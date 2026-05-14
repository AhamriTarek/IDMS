"""
Security Audit Logger for IDMS — Agent 4 Security Layer
Logs:
 - File access attempts (who, what, when, IP)
 - Permission changes (admin, employe, dossier, new access level)

NEVER logs file contents or passwords.
"""
import logging
from django.utils import timezone

logger = logging.getLogger('idms.security')


def _get_ip(request) -> str:
    """Extract real client IP, handling reverse proxies."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def log_file_access(request, fichier, action: str = 'DOWNLOAD') -> None:
    """
    Log a file access event.
    Args:
        request:  Django request object (for user + IP)
        fichier:  Fichier model instance
        action:   One of 'DOWNLOAD', 'VIEW', 'UPLOAD', 'DELETE'
    """
    user = getattr(request, 'user', None)
    username = user.username if user and user.is_authenticated else 'anonymous'
    ip = _get_ip(request)

    logger.info(
        'FILE_%s | user=%s | ip=%s | fichier_id=%s | nom=%s | dossier_id=%s | ts=%s',
        action,
        username,
        ip,
        getattr(fichier, 'id', '?'),
        getattr(fichier, 'nom', '?'),
        getattr(getattr(fichier, 'dossier', None), 'id', '?'),
        timezone.now().isoformat(),
    )


def log_permission_change(request, employe, dossier, new_acces: str, action: str = 'GRANT') -> None:
    """
    Log a permission assignment or revocation.
    Args:
        request:    Django request (for admin user + IP)
        employe:    Employe model instance receiving the permission
        dossier:    Dossier model instance
        new_acces:  Permission level: 'lecture' | 'ecriture' | 'admin'
        action:     'GRANT' or 'REVOKE'
    """
    admin_user = getattr(request, 'user', None)
    admin_name = admin_user.username if admin_user and admin_user.is_authenticated else 'unknown'
    ip = _get_ip(request)

    logger.warning(
        'PERMISSION_%s | admin=%s | ip=%s | employe_id=%s | employe=%s | dossier_id=%s | acces=%s | ts=%s',
        action,
        admin_name,
        ip,
        getattr(employe, 'id', '?'),
        str(employe),
        getattr(dossier, 'id', '?'),
        new_acces,
        timezone.now().isoformat(),
    )


def log_failed_login(request, email: str) -> None:
    """Log a failed login attempt (NO password logged)."""
    ip = _get_ip(request)
    logger.warning(
        'LOGIN_FAILED | email=%s | ip=%s | ts=%s',
        email,
        ip,
        timezone.now().isoformat(),
    )


def log_successful_login(request, user) -> None:
    """Log a successful login."""
    ip = _get_ip(request)
    logger.info(
        'LOGIN_SUCCESS | user=%s | ip=%s | ts=%s',
        user.username,
        ip,
        timezone.now().isoformat(),
    )
