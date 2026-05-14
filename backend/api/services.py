import os
import json
import re
import logging
import fitz          # PyMuPDF
from docx import Document
from django.conf import settings
from core.models import CarteIA_Dossier

logger = logging.getLogger(__name__)


# ── Text extraction ───────────────────────────────────────────────────────────

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
    ext = fichier_path.split('.')[-1].lower()
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
    from google import genai
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text


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
        """Generate ai_titre + ai_resume for a single file."""
        full_path = os.path.join(settings.MEDIA_ROOT, fichier.fichier.name)
        text = extract_text_from_file(full_path)
        if not text:
            return {'ai_titre': fichier.nom, 'ai_resume': ''}

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
                'ai_resume': data.get('resume') or '',
            }
        except Exception as exc:
            logger.exception("analyser_fichier error: %s", exc)
            return {'ai_titre': fichier.nom, 'ai_resume': ''}

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
                # Last resort only — will be slow for scanned PDFs
                full_path = os.path.join(settings.MEDIA_ROOT, f.fichier.name)
                content = extract_text_from_file(full_path)

            if content:
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
        """Generate a CarteIA for the whole dossier."""
        from core.models import Fichier as _Fichier
        texts = []
        for fichier in _Fichier.objects.filter(dossier=dossier):
            full_path = os.path.join(settings.MEDIA_ROOT, fichier.fichier.name)
            t = extract_text_from_file(full_path)
            if t:
                texts.append(f"[{fichier.nom}]\n{t}")

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


# ── Alias so existing task code keeps working ─────────────────────────────────
ClaudeService = GeminiService
