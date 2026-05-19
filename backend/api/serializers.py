from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from core.models import (
    Administrateur, TypeEmploye, Employe, Dossier, Fichier,
    CarteIA_Dossier, Permission, SoumissionFichier, Notification,
    DossierTypeCustom,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field)
        if identifier and '@' in identifier:
            try:
                user = User.objects.get(email__iexact=identifier)
                attrs[self.username_field] = user.username
            except User.DoesNotExist:
                pass
        return super().validate(attrs)


class AdministrateurSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Administrateur
        fields = ('id', 'user', 'nom', 'prenom', 'telephone', 'created_at')


class TypeEmployeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeEmploye
        fields = ('id', 'nom', 'description', 'created_at')


class EmployeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    type_employe = TypeEmployeSerializer(read_only=True)
    type_employe_id = serializers.PrimaryKeyRelatedField(
        queryset=TypeEmploye.objects.all(), source='type_employe', write_only=True, required=False
    )

    class Meta:
        model = Employe
        fields = (
            'id', 'user', 'type_employe', 'type_employe_id',
            'nom', 'prenom', 'telephone', 'avatar', 'is_active', 'created_at'
        )


class FichierSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    taille_mb = serializers.ReadOnlyField()

    class Meta:
        model = Fichier
        fields = (
            'id', 'dossier', 'nom', 'fichier', 'type_fichier',
            'taille', 'taille_mb', 'uploaded_by',
            'ai_titre', 'ai_resume', 'status', 'created_at'
        )
        read_only_fields = ('taille', 'type_fichier', 'ai_titre', 'ai_resume', 'status')

    def create(self, validated_data):
        fichier_file = validated_data.get('fichier')
        if fichier_file:
            validated_data['taille'] = fichier_file.size
            ext = fichier_file.name.split('.')[-1].lower()
            type_map = {'pdf': 'pdf', 'docx': 'docx', 'doc': 'docx', 'xlsx': 'xlsx', 'xls': 'xlsx'}
            if ext in type_map:
                validated_data['type_fichier'] = type_map[ext]
            elif ext in ('jpg', 'jpeg', 'png', 'gif', 'webp'):
                validated_data['type_fichier'] = 'image'
            else:
                validated_data['type_fichier'] = 'autre'
        return super().create(validated_data)


class CarteIA_DossierSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarteIA_Dossier
        fields = ('id', 'dossier', 'resume', 'mots_cles', 'analyse', 'entites', 'resume_structure', 'generated_at', 'updated_at')
        read_only_fields = ('generated_at', 'updated_at')


class PermissionSerializer(serializers.ModelSerializer):
    employe = EmployeSerializer(read_only=True)
    employe_id = serializers.PrimaryKeyRelatedField(
        queryset=Employe.objects.all(), source='employe', write_only=True
    )
    dossier_id = serializers.PrimaryKeyRelatedField(
        queryset=Dossier.objects.all(), source='dossier', write_only=True
    )
    dossier_titre = serializers.CharField(source='dossier.titre', read_only=True)

    class Meta:
        model = Permission
        fields = ('id', 'employe', 'employe_id', 'dossier', 'dossier_id', 'dossier_titre', 'acces', 'accordee_par', 'created_at')
        read_only_fields = ('accordee_par', 'dossier')  # dossier written via dossier_id


class EmployeAvatarSerializer(serializers.ModelSerializer):
    initials = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Employe
        fields = ('id', 'nom', 'prenom', 'avatar', 'initials', 'email')

    def get_initials(self, obj):
        p = (obj.prenom or '')[:1].upper()
        n = (obj.nom or '')[:1].upper()
        return (p + n) or '?'


