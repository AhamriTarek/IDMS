from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from . import views

router = DefaultRouter()
router.register(r'type-employes', views.TypeEmployeViewSet, basename='type-employe')
router.register(r'employes', views.EmployeViewSet, basename='employe')
router.register(r'dossiers', views.DossierViewSet, basename='dossier')
router.register(r'fichiers', views.FichierViewSet, basename='fichier')
router.register(r'permissions', views.PermissionViewSet, basename='permission')
router.register(r'soumissions', views.SoumissionFichierViewSet, basename='soumission')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'dossier-types', views.DossierTypeCustomViewSet, basename='dossier-type')

urlpatterns = [
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('register/', views.register_employe, name='register'),
    path('me/', views.me, name='me'),
    path('logout/', views.logout_view, name='logout'),
    path('stats/', views.stats_overview, name='stats'),
    path('stats/dossiers-par-type/', views.stats_dossiers_par_type, name='stats-par-type'),
    path('stats/activite/', views.stats_activite, name='stats-activite'),
    path('employe/stats/', views.employe_stats, name='employe-stats'),
    path('', include(router.urls)),
]
