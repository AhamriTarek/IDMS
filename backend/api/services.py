import os
import json
import re
import logging
from concurrent.futures import ThreadPoolExecutor
import fitz          # PyMuPDF
from docx import Document
from django.conf import settings
from core.models import CarteIA_Dossier

logger = logging.getLogger(__name__)


# ── Text extraction ───────────────────────────────────────────────────────────

IMAGE_EXTS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif'}

_IMAGE_MIME = {
    'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp',
    'tiff': 'image/tiff', 'tif': 'image/tiff',
}


def _describe_image_via_vision(path: str) -> str:
    """Send an image to Gemini Vision and return a French description."""
    import time
    from google import genai
    from google.genai import types

    ext  = path.rsplit('.', 1)[-1].lower()
    mime = _IMAGE_MIME.get(ext, 'image/png')

    try:
        with open(path, 'rb') as fh:
            image_bytes = fh.read()
    except Exception as e:
        logger.warning("Cannot read image %s: %s", path, e)
        return ''

    parts = [
        types.Part.from_bytes(data=image_bytes, mime_type=mime),
        ('Décris le contenu de cette image en français. '
         'Identifie le type de document, les textes visibles, les éléments '
         'graphiques et toute information pertinente. Sois précis et concis.'),
    ]

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL, contents=parts,
            )
            text = response.text or ''
            logger.info("Gemini vision described image %s: %d chars", path, len(text))
            return text
        except Exception as e:
            msg = str(e)
            if attempt < 2 and any(c in msg for c in ('503', '429', 'UNAVAILABLE')):
                wait = 4 * (attempt + 1)
                logger.warning("Vision attempt %d failed (%s), retrying in %ds…", attempt + 1, msg[:60], wait)
                time.sleep(wait)
            else:
                logger.warning("Gemini vision failed for %s: %s", path, e)
                return ''
    return ''


def _extract_pdf_via_vision(path: str) -> str:
    """Render PDF pages to images and transcribe via Gemini vision (no system deps).
    Retries up to 3 times on transient 503/429 errors."""
    import time
    from google import genai
    from google.genai import types

    # Build image parts once (fitz renders locally, no network)
    parts = []
    try:
        with fitz.open(path) as doc:
            for i, page in enumerate(doc):
                if i >= 6:
                    break
                pix = page.get_pixmap(dpi=150)
                parts.append(types.Part.from_bytes(
                    data=pix.tobytes('png'),
                    mime_type='image/png',
                ))
    except Exception as e:
        logger.warning("fitz render failed for %s: %s", path, e)
        return ''

    if not parts:
        return ''

    parts.append(
        'Transcribe every word of text visible in these document pages. '
        'Return only the raw extracted text, no commentary.'
    )

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=parts,
            )
            text = response.text or ''
            logger.info("Gemini vision OCR extracted %d chars from %s (attempt %d)", len(text), path, attempt + 1)
            return text
        except Exception as e:
            msg = str(e)
            if attempt < 2 and ('503' in msg or '429' in msg or 'UNAVAILABLE' in msg):
                wait = 4 * (attempt + 1)
                logger.warning("Gemini vision OCR attempt %d failed (%s), retrying in %ds…", attempt + 1, msg[:60], wait)
                time.sleep(wait)
            else:
                logger.warning("Gemini vision OCR failed for %s: %s", path, e)
                return ''
    return ''


def _extract_pdf_text(path: str) -> str:
    """pdfplumber → PyMuPDF → Gemini vision OCR (each as optional fallback)."""

    # 1. pdfplumber — best for text-layer PDFs
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            text = '\n'.join(p.extract_text() or '' for p in pdf.pages)
        if len(text.strip()) > 50:
            logger.debug("pdfplumber extracted %d chars from %s", len(text), path)
            return text
    except Exception as e:
        logger.debug("pdfplumber failed for %s: %s", path, e)

    # 2. PyMuPDF (fitz) — fast embedded-font fallback
    try:
        with fitz.open(path) as doc:
            text = '\n'.join(page.get_text() for page in doc)
        if len(text.strip()) > 50:
            logger.debug("fitz extracted %d chars from %s", len(text), path)
            return text
    except Exception as e:
        logger.debug("fitz failed for %s: %s", path, e)

    # 3. Gemini vision OCR — for scanned/image PDFs, no Tesseract needed
    logger.info("Falling back to Gemini vision OCR for %s", path)
    return _extract_pdf_via_vision(path)


