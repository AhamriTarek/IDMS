import logging
import requests
from django.conf import settings
from django.contrib.auth import logout as django_logout
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.views import View
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from core.models import Employe, Administrateur

logger = logging.getLogger(__name__)
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'


def google_oauth_callback(request):
    """
    Stateless Google OAuth callback registered BEFORE allauth URLs so it
    shadows allauth's /accounts/google/login/callback/ without needing
    any session-based state validation.
    """
    code  = request.GET.get('code')
    error = request.GET.get('error')
    frontend_cb = f"{settings.FRONTEND_URL}/auth/callback"

    if error or not code:
        return redirect(f"{settings.FRONTEND_URL}/?error=google_failed&detail={error or 'no_code'}")

    redirect_uri = request.build_absolute_uri('/accounts/google/login/callback/')

    try:
        token_resp = requests.post(GOOGLE_TOKEN_URL, data={
            'code':          code,
            'client_id':     settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri':  redirect_uri,
            'grant_type':    'authorization_code',
        }, timeout=10)
    except requests.RequestException:
        return redirect(f"{settings.FRONTEND_URL}/?error=google_failed&detail=network")

    if not token_resp.ok:
        logger.error("Google token exchange failed: %s", token_resp.text)
        return redirect(f"{settings.FRONTEND_URL}/?error=google_failed&detail=token_exchange")

    id_token_str = token_resp.json().get('id_token')
    if not id_token_str:
        return redirect(f"{settings.FRONTEND_URL}/?error=google_failed&detail=no_id_token")

    try:
        id_info = id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(),
            settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=10,
        )
    except ValueError as e:
        logger.error("Invalid Google id_token: %s", e)
        return redirect(f"{settings.FRONTEND_URL}/?error=google_failed&detail=invalid_token")

    try:
        user, _ = get_or_create_from_google(id_info)
    except Exception:
        logger.exception("google_oauth_callback: user creation failed")
        return redirect(f"{settings.FRONTEND_URL}/?error=google_failed&detail=user_error")

    refresh = RefreshToken.for_user(user)
    return redirect(
        f"{frontend_cb}?access={str(refresh.access_token)}&refresh={str(refresh)}"
    )


def _unique_username(base):
    username = base[:140]
    if not User.objects.filter(username=username).exists():
        return username
    i = 1
    while User.objects.filter(username=f"{username}{i}").exists():
        i += 1
    return f"{username}{i}"


def _is_admin_email(email: str) -> bool:
    """Return True if email appears in settings.ADMIN_EMAILS (case-insensitive)."""
    admin_emails = [e.lower() for e in getattr(settings, 'ADMIN_EMAILS', [])]
    return email.lower() in admin_emails


def _promote_to_admin(user: User) -> None:
    """
    Ensure the user has Django staff/superuser flags and an Administrateur
    profile.  Remove any Employe profile so role detection is unambiguous.
    Called on every login when the email is in ADMIN_EMAILS.
    """
    changed = False
    if not user.is_staff:
        user.is_staff = True
        changed = True
    if not user.is_superuser:
        user.is_superuser = True
        changed = True
    if changed:
        user.save(update_fields=['is_staff', 'is_superuser'])

    # Remove employee profile if it exists (can happen on role change)
    Employe.objects.filter(user=user).delete()

    # Ensure Administrateur profile exists
    Administrateur.objects.get_or_create(
        user=user,
        defaults={
            'nom':    user.last_name or user.username,
            'prenom': user.first_name or '',
        },
    )


def _demote_to_employe(user: User, google_id: str = '', picture: str = '') -> None:
    """
    Ensure the user has no staff flags and has an Employe profile.
    Called on every login when the email is NOT in ADMIN_EMAILS.
    """
    changed = False
    if user.is_staff:
        user.is_staff = False
        changed = True
    if user.is_superuser:
        user.is_superuser = False
        changed = True
    if changed:
        user.save(update_fields=['is_staff', 'is_superuser'])

    # Remove admin profile if it exists
    Administrateur.objects.filter(user=user).delete()

    # Ensure Employe profile exists / update google_id & avatar
    emp, created = Employe.objects.get_or_create(
        user=user,
        defaults={
            'nom':       user.last_name or user.username,
            'prenom':    user.first_name or '',
            'google_id': google_id,
            'avatar':    picture,
        },
    )
    if not created:
        update_fields = []
        if google_id and not emp.google_id:
            emp.google_id = google_id
            update_fields.append('google_id')
        if picture and not emp.avatar:
            emp.avatar = picture
            update_fields.append('avatar')
        if update_fields:
            emp.save(update_fields=update_fields)


