"""
File Validators for IDMS — Agent 4 Security Layer
- validate_file_extension:  whitelist-based extension check
- validate_file_magic_bytes: real file type check via magic bytes (not just extension)
- validate_file_size:        enforces max size limits
- sanitize_filename:         renames to UUID to prevent path traversal
"""
import os
import uuid
import imghdr
from django.conf import settings
from rest_framework.exceptions import ValidationError

# ─── Allowed extensions whitelist ──────────────────────────────────────────────
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'txt', 'zip'}

# ─── Magic bytes signatures ─────────────────────────────────────────────────────
MAGIC_BYTES = {
    b'%PDF':           'pdf',
    b'PK\x03\x04':    'docx_or_xlsx_or_zip',
    b'\xff\xd8\xff':  'jpg',
    b'\x89PNG\r\n':   'png',
}


def validate_file_extension(filename: str) -> str:
    """
    Returns the lowercased extension if allowed, raises ValidationError otherwise.
    """
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Extension '.{ext}' non autorisée. Types acceptés: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    return ext


def validate_file_magic_bytes(file_obj) -> str:
    """
    Reads the first 8 bytes to verify the real file type.
    Returns detected type string. Raises ValidationError for unknown/malicious files.
    """
    file_obj.seek(0)
    header = file_obj.read(8)
    file_obj.seek(0)

    detected = None
    for magic, ftype in MAGIC_BYTES.items():
        if header[:len(magic)] == magic:
            detected = ftype
            break

    if detected is None:
        # Try plain text
        try:
            header.decode('utf-8')
            detected = 'txt'
        except UnicodeDecodeError:
            raise ValidationError(
                "Type de fichier non reconnu ou potentiellement dangereux."
            )

    return detected


def validate_file_size(file_obj, is_zip: bool = False) -> None:
    """
    Enforces MAX_FILE_SIZE_MB (default 50MB) or MAX_ZIP_SIZE_MB (default 200MB).
    """
    max_mb = settings.MAX_ZIP_SIZE_MB if is_zip else settings.MAX_FILE_SIZE_MB
    max_bytes = max_mb * 1024 * 1024

    # Get size: either from .size attribute or seek to end
    size = getattr(file_obj, 'size', None)
    if size is None:
        file_obj.seek(0, 2)
        size = file_obj.tell()
        file_obj.seek(0)

    if size > max_bytes:
        raise ValidationError(
            f"Fichier trop volumineux: {size // (1024*1024)} MB. "
            f"Maximum autorisé: {max_mb} MB."
        )


def sanitize_filename(original_name: str) -> str:
    """
    Replaces original filename with a UUID to prevent path traversal attacks.
    Keeps the original extension (after validation).
    Returns: '3f4a2b1c-...uuid....pdf'
    """
    ext = ''
    if '.' in original_name:
        ext = '.' + original_name.rsplit('.', 1)[-1].lower()
    return str(uuid.uuid4()) + ext


def full_file_validation(file_obj, original_name: str) -> dict:
    """
    Runs all validations in sequence.
    Returns dict: { 'ext': str, 'safe_name': str, 'detected_type': str }
    """
    ext = validate_file_extension(original_name)
    is_zip = (ext == 'zip')
    validate_file_size(file_obj, is_zip=is_zip)
    detected = validate_file_magic_bytes(file_obj)
    safe_name = sanitize_filename(original_name)

    return {
        'ext': ext,
        'safe_name': safe_name,
        'detected_type': detected,
        'is_zip': is_zip,
    }
