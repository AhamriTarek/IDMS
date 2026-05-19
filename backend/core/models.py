from django.db import models
from django.contrib.auth.models import User


class Administrateur(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='administrateur')
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'administrateur'
        verbose_name = 'Administrateur'
        verbose_name_plural = 'Administrateurs'

    def __str__(self):
        return f"{self.prenom} {self.nom}"


class TypeEmploye(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'type_employe'
        verbose_name = 'Type Employé'
        verbose_name_plural = 'Types Employé'

    def __str__(self):
        return self.nom


class Employe(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employe')
    type_employe = models.ForeignKey(
        TypeEmploye, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='employes'
    )
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20, blank=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    avatar = models.URLField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employe'
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'

    def __str__(self):
        return f"{self.prenom} {self.nom}"


class DossierTypeCustom(models.Model):
    name  = models.CharField(max_length=80, unique=True)
    color = models.CharField(max_length=7, default='#6366F1')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'dossier_type_custom'
        ordering = ['created_at']

    def __str__(self):
        return self.name


class Dossier(models.Model):
    STATUS_CHOICES = [
        ('en_cours', 'En Cours'),
        ('termine', 'Terminé'),
        ('archive', 'Archivé'),
    ]
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_cours')
    type_dossier = models.CharField(max_length=50, default='enterprise')
    createur = models.ForeignKey(
        Administrateur, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='dossiers_crees'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'dossier'
        verbose_name = 'Dossier'
        verbose_name_plural = 'Dossiers'
        ordering = ['-created_at']

    def __str__(self):
        return self.titre


class Fichier(models.Model):
    TYPE_CHOICES = [
        ('pdf', 'PDF'),
        ('docx', 'Word'),
        ('xlsx', 'Excel'),
        ('image', 'Image'),
        ('autre', 'Autre'),
    ]
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='fichiers')
    nom = models.CharField(max_length=255)
    fichier = models.FileField(upload_to='fichiers/%Y/%m/')
    type_fichier = models.CharField(max_length=10, choices=TYPE_CHOICES, default='autre')
    taille = models.BigIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='fichiers_uploades'
    )
    STATUS_FICHIER_CHOICES = [
        ('confirme', 'Confirmé'),
        ('en_attente', 'En attente'),
    ]
    ai_titre = models.CharField(max_length=300, blank=True)
    ai_resume = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_FICHIER_CHOICES, default='confirme')
    soumission = models.ForeignKey(
        'SoumissionFichier',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='fichiers_soumis'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fichier'
        verbose_name = 'Fichier'
        verbose_name_plural = 'Fichiers'
        ordering = ['-created_at']

    def __str__(self):
        return self.nom

    @property
    def taille_mb(self):
        return round(self.taille / (1024 * 1024), 2)


class CarteIA_Dossier(models.Model):
    dossier = models.OneToOneField(Dossier, on_delete=models.CASCADE, related_name='carte_ia')
    resume = models.TextField()
    mots_cles = models.JSONField(default=list)
    analyse = models.TextField(blank=True)
    entites = models.JSONField(default=dict)
    resume_structure = models.JSONField(null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carte_ia_dossier'
        verbose_name = 'Carte IA Dossier'
        verbose_name_plural = 'Cartes IA Dossiers'

    def __str__(self):
        return f"Carte IA — {self.dossier.titre}"


class Permission(models.Model):
    ACCES_CHOICES = [
        ('lecture', 'Lecture'),
        ('ecriture', 'Écriture'),
        ('admin', 'Admin'),
    ]
    employe = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name='permissions')
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='permissions')
    acces = models.CharField(max_length=20, choices=ACCES_CHOICES, default='lecture')
    accordee_par = models.ForeignKey(
        Administrateur, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='permissions_accordees'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'permission'
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'
        unique_together = ('employe', 'dossier')

    def __str__(self):
        return f"{self.employe} → {self.dossier} ({self.acces})"


class SoumissionFichier(models.Model):
    STATUS_CHOICES = [
        ('en_attente', 'En Attente'),
        ('approuve', 'Approuvé'),
        ('rejete', 'Rejeté'),
    ]
    employe = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name='soumissions')
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='soumissions')
    fichier = models.FileField(upload_to='soumissions/%Y/%m/', blank=True, null=True)
    nom_fichier = models.CharField(max_length=255)
    commentaire = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente')
    reviewed_by = models.ForeignKey(
        Administrateur, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='soumissions_revues'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'soumission_fichier'
        verbose_name = 'Soumission Fichier'
        verbose_name_plural = 'Soumissions Fichiers'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employe} — {self.nom_fichier} ({self.status})"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Avertissement'),
        ('success', 'Succès'),
        ('error', 'Erreur'),
    ]
    destinataire = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='notifications'
    )
    titre = models.CharField(max_length=200)
    message = models.TextField()
    type_notif = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    lu = models.BooleanField(default=False)
    lien = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.destinataire.username} — {self.titre}"
