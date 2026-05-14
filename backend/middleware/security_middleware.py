"""
Security Middleware for IDMS
- SecurityHeadersMiddleware: adds security HTTP headers to every response
- FileAccessLogMiddleware:   logs every access to /media/ files with user + IP
"""
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('idms.security')


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Inject security headers on every response."""

    def process_response(self, request, response):
        # Prevent MIME sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'
        # XSS protection (legacy browsers)
        response['X-XSS-Protection'] = '1; mode=block'
        # Content Security Policy
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://accounts.google.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' http://localhost:5173 http://localhost:8000; "
            "frame-ancestors 'none';"
        )
        # Referrer policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        # Permissions policy
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        return response


class FileAccessLogMiddleware(MiddlewareMixin):
    """Log every request to /media/ endpoints with user identity and IP."""

    def process_request(self, request):
        if request.path.startswith('/media/'):
            user = getattr(request, 'user', None)
            username = user.username if user and user.is_authenticated else 'anonymous'
            ip = self._get_client_ip(request)
            logger.info(
                'MEDIA_ACCESS | user=%s | ip=%s | path=%s | method=%s',
                username, ip, request.path, request.method
            )
        return None

    @staticmethod
    def _get_client_ip(request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '0.0.0.0')