def extract_text_from_file(fichier_path: str) -> str:
    ext = fichier_path.rsplit('.', 1)[-1].lower()
    text = ''
    try:
        if ext == 'pdf':
            text = _extract_pdf_text(fichier_path)
        elif ext in ('docx', 'doc'):
            doc = Document(fichier_path)
            text = '\n'.join(para.text for para in doc.paragraphs)
        elif ext in ('txt', 'csv'):
            with open(fichier_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        elif ext in IMAGE_EXTS:
            text = _describe_image_via_vision(fichier_path)
    except Exception:
        text = ''
    return text[:8000]


# ── JSON parsing helper ───────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    raw = raw.strip()
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return {}


# ── Gemini client factory ─────────────────────────────────────────────────────

def _generate(prompt: str) -> str:
    import time
    from google import genai

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    model  = settings.GEMINI_MODEL

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )
            return (response.text or '').strip()
        except Exception as e:
            err_str = str(e).lower()
            if '429' in err_str or 'quota' in err_str:
                # Rate limit — exponential backoff
                if attempt < 2:
                    wait = 2 ** attempt
                    logger.warning("Gemini rate-limited (attempt %d), retrying in %ds…", attempt + 1, wait)
                    time.sleep(wait)
                else:
                    raise
            elif '503' in err_str or 'unavailable' in err_str:
                # Transient — quick retry
                logger.warning("Gemini transient error (attempt %d), retrying in 0.5s…", attempt + 1)
                time.sleep(0.5)
            else:
                # Other errors — one fast retry then fail
                if attempt == 0:
                    logger.warning("Gemini error (attempt 1: %s), retrying in 0.3s…", str(e)[:80])
                    time.sleep(0.3)
                else:
                    raise

    raise RuntimeError("Gemini failed after 3 retries")


# ── CarteIA upsert ────────────────────────────────────────────────────────────

def _upsert_carte(dossier, result: dict) -> CarteIA_Dossier:
    carte, _ = CarteIA_Dossier.objects.update_or_create(
        dossier=dossier,
        defaults={
            'resume':    result.get('resume', ''),
            'mots_cles': result.get('mots_cles', []),
            'analyse':   result.get('analyse', ''),
            'entites':   result.get('entites', {}),
        },
    )
    return carte


# ── Main service ──────────────────────────────────────────────────────────────

