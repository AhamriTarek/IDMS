"""
Custom DRF Permission Classes for IDMS
- IsAdminUser:           only Administrateur profiles can access
- IsEmployeUser:         only Employe profiles can access
- CheckDossierPermission: verifies employe has correct access level for a dossier
"""
from rest_framework.permissions import BasePermission


def _is_admin(user):
    return user.is_authenticated and hasattr(user, 'administrateur')


def _is_employe(user):
    return user.is_authenticated and hasattr(user, 'employe')


class IsAdminUser(BasePermission):
    """Allow access only to Administrateur users."""
    message = 'Accès réservé aux administrateurs.'

    def has_permission(self, request, view):
        return _is_admin(request.user)


class IsEmployeUser(BasePermission):
    """Allow access only to Employe users."""
    message = 'Accès réservé aux employés.'

    def has_permission(self, request, view):
        return _is_employe(request.user)


class IsAdminOrReadOnly(BasePermission):
    """Admins can do anything; others read-only."""
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user.is_authenticated
        return _is_admin(request.user)


class CheckDossierPermission(BasePermission):
    """
    Object-level permission: verifies that the employe has the required
    access type on the related Dossier before allowing file operations.

    Usage in views:
        permission_classes = [IsAuthenticated, CheckDossierPermission]
        required_permission = 'lecture'  # or 'ecriture' or 'admin'
    """
    message = "Vous n'avez pas la permission nécessaire sur ce dossier."

    # Map HTTP methods → minimum required access level
    METHOD_PERMISSION_MAP = {
        'GET':    'lecture',
        'HEAD':   'lecture',
        'OPTIONS':'lecture',
        'POST':   'ecriture',
        'PUT':    'ecriture',
        'PATCH':  'ecriture',
        'DELETE': 'admin',
    }

    ACCESS_HIERARCHY = ['lecture', 'ecriture', 'admin']

    def has_permission(self, request, view):
        # Admins bypass all permission checks
        if _is_admin(request.user):
            return True
        return _is_employe(request.user)

    def has_object_permission(self, request, view, obj):
        # Admins always allowed
        if _is_admin(request.user):
            return True

        if not _is_employe(request.user):
            return False

        employe = request.user.employe

        # Determine required permission level for this HTTP method
        required = self.METHOD_PERMISSION_MAP.get(request.method, 'admin')

        # Find the dossier — obj can be a Dossier, Fichier, etc.
        from core.models import Permission, Dossier, Fichier
        if isinstance(obj, Dossier):
            dossier = obj
        elif isinstance(obj, Fichier):
            dossier = obj.dossier
        else:
            # For other models, try to get dossier attribute
            dossier = getattr(obj, 'dossier', None)
            if dossier is None:
                return False

        try:
            perm = Permission.objects.get(employe=employe, dossier=dossier)
        except Permission.DoesNotExist:
            return False

        # Check level hierarchy
        try:
            user_level = self.ACCESS_HIERARCHY.index(perm.acces)
            required_level = self.ACCESS_HIERARCHY.index(required)
            return user_level >= required_level
        except ValueError:
            return False
