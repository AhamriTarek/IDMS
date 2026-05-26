# Rapport de stage

## Conception et développement d'un système intelligent de gestion documentaire — **IDMS**

---

| | |
|---|---|
| **Stagiaire** | Fatima-Zohra |
| **Encadrant** | — |
| **Période** | 2025 – 2026 |
| **Établissement d'accueil** | — |
| **Type de stage** | Stage de fin d'études — projet de développement logiciel |
| **Date de rédaction** | Mai 2026 |
| **Version du document** | 1.0 |

---

## Résumé

Le présent rapport décrit la conception, le développement et la mise en œuvre d'**IDMS** (*Intelligent Document Management System*), une plateforme web full-stack de gestion documentaire intégrant des fonctionnalités d'intelligence artificielle. Développée sur une architecture découplée **Django REST Framework** côté serveur et **React / Vite** côté client, l'application répond à la problématique de centralisation, de sécurisation et d'exploitation automatisée des documents au sein d'une organisation. Elle propose un contrôle d'accès granulaire par dossier, un workflow de soumission collaborative entre employés et administrateur, une analyse automatique du contenu des documents (extraction de texte, génération de résumés, détection d'entités, mots-clés) via **Google Gemini**, et un système de notifications interne. Le traitement asynchrone des analyses IA est orchestré par **Celery** et **Redis**. Le projet aboutit à une application fonctionnelle, sécurisée (JWT, OAuth Google, protection brute-force, validation des fichiers, en-têtes HTTP durcis) et évolutive.

**Mots-clés** : gestion documentaire, GED, Django REST Framework, React, JWT, OAuth 2.0, Google Gemini, intelligence artificielle, OCR, Celery, Redis, full-stack.

---

## Table des matières

1. [Introduction générale](#1-introduction-générale)
2. [Présentation du projet](#2-présentation-du-projet)
3. [Étude et analyse des besoins](#3-étude-et-analyse-des-besoins)
4. [Architecture technique](#4-architecture-technique)
5. [Modèles de données](#5-modèles-de-données)
6. [Fonctionnalités réalisées](#6-fonctionnalités-réalisées)
7. [API REST — Endpoints](#7-api-rest--endpoints)
8. [Sécurité implémentée](#8-sécurité-implémentée)
9. [Interface utilisateur et expérience](#9-interface-utilisateur-et-expérience)
10. [Installation et exploitation](#10-installation-et-exploitation)
11. [Difficultés rencontrées et solutions apportées](#11-difficultés-rencontrées-et-solutions-apportées)
12. [Bilan personnel et compétences acquises](#12-bilan-personnel-et-compétences-acquises)
13. [Perspectives d'amélioration](#13-perspectives-damélioration)
14. [Conclusion générale](#14-conclusion-générale)
15. [Annexes](#15-annexes)

---

## 1. Introduction générale

La transformation numérique des organisations s'accompagne d'une explosion du volume des documents produits, échangés et archivés au quotidien : contrats, factures, rapports, formulaires RH, supports commerciaux. Cette prolifération soulève trois problèmes majeurs : la **dispersion** des fichiers entre des outils hétérogènes (e-mails, partages réseau, services cloud), la **difficulté de contrôle d'accès** (qui peut consulter quoi, à quel moment) et le **temps perdu** dans la classification manuelle et la recherche d'information.

Les solutions de gestion électronique de documents (GED) traditionnelles répondent partiellement à ces enjeux, mais demeurent souvent coûteuses, peu adaptées aux besoins spécifiques d'une PME et dépourvues de capacités d'analyse intelligente. Avec l'émergence des grands modèles de langage (LLM) accessibles via API, il devient envisageable d'enrichir une plateforme documentaire avec des fonctionnalités d'**analyse sémantique automatique** — résumés, extraction d'entités, classification — auparavant réservées à des projets de recherche.

C'est dans ce contexte que s'inscrit le projet **IDMS** (*Intelligent Document Management System*), réalisé durant ce stage. L'objectif a été de concevoir, développer et livrer une application web complète, sécurisée et exploitable, capable d'unifier la gestion documentaire d'une organisation tout en y intégrant nativement une couche d'intelligence artificielle s'appuyant sur **Google Gemini**.

Ce rapport présente le cheminement du projet, du recueil des besoins jusqu'au livrable final. Il décrit l'architecture technique retenue, les choix d'implémentation, les difficultés rencontrées et les compétences mobilisées ou acquises tout au long du stage.

---

## 2. Présentation du projet

### 2.1 Contexte et problématique

La gestion documentaire dans une organisation moyenne se heurte généralement à plusieurs limites :
- les documents sont stockés dans des emplacements multiples (postes de travail, mails, partages réseau, services cloud personnels) sans politique de centralisation ;
- les droits d'accès sont gérés de façon implicite, ce qui crée des risques de fuite ou de perte d'information ;
- la classification des documents repose sur un effort manuel chronophage, souvent inégal selon les utilisateurs ;
- l'exploitation analytique des contenus (recherche par mots-clés, extraction d'entités, résumés) est inexistante ou rudimentaire.

Le projet IDMS vise à répondre à ces limites par une solution unifiée, accessible via navigateur, sécurisée et enrichie d'intelligence artificielle.

### 2.2 Objectifs du projet

**Objectif général** : concevoir et développer une plateforme web complète de gestion documentaire intelligente, permettant à une organisation de centraliser ses documents, d'en contrôler l'accès et d'en automatiser l'analyse.

**Objectifs spécifiques** :
- proposer un module de **stockage structuré** organisé par dossiers et types ;
- implémenter une **authentification robuste** (email/mot de passe + OAuth Google) avec gestion des rôles (Administrateur / Employé) ;
- construire un **modèle de permissions fines** au niveau (employé × dossier) avec trois niveaux d'accès (lecture, écriture, admin) ;
- intégrer un **moteur d'analyse IA** capable de générer automatiquement, pour chaque document, un titre, un résumé, des mots-clés et de détecter les entités nommées ;
- mettre en place un **workflow de soumission collaborative** permettant aux employés de proposer des fichiers à l'inclusion dans un dossier, avec validation administrateur ;
- offrir un **système de notifications** en temps semi-réel informant les utilisateurs des événements importants ;
- garantir une **sécurité de niveau production** : protection contre la force brute, validation des uploads, en-têtes HTTP durcis, journalisation des accès.

### 2.3 Périmètre

**Inclus dans le périmètre** :
- gestion des comptes utilisateurs (création, modification, suppression, activation) ;
- gestion des dossiers et des fichiers (CRUD complet, upload multipart) ;
- attribution et révocation des permissions par dossier ;
- analyse IA des fichiers et des dossiers via Google Gemini ;
- extraction de texte des PDF (texte natif + OCR multimodal pour les PDF numérisés) ;
- workflow de soumission et validation de fichiers ;
- tableau de bord administrateur (KPIs, graphiques) et tableau de bord employé personnalisé ;
- système de notifications in-app avec compteur de non-lues ;
- intégration OAuth Google.

**Exclus du périmètre actuel** (identifiés comme perspectives) :
- moteur de recherche plein texte sur le contenu des documents ;
- versioning et historique des modifications de fichiers ;
- notifications temps réel via WebSockets ;
- application mobile native ;
- internationalisation (l'interface est en français uniquement).

### 2.4 Acteurs du système

Le système distingue deux profils d'utilisateurs :

| Profil | Description | Capacités principales |
|---|---|---|
| **Administrateur** | Compte à privilèges étendus, attribué via la liste `ADMIN_EMAILS` dans la configuration | Crée et gère les dossiers, les comptes employés, attribue les permissions, valide ou rejette les soumissions, consulte les statistiques globales |
| **Employé** | Compte utilisateur standard | Consulte uniquement les dossiers sur lesquels il dispose d'une permission, soumet des fichiers, suit l'état de ses soumissions, reçoit les notifications |

---

## 3. Étude et analyse des besoins

### 3.1 Besoins fonctionnels

| Code | Besoin | Acteur | Priorité |
|---|---|---|---|
| BF-01 | Authentification par email / mot de passe | Tous | Haute |
| BF-02 | Authentification par Google OAuth | Tous | Haute |
| BF-03 | Création, lecture, modification, suppression de dossiers | Administrateur | Haute |
| BF-04 | Upload, téléchargement et suppression de fichiers | Administrateur, Employé (selon permissions) | Haute |
| BF-05 | Attribution et révocation des permissions par dossier | Administrateur | Haute |
| BF-06 | Soumission d'un fichier pour validation | Employé | Haute |
| BF-07 | Validation ou rejet d'une soumission | Administrateur | Haute |
| BF-08 | Génération automatique d'une fiche IA pour un dossier | Administrateur | Moyenne |
| BF-09 | Génération d'un résumé structuré du dossier | Administrateur | Moyenne |
| BF-10 | Visualisation des notifications | Tous | Moyenne |
| BF-11 | Tableau de bord avec indicateurs et graphiques | Administrateur, Employé | Moyenne |
| BF-12 | Gestion des types de dossiers personnalisés | Administrateur | Basse |

### 3.2 Besoins non fonctionnels

- **Sécurité** : authentification forte, journalisation des accès, protection contre les attaques courantes (force brute, CSRF, clickjacking, XSS).
- **Performance** : pagination systématique des listes API (taille par défaut : 20), traitement asynchrone des opérations IA coûteuses (extraction de texte, appels Gemini).
- **Ergonomie** : interface responsive (Tailwind CSS), animations fluides (Framer Motion, GSAP), feedback visuel sur chaque action.
- **Maintenabilité** : séparation stricte des couches (modèles / sérialiseurs / vues / services), code typé et documenté, fichiers de configuration centralisés.
- **Évolutivité** : architecture découplée permettant le remplacement indépendant du frontend ou du backend, possibilité d'externaliser le stockage des fichiers vers Amazon S3.

### 3.3 Méthodologie suivie

Le projet a été conduit selon une démarche **incrémentale**, organisée en plusieurs cycles courts :
1. cadrage et conception des modèles de données ;
2. mise en place de l'authentification et du système de rôles ;
3. développement des CRUD principaux (dossiers, fichiers, permissions) ;
4. intégration du moteur d'analyse IA (Gemini) ;
5. développement du workflow de soumission ;
6. construction des tableaux de bord et des notifications ;
7. durcissement de la sécurité et refonte UX ;
8. tests manuels, corrections et préparation à la mise en production.

Le contrôle de version a été assuré par **Git** tout au long du projet, avec des commits réguliers et descriptifs.

---

## 4. Architecture technique

### 4.1 Vue d'ensemble

L'application repose sur une architecture **client-serveur découplée** :
- un **serveur backend** Django exposant une **API REST** stateless ;
- un **client frontend** React (SPA) consommant l'API via Axios ;
- une **base de données relationnelle** (MySQL en production, SQLite en développement) ;
- un **broker Redis** et un **worker Celery** pour les tâches asynchrones (analyse IA) ;
- un **service externe** Google Gemini (API HTTPS) pour les capacités d'IA générative.

```
┌──────────────────┐        HTTPS / REST + JWT       ┌──────────────────┐
│                  │  ─────────────────────────────► │                  │
│  Frontend React  │                                 │  Backend Django  │
│  (Vite, Tailwind)│  ◄───────────────────────────── │   (DRF + JWT)    │
│                  │       JSON / multipart          │                  │
└──────────────────┘                                 └─────────┬────────┘
                                                               │
                                       ┌───────────────────────┼───────────────────────┐
                                       ▼                       ▼                       ▼
                              ┌──────────────┐        ┌───────────────┐        ┌─────────────────┐
                              │   MySQL DB   │        │ Celery+Redis  │        │ Google Gemini   │
                              │              │        │ (async tasks) │        │   (LLM API)     │
                              └──────────────┘        └───────────────┘        └─────────────────┘
```

### 4.2 Stack technologique

#### Backend

| Composant | Technologie | Rôle |
|---|---|---|
| Framework web | **Django ≥ 5.0** | Cœur applicatif, ORM, routage, admin |
| API REST | **Django REST Framework ≥ 3.14** | Sérialisation, viewsets, pagination, gestion des exceptions |
| JWT | **djangorestframework-simplejwt ≥ 5.3** | Authentification stateless, rotation et blacklist |
| OAuth social | **django-allauth ≥ 0.63** | Flux Google OAuth alternatif |
| Tâches asynchrones | **Celery ≥ 5.4** | Exécution différée des analyses IA |
| Broker | **Redis ≥ 5.0** | File d'attente Celery et cache Django |
| IA générative | **google-genai ≥ 1.0** | Client officiel Gemini |
| Extraction PDF | **pdfplumber ≥ 0.11**, **PyMuPDF ≥ 1.24** | Extraction de texte natif |
| OCR | **pytesseract ≥ 0.3**, **Pillow ≥ 10.3** + Gemini Vision | Reconnaissance optique pour PDF scannés |
| Anti-brute-force | **django-axes ≥ 8.0** | Verrouillage après échecs répétés |
| Rate limiting | **django-ratelimit ≥ 4.0** | Limitation du débit sur endpoints sensibles |
| CORS | **django-cors-headers** | Filtrage des origines cross-domain |
| Stockage cloud | **boto3 ≥ 1.34**, **django-storages ≥ 1.14** | Stockage S3 (optionnel via `USE_S3`) |
| Variables d'env. | **python-dotenv** | Chargement des secrets depuis `.env` |

#### Frontend

| Composant | Technologie | Rôle |
|---|---|---|
| Bibliothèque UI | **React 18.3.1** | Composants déclaratifs |
| Outil de build | **Vite 5.3.4** | Serveur dev rapide + bundling de production |
| Routage | **React Router DOM 6.24** | Routes côté client |
| Styles | **Tailwind CSS 3.4** + **tailwindcss-animate** | Design system utilitaire |
| Client HTTP | **Axios 1.7** | Appels API + intercepteurs JWT |
| Animations | **Framer Motion 12.38**, **GSAP 3.15** | Transitions, micro-interactions |
| Graphiques | **Recharts 3.8** | Camembert et barres du tableau de bord |
| Icônes | **lucide-react 1.14** | Set d'icônes SVG |
| Upload | **react-dropzone 15** | Zones de dépôt de fichiers |
| 3D / WebGL | **@react-three/fiber 9**, **@react-three/drei 10**, **three.js 0.184** | Visuels décoratifs sur la landing |
| Effets | **@splinetool/react-spline**, **react-tilt** | Effets visuels avancés |

#### Base de données

- **MySQL 8.x** en production (`charset utf8mb4`, mode `STRICT_TRANS_TABLES`)
- **SQLite** en développement local (configuration alternative via `DB_ENGINE`)
- Migrations gérées par le système natif Django

### 4.3 Patrons architecturaux

- **Modèle MVT** (Model-View-Template) côté Django, étendu en MVS (Model-View-Serializer) avec DRF.
- **API REST stateless** : aucune session côté serveur pour les requêtes API ; chaque requête porte son propre token JWT dans l'en-tête `Authorization`.
- **Séparation des préoccupations** :
  - `core/` : modèles de données purs ;
  - `api/serializers.py` : transformation entité ↔ JSON ;
  - `api/views.py` : logique des endpoints (viewsets DRF) ;
  - `api/services.py` : logique métier complexe (IA, extraction) ;
  - `api/tasks.py` : tâches Celery asynchrones ;
  - `auth_app/` : flux d'authentification spécifiques (OAuth).
- **Pattern Adapter** côté allauth (`auth_app/adapters.py`) pour personnaliser la création des comptes via OAuth.
- **Context API** côté React pour l'état global (auth, dossiers, notifications), évitant le surdimensionnement d'une solution comme Redux pour un projet de cette taille.

### 4.4 Structure des dossiers

```
IDMS/
├── backend/                          # Serveur Django
│   ├── idms/                         # Configuration projet
│   │   ├── settings.py               # Paramètres globaux
│   │   ├── urls.py                   # Routage racine
│   │   ├── celery.py                 # Configuration Celery
│   │   ├── asgi.py / wsgi.py         # Points d'entrée
│   ├── core/                         # Modèles métier
│   │   ├── models.py                 # Définition des entités
│   │   ├── admin.py                  # Interface Django admin
│   │   └── migrations/               # Historique des migrations
│   ├── api/                          # API REST
│   │   ├── views.py                  # Viewsets et vues fonctionnelles
│   │   ├── urls.py                   # Routage API
│   │   ├── serializers.py            # Sérialiseurs DRF
│   │   ├── services.py               # Service IA + extraction texte
│   │   └── tasks.py                  # Tâches Celery
│   ├── auth_app/                     # Authentification personnalisée
│   │   ├── views.py                  # Handlers Google OAuth + redirection JWT
│   │   ├── urls.py                   # Routes /auth/
│   │   └── adapters.py               # Adaptateur allauth
│   ├── middleware/                   # Middlewares de sécurité custom
│   │   ├── security_middleware.py
│   │   ├── security_logger.py
│   │   ├── permissions.py
│   │   └── validators.py
│   ├── media/                        # Fichiers uploadés (année/mois)
│   ├── templates/                    # Templates allauth
│   ├── manage.py
│   └── requirements.txt
│
├── src/                              # Application React
│   ├── pages/                        # Vues par route
│   │   ├── Login.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── Dossiers.jsx
│   │   ├── Comptes.jsx
│   │   ├── Notifications.jsx
│   │   ├── GoogleCallback.jsx
│   │   ├── admin/AdminSoumissions.jsx
│   │   └── employe/
│   │       ├── Dashboard.jsx
│   │       ├── Dossiers.jsx
│   │       ├── Soumissions.jsx
│   │       └── Notifications.jsx
│   ├── components/                   # Composants réutilisables
│   │   ├── Navbar.jsx, Sidebar.jsx
│   │   ├── DossierCard.jsx, FileUpload.jsx
│   │   ├── PermissionModal.jsx
│   │   ├── NotificationBadge.jsx, StatusBadge.jsx
│   │   ├── ParticleBackground.jsx, EmptyState.jsx
│   │   └── dashboard/                # Widgets du tableau de bord
│   ├── context/                      # State global (React Context)
│   │   ├── AuthContext.jsx
│   │   ├── DossiersContext.jsx
│   │   ├── NotificationContext.jsx
│   │   └── ThemeContext.jsx
│   ├── api/axios.js                  # Instance Axios + intercepteurs JWT
│   ├── services/employeAPI.js        # Couche d'appels API métier
│   ├── App.jsx, main.jsx             # Points d'entrée React
│   └── index.css                     # Styles globaux + tokens
│
├── design/                           # Design system
│   ├── tokens.json                   # Tokens de design (couleurs, espacements)
│   ├── animations-cookbook.md
│   ├── components-catalog.md
│   └── resources.md
│
├── package.json                      # Dépendances frontend
├── vite.config.js                    # Configuration Vite
├── tailwind.config.js                # Thème Tailwind
└── .env.example                      # Modèle de variables d'environnement
```

---

## 5. Modèles de données

### 5.1 Diagramme entité-relation (description textuelle)

```
User (django.contrib.auth)
  ├─OneToOne──► Administrateur
  └─OneToOne──► Employe
                  └─FK──► TypeEmploye

Dossier
  ├─FK──────────► Administrateur (createur)
  ├─1..N─────────► Fichier
  │                  ├─FK──► User (uploaded_by)
  │                  └─FK──► SoumissionFichier (optionnel)
  ├─1..1─────────► CarteIA_Dossier
  ├─1..N─────────► Permission
  │                  ├─FK──► Employe
  │                  └─FK──► Administrateur (accordee_par)
  └─1..N─────────► SoumissionFichier
                     ├─FK──► Employe
                     └─FK──► Administrateur (reviewed_by)

Notification
  └─FK──► User (destinataire)

DossierTypeCustom        # types de dossiers personnalisés
```

### 5.2 Description détaillée des entités

#### TypeEmploye
Catégorie professionnelle d'un employé (ex. : comptable, RH, commercial).

| Champ | Type | Contraintes |
|---|---|---|
| nom | CharField(100) | unique |
| description | TextField | facultatif |
| created_at | DateTimeField | auto |

#### Administrateur
Profil administrateur, lié à un `User` Django.

| Champ | Type | Contraintes |
|---|---|---|
| user | OneToOne(User) | cascade |
| nom, prenom | CharField(100) | obligatoires |
| telephone | CharField(20) | facultatif |
| created_at, updated_at | DateTimeField | auto |

#### Employe
Profil employé.

| Champ | Type | Contraintes |
|---|---|---|
| user | OneToOne(User) | cascade |
| type_employe | FK(TypeEmploye) | SET_NULL |
| nom, prenom | CharField(100) | obligatoires |
| telephone | CharField(20) | facultatif |
| google_id | CharField(255) | unique, nullable |
| avatar | URLField(500) | nullable |
| is_active | BooleanField | défaut `True` |

#### Dossier
Conteneur principal de documents.

| Champ | Type | Contraintes |
|---|---|---|
| titre | CharField(200) | obligatoire |
| description | TextField | facultatif |
| status | CharField(20) | choix : `en_cours` / `termine` / `archive` |
| type_dossier | CharField(50) | défaut `enterprise` |
| createur | FK(Administrateur) | SET_NULL |
| created_at, updated_at | DateTimeField | auto |

#### DossierTypeCustom
Types de dossier personnalisés (au-delà des types prédéfinis).

| Champ | Type | Contraintes |
|---|---|---|
| name | CharField(80) | unique |
| color | CharField(7) | code hex (défaut `#6366F1`) |
| created_at | DateTimeField | auto |

#### Fichier
Fichier individuel rattaché à un dossier.

| Champ | Type | Contraintes |
|---|---|---|
| dossier | FK(Dossier) | cascade |
| nom | CharField(255) | obligatoire |
| fichier | FileField | upload vers `fichiers/%Y/%m/` |
| type_fichier | CharField(10) | choix : `pdf`, `docx`, `xlsx`, `image`, `autre` |
| taille | BigIntegerField | octets |
| uploaded_by | FK(User) | SET_NULL |
| ai_titre | CharField(300) | généré par Gemini |
| ai_resume | TextField | généré par Gemini |
| status | CharField(20) | `confirme` / `en_attente` |
| soumission | FK(SoumissionFichier) | nullable |
| created_at | DateTimeField | auto |

Une propriété calculée `taille_mb` retourne la taille en mégaoctets arrondie au centième.

#### CarteIA_Dossier
Fiche d'analyse IA associée à un dossier (1-1).

| Champ | Type | Contraintes |
|---|---|---|
| dossier | OneToOne(Dossier) | cascade |
| resume | TextField | obligatoire |
| mots_cles | JSONField | liste |
| analyse | TextField | facultatif |
| entites | JSONField | dictionnaire `{organisations: [], personnes: [], dates: []}` |
| resume_structure | JSONField | structure point-par-point |
| generated_at, updated_at | DateTimeField | auto |

#### Permission
Droit d'accès d'un employé sur un dossier (clé composée).

| Champ | Type | Contraintes |
|---|---|---|
| employe | FK(Employe) | cascade |
| dossier | FK(Dossier) | cascade |
| acces | CharField(20) | choix : `lecture` / `ecriture` / `admin` |
| accordee_par | FK(Administrateur) | SET_NULL |
| created_at, updated_at | DateTimeField | auto |

Contrainte d'unicité : `(employe, dossier)` — un employé n'a qu'une seule permission par dossier.

#### SoumissionFichier
Soumission d'un fichier par un employé.

| Champ | Type | Contraintes |
|---|---|---|
| employe | FK(Employe) | cascade |
| dossier | FK(Dossier) | cascade |
| fichier | FileField | upload vers `soumissions/%Y/%m/`, nullable |
| nom_fichier | CharField(255) | obligatoire |
| commentaire | TextField | facultatif |
| status | CharField(20) | `en_attente` / `approuve` / `rejete` |
| reviewed_by | FK(Administrateur) | nullable |
| reviewed_at | DateTimeField | nullable |
| rejection_reason | TextField | facultatif |
| created_at | DateTimeField | auto |

#### Notification
Message in-app destiné à un utilisateur.

| Champ | Type | Contraintes |
|---|---|---|
| destinataire | FK(User) | cascade |
| titre | CharField(200) | obligatoire |
| message | TextField | obligatoire |
| type_notif | CharField(20) | `info` / `warning` / `success` / `error` |
| lu | BooleanField | défaut `False` |
| lien | CharField(500) | URL interne facultative |
| created_at | DateTimeField | auto |

### 5.3 Choix techniques sur la persistance

- **Cascade vs SET_NULL** : la suppression d'un compte administrateur ne supprime ni les dossiers qu'il a créés ni les permissions qu'il a accordées (`SET_NULL`), pour préserver la traçabilité. À l'inverse, la suppression d'un dossier entraîne celle de ses fichiers, soumissions et permissions (`CASCADE`).
- **JSONField** : utilisé pour les structures dynamiques produites par l'IA (`mots_cles`, `entites`, `resume_structure`), évitant la création de tables auxiliaires pour un contenu purement consultatif.
- **Index implicites** : les clés étrangères Django créent automatiquement les index nécessaires aux jointures fréquentes (`dossier_id`, `employe_id`).
- **Unicité fonctionnelle** : la contrainte `unique_together` sur `Permission` garantit l'absence de doublons logiques.

---

## 6. Fonctionnalités réalisées

### 6.1 Authentification

Deux mécanismes coexistent et sont entièrement opérationnels.

**Authentification classique (email / mot de passe).** Le frontend envoie les identifiants à `POST /api/token/`. Le backend valide les credentials via le `ModelBackend` Django (avec hachage PBKDF2-SHA256 par défaut) et retourne une paire de tokens JWT : un *access token* d'une durée de 60 minutes et un *refresh token* d'une durée de 7 jours. À chaque requête, le frontend joint l'access token via l'en-tête `Authorization: Bearer <token>`. Un intercepteur Axios détecte les réponses 401 dues à un token expiré et déclenche automatiquement un renouvellement via `POST /api/token/refresh/`, de manière transparente pour l'utilisateur.

**Authentification Google OAuth.** Deux flux parallèles sont implémentés :
- **Flux direct** : le frontend récupère un *authorization code* Google, le transmet à `POST /auth/google/`, le backend l'échange contre un ID token via les API Google, valide la signature, crée ou met à jour l'utilisateur et retourne une paire de tokens JWT.
- **Flux allauth** : pour les déclenchements depuis l'URL `/accounts/google/login/`, django-allauth gère l'intégralité du flux OAuth ; après authentification, un adaptateur personnalisé (`CustomSocialAccountAdapter`) crée ou attache le profil `Employe`/`Administrateur`, puis l'utilisateur est redirigé vers `/auth/jwt-redirect/` qui convertit la session allauth en tokens JWT.

**Enforcement des rôles à la connexion.** À chaque sign-in OAuth, le système consulte la variable d'environnement `ADMIN_EMAILS` (liste séparée par virgules). Si l'adresse de l'utilisateur y figure, le profil `Administrateur` est créé/promu ; sinon, un profil `Employe` est créé/réaffirmé. Cette logique idempotente garantit la cohérence des rôles même après un redéploiement avec une nouvelle liste d'admins.

### 6.2 Gestion des dossiers et des fichiers

L'administrateur dispose d'une interface complète de gestion des dossiers, accessible via la page `/dossiers`. Chaque dossier est défini par :
- un **titre** (200 caractères maximum),
- une **description** libre,
- un **statut** (`en_cours`, `terminé`, `archivé`),
- un **type** parmi une liste prédéfinie (`enterprise`, `facturation`, `rh`, `rapports`) ou un type personnalisé créé dynamiquement via le modèle `DossierTypeCustom`.

À l'intérieur d'un dossier, les fichiers peuvent être ajoutés :
- soit directement par l'administrateur (statut `confirme` immédiatement),
- soit par un employé disposant du droit `ecriture` ou `admin` (statut `en_attente`, soumis pour validation).

Les types de fichiers supportés sont : PDF, DOCX, XLSX, images (JPG, PNG, GIF, WebP) et autres formats binaires. La taille maximale par fichier est paramétrée à **50 Mo** (variable `MAX_FILE_SIZE_MB`), avec une enveloppe globale de requête de 200 Mo pour permettre les uploads multi-fichiers.

Les fichiers sont stockés sur le système de fichiers local sous `media/fichiers/<année>/<mois>/`, avec une option de bascule vers **Amazon S3** activable via la variable d'environnement `USE_S3=True` (utilisant `boto3` et `django-storages`).

### 6.3 Analyse IA des documents (Google Gemini)

Cette fonctionnalité constitue la **valeur ajoutée différenciante** du projet. Elle s'articule autour du service `api/services.py` qui orchestre plusieurs étapes :

**Étape 1 — extraction du texte.** Pour chaque fichier PDF, le service tente successivement :
1. `pdfplumber` (le plus précis pour les PDF avec texte natif et tableaux) ;
2. `PyMuPDF` (fitz) comme repli si pdfplumber échoue ;
3. en dernier recours, la **vision multimodale de Gemini** : le PDF est envoyé directement à l'API comme entrée image, permettant d'extraire le contenu des PDF numérisés sans installation locale de Tesseract.

Cette cascade garantit une couverture maximale des cas réels rencontrés en entreprise.

**Étape 2 — analyse par fichier.** Pour chaque fichier individuel, Gemini est sollicité pour produire :
- un **titre descriptif** (une ligne, max 300 caractères) stocké dans `Fichier.ai_titre` ;
- un **résumé concis** de 2 à 3 phrases stocké dans `Fichier.ai_resume`.

**Étape 3 — analyse globale du dossier (Carte IA).** Une fois les fichiers analysés, le service agrège leurs contenus et soumet à Gemini une requête structurée demandant :
- un **résumé général** du dossier (`CarteIA_Dossier.resume`) ;
- une **liste de mots-clés** représentatifs (`mots_cles`, JSONField) ;
- une **analyse approfondie** thématique (`analyse`) ;
- un **dictionnaire d'entités nommées** : organisations, personnes, dates, montants (`entites`, JSONField).

**Étape 4 — résumé structuré.** Une dernière passe produit un **résumé point-par-point** (`resume_structure`, JSONField) où, pour chaque fichier, les points clés sont extraits, suivis d'une synthèse globale du dossier.

**Exécution asynchrone.** Compte tenu de la durée variable des analyses (10 à 60 secondes selon le volume), toutes ces opérations sont déléguées à **Celery** via le broker **Redis**. Si Redis est indisponible, le service bascule automatiquement sur un *thread pool* Python interne, garantissant la disponibilité du service en environnement de développement. Le frontend interroge l'avancement via les endpoints `/api/dossiers/<id>/carte-ia-status/` et `/api/dossiers/<id>/resumer-status/` jusqu'à obtention du résultat final.

**Modèle Gemini utilisé.** `gemini-flash-lite-latest`, choisi pour son rapport coût/latence/qualité adapté à un usage intensif sur des documents administratifs.

### 6.4 Système de permissions par dossier

Le modèle d'autorisation repose sur trois niveaux d'accès, du moins privilégié au plus privilégié :

| Niveau | Capacités |
|---|---|
| `lecture` | Consulter les fichiers du dossier, télécharger, consulter la carte IA |
| `ecriture` | Tout ce que permet `lecture` + soumettre des fichiers (en attente de validation) |
| `admin` | Tout ce que permet `ecriture` + accorder/révoquer des permissions sur ce dossier spécifique |

Le composant React `PermissionModal` permet à l'administrateur d'attribuer ou modifier les permissions d'un employé sur un dossier directement depuis la fiche du dossier, sans navigation supplémentaire. Côté backend, chaque endpoint filtre systématiquement les querysets selon les permissions de l'utilisateur connecté : un employé n'a aucune visibilité sur les dossiers auxquels il n'a pas accès, même en connaissant leur identifiant numérique.

### 6.5 Système de notifications

Le modèle `Notification` permet d'informer un utilisateur d'un événement le concernant. Les notifications sont générées automatiquement par le backend lors des événements suivants :
- attribution d'une nouvelle permission (notification de type `success` à l'employé) ;
- approbation d'une soumission (`success`) ;
- rejet d'une soumission (`warning`, avec la raison du rejet dans le message) ;
- ajout d'un fichier dans un dossier auquel l'employé a accès (`info`).

Chaque notification porte un type visuel (info, success, warning, error), un titre, un message, un lien optionnel vers la ressource concernée, et un booléen `lu`. La barre de navigation affiche un badge avec le nombre de notifications non lues, mis à jour via l'endpoint dédié `/api/notifications/non-lues-count/` interrogé périodiquement.

### 6.6 Workflow de soumission

Lorsque l'employé clique sur "Soumettre un fichier" depuis un dossier accessible (en écriture), il est redirigé vers le formulaire de soumission. Le fichier est uploadé avec un commentaire optionnel, et une entrée `SoumissionFichier` est créée avec le statut `en_attente`. La soumission apparaît immédiatement dans la page d'administration `/admin/soumissions` listant toutes les soumissions en attente.

L'administrateur dispose de deux actions :
- **Approuver** : la soumission passe à `approuve`, un objet `Fichier` est créé dans le dossier cible avec le statut `confirme`, et une notification de succès est envoyée à l'employé.
- **Rejeter** : la soumission passe à `rejete`, l'administrateur saisit obligatoirement une raison (`rejection_reason`), et une notification d'avertissement est envoyée à l'employé contenant cette raison.

Dans les deux cas, les champs `reviewed_by` et `reviewed_at` sont renseignés pour la traçabilité.

### 6.7 Tableau de bord Administrateur

La page `AdminDashboard` présente une vue synthétique de l'activité :
- **4 KPIs** : nombre total de dossiers, nombre d'employés actifs, soumissions en attente, notifications non lues. Chaque KPI affiche également une variation (`+12%`, `–3%`) par rapport au mois précédent, calculée côté backend.
- **Graphique en secteurs (Recharts)** : répartition des dossiers par type (entreprise, facturation, RH, rapports, autres). Les couleurs sont synchronisées avec les types de dossier personnalisés (`DossierTypeCustom.color`).
- **Graphique en barres** : activité de création de fichiers sur les 7 derniers jours, alimenté par `/api/stats/activite/`.

### 6.8 Tableau de bord Employé

La page `employe/Dashboard.jsx` propose une vue centrée sur l'utilisateur :
- liste des **dossiers accessibles** avec leur statut et le niveau de permission ;
- résumé des **soumissions en cours** (en attente / approuvées / rejetées) ;
- compteur de **notifications non lues** avec accès direct à la page dédiée.

### 6.9 Gestion des comptes (Administrateur)

La page `Comptes` permet à l'administrateur de :
- consulter la liste paginée des employés (avec recherche par nom, prénom, email) ;
- créer un nouveau compte employé (avec génération automatique d'un mot de passe ou définition manuelle) ;
- modifier les informations d'un employé (nom, prénom, téléphone, type d'emploi) ;
- activer ou désactiver un compte (sans le supprimer, pour préserver l'historique) ;
- supprimer définitivement un compte si nécessaire.

---

## 7. API REST — Endpoints

L'ensemble des endpoints est exposé sous le préfixe `/api/` (sauf l'authentification OAuth, sous `/auth/`). La pagination est activée par défaut sur tous les endpoints de liste, avec une taille de page de 20 éléments.

### 7.1 Authentification

| Méthode | Endpoint | Description | Rôle requis |
|---|---|---|---|
| POST | `/api/token/` | Connexion email/mot de passe | Public |
| POST | `/api/token/refresh/` | Renouvellement de l'access token | Refresh token valide |
| POST | `/api/token/verify/` | Vérification de la validité d'un token | Public |
| POST | `/api/register/` | Création d'un compte employé | Public ou Admin |
| GET | `/api/me/` | Profil de l'utilisateur courant + rôle | Authentifié |
| POST | `/api/logout/` | Blacklist du refresh token | Authentifié |
| POST | `/auth/google/` | Échange code OAuth Google → JWT | Public |
| POST | `/auth/google/token/` | Vérification d'un ID token Google | Public |
| GET | `/auth/jwt-redirect/` | Pont allauth → JWT après OAuth | Session allauth |

### 7.2 Statistiques

| Méthode | Endpoint | Description | Rôle requis |
|---|---|---|---|
| GET | `/api/stats/` | KPIs globaux | Administrateur |
| GET | `/api/stats/dossiers-par-type/` | Répartition pour camembert | Administrateur |
| GET | `/api/stats/activite/` | Activité fichiers sur 7 jours | Administrateur |
| GET | `/api/employe/stats/` | Stats personnelles de l'employé | Employé |

### 7.3 ViewSets (CRUD)

| Ressource | Endpoint de base | Actions standard | Actions personnalisées |
|---|---|---|---|
| Types d'employés | `/api/type-employes/` | list, create, retrieve, update, destroy | — |
| Employés | `/api/employes/` | list, create, retrieve, update, destroy | — |
| Dossiers | `/api/dossiers/` | list, create, retrieve, update, destroy | `generer-carte-ia/`, `resumer/`, `resumer-status/`, `resume-data/`, `carte-ia-status/`, `fichiers/` |
| Fichiers | `/api/fichiers/` | list, create, retrieve, update, destroy | — |
| Permissions | `/api/permissions/` | list, create, retrieve, update, destroy | — |
| Soumissions | `/api/soumissions/` | list, create, retrieve, update, destroy | approbation / rejet via update |
| Notifications | `/api/notifications/` | list, retrieve, update, destroy | `non-lues-count/` |
| Types de dossiers personnalisés | `/api/dossier-types/` | list, create, update, destroy | — |

### 7.4 Format des réponses

Toutes les réponses utilisent le format **JSON** et suivent les conventions HTTP :

| Code | Signification dans l'application |
|---|---|
| 200 OK | Succès d'une requête de lecture ou de mise à jour |
| 201 Created | Création réussie d'une ressource |
| 204 No Content | Suppression réussie |
| 400 Bad Request | Validation côté serveur en échec (champs manquants, format invalide) |
| 401 Unauthorized | Token absent ou expiré |
| 403 Forbidden | Token valide mais permission insuffisante |
| 404 Not Found | Ressource inexistante ou non accessible |
| 429 Too Many Requests | Limite de débit dépassée |
| 500 Internal Server Error | Erreur serveur (loggée et capturée par l'`EXCEPTION_HANDLER` personnalisé) |

Un gestionnaire d'exceptions personnalisé (`api.views.custom_exception_handler`) intercepte toutes les exceptions DRF pour homogénéiser le format d'erreur : `{"detail": "...", "code": "...", "fields": {...}}`.

---

## 8. Sécurité implémentée

La sécurité a fait l'objet d'une attention particulière, en couvrant les principaux risques de l'OWASP Top 10.

### 8.1 Authentification et gestion des sessions

- **JWT avec rotation** : chaque rafraîchissement du token génère un nouveau refresh token, l'ancien étant immédiatement blacklisté (`BLACKLIST_AFTER_ROTATION = True`). Cela empêche la réutilisation d'un refresh token volé après sa première utilisation.
- **Durée de vie limitée** : access token de 60 minutes (paramétrable via `JWT_ACCESS_TOKEN_LIFETIME`), refresh token de 7 jours.
- **Blacklist à la déconnexion** : l'endpoint `/api/logout/` ajoute explicitement le refresh token courant à la liste noire, invalidant la session côté serveur.
- **Stockage côté client** : les tokens sont stockés en `sessionStorage` plutôt qu'en `localStorage`, garantissant leur suppression à la fermeture de l'onglet.
- **Hachage des mots de passe** : Django utilise PBKDF2-SHA256 par défaut, avec un salt par utilisateur.
- **Validation des mots de passe** : longueur minimale, similarité avec les attributs utilisateur, exclusion des mots de passe communs et purement numériques.

### 8.2 Protection contre les attaques

- **django-axes** : verrouillage automatique du compte après **5 tentatives échouées**, avec un *cool-off* de 1 heure (`AXES_COOLOFF_TIME = 1`). Le compteur est remis à zéro après une connexion réussie (`AXES_RESET_ON_SUCCESS = True`). Toutes les tentatives sont journalisées en base.
- **django-ratelimit** : limitation du débit sur les endpoints sensibles (`/api/token/`, `/api/register/`, `/auth/google/`) pour prévenir le credential stuffing.
- **Validation des uploads** :
  - taille maximale : 50 Mo par fichier (200 Mo pour la requête globale) ;
  - vérification du type MIME et de l'extension ;
  - les fichiers sont stockés en dehors de la racine statique pour empêcher l'exécution accidentelle.

### 8.3 Contrôle d'accès

- **IsAuthenticated par défaut** : toutes les vues DRF requièrent un utilisateur authentifié sauf annotation explicite (`AllowAny` pour l'inscription, le login, le verify).
- **Filtrage systématique des querysets** : dans chaque viewset, la méthode `get_queryset()` filtre les enregistrements selon le rôle (Admin / Employé) et, pour les employés, selon les permissions sur les dossiers. Un employé ne peut jamais accéder à un fichier d'un dossier non attribué, même en forgeant l'URL.
- **Permissions personnalisées** : `middleware/permissions.py` définit des permissions DRF custom (par exemple `IsAdminOrReadOnlyForOwn`) pour les cas métier complexes.

### 8.4 Sécurité réseau et HTTP

- **CORS** : `django-cors-headers` limite les requêtes cross-origin aux origines listées (`FRONTEND_URL`, `http://localhost:3000`, `http://127.0.0.1:5173`). Les credentials cross-origin sont autorisés (`CORS_ALLOW_CREDENTIALS = True`).
- **ALLOWED_HOSTS** : restriction des hôtes acceptés par Django, paramétrable via la variable d'environnement.
- **En-têtes HTTP durcis** (middleware personnalisé `SecurityHeadersMiddleware`) :
  - `X-Frame-Options: DENY` (anti clickjacking),
  - `X-Content-Type-Options: nosniff`,
  - `Strict-Transport-Security` en production HTTPS,
  - `Content-Security-Policy` restrictif.
- **CSRF** : protégé via le middleware Django sur les routes hors API (l'API étant stateless avec JWT, le CSRF n'est pas applicable).

### 8.5 Journalisation et observabilité

- **SecurityHeadersMiddleware** et **FileAccessLogMiddleware** (`middleware/security_middleware.py`) tracent les requêtes sensibles.
- **security_logger.py** journalise les événements suspects (tentatives d'accès à des ressources non autorisées, requêtes mal formées).
- Configuration Python `logging` avec un logger dédié `idms.security` au niveau `INFO`.

### 8.6 Gestion des secrets

- Toutes les variables sensibles (clé secrète Django, identifiants DB, clé Gemini, secrets OAuth, identifiants AWS) sont externalisées dans un fichier `.env` non versionné (présent uniquement via `.env.example`).
- La clé `SECRET_KEY` Django est lue dynamiquement depuis l'environnement, avec un fallback explicite signalant qu'elle doit être remplacée en production.

---

## 9. Interface utilisateur et expérience

### 9.1 Design system

Un **design system** dédié a été matérialisé dans le dossier `design/` du projet :
- `tokens.json` : tokens de design (couleurs primaires, secondaires, neutres, espacements, rayons de bordure, typographies) consommés par Tailwind via une extension du thème.
- `components-catalog.md` : catalogue des composants UI réutilisables avec leurs variantes.
- `animations-cookbook.md` : recettes d'animation (Framer Motion, GSAP) standardisées.
- `resources.md` : ressources externes (palettes, références d'inspiration).

### 9.2 Choix d'expérience utilisateur

- **Mode thématique** : un `ThemeContext` permet de gérer un thème (clair/sombre, accessible via préférence utilisateur ou système).
- **Feedback immédiat** : chaque action utilisateur déclenche soit une notification toast, soit une transition animée, soit un état de chargement explicite (squelettes, spinners).
- **Empty states soignés** : un composant `EmptyState` réutilisable propose des illustrations et messages contextualisés lorsque les listes sont vides (aucun dossier, aucune notification, etc.).
- **Upload par glisser-déposer** : `react-dropzone` est intégré dans `FileUpload.jsx` pour une expérience moderne, avec validation client immédiate de la taille et du type.
- **Animations narratives** : `Framer Motion` est utilisé pour les transitions de page et les apparitions de modaux ; `GSAP` est employé sur la landing pour des effets plus avancés.
- **Visuels d'accueil** : utilisation ponctuelle de `@splinetool/react-spline` et de `@react-three/fiber` (three.js) pour intégrer des scènes 3D décoratives sur la page de connexion.

### 9.3 Responsive design

L'interface est entièrement responsive grâce à Tailwind CSS et son système de *breakpoints* (`sm`, `md`, `lg`, `xl`). La barre latérale (`Sidebar.jsx`) bascule en mode rétractable sur mobile et en mode permanent sur desktop. Les tableaux de bord adaptent leurs grilles (1 colonne sur mobile, 2 sur tablette, 4 sur desktop).

---

## 10. Installation et exploitation

### 10.1 Prérequis

| Composant | Version |
|---|---|
| Python | ≥ 3.11 |
| Node.js | ≥ 18.x |
| MySQL | 8.x (ou SQLite pour le développement) |
| Redis | ≥ 5.0 (optionnel — fallback thread si absent) |
| Système d'exploitation | Windows, macOS ou Linux |

### 10.2 Variables d'environnement principales

Le fichier `.env` (à créer à partir de `.env.example`) regroupe les paramètres suivants :

| Variable | Rôle | Exemple |
|---|---|---|
| `SECRET_KEY` | Clé secrète Django | (chaîne longue aléatoire) |
| `DEBUG` | Mode debug | `True` en dev, `False` en prod |
| `ALLOWED_HOSTS` | Hôtes acceptés | `localhost,127.0.0.1` |
| `DB_ENGINE` | Moteur DB | `django.db.backends.mysql` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Connexion MySQL | — |
| `FRONTEND_URL` | URL du frontend (CORS) | `http://localhost:5173` |
| `JWT_ACCESS_TOKEN_LIFETIME` | Durée access token (min) | `60` |
| `JWT_REFRESH_TOKEN_LIFETIME` | Durée refresh token (jours) | `7` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Identifiants OAuth Google | — |
| `ADMIN_EMAILS` | Liste des emails admin | `admin@org.com,...` |
| `GEMINI_API_KEY` | Clé API Google Gemini | — |
| `REDIS_URL` | URL du broker Redis | `redis://localhost:6379/0` |
| `MAX_FILE_SIZE_MB` | Taille max d'un fichier | `50` |
| `USE_S3` | Stockage cloud activé | `False` |
| `AWS_*` | Identifiants AWS S3 (si `USE_S3`) | — |

### 10.3 Procédure d'installation

**Backend** :
1. créer un environnement virtuel Python (`python -m venv venv` + activation) ;
2. installer les dépendances (`pip install -r requirements.txt`) ;
3. créer la base MySQL ou conserver SQLite ;
4. copier `.env.example` en `.env` et renseigner les valeurs ;
5. appliquer les migrations (`python manage.py migrate`) ;
6. créer un superutilisateur Django (`python manage.py createsuperuser`) si nécessaire ;
7. configurer l'application sociale Google dans l'admin Django (`/admin/socialaccount/socialapp/`) ;
8. lancer le serveur (`python manage.py runserver 8000`).

**Frontend** :
1. installer les dépendances (`npm install`) ;
2. lancer le serveur de développement Vite (`npm run dev`).

**Worker Celery (optionnel)** :
1. démarrer Redis localement ;
2. lancer le worker (`celery -A idms worker -l info`).

### 10.4 URLs d'accès

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Admin Django | http://localhost:8000/admin/ |

---

## 11. Difficultés rencontrées et solutions apportées

### 11.1 Extraction de texte des PDF numérisés

**Difficulté** : les PDF issus de scanners ne contiennent pas de couche textuelle ; `pdfplumber` et `PyMuPDF` retournent une chaîne vide. L'installation locale de Tesseract est lourde, dépendante de la plateforme et ralentit le déploiement.

**Solution** : exploitation de la **vision multimodale de Gemini** comme troisième niveau de la cascade d'extraction. Le PDF est envoyé directement à l'API comme entrée image, et Gemini retourne le texte reconnu. Cette approche élimine la dépendance Tesseract et délivre une qualité supérieure sur les documents complexes.

### 11.2 Disponibilité de Redis en développement

**Difficulté** : Redis n'est pas systématiquement disponible sur les postes de développement, en particulier sur Windows. L'absence de broker bloquait l'exécution des tâches Celery, ralentissant les tests des fonctionnalités IA.

**Solution** : ajout d'une **détection automatique** de la disponibilité de Redis dans `settings.py` (fonction `_make_cache`) et bascule transparente vers un thread pool Python lorsque Redis est injoignable. Le frontend, lui, continue d'utiliser le même mécanisme de polling.

### 11.3 Synchronisation des rôles OAuth

**Difficulté** : lors d'une connexion OAuth, comment déterminer si l'utilisateur doit être Administrateur ou Employé sans interface dédiée ? Et comment garantir qu'un changement de configuration administrative soit appliqué automatiquement ?

**Solution** : utilisation d'une **variable d'environnement `ADMIN_EMAILS`** (liste d'emails). À chaque sign-in (classique ou OAuth), un hook côté serveur consulte cette liste et promeut ou rétrograde l'utilisateur en conséquence. Cette logique idempotente est appliquée dans `auth_app/adapters.py` et `auth_app/views.py`.

### 11.4 Doublon entre allauth et flux OAuth direct

**Difficulté** : lors de la première mise en place, la coexistence de deux flux OAuth (allauth + flux direct via `/auth/google/`) provoquait des erreurs `MultipleObjectsReturned` lorsque l'objet `SocialApp` était à la fois configuré en base et dans les `SOCIALACCOUNT_PROVIDERS` de `settings.py`.

**Solution** : suppression de la clé `APP` dans `SOCIALACCOUNT_PROVIDERS` et configuration exclusive via l'objet `SocialApp` en base, comme documenté dans les commentaires de `settings.py`. Les deux flux cohabitent désormais sans conflit.

### 11.5 Cohérence des notifications après mise à jour

**Difficulté** : après l'approbation d'une soumission, le compteur de notifications côté frontend pouvait afficher une valeur obsolète tant que la page n'était pas rafraîchie.

**Solution** : mise en place d'un `NotificationContext` côté React, avec un polling régulier (intervalle paramétrable) sur l'endpoint `/api/notifications/non-lues-count/`. Le compteur est ainsi mis à jour automatiquement sans intervention utilisateur.

### 11.6 Certificats SSL sur Windows

**Difficulté** : sur Windows, les requêtes HTTPS sortantes (vers Google et Gemini) échouaient avec des erreurs de vérification de certificat, le bundle `certifi` ne contenant pas toujours les autorités racines du système.

**Solution** : import conditionnel de `certifi_win32` au démarrage de Django, ce qui patche `certifi` pour utiliser le magasin de certificats Windows natif.

---

## 12. Bilan personnel et compétences acquises

### 12.1 Compétences techniques renforcées

- **Développement full-stack** : maîtrise renforcée du couple Django REST Framework + React, avec une compréhension approfondie des interactions entre les deux côtés (JWT, CORS, formats de payload).
- **Architecture logicielle** : conception d'une application multi-modules avec séparation claire des responsabilités (models / serializers / views / services / tasks).
- **Sécurité applicative** : mise en pratique des mécanismes de protection (JWT, OAuth, rate limiting, axes, en-têtes HTTP), avec une lecture critique de l'OWASP Top 10.
- **Intégration d'API externes** : intégration de l'API Google Gemini, y compris ses capacités multimodales pour l'OCR ; intégration du flux OAuth Google.
- **Traitement asynchrone** : conception et déploiement de tâches Celery avec broker Redis, gestion des cas de repli, polling côté frontend.
- **Gestion documentaire** : compréhension des contraintes d'extraction de texte (PDF natif, PDF scanné), des bonnes pratiques de stockage de fichiers.

### 12.2 Compétences transverses

- **Méthode incrémentale** : capacité à découper un projet ambitieux en lots livrables, à arbitrer le périmètre.
- **Documentation** : rédaction d'un design system, d'une documentation technique, d'un rapport structuré.
- **Veille technologique** : exploration et choix éclairé des dépendances (parmi plusieurs alternatives à chaque étape : auth, OCR, stockage, animations).
- **Résolution de problèmes** : diagnostic systématique face aux blocages techniques (SSL Windows, conflits allauth, indisponibilité Redis), avec une démarche d'investigation et de tests.

### 12.3 Apprentissages personnels

Au-delà des compétences techniques, ce stage m'a permis de mesurer la différence entre un projet académique et un projet à vocation opérationnelle : la sécurité n'est plus optionnelle, la gestion des erreurs doit être systématique, la documentation conditionne la maintenabilité, et chaque dépendance externe ajoutée doit être évaluée en termes de coût et de risque. La gestion de l'intégration de l'IA, en particulier, m'a sensibilisé aux problématiques de coût d'appel, de latence et de qualité des prompts — autant de dimensions absentes d'un cursus purement académique.

---

## 13. Perspectives d'amélioration

### 13.1 Tests automatisés

Le projet ne dispose pas encore d'une suite de tests automatisés. Il s'agit du chantier prioritaire à court terme :
- **tests unitaires** sur les sérialiseurs, les services (notamment l'extraction de texte et les appels Gemini avec mocks) ;
- **tests d'intégration** sur les endpoints API via `pytest-django` et une base SQLite de test ;
- **tests end-to-end** avec **Playwright** ou **Cypress** sur les flux critiques (login, upload, analyse, soumission, validation).

### 13.2 Documentation OpenAPI / Swagger

L'intégration de **drf-spectacular** permettrait de générer automatiquement une documentation OpenAPI 3 interactive, facilitant l'intégration de clients tiers et l'onboarding des nouveaux développeurs.

### 13.3 Notifications temps réel via WebSockets

Le polling actuel pourrait être remplacé par une connexion **WebSocket** persistante via **Django Channels**, réduisant le trafic réseau et améliorant la réactivité (notification instantanée d'une approbation).

### 13.4 Recherche plein texte

L'intégration d'**Elasticsearch** ou d'un index PostgreSQL `tsvector` permettrait une recherche dans le contenu des documents, leurs résumés IA et leurs métadonnées. Une variante encore plus ambitieuse consisterait à indexer les **embeddings** vectoriels des documents pour une recherche sémantique.

### 13.5 Versioning des fichiers

Chaque upload crée actuellement un nouveau fichier sans lien avec un éventuel original. Un système de versioning (table `FichierVersion` avec parent FK) permettrait de conserver l'historique et d'autoriser le retour à une version antérieure.

### 13.6 Pipeline CI/CD

La mise en place d'un workflow **GitHub Actions** (ou équivalent) automatisant :
- le lint (ruff, eslint),
- l'exécution des tests,
- la construction des images Docker,
- le déploiement sur un environnement de pré-production,

apporterait une fiabilité et une rapidité de livraison considérables.

### 13.7 Containerisation Docker

Un `docker-compose.yml` regroupant Django, Redis, MySQL et le worker Celery faciliterait la reproductibilité des environnements de développement et de production.

### 13.8 Internationalisation

L'interface étant exclusivement en français, le support de l'anglais (et potentiellement de l'arabe pour le marché tunisien) via **react-i18next** côté frontend et le middleware `LocaleMiddleware` côté backend ouvrirait l'application à une audience plus large.

### 13.9 Audit log complet

L'ajout d'un modèle `AuditLog` traçant toutes les actions sensibles (création, suppression, modification de permission) avec horodatage et acteur fournirait une traçabilité réglementaire utile pour certains secteurs (finance, santé, juridique).

---

## 14. Conclusion générale

Le projet **IDMS** a permis de concevoir et de livrer une application web complète, sécurisée et fonctionnelle, répondant aux besoins de gestion documentaire d'une organisation. À travers la mise en œuvre d'une architecture full-stack moderne (Django REST Framework + React/Vite), l'intégration native de l'intelligence artificielle (Google Gemini) pour l'analyse automatique des documents, et un dispositif de sécurité robuste (JWT, OAuth, rate limiting, middlewares personnalisés), le projet démontre la faisabilité d'une plateforme documentaire enrichie sans recourir à des outils propriétaires coûteux.

Sur le plan technique, le développement m'a permis de mobiliser et d'approfondir un large éventail de compétences : modélisation relationnelle, API REST, authentification stateless, OAuth 2.0, traitement asynchrone via Celery, intégration d'API d'IA générative, OCR multimodal, sécurité applicative, et conception d'interfaces React modernes. Sur le plan méthodologique, l'approche incrémentale a permis de livrer rapidement des fonctionnalités utilisables tout en réservant le temps nécessaire à la consolidation (sécurité, UX, performance).

Le résultat final est une application **opérationnelle**, **évolutive** et **déployable**, dont la feuille de route d'évolution (tests automatisés, recherche plein texte, WebSockets, CI/CD, containerisation) est clairement identifiée. Les défis techniques rencontrés — extraction de PDF scannés, disponibilité de Redis, certificats SSL Windows, coexistence des flux OAuth — ont été surmontés par des solutions robustes qui enrichissent la qualité du livrable.

Ce stage constitue ainsi une expérience formatrice de bout en bout : de la conception à la livraison, en passant par la documentation, la sécurité et l'intégration de technologies de pointe. Il valide la capacité à porter seul un projet logiciel substantiel, tout en identifiant lucidement ses axes de progrès.

---

## 15. Annexes

### Annexe A — Glossaire technique

| Terme | Définition |
|---|---|
| **API REST** | *Application Programming Interface* suivant les principes REST (stateless, ressources, verbes HTTP) |
| **JWT** | *JSON Web Token* — jeton signé contenant les claims de l'utilisateur, vérifiable sans appel à la base |
| **OAuth 2.0** | Protocole standard de délégation d'autorisation (utilisé ici pour la connexion Google) |
| **GED** | Gestion Électronique de Documents |
| **OCR** | *Optical Character Recognition* — reconnaissance optique de caractères |
| **LLM** | *Large Language Model* — grand modèle de langage (Gemini, GPT, etc.) |
| **ORM** | *Object-Relational Mapping* — couche d'abstraction objet/relationnel (Django ORM) |
| **CORS** | *Cross-Origin Resource Sharing* — politique de partage entre origines distinctes |
| **CSRF** | *Cross-Site Request Forgery* — attaque par requête forgée |
| **Celery** | Bibliothèque Python de traitement de tâches asynchrones distribuées |
| **Broker** | Intermédiaire de file d'attente (Redis dans ce projet) |
| **SPA** | *Single Page Application* — application web monopage |

### Annexe B — Dépendances Python principales (`requirements.txt`)

- Django ≥ 5.0
- djangorestframework ≥ 3.14
- djangorestframework-simplejwt ≥ 5.3
- django-allauth ≥ 0.63
- django-cors-headers
- django-axes ≥ 8.0
- django-ratelimit ≥ 4.0
- celery ≥ 5.4
- redis ≥ 5.0
- django-celery-results, django-celery-beat
- google-genai ≥ 1.0
- pdfplumber ≥ 0.11
- PyMuPDF ≥ 1.24
- pytesseract ≥ 0.3
- Pillow ≥ 10.3
- boto3 ≥ 1.34
- django-storages ≥ 1.14
- python-dotenv
- mysqlclient
- certifi-win32 *(Windows uniquement)*

### Annexe C — Dépendances JavaScript principales (`package.json`)

- react ^18.3.1
- react-dom ^18.3.1
- react-router-dom ^6.24.0
- vite ^5.3.4
- @vitejs/plugin-react ^4.3.1
- axios ^1.7.2
- tailwindcss ^3.4.7, tailwindcss-animate ^1.0.7
- autoprefixer ^10.4.19, postcss ^8.4.40
- framer-motion ^12.38.0
- gsap ^3.15.0
- recharts ^3.8.1
- lucide-react ^1.14.0
- react-dropzone ^15.0.0
- react-tilt ^1.0.2
- @react-three/fiber ^9.6.0, @react-three/drei ^10.7.7, three ^0.184.0
- @splinetool/react-spline ^4.1.0, @splinetool/runtime ^1.12.94
- ws ^8.20.1

### Annexe D — Comptes de test (à adapter)

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | `admin@idms.local` | *à définir au seed* |
| Employé | `employe@idms.local` | *à définir au seed* |

Les comptes effectifs sont générés via la commande `python manage.py createsuperuser` et la liste `ADMIN_EMAILS` dans `.env`.

---

*Document rédigé en mai 2026 — IDMS v1.0*