class GeminiService:
    """Primary AI service — Google Gemini 1.5 Flash."""

    @staticmethod
    def analyser_fichier(fichier) -> dict:
        """Generate ai_titre + ai_resume for a single file. Always returns a non-empty resume."""
        try:
            full_path = os.path.join(settings.MEDIA_ROOT, fichier.fichier.name)
            text = extract_text_from_file(full_path)
        except Exception as exc:
            logger.exception("extract_text_from_file failed for %s: %s", fichier.nom, exc)
            text = ''

        if not text:
            # Image vision failed OR unsupported extension OR empty file
            return {
                'ai_titre':  fichier.nom,
                'ai_resume': f'[Fichier: {fichier.nom}] (contenu non extractible)',
            }

        text = text[:6000]  # hard cap before prompting Gemini

        prompt = f"""Analyse ce document et retourne UNIQUEMENT un objet JSON valide:
{{
  "titre": "titre court et descriptif en 1 phrase (max 80 caractères)",
  "resume": "résumé de 2-3 phrases du contenu du document"
}}

Contenu du document:
{text[:4000]}"""

        try:
            raw  = _generate(prompt)
            data = _parse_json(raw)
            return {
                'ai_titre':  (data.get('titre') or fichier.nom)[:300],
                'ai_resume': data.get('resume') or f'[{fichier.nom}]',
            }
        except Exception as exc:
            logger.exception("analyser_fichier Gemini error for %s: %s", fichier.nom, exc)
            return {
                'ai_titre':  fichier.nom,
                'ai_resume': f'[{fichier.nom}] (analyse IA non disponible)',
            }

    @staticmethod
    def resumer_dossier(dossier) -> dict:
        """Generate per-file key points + global synthesis.

        Content priority per file:
          1. f.ai_resume  — already computed, instant
          2. carte_ia.analyse / carte_ia.resume  — already computed, instant
          3. Direct file text extraction  — slow for scanned PDFs, last resort only
        """
        # Grab carte_ia data once — avoids repeated DB hits and heavy OCR fallback
        carte_analyse = ''
        try:
            c = dossier.carte_ia
            carte_analyse = c.analyse or c.resume or ''
        except Exception:
            pass

        # Query DB directly — dossier.fichiers.all() may return a stale prefetch cache
        from core.models import Fichier as _Fichier
        file_list = []
        for f in _Fichier.objects.filter(dossier=dossier):
            content = f.ai_resume or ''

            if not content and carte_analyse:
                # Use the already-computed global analysis as proxy (no extra API call)
                content = f"[{f.ai_titre or f.nom}]\n{carte_analyse}"

            if not content:
                # Last resort — slow for scanned PDFs, uses vision for images
                full_path = os.path.join(settings.MEDIA_ROOT, f.fichier.name)
                content = extract_text_from_file(full_path)

            # Always include the file; use a placeholder if content is still empty
            # (e.g. vision API unavailable) so the filename appears in the summary
            if not content:
                ext = (f.fichier.name or '').rsplit('.', 1)[-1].lower()
                if ext in IMAGE_EXTS:
                    content = f"[Fichier image — contenu visuel: {f.nom}]"
                else:
                    content = f"[Fichier sans contenu textuel extractible: {f.nom}]"

            file_list.append({'nom': f.nom, 'contenu': content[:2000]})

        if not file_list:
            return {'fichiers': [], 'synthese_globale': 'Aucun contenu disponible dans ce dossier.'}

        files_json = json.dumps(file_list, ensure_ascii=False)

        prompt = f"""Analyse les documents du dossier "{dossier.titre}" et retourne UNIQUEMENT un objet JSON valide.

Pour chaque document extrait 3 à 5 points clés (1 phrase précise chacun).
Ajoute une synthèse globale du dossier en 2-3 phrases.

JSON attendu:
{{
  "fichiers": [
    {{
      "nom": "nom_du_fichier.pdf",
      "points": [
        "Point clé 1 précis et concis",
        "Point clé 2 précis et concis",
        "Point clé 3 précis et concis"
      ]
    }}
  ],
  "synthese_globale": "Synthèse globale du dossier en 2-3 phrases."
}}

Documents:
{files_json[:6000]}"""

        try:
            raw  = _generate(prompt)
            data = _parse_json(raw)
            fichiers = data.get('fichiers', [])
            if not isinstance(fichiers, list):
                fichiers = []
            result = {
                'fichiers':         fichiers,
                'synthese_globale': data.get('synthese_globale', '') or '',
            }
            # Persist to DB so Résumer button reads it instantly next time
            try:
                CarteIA_Dossier.objects.filter(dossier=dossier).update(resume_structure=result)
            except Exception:
                pass
            return result
        except Exception as exc:
            logger.exception("resumer_dossier error: %s", exc)
            return {'fichiers': [], 'synthese_globale': 'Erreur lors de la génération de la synthèse.'}

    @staticmethod
    def analyser_dossier(dossier) -> CarteIA_Dossier:
        """Generate a CarteIA for the whole dossier.

        Reuses each file's already-computed ai_resume to avoid a second,
        expensive text-extraction / OCR pass. Falls back to direct extraction
        only for files that have not been analysed yet.
        """
        from core.models import Fichier as _Fichier
        texts = []
        for fichier in _Fichier.objects.filter(dossier=dossier):
            t = fichier.ai_resume or ''
            if not t:
                full_path = os.path.join(settings.MEDIA_ROOT, fichier.fichier.name)
                t = extract_text_from_file(full_path)
                if not t:
                    ext = (fichier.fichier.name or '').rsplit('.', 1)[-1].lower()
                    if ext in IMAGE_EXTS:
                        t = f"[Fichier image — contenu visuel: {fichier.nom}]"
            if t:
                texts.append(f"[{fichier.ai_titre or fichier.nom}]\n{t}")

        combined = '\n\n'.join(texts) if texts else 'Aucun contenu textuel disponible.'

        prompt = f"""Tu es un assistant IA pour un système de gestion documentaire.
Analyse les documents du dossier "{dossier.titre}" et retourne UNIQUEMENT un objet JSON valide:
{{
  "resume": "résumé concis en 3-5 phrases",
  "mots_cles": ["mot1", "mot2", "mot3", "mot4", "mot5"],
  "analyse": "analyse détaillée: points importants, entités, dates, décisions",
  "entites": {{
    "personnes": [],
    "lieux": [],
    "dates": [],
    "organisations": []
  }}
}}

Contenu des documents:
{combined[:6000]}"""

        try:
            raw    = _generate(prompt)
            result = _parse_json(raw)
            if not result:
                result = {'resume': raw.strip(), 'mots_cles': [], 'analyse': '', 'entites': {}}
        except Exception as exc:
            logger.exception("analyser_dossier error: %s", exc)
            result = {'resume': '', 'mots_cles': [], 'analyse': '', 'entites': {}}

        return _upsert_carte(dossier, result)