class DossierSerializer(serializers.ModelSerializer):
    createur = AdministrateurSerializer(read_only=True)
    fichiers = serializers.SerializerMethodField()
    carte_ia = CarteIA_DossierSerializer(read_only=True)
    fichiers_count = serializers.SerializerMethodField()
    employes_autorises = serializers.SerializerMethodField()
    type_dossier = serializers.CharField(max_length=50, default='enterprise')

    class Meta:
        model = Dossier
        fields = (
            'id', 'titre', 'description', 'status', 'type_dossier',
            'createur', 'fichiers', 'fichiers_count', 'carte_ia',
            'employes_autorises', 'created_at', 'updated_at'
        )

    def get_fichiers(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'administrateur'):
            # Admins only see confirmed files
            qs = obj.fichiers.filter(status='confirme')
        elif request:
            # Employees see confirmed files + their own pending files (so they know what's awaiting approval)
            qs = obj.fichiers.filter(
                Q(status='confirme') |
                Q(status='en_attente', uploaded_by=request.user)
            )
        else:
            qs = obj.fichiers.filter(status='confirme')
        return FichierSerializer(qs, many=True, context=self.context).data

    def get_fichiers_count(self, obj):
        return obj.fichiers.filter(status='confirme').count()

    def get_employes_autorises(self, obj):
        perms = obj.permissions.select_related('employe__user').all()[:8]
        return [EmployeAvatarSerializer(p.employe).data for p in perms]


class DossierListSerializer(serializers.ModelSerializer):
    createur = AdministrateurSerializer(read_only=True)
    fichiers_count = serializers.SerializerMethodField()
    ai_resume_preview = serializers.SerializerMethodField()
    has_ai_analysis = serializers.SerializerMethodField()
    has_resume = serializers.SerializerMethodField()
    employes_autorises = serializers.SerializerMethodField()
    type_dossier = serializers.CharField(max_length=50, default='enterprise')

    class Meta:
        model = Dossier
        fields = (
            'id', 'titre', 'description', 'status', 'type_dossier',
            'createur', 'fichiers_count', 'ai_resume_preview', 'has_ai_analysis',
            'has_resume', 'employes_autorises', 'created_at', 'updated_at'
        )

    def get_fichiers_count(self, obj):
        return obj.fichiers.filter(status='confirme').count()

    def get_ai_resume_preview(self, obj):
        try:
            return (obj.carte_ia.resume or '')[:160]
        except Exception:
            return ''

    def get_has_ai_analysis(self, obj):
        try:
            _ = obj.carte_ia
            return True
        except Exception:
            pass
        return obj.fichiers.exclude(ai_resume='').exists()

    def get_has_resume(self, obj):
        try:
            return bool(obj.carte_ia.resume_structure)
        except Exception:
            return False

    def get_employes_autorises(self, obj):
        perms = obj.permissions.select_related('employe__user').all()[:6]
        return [EmployeAvatarSerializer(p.employe).data for p in perms]


class SoumissionFichierSerializer(serializers.ModelSerializer):
    employe = EmployeSerializer(read_only=True)
    dossier = DossierListSerializer(read_only=True)
    dossier_id = serializers.PrimaryKeyRelatedField(
        queryset=Dossier.objects.all(), source='dossier', write_only=True
    )

    class Meta:
        model = SoumissionFichier
        fields = (
            'id', 'employe', 'dossier', 'dossier_id', 'fichier',
            'nom_fichier', 'commentaire', 'status',
            'reviewed_by', 'reviewed_at', 'rejection_reason', 'created_at'
        )
        read_only_fields = ('employe', 'status', 'reviewed_by', 'reviewed_at', 'nom_fichier')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'titre', 'message', 'type_notif', 'lu', 'lien', 'created_at')
        read_only_fields = ('created_at',)


class DossierTypeCustomSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DossierTypeCustom
        fields = ('id', 'name', 'color', 'created_at')
        read_only_fields = ('created_at',)


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True, required=False, allow_blank=True)
    nom = serializers.CharField(max_length=100)
    prenom = serializers.CharField(max_length=100)
    type_employe_id = serializers.IntegerField(required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value
