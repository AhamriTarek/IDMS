from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    AdministrateurSerializer, TypeEmployeSerializer, EmployeSerializer,
    DossierSerializer, DossierListSerializer, FichierSerializer,
    CarteIA_DossierSerializer, PermissionSerializer,
    SoumissionFichierSerializer, NotificationSerializer, RegisterSerializer,
    DossierTypeCustomSerializer, CustomTokenObtainPairSerializer,
)

from core.models import (
    Administrateur, TypeEmploye, Employe, Dossier, Fichier,
    CarteIA_Dossier, Permission, SoumissionFichier, Notification,
    DossierTypeCustom,
)
from .serializers import (
    AdministrateurSerializer, TypeEmployeSerializer, EmployeSerializer,
    DossierSerializer, DossierListSerializer, FichierSerializer,
    CarteIA_DossierSerializer, PermissionSerializer,
    SoumissionFichierSerializer, NotificationSerializer, RegisterSerializer,
    DossierTypeCustomSerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_overview(request):
    from django.utils import timezone
    from datetime import timedelta
    now  = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    d_total = Dossier.objects.count()
    d_prev  = Dossier.objects.filter(created_at__lt=month_start).count()

    e_total = Employe.objects.filter(is_active=True).count()
    e_prev  = Employe.objects.filter(is_active=True, created_at__lt=month_start).count()

    s_total = SoumissionFichier.objects.count()
    s_prev  = SoumissionFichier.objects.filter(created_at__lt=month_start).count()

    n_total = Notification.objects.filter(destinataire=request.user, lu=False).count()

    def trend(cur, prev):
        if prev == 0:
            return {'value': cur, 'pct': None, 'dir': 'up'}
        pct = round((cur - prev) / prev * 100)
        return {'value': cur, 'pct': abs(pct), 'dir': 'up' if pct >= 0 else 'down'}

    return Response({
        'dossiers':    trend(d_total, d_prev),
        'employes':    trend(e_total, e_prev),
        'soumissions': trend(s_total, s_prev),
        'notifs':      {'value': n_total, 'pct': None, 'dir': 'up'},
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_dossiers_par_type(request):
    from django.db.models import Count
    data = (
        Dossier.objects
        .values('type_dossier')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    return Response([{'type': r['type_dossier'], 'count': r['count']} for r in data])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_activite(request):
    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Count
    from django.db.models.functions import TruncDate

    today = timezone.now().date()
    since = today - timedelta(days=6)

    qs = (
        Fichier.objects
        .filter(created_at__date__gte=since)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    by_day = {r['day']: r['count'] for r in qs}
    result = []
    for i in range(7):
        d = since + timedelta(days=i)
        result.append({
            'date':  d.strftime('%d/%m'),
            'count': by_day.get(d, 0),
        })
    return Response(result)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None and not isinstance(response.data, dict):
        response.data = {'detail': response.data}
    return response


def is_admin(user):   return hasattr(user, 'administrateur')
def is_employe(user): return hasattr(user, 'employe')


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_employe(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    data = serializer.validated_data
    pwd = data.get('password') or None
    user = User.objects.create_user(
        username=data['username'], email=data['email'], password=pwd,
        first_name=data.get('prenom', ''), last_name=data.get('nom', ''),
    )
    if not pwd:
        user.set_unusable_password()
        user.save()
    type_employe = None
    if data.get('type_employe_id'):
        try:
            type_employe = TypeEmploye.objects.get(id=data['type_employe_id'])
        except TypeEmploye.DoesNotExist:
            pass
    emp = Employe.objects.create(user=user, nom=data['nom'], prenom=data['prenom'], type_employe=type_employe)
    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh), 'access': str(refresh.access_token),
        'user': {'id': user.id, 'username': user.username, 'email': user.email},
        'employe_id': emp.id,
        'role': 'employe',
    }, status=status.HTTP_201_CREATED)


# FIX: me() no longer crashes when user has no profile
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    role = 'admin' if is_admin(user) else ('employe' if is_employe(user) else 'unknown')
    data = {'id': user.id, 'username': user.username, 'email': user.email, 'role': role, 'profile': None}
    try:
        if role == 'admin':
            data['profile'] = AdministrateurSerializer(user.administrateur).data
        elif role == 'employe':
            data['profile'] = EmployeSerializer(user.employe).data
    except Exception:
        pass
    return Response(data)


# FIX: logout endpoint — blacklists the refresh token
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'refresh token requis'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        RefreshToken(refresh_token).blacklist()
        return Response({'detail': 'Déconnexion réussie.'})
    except TokenError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employe_stats(request):
    if not is_employe(request.user):
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
    employe = request.user.employe
    dossiers_count = Permission.objects.filter(employe=employe).values('dossier').distinct().count()
    subs = SoumissionFichier.objects.filter(employe=employe)
    return Response({
        'dossiers':   dossiers_count,
        'en_attente': subs.filter(status='en_attente').count(),
        'approuve':   subs.filter(status='approuve').count(),
        'rejete':     subs.filter(status='rejete').count(),
        'total_subs': subs.count(),
    })


class TypeEmployeViewSet(viewsets.ModelViewSet):
    queryset = TypeEmploye.objects.all()
    serializer_class = TypeEmployeSerializer
    permission_classes = [IsAuthenticated]


class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.select_related('user', 'type_employe').all()
    serializer_class = EmployeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if is_admin(self.request.user):
            return super().get_queryset()
        if is_employe(self.request.user):
            return Employe.objects.filter(user=self.request.user)
        return Employe.objects.none()

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les administrateurs peuvent supprimer des comptes.")
        employe = self.get_object()
        user = employe.user
        employe.delete()
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DossierViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base = Dossier.objects.select_related(
            'createur', 'carte_ia'
        ).prefetch_related(
            'fichiers__uploaded_by',
            'permissions__employe__user',
        )
        if is_admin(user):
            return base.all()
        if is_employe(user):
            ids = Permission.objects.filter(employe=user.employe).values_list('dossier_id', flat=True)
            return base.filter(id__in=ids)
        return Dossier.objects.none()

    def get_serializer_class(self):
        return DossierListSerializer if self.action == 'list' else DossierSerializer

    # FIX: guard against non-admin creating dossiers
    def perform_create(self, serializer):
        if not is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les administrateurs peuvent créer des dossiers.")
        serializer.save(createur=self.request.user.administrateur)

    @action(detail=True, methods=['post'], url_path='generer-carte-ia')
    def generer_carte_ia(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        dossier = self.get_object()
        try:
            from .tasks import analyser_dossier_task
            task = analyser_dossier_task.delay(dossier.pk)
            return Response({'task_id': task.id, 'status': 'en_cours'}, status=status.HTTP_202_ACCEPTED)
        except Exception:
            # Celery/Redis not available — run synchronously
            import threading
            from .services import GeminiService
            def run():
                try:
                    for fichier in Fichier.objects.filter(dossier=dossier):
                        if not fichier.ai_titre and not fichier.ai_resume:
                            r = GeminiService.analyser_fichier(fichier)
                            fichier.ai_titre  = r['ai_titre']
                            fichier.ai_resume = r['ai_resume']
                            fichier.save(update_fields=['ai_titre', 'ai_resume'])
                    GeminiService.analyser_dossier(dossier)
                    GeminiService.resumer_dossier(dossier)  # saves resume_structure
                except Exception:
                    pass
            threading.Thread(target=run, daemon=True).start()
            return Response({'task_id': None, 'status': 'en_cours_sync'}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'], url_path='resumer')
    def resumer(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        dossier = self.get_object()
        try:
            from .tasks import resumer_dossier_task
            task = resumer_dossier_task.delay(dossier.pk)
            return Response({'task_id': task.id, 'status': 'en_cours'}, status=status.HTTP_202_ACCEPTED)
        except Exception:
            # Celery unavailable — run synchronously and return result directly
            from .services import GeminiService
            try:
                result = GeminiService.resumer_dossier(dossier)
                return Response({
                    'task_id': None, 'task_status': 'SUCCESS',
                    'fichiers':         result.get('fichiers', []),
                    'synthese_globale': result.get('synthese_globale', ''),
                })
            except Exception as exc:
                return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='resumer-status')
    def resumer_status(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({'error': 'task_id requis'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from celery.result import AsyncResult
            result = AsyncResult(task_id)
            if result.state == 'SUCCESS':
                r = result.result or {}
                return Response({
                    'task_status': 'SUCCESS',
                    'fichiers':         r.get('fichiers', []),
                    'synthese_globale': r.get('synthese_globale', ''),
                })
            if result.state == 'FAILURE':
                return Response({'task_status': 'FAILURE', 'error': str(result.result)},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({'task_status': result.state})
        except Exception:
            return Response({'task_status': 'FAILURE', 'error': 'Celery non disponible'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='fichiers')
    def ajouter_fichiers(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        dossier = self.get_object()
        files = request.FILES.getlist('fichiers')
        if not files:
            return Response({'error': 'Aucun fichier fourni'}, status=status.HTTP_400_BAD_REQUEST)
        new_fichiers = []
        created = []
        for f in files:
            ext = f.name.split('.')[-1].lower()
            type_map = {'pdf': 'pdf', 'docx': 'docx', 'doc': 'docx', 'xlsx': 'xlsx', 'xls': 'xlsx'}
            type_fichier = type_map.get(ext, 'image' if ext in ('jpg','jpeg','png') else 'autre')
            fichier = Fichier.objects.create(
                dossier=dossier, nom=f.name, fichier=f,
                type_fichier=type_fichier, taille=f.size,
                uploaded_by=request.user, status='confirme',
            )
            new_fichiers.append(fichier)
            created.append(FichierSerializer(fichier).data)
        # Nullify resume_structure so polling detects when new analysis completes
        CarteIA_Dossier.objects.filter(dossier=dossier).update(resume_structure=None)
        # Trigger full analysis in background
        import threading
        from .services import GeminiService
        def run():
            try:
                for fichier_obj in new_fichiers:
                    r = GeminiService.analyser_fichier(fichier_obj)
                    fichier_obj.ai_titre  = r['ai_titre']
                    fichier_obj.ai_resume = r['ai_resume']
                    fichier_obj.save(update_fields=['ai_titre', 'ai_resume'])
                GeminiService.analyser_dossier(dossier)
                GeminiService.resumer_dossier(dossier)  # saves resume_structure
            except Exception:
                pass
        threading.Thread(target=run, daemon=True).start()
        return Response(created, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='resume-data')
    def resume_data(self, request, pk=None):
        """Return stored resume_structure — null while analysis is still running."""
        dossier = self.get_object()
        try:
            structure = dossier.carte_ia.resume_structure
            if structure:
                return Response({'status': 'done', 'data': structure})
        except Exception:
            pass
        return Response({'status': 'pending', 'data': None})

    @action(detail=True, methods=['get'], url_path='carte-ia-status')
    def carte_ia_status(self, request, pk=None):
        """Poll task status and return the carte IA once ready."""
        if not is_admin(request.user):
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        task_id = request.query_params.get('task_id')
        if not task_id:
            # Return existing carte if present
            dossier = self.get_object()
            try:
                return Response(CarteIA_DossierSerializer(dossier.carte_ia).data)
            except CarteIA_Dossier.DoesNotExist:
                return Response({'detail': 'Aucune carte IA'}, status=status.HTTP_404_NOT_FOUND)
        from celery.result import AsyncResult
        result = AsyncResult(task_id)
        if result.state == 'SUCCESS':
            dossier = self.get_object()
            try:
                return Response({'task_status': 'SUCCESS',
                                 'carte': CarteIA_DossierSerializer(dossier.carte_ia).data})
            except CarteIA_Dossier.DoesNotExist:
                return Response({'task_status': 'SUCCESS', 'carte': None})
        if result.state == 'FAILURE':
            return Response({'task_status': 'FAILURE', 'error': str(result.result)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'task_status': result.state})


class FichierViewSet(viewsets.ModelViewSet):
    queryset = Fichier.objects.select_related('dossier', 'uploaded_by').all()
    serializer_class = FichierSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        # Files uploaded by employees are staged as pending until admin accepts the submission
        file_status = 'confirme' if is_admin(user) else 'en_attente'
        serializer.save(uploaded_by=user, status=file_status)

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        dossier_id = self.request.query_params.get('dossier')
        if dossier_id:
            qs = qs.filter(dossier_id=dossier_id)
        if is_admin(user):
            # Admins only see confirmed files via this endpoint
            return qs.filter(status='confirme')
        if is_employe(user):
            allowed = Permission.objects.filter(employe=user.employe).values_list('dossier_id', flat=True)
            qs = qs.filter(dossier_id__in=allowed)
            # Employees see confirmed files + their own pending files
            return qs.filter(Q(status='confirme') | Q(status='en_attente', uploaded_by=user))
        return qs.none()


class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.select_related('employe', 'dossier', 'accordee_par').all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if is_admin(self.request.user):
            serializer.save(accordee_par=self.request.user.administrateur)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les administrateurs peuvent gérer les permissions.")

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            qs = super().get_queryset()
            employe_id = self.request.query_params.get('employe')
            if employe_id:
                qs = qs.filter(employe_id=employe_id)
            return qs
        if is_employe(user):
            return Permission.objects.filter(employe=user.employe)
        return Permission.objects.none()


class SoumissionFichierViewSet(viewsets.ModelViewSet):
    queryset = SoumissionFichier.objects.select_related('employe', 'dossier', 'reviewed_by').all()
    serializer_class = SoumissionFichierSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return super().get_queryset()
        if is_employe(user):
            return SoumissionFichier.objects.filter(employe=user.employe)
        return SoumissionFichier.objects.none()

    def perform_create(self, serializer):
        if not is_employe(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les employés peuvent soumettre des fichiers.")
        employe = self.request.user.employe
        fichier = self.request.FILES.get('fichier')
        dossier = serializer.validated_data.get('dossier')
        nom = fichier.name if fichier else (dossier.titre if dossier else 'Soumission')
        soumission = serializer.save(employe=employe, nom_fichier=nom)
        # Link any unbound pending files the employee uploaded to this submission
        Fichier.objects.filter(
            dossier=dossier, uploaded_by=employe.user,
            status='en_attente', soumission__isnull=True
        ).update(soumission=soumission)
        # Notify every admin user about the new submission
        for admin in Administrateur.objects.select_related('user').all():
            Notification.objects.create(
                destinataire=admin.user,
                titre='Nouvelle soumission 📋',
                message=f'Nouvelle soumission de {employe.prenom} {employe.nom} — Dossier : {dossier.titre if dossier else nom}',
                type_notif='info',
            )

    @action(detail=True, methods=['post'])
    def approuver(self, request, pk=None):
        soumission = self.get_object()
        if not is_admin(request.user):
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        soumission.status = 'approuve'
        soumission.reviewed_by = request.user.administrateur
        soumission.reviewed_at = timezone.now()
        soumission.save()
        # Confirm all pending files linked to this submission
        soumission.fichiers_soumis.update(status='confirme', soumission=None)
        # Mark the dossier as terminé so it reflects the accepted state in Gestion des Dossiers
        dossier = soumission.dossier
        dossier.status = 'termine'
        dossier.save(update_fields=['status', 'updated_at'])
        Notification.objects.create(
            destinataire=soumission.employe.user,
            titre='Soumission approuvée ✅',
            message=f'Votre soumission du dossier "{dossier.titre}" a été approuvée.',
            type_notif='success',
        )
        return Response(SoumissionFichierSerializer(soumission).data)

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        soumission = self.get_object()
        if not is_admin(request.user):
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        reason = request.data.get('raison', '')
        # Delete pending files that were staged for this submission
        for f in soumission.fichiers_soumis.all():
            if f.fichier:
                f.fichier.delete(save=False)
            f.delete()
        soumission.status = 'rejete'
        soumission.reviewed_by = request.user.administrateur
        soumission.reviewed_at = timezone.now()
        soumission.rejection_reason = reason
        soumission.save()
        Notification.objects.create(
            destinataire=soumission.employe.user,
            titre='Soumission rejetée ❌',
            message=f'Votre soumission du dossier "{soumission.dossier.titre}" a été rejetée. Raison: {reason}',
            type_notif='error',
        )
        return Response(SoumissionFichierSerializer(soumission).data)

    @action(detail=True, methods=['get'], url_path='fichiers')
    def fichiers(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        soumission = self.get_object()
        files = Fichier.objects.filter(soumission=soumission).select_related('uploaded_by')
        return Response(FichierSerializer(files, many=True, context={'request': request}).data)


class DossierTypeCustomViewSet(viewsets.ModelViewSet):
    queryset = DossierTypeCustom.objects.all()
    serializer_class = DossierTypeCustomSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if not is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les administrateurs peuvent créer des types.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les administrateurs peuvent supprimer des types.")
        return super().destroy(request, *args, **kwargs)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(destinataire=self.request.user)

    def perform_create(self, serializer):
        serializer.save(destinataire=self.request.user)

    @action(detail=False, methods=['post'], url_path='marquer-tout-lu')
    def marquer_tout_lu(self, request):
        updated = self.get_queryset().filter(lu=False).update(lu=True)
        return Response({'status': 'ok', 'updated': updated})

    @action(detail=True, methods=['post'], url_path='marquer-lu')
    def marquer_lu(self, request, pk=None):
        notif = self.get_object()
        notif.lu = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['get'], url_path='non-lues-count')
    def non_lues_count(self, request):
        return Response({'count': self.get_queryset().filter(lu=False).count()})