def get_or_create_from_google(id_info: dict) -> tuple[User, bool]:
    """
    Resolve (or create) a Django User from Google id_info, then enforce
    admin/employee role based on settings.ADMIN_EMAILS on every call.
    Returns (user, created).
    """
    email     = id_info.get('email', '')
    google_id = id_info.get('sub', '')
    given     = id_info.get('given_name', '')
    family    = id_info.get('family_name', '')
    picture   = id_info.get('picture', '')

    if not email or not google_id:
        raise ValueError("Google user info incomplete")

    # ── 1. Find existing user ────────────────────────────────────────────────
    user = None
    created = False

    # Try Employe.google_id first
    try:
        emp = Employe.objects.select_related('user').get(google_id=google_id)
        user = emp.user
    except Employe.DoesNotExist:
        pass

    # Fall back to email match
    if user is None:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            pass

    # ── 2. Create if brand new ───────────────────────────────────────────────
    if user is None:
        username = _unique_username(email.split('@')[0])
        user = User.objects.create_user(
            username=username, email=email,
            first_name=given, last_name=family,
        )
        created = True

    # ── 3. Keep name fields current ──────────────────────────────────────────
    name_changed = False
    if given and user.first_name != given:
        user.first_name = given
        name_changed = True
    if family and user.last_name != family:
        user.last_name = family
        name_changed = True
    if name_changed:
        user.save(update_fields=['first_name', 'last_name'])

    # ── 4. Enforce role on EVERY login ───────────────────────────────────────
    if _is_admin_email(email):
        _promote_to_admin(user)
    else:
        _demote_to_employe(user, google_id=google_id, picture=picture)

    return user, created


def _auth_response(user: User, created: bool) -> Response:
    refresh = RefreshToken.for_user(user)
    role    = 'admin' if hasattr(user, 'administrateur') else 'employe'
    return Response({
        'refresh':  str(refresh),
        'access':   str(refresh.access_token),
        'user': {
            'id':       user.id,
            'email':    user.email,
            'username': user.username,
            'name':     f"{user.first_name} {user.last_name}".strip() or user.username,
        },
        'role':     role,
        'new_user': created,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """Exchange an authorization code for tokens (standard OAuth2 flow)."""
    code         = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri', f"{settings.FRONTEND_URL}/auth/callback")

    if not code:
        return Response({'error': 'Code manquant'}, status=status.HTTP_400_BAD_REQUEST)
    if not settings.GOOGLE_CLIENT_ID:
        return Response({'error': 'Google OAuth non configuré'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        token_response = requests.post(GOOGLE_TOKEN_URL, data={
            'code':          code,
            'client_id':     settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri':  redirect_uri,
            'grant_type':    'authorization_code',
        }, timeout=10)
    except requests.RequestException:
        return Response({'error': 'Impossible de contacter Google'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)

    if not token_response.ok:
        google_error = token_response.json()
        logger.error("Google token exchange failed: %s", google_error)
        return Response(
            {'error': 'Échec échange code Google', 'detail': google_error},
            status=status.HTTP_400_BAD_REQUEST,
        )

    id_token_str = token_response.json().get('id_token')
    if not id_token_str:
        return Response({'error': 'id_token manquant'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        id_info = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )
    except ValueError as e:
        return Response({'error': f'Token Google invalide: {e}'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user, created = get_or_create_from_google(id_info)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.exception("Unexpected error in google_login")
        from django.conf import settings as _s
        detail = tb if _s.DEBUG else 'Erreur interne'
        return Response({'error': 'Erreur interne', 'traceback': detail},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return _auth_response(user, created)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_token_login(request):
    """Verify a Google ID token directly (mobile / implicit flow)."""
    token_str = request.data.get('id_token')
    if not token_str:
        return Response({'error': 'id_token manquant'}, status=status.HTTP_400_BAD_REQUEST)
    if not settings.GOOGLE_CLIENT_ID:
        return Response({'error': 'Google OAuth non configuré'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        id_info = id_token.verify_oauth2_token(
            token_str,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )
    except ValueError as e:
        return Response({'error': f'Token invalide: {e}'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user, created = get_or_create_from_google(id_info)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return _auth_response(user, created)


class JWTRedirectView(View):
    """
    allauth redirects here (LOGIN_REDIRECT_URL) after a successful Google login.
    We generate JWT tokens, clear the Django session, then redirect to the
    React frontend with the tokens in the query string.
    """

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return redirect(f"{settings.FRONTEND_URL}/?error=google_failed")

        # Enforce admin / employee role on every login
        try:
            if _is_admin_email(user.email):
                _promote_to_admin(user)
            else:
                social = user.socialaccount_set.filter(provider='google').first()
                google_id = social.uid if social else ''
                picture   = (social.extra_data or {}).get('picture', '') if social else ''
                _demote_to_employe(user, google_id=google_id, picture=picture)
        except Exception:
            logger.exception("JWTRedirectView: role enforcement failed for %s", user.email)

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)

        # Clear the allauth session — the app uses JWT, not cookies
        django_logout(request)

        frontend_cb = f"{settings.FRONTEND_URL}/auth/callback"
        return redirect(
            f"{frontend_cb}"
            f"?access={str(refresh.access_token)}"
            f"&refresh={str(refresh)}"
        )
