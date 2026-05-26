# COMPTE RENDU DE STAGE
## Développement d'un Système Intelligent de Gestion Documentaire (IDMS)

---

| | |
|---|---|
| **Stagiaire** | Fatima-Zohra |
| **Encadrant** | — |
| **Période** | 2025 – 2026 |
| **Établissement d'accueil** | — |
| **Date de rédaction** | Mai 2026 |

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture technique](#2-architecture-technique)
3. [Fonctionnalités réalisées](#3-fonctionnalités-réalisées)
4. [Modèles de données](#4-modèles-de-données)
5. [API Endpoints](#5-api-endpoints)
6. [Sécurité implémentée](#6-sécurité-implémentée)
7. [Ce qui reste à faire](#7-ce-qui-reste-à-faire)
8. [Conclusion](#8-conclusion)

---

## 1. Présentation du projet

### 1.1 Contexte du développement

Ce stage s'est inscrit dans le cadre du développement d'une application web complète destinée à moderniser la gestion documentaire au sein d'une organisation. Face à la prolifération des documents numériques et à la difficulté croissante de les organiser, sécuriser et exploiter efficacement, il est apparu nécessaire de concevoir un système centralisé, intelligent et accessible.

### 1.2 Objectif du système

L'**IDMS (Intelligent Document Management System)** est une plateforme web de gestion documentaire intégrant des capacités d'intelligence artificielle. Elle permet à une organisation de :

- **Centraliser** l'ensemble de ses documents numériques (PDF, Word, Excel, images) dans des dossiers structurés ;
- **Contrôler les accès** de manière granulaire, en attribuant à chaque employé des droits de lecture, d'écriture ou d'administration par dossier ;
- **Analyser automatiquement** le contenu des documents grâce à l'IA (Google Gemini), en générant des titres, des résumés et des fiches d'analyse complètes ;
- **Gérer les soumissions** de fichiers par les employés, avec un workflow de validation par l'administrateur ;
- **Notifier** les utilisateurs en temps réel des événements importants (approbation, rejet, nouvelles permissions).

Le système distingue deux profils d'utilisateurs : l'**Administrateur**, qui gère l'ensemble des dossiers, des comptes et des permissions, et l'**Employé**, qui accède uniquement aux ressources qui lui ont été attribuées.

---

## 2. Architecture technique

### 2.1 Stack technologique

Le projet repose sur une architecture **découplée** (séparation totale frontend / backend), communicant via une API REST sécurisée par JWT.

#### Backend

| Composant | Technologie | Version |
|---|---|---|
| Framework web | Django | ≥ 5.0 |
| API REST | Django REST Framework | ≥ 3.14 |
| Base de données | MySQL | 8.x |
| Authentification JWT | djangorestframework-simplejwt | ≥ 5.3 |
| OAuth social | django-allauth | ≥ 0.63 |
| File d'attente async | Celery | ≥ 5.4 |
| Broker de messages | Redis | ≥ 5.0 |
| Intelligence artificielle | Google Gemini (google-genai) | ≥ 1.0 |
| Extraction PDF | PyMuPDF, pdfplumber | ≥ 1.24 / ≥ 0.11 |
| OCR (images) | pytesseract, Pillow | ≥ 0.3 / ≥ 10.3 |
| Protection brute-force | django-axes | ≥ 8.0 |
| Limitation de requêtes | django-ratelimit | ≥ 4.0 |
| Stockage cloud (optionnel) | boto3 / django-storages | ≥ 1.34 / ≥ 1.14 |

#### Frontend

| Composant | Technologie | Version |
|---|---|---|
| Bibliothèque UI | React | 18.3.1 |
| Outil de build | Vite | 5.3.4 |
| Routage client | React Router DOM | 6.24.0 |
| Framework CSS | Tailwind CSS | 3.4.7 |
| Client HTTP | Axios | 1.7.2 |
| Animations | Framer Motion | 12.38.0 |
| Graphiques | Recharts | 3.8.1 |
| Icônes | Lucide React | 1.14.0 |
| Upload fichiers | React Dropzone | 15.0.0 |
| Animations avancées | GSAP | 3.15.0 |

### 2.2 Structure des dossiers

```
IDMS/
├── backend/                        # Serveur Django
│   ├── idms/                       # Configuration principale du projet
│   │   ├── settings.py             # Paramètres globaux (DB, auth, AI, Celery)
│   │   ├── urls.py                 # Routage racine
│   │   ├── celery.py               # Configuration Celery
│   │   ├── asgi.py                 # Point d'entrée ASGI (async)
│   │   └── wsgi.py                 # Point d'entrée WSGI
│   ├── core/                       # Modèles de données et migrations
│   │   ├── models.py               # Tous les modèles Django
│   │   ├── admin.py                # Interface d'administration
│   │   └── migrations/             # Historique des migrations
│   ├── api/                        # Logique métier et endpoints REST
│   │   ├── views.py                # ViewSets et vues API
│   │   ├── urls.py                 # Routage API
│   │   ├── serializers.py          # Sérialiseurs DRF
│   │   ├── services.py             # Service IA Gemini + extraction de texte
│   │   └── tasks.py                # Tâches Celery asynchrones
│   ├── auth_app/                   # Authentification personnalisée
│   │   ├── views.py                # Handlers Google OAuth + redirection JWT
│   │   ├── urls.py                 # Routes d'authentification
│   │   └── adapters.py             # Adaptateur django-allauth
│   ├── middleware/                  # Middlewares de sécurité personnalisés
│   │   ├── security_middleware.py
│   │   ├── security_logger.py
│   │   ├── permissions.py
│   │   └── validators.py
│   ├── media/                      # Fichiers uploadés (organisés par année/mois)
│   ├── templates/                  # Templates HTML (allauth)
│   ├── manage.py
│   └── requirements.txt
│
├── src/                            # Application React (Vite)
│   ├── pages/                      # Composants de pages
│   │   ├── Login.jsx               # Page de connexion
│   │   ├── AdminDashboard.jsx      # Tableau de bord administrateur
│   │   ├── Dossiers.jsx            # Gestion des dossiers (admin)
│   │   ├── Comptes.jsx             # Gestion des comptes employés
│   │   ├── Notifications.jsx       # Liste des notifications
│   │   ├── GoogleCallback.jsx      # Callback OAuth Google
│   │   ├── admin/
│   │   │   └── AdminSoumissions.jsx
│   │   └── employe/
│   │       ├── Dashboard.jsx
│   │       ├── Dossiers.jsx
│   │       ├── Soumissions.jsx
│   │       └── Notifications.jsx
│   ├── components/                 # Composants UI réutilisables
│   │   ├── Navbar.jsx, Sidebar.jsx
│   │   ├── DossierCard.jsx, FileUpload.jsx
│   │   ├── PermissionModal.jsx
│   │   ├── NotificationBadge.jsx, StatusBadge.jsx
│   │   ├── ParticleBackground.jsx, EmptyState.jsx
│   ├── context/                    # Gestion d'état global (React Context)
│   │   ├── AuthContext.jsx
│   │   ├── DossiersContext.jsx
│   │   └── NotificationContext.jsx
│   ├── api/
│   │   └── axios.js                # Instance Axios avec intercepteurs JWT
│   ├── services/
│   │   └── employeAPI.js
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

---

## 3. Fonctionnalités réalisées

### 3.1 Authentification

Deux mécanismes d'authentification ont été implémentés et sont disponibles simultanément.

**Authentification classique (email / mot de passe) :**
Le frontend envoie les identifiants à l'endpoint `/api/token/`. Le backend vérifie les credentials, puis retourne une paire de tokens JWT (accès : 60 min, rafraîchissement : 7 jours). L'accès token est joint à chaque requête via l'en-tête `Authorization: Bearer <token>`. Un mécanisme de rafraîchissement silencieux est géré côté frontend par un intercepteur Axios.

**Authentification Google OAuth :**
Deux flux parallèles ont été développés :
- **Flux direct :** le frontend échange un code d'autorisation Google directement via `/auth/google/`. Le backend valide le token, crée ou met à jour le compte utilisateur, puis génère des tokens JWT renvoyés au frontend.
- **Flux allauth :** passage par django-allauth, avec redirection finale vers `/auth/jwt-redirect/` où la session allauth est convertie en JWT.

**Enforcement des rôles :** à chaque connexion, le système vérifie si l'adresse email figure dans la liste `ADMIN_EMAILS`. Si oui, le compte est configuré comme Administrateur ; sinon, comme Employé. Cette logique garantit la cohérence des rôles même après des modifications de configuration.

### 3.2 Gestion des dossiers et des fichiers

L'administrateur peut créer des **dossiers** (conteneurs logiques) avec un titre, une description, un statut (`en_cours`, `terminé`, `archivé`) et un type (entreprise, facturation, RH, rapports, ou type personnalisé). À l'intérieur de ces dossiers, il peut uploader des **fichiers** (PDF, DOCX, XLSX, images) d'une taille maximale de 50 Mo par fichier.

Les employés disposant de droits d'écriture peuvent également uploader des fichiers, qui sont alors placés en statut `en_attente` jusqu'à validation par un administrateur.

### 3.3 Analyse IA des documents (Google Gemini)

Un service dédié (`api/services.py`) orchestre l'analyse intelligente des documents en plusieurs étapes :

1. **Extraction du texte** : le système utilise `pdfplumber` en première intention, puis `PyMuPDF` comme solution de repli, et enfin la vision multimodale de Gemini pour les PDFs numérisés (OCR sans dépendance locale).
2. **Analyse par fichier** : Gemini génère automatiquement un titre descriptif et un résumé de 2 à 3 phrases pour chaque fichier.
3. **Analyse par dossier** (fiche IA `CarteIA_Dossier`) : en agrégeant tous les fichiers, Gemini produit un résumé global, une liste de mots-clés, une analyse approfondie et un dictionnaire d'entités (organisations, dates, personnes).
4. **Résumé structuré** : pour chaque fichier du dossier, Gemini extrait les points clés, complété par une synthèse globale.

Ces tâches d'analyse sont exécutées de manière **asynchrone via Celery**, avec un repli sur les threads Python si Redis est indisponible. Des endpoints de polling permettent au frontend de suivre l'avancement en temps réel.

### 3.4 Système de permissions par employé

Les permissions sont gérées au niveau du couple *(employé, dossier)* avec trois niveaux d'accès :
- **Lecture** : consultation des fichiers uniquement ;
- **Écriture** : lecture + soumission de fichiers ;
- **Admin** : écriture + gestion des permissions du dossier.

Seul l'Administrateur peut accorder ou révoquer des permissions. Un modal dédié (`PermissionModal`) permet cette gestion directement depuis l'interface.

### 3.5 Système de notifications

Un modèle `Notification` permet d'informer les utilisateurs d'événements importants (nouvelle permission accordée, soumission approuvée ou rejetée, nouveau document disponible). Les notifications sont typées (`info`, `success`, `warning`, `error`), liées à un lien de navigation optionnel, et marquées comme lues ou non lues. Un badge affiche en temps réel le nombre de notifications non lues dans la barre de navigation.

### 3.6 Workflow de soumission de documents

Les employés peuvent soumettre des fichiers à destination d'un dossier via l'interface de soumission. Chaque soumission est enregistrée avec le statut `en_attente`. L'administrateur dispose d'un écran dédié listant toutes les soumissions en attente ; il peut les **approuver** (le fichier intègre alors le dossier) ou les **rejeter** (en indiquant un motif). Une notification est envoyée à l'employé dans les deux cas.

### 3.7 Tableau de bord Administrateur

Le tableau de bord administrateur présente :
- Des **indicateurs clés** (KPIs) : nombre total de dossiers, d'employés actifs, de soumissions en attente, de notifications non lues, avec tendances par rapport au mois précédent ;
- Un **graphique en secteurs** (Recharts) : répartition des dossiers par type ;
- Un **graphique en barres** : activité de création de fichiers sur les 7 derniers jours.

### 3.8 Tableau de bord Employé

L'employé dispose d'un tableau de bord personnalisé affichant ses dossiers accessibles, l'état de ses soumissions (en attente / approuvées / rejetées) et ses notifications non lues.

---

## 4. Modèles de données

### 4.1 Diagramme des modèles

```
User (Django)
  ├── Administrateur (OneToOne)
  └── Employe (OneToOne)
        └── TypeEmploye (ForeignKey)

Dossier
  ├── createur → Administrateur
  ├── Fichier (ForeignKey, plusieurs par dossier)
  │     └── uploaded_by → User
  │     └── soumission → SoumissionFichier (optionnel)
  ├── CarteIA_Dossier (OneToOne)
  ├── Permission (ForeignKey, plusieurs par dossier)
  │     ├── employe → Employe
  │     └── accordee_par → Administrateur
  └── SoumissionFichier (ForeignKey)
        ├── employe → Employe
        └── reviewed_by → Administrateur

Notification
  └── destinataire → User
```

### 4.2 Description des modèles

**`TypeEmploye`**
Catégorie d'emploi (ex. : comptable, RH, commercial). Champs : `nom` (unique), `description`.

**`Administrateur`**
Profil administrateur lié à un `User` Django (OneToOne). Champs : `nom`, `prenom`, `telephone`, `created_at`, `updated_at`.

**`Employe`**
Profil employé lié à un `User` Django (OneToOne). Champs : `type_employe` (FK), `nom`, `prenom`, `telephone`, `google_id` (OAuth), `avatar` (URL Google), `is_active`.

**`Dossier`**
Conteneur principal de documents. Champs : `titre`, `description`, `status` (`en_cours` / `termine` / `archive`), `type_dossier`, `createur` (FK Administrateur), `created_at`, `updated_at`.

**`DossierTypeCustom`**
Types de dossiers personnalisés créés par l'admin. Champs : `name` (unique), `color` (code hex), `created_at`.

**`Fichier`**
Fichier individuel rattaché à un dossier. Champs : `dossier` (FK), `nom`, `fichier` (FileField, chemin `media/fichiers/%Y/%m/`), `type_fichier` (`pdf` / `docx` / `xlsx` / `image` / `autre`), `taille` (octets), `uploaded_by` (FK User), `status` (`confirme` / `en_attente`), `ai_titre`, `ai_resume`, `soumission` (FK optionnel), `created_at`.

**`CarteIA_Dossier`**
Fiche d'analyse IA associée à un dossier (OneToOne). Champs : `resume`, `mots_cles` (JSONField), `analyse`, `entites` (JSONField), `resume_structure` (JSONField), `generated_at`, `updated_at`.

**`Permission`**
Droit d'accès d'un employé sur un dossier. Champs : `employe` (FK), `dossier` (FK), `acces` (`lecture` / `ecriture` / `admin`), `accordee_par` (FK Administrateur), `created_at`, `updated_at`. Contrainte unique : *(employe, dossier)*.

**`SoumissionFichier`**
Soumission de fichier par un employé. Champs : `employe` (FK), `dossier` (FK), `fichier` (FileField optionnel), `nom_fichier`, `commentaire`, `status` (`en_attente` / `approuve` / `rejete`), `reviewed_by` (FK Administrateur, nullable), `reviewed_at`, `rejection_reason`, `created_at`.

**`Notification`**
Message in-app destiné à un utilisateur. Champs : `destinataire` (FK User), `titre` (max 200 car.), `message`, `type_notif` (`info` / `warning` / `success` / `error`), `lu` (booléen), `lien` (URL optionnelle), `created_at`.

---

## 5. API Endpoints

### 5.1 Authentification

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/token/` | Connexion email/mot de passe → retourne access + refresh tokens |
| POST | `/api/token/refresh/` | Renouvellement du token d'accès |
| POST | `/api/token/verify/` | Vérification de la validité d'un token |
| POST | `/api/register/` | Création d'un compte employé |
| GET | `/api/me/` | Profil de l'utilisateur courant + rôle |
| POST | `/api/logout/` | Révocation du refresh token (blacklist) |
| POST | `/auth/google/` | Échange de code OAuth Google → JWT |
| POST | `/auth/google/token/` | Vérification d'un ID token Google |
| GET | `/auth/jwt-redirect/` | Pont allauth → JWT (après OAuth) |

### 5.2 Statistiques

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/stats/` | KPIs globaux (admin) |
| GET | `/api/stats/dossiers-par-type/` | Répartition des dossiers par type |
| GET | `/api/stats/activite/` | Activité fichiers sur 7 jours |
| GET | `/api/employe/stats/` | Statistiques personnelles de l'employé |

### 5.3 ViewSets (CRUD complet)

| Ressource | Endpoint de base | Actions standard | Actions personnalisées |
|---|---|---|---|
| Types d'employés | `/api/type-employes/` | list, create, retrieve, update, destroy | — |
| Employés | `/api/employes/` | list, create, retrieve, update, destroy | — |
| Dossiers | `/api/dossiers/` | list, create, retrieve, update, destroy | `generer-carte-ia/`, `resumer/`, `resumer-status/`, `resume-data/`, `carte-ia-status/`, `fichiers/` |
| Fichiers | `/api/fichiers/` | list, create, retrieve, update, destroy | — |
| Permissions | `/api/permissions/` | list, create, retrieve, update, destroy | — |
| Soumissions | `/api/soumissions/` | list, create, retrieve, update, destroy | — |
| Notifications | `/api/notifications/` | list, retrieve, update, destroy | `non-lues-count/` |
| Types de dossiers | `/api/dossier-types/` | list, create, update, destroy | — |

---

## 6. Sécurité implémentée

### 6.1 Authentification et gestion des sessions

- **JWT (JSON Web Tokens)** : l'accès token a une durée de vie de 60 minutes, le refresh token de 7 jours avec rotation automatique à chaque renouvellement. À la déconnexion, le refresh token est mis en liste noire (`simplejwt` blacklist), rendant impossible toute réutilisation.
- Les tokens sont stockés en `sessionStorage` côté frontend (non persistés au-delà de la session navigateur, contrairement à `localStorage`).

### 6.2 Protection contre les attaques

- **django-axes** : verrouillage automatique du compte après 5 tentatives de connexion échouées, avec une période de blocage d'une heure. Journalisation de toutes les tentatives.
- **django-ratelimit** : limitation du débit des requêtes sur les endpoints sensibles pour prévenir les attaques par force brute et le scraping.
- **Validation des fichiers** : taille maximale de 50 Mo par fichier (200 Mo pour les archives), vérification du type MIME pour éviter l'upload de fichiers malveillants.

### 6.3 Contrôle des accès

- **Permissions par rôle** : chaque endpoint vérifie si l'utilisateur est Administrateur ou Employé avant d'autoriser l'opération.
- **Permissions par dossier** : les queries des fichiers et dossiers sont filtrées selon les enregistrements `Permission` de l'employé connecté — un employé ne peut jamais accéder à un dossier non attribué, même en connaissant son identifiant.
- **Middlewares de sécurité personnalisés** : `security_middleware.py` ajoute les en-têtes de sécurité HTTP (`X-Frame-Options: DENY`, `Content-Security-Policy`, `Strict-Transport-Security`), et `security_logger.py` journalise les événements suspects.

### 6.4 CORS et configuration réseau

- `django-cors-headers` : les requêtes cross-origin ne sont acceptées que depuis l'URL du frontend (`FRONTEND_URL`), bloquant tout accès depuis d'autres origines.
- `ALLOWED_HOSTS` restreint les hôtes acceptés par le serveur Django.

### 6.5 Données sensibles

- Toutes les variables sensibles (clés API, identifiants DB, SECRET_KEY) sont externalisées dans un fichier `.env` non versionné.
- La clé secrète Django n'est jamais codée en dur dans le code source.

---

## 7. Ce qui reste à faire

### 7.1 Tests automatisés

Aucune suite de tests n'est actuellement présente dans le projet. Il serait nécessaire de développer :
- Des **tests unitaires** pour les serializers et les services (notamment le service Gemini et l'extraction de texte) ;
- Des **tests d'intégration** pour les endpoints API (avec une base de données de test) ;
- Des **tests end-to-end** pour les principaux flux utilisateurs (connexion, upload, analyse, soumission).

### 7.2 Documentation de l'API

L'API REST n'est pas documentée de manière formelle. L'intégration de **drf-spectacular** ou **drf-yasg** permettrait de générer automatiquement une documentation Swagger / OpenAPI interactive, facilitant l'onboarding de nouveaux développeurs et l'intégration de clients tiers.

### 7.3 Notifications en temps réel (WebSockets)

Le système de notifications actuel repose sur un polling côté client. Une évolution vers les **WebSockets** (Django Channels) permettrait des notifications véritablement temps réel, sans surcharger le serveur de requêtes HTTP répétées.

### 7.4 Recherche avancée

Il n'existe pas encore de moteur de recherche plein texte. L'intégration d'**Elasticsearch** ou de la recherche vectorielle permettrait de chercher dans le contenu des documents, les résumés IA et les métadonnées.

### 7.5 Gestion des versions de fichiers

Actuellement, chaque upload crée un nouveau fichier. Un système de **versioning** permettrait de conserver l'historique des modifications d'un document et de restaurer une version antérieure.

### 7.6 Interface d'administration avancée

Certaines actions d'administration (suppression en masse, import/export de données, audit complet des accès) pourraient être enrichies dans l'interface React. L'interface Django admin existante (`core/admin.py`) reste fonctionnelle mais limitée.

### 7.7 Déploiement et CI/CD

Le projet ne dispose pas encore d'un pipeline d'intégration et de déploiement continus. La mise en place de **GitHub Actions** (ou équivalent) permettrait d'automatiser les tests, le linting et le déploiement en production. Une containerisation via **Docker Compose** faciliterait également la reproductibilité des environnements.

### 7.8 Internationalisation

L'interface est actuellement en français uniquement. Un support multilingue (i18n) via `react-i18next` côté frontend et `django.middleware.locale` côté backend pourrait être ajouté pour une audience internationale.

---

## 8. Conclusion

Ce stage a permis de concevoir et développer de bout en bout un **système de gestion documentaire intelligent**, couvrant l'ensemble du cycle de vie d'un document au sein d'une organisation : stockage structuré, contrôle d'accès, analyse automatisée par intelligence artificielle, soumission collaborative et notification.

Sur le plan technique, le projet m'a permis de mettre en pratique une stack moderne et complète — **Django REST Framework** pour le backend, **React / Vite** pour le frontend, **Celery / Redis** pour le traitement asynchrone, et **Google Gemini** pour l'IA — en portant une attention particulière à la sécurité (JWT, OAuth, rate limiting, middlewares) et à la qualité du code (séparation des couches, services réutilisables, sérialiseurs).

Le résultat est une application fonctionnelle, déployable et évolutive, qui répond aux besoins identifiés : un administrateur peut gérer l'ensemble des documents et des accès depuis une interface claire, tandis que chaque employé dispose d'un espace personnalisé adapté à ses droits. L'intégration de l'IA apporte une réelle valeur ajoutée en automatisant l'analyse des documents et en réduisant le travail manuel de catégorisation.

Les axes d'amélioration identifiés — tests, documentation, temps réel, recherche plein texte — constituent une feuille de route naturelle pour les prochaines itérations du projet.

---

*Document généré en mai 2026 — IDMS v1.0*
