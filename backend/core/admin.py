from django.contrib import admin
from .models import (
    Administrateur, TypeEmploye, Employe, Dossier, Fichier,
    CarteIA_Dossier, Permission, SoumissionFichier, Notification
)


@admin.register(Administrateur)
class AdministrateurAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prenom', 'user', 'created_at')
    search_fields = ('nom', 'prenom', 'user__email')


@admin.register(TypeEmploye)
class TypeEmployeAdmin(admin.ModelAdmin):
    list_display = ('nom', 'created_at')
    search_fields = ('nom',)


@admin.register(Employe)
class EmployeAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prenom', 'type_employe', 'is_active', 'created_at')
    list_filter = ('type_employe', 'is_active')
    search_fields = ('nom', 'prenom', 'user__email')


@admin.register(Dossier)
class DossierAdmin(admin.ModelAdmin):
    list_display = ('titre', 'status', 'createur', 'created_at')
    list_filter = ('status',)
    search_fields = ('titre', 'description')


@admin.register(Fichier)
class FichierAdmin(admin.ModelAdmin):
    list_display = ('nom', 'dossier', 'type_fichier', 'taille_mb', 'created_at')
    list_filter = ('type_fichier',)
    search_fields = ('nom',)

    def taille_mb(self, obj):
        return f"{obj.taille_mb} MB"
    taille_mb.short_description = 'Taille'


@admin.register(CarteIA_Dossier)
class CarteIA_DossierAdmin(admin.ModelAdmin):
    list_display = ('dossier', 'generated_at', 'updated_at')
    search_fields = ('dossier__titre',)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('employe', 'dossier', 'acces', 'accordee_par', 'created_at')
    list_filter = ('acces',)


@admin.register(SoumissionFichier)
class SoumissionFichierAdmin(admin.ModelAdmin):
    list_display = ('employe', 'dossier', 'nom_fichier', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('nom_fichier',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('destinataire', 'titre', 'type_notif', 'lu', 'created_at')
    list_filter = ('type_notif', 'lu')
    search_fields = ('titre', 'message')
