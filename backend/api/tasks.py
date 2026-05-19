import logging
from celery import shared_task
from .services import GeminiService as GeminiService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def analyser_dossier_task(self, dossier_id: int) -> dict:
    from core.models import Dossier

    try:
        dossier = Dossier.objects.get(pk=dossier_id)
    except Dossier.DoesNotExist:
        logger.error("analyser_dossier_task: dossier %s not found", dossier_id)
        return {'error': f'Dossier {dossier_id} introuvable'}

    try:
        # Per-file AI analysis first
        for fichier in dossier.fichiers.all():
            if not fichier.ai_titre and not fichier.ai_resume:
                result = GeminiService.analyser_fichier(fichier)
                fichier.ai_titre = result['ai_titre']
                fichier.ai_resume = result['ai_resume']
                fichier.save(update_fields=['ai_titre', 'ai_resume'])

        # Global dossier carte IA
        carte = GeminiService.analyser_dossier(dossier)
        return {
            'id':         carte.id,
            'dossier_id': dossier_id,
            'resume':     carte.resume,
            'mots_cles':  carte.mots_cles,
            'analyse':    carte.analyse,
            'entites':    carte.entites,
        }
    except Exception as exc:
        logger.exception("analyser_dossier_task: error for dossier %s: %s", dossier_id, exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=1, default_retry_delay=10)
def resumer_dossier_task(self, dossier_id: int) -> dict:
    from core.models import Dossier

    try:
        dossier = Dossier.objects.get(pk=dossier_id)
    except Dossier.DoesNotExist:
        return {'error': f'Dossier {dossier_id} introuvable'}

    try:
        result = GeminiService.resumer_dossier(dossier)
        return result  # already a dict: {synthesis, key_points, alerts}
    except Exception as exc:
        logger.exception("resumer_dossier_task: error for dossier %s: %s", dossier_id, exc)
        raise self.retry(exc=exc)