# ── Background orchestration ──────────────────────────────────────────────────

def analyser_fichiers_en_parallele(fichiers, max_workers=4):
    """Analyse the given files concurrently, filling ai_titre / ai_resume.

    Only files still missing ai_resume are processed. Each Gemini call is
    independent, so running them in parallel turns N sequential round-trips into
    ceil(N / max_workers) waves — the main speed-up when a dossier has many files.
    A failure on one file falls back to a placeholder so the pipeline never stalls.
    """
    from django.db import connection

    pending = [f for f in fichiers if not f.ai_resume]
    if not pending:
        return

    def _analyse_one(fichier):
        try:
            result = GeminiService.analyser_fichier(fichier)
            fichier.ai_resume = result.get('ai_resume') or f'[{fichier.nom}]'
            fichier.ai_titre  = result.get('ai_titre')  or fichier.nom
        except Exception:
            logger.exception("analyser_fichier failed for %s", fichier.nom)
            fichier.ai_resume = f'[Fichier: {fichier.nom}]'
            fichier.ai_titre  = fichier.nom
        try:
            fichier.save(update_fields=['ai_resume', 'ai_titre'])
        finally:
            # Each worker uses its own thread-local DB connection — release it
            connection.close()

    with ThreadPoolExecutor(max_workers=min(max_workers, len(pending))) as executor:
        list(executor.map(_analyse_one, pending))


def run_full_analysis(dossier):
    """Full AI pipeline for a dossier — safe to run in a background thread.

      1. per-file analysis (parallel)  → ai_titre / ai_resume
      2. global carte IA               → resume / mots_cles / analyse / entites
      3. structured resume             → resume_structure (what "Résumer" reads)

    Guarantees resume_structure is non-null so the frontend spinner always
    resolves, even if individual AI calls fail.
    """
    import time
    from core.models import Fichier as _Fichier

    t0 = time.time()
    fichiers = list(_Fichier.objects.filter(dossier=dossier))
    logger.info("run_full_analysis: dossier=%s, %d file(s)", dossier.pk, len(fichiers))

    analyser_fichiers_en_parallele(fichiers)

    try:
        GeminiService.analyser_dossier(dossier)
    except Exception:
        logger.exception("run_full_analysis: analyser_dossier failed (dossier=%s)", dossier.pk)

    try:
        GeminiService.resumer_dossier(dossier)  # persists resume_structure
    except Exception:
        logger.exception("run_full_analysis: resumer_dossier failed (dossier=%s)", dossier.pk)

    # Guarantee resume_structure is populated even if the AI calls above failed
    carte, _ = CarteIA_Dossier.objects.get_or_create(dossier=dossier)
    if not carte.resume_structure:
        logger.warning("run_full_analysis: resume_structure empty, writing fallback (dossier=%s)", dossier.pk)
        carte.resume_structure = {
            'synthese_globale': f"Dossier « {dossier.titre} » contient {len(fichiers)} fichier(s).",
            'fichiers': [
                {'nom': f.nom, 'points': [f.ai_resume or f'Fichier: {f.nom}']}
                for f in fichiers
            ],
        }
        carte.save(update_fields=['resume_structure'])

    logger.info("run_full_analysis: dossier=%s done in %.2fs", dossier.pk, time.time() - t0)


# ── Alias so existing task code keeps working ─────────────────────────────────
ClaudeService = GeminiService
