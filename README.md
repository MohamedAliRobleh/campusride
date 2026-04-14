# CampusRide — Documentation du projet

CampusRide est une application de covoiturage destinée à la communauté du Collège La Cité (Ottawa). Elle permet aux étudiants, enseignants et employés de proposer, rechercher et réserver des trajets domicile–campus de manière sécurisée, via une application web progressive (PWA).

---

## Table des matières

1. [Aperçu du projet](#1-aperçu-du-projet)
2. [Prérequis](#2-prérequis)
3. [Installation](#3-installation)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Lancer le projet](#5-lancer-le-projet)
6. [Tester le projet](#6-tester-le-projet)
7. [Architecture du projet](#7-architecture-du-projet)
8. [Schéma de la base de données](#8-schéma-de-la-base-de-données)
9. [Référence des endpoints API](#9-référence-des-endpoints-api)
10. [Décisions de conception](#10-décisions-de-conception)
11. [Flux de données principaux](#11-flux-de-données-principaux)
12. [Déploiement](#12-déploiement)
13. [Guide vidéo](#13-guide-vidéo)

---

## 1. Aperçu du projet

### Fonctionnalités principales

| Fonctionnalité | Description |
|---|---|
| Authentification | Inscription/connexion avec courriel institutionnel (@lacite.on.ca / @collegelacite.ca), JWT, réinitialisation par courriel |
| Gestion des trajets | Publier, rechercher, modifier, annuler des trajets avec géolocalisation |
| Réservations | Demander, accepter, refuser, annuler une place dans un trajet |
| Suivi en temps réel | GPS du conducteur visible par les passagers pendant le trajet |
| Messagerie | Conversations privées entre utilisateurs |
| Évaluations | Notation bidirectionnelle conducteur ↔ passager après chaque trajet |
| Signalements | Signaler un utilisateur ou un trajet avec escalade de niveau 1 à 3 |
| Notifications | In-app, push web (PWA) et courriel (Brevo) |
| Administration | Tableau de bord complet : gestion des utilisateurs, trajets, signalements, statistiques |
| PWA | Application installable sur mobile et bureau, avec mode hors ligne partiel |

### Stack technique

```
Frontend : React 19 + Vite · Bootstrap 5 · React Router v6 · Axios
Backend  : Node.js 20 + Express 5 · JWT · bcryptjs · web-push · Brevo
Base de données : PostgreSQL 15 (14 tables, pgcrypto)
Hébergement : Vercel (frontend) · Render (backend) · Cloudinary (images)
```

---

## 2. Prérequis

| Outil | Version minimale |
|---|---|
| Node.js | 18.x LTS ou supérieur |
| npm | 9.x ou supérieur |
| PostgreSQL | 14 ou supérieur |
| Git | toute version récente |

Comptes externes requis (optionnels en développement local) :
- **Brevo** — envoi de courriels (SMTP/API)
- **Cloudinary** — stockage d'images (fallback : dossier local `uploads/`)
- **Google Maps API** — autocomplétion des adresses (frontend)

---

## 3. Installation

### 3.1 Cloner le dépôt

```bash
git clone https://github.com/mustapha1900/CampusRide.git
cd CampusRide
```

### 3.2 Installer les dépendances backend

```bash
cd backend
npm install
```

### 3.3 Installer les dépendances frontend

```bash
cd ../frontend
npm install
```

### 3.4 Créer la base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base
CREATE DATABASE "campusR";
\c campusR

# Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

# Quitter psql
\q

# Appliquer le schéma
psql -U postgres -d campusR -f backend/src/DB/"script DB.sql"
```

---

## 4. Variables d'environnement

### Backend — `backend/.env`

Créer le fichier `backend/.env` avec les valeurs suivantes :

```env
# Serveur
PORT=5000
NODE_ENV=development

# Base de données (développement local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campusR
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

# En production, remplacer les variables DB_* par :
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=votre_secret_jwt_long_et_aleatoire

# URLs de l'application
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173

# Notifications push (Web Push / VAPID)
# Générer avec : npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=votre_cle_publique_vapid
VAPID_PRIVATE_KEY=votre_cle_privee_vapid
VAPID_EMAIL=mailto:admin@campusride.ca

# Brevo (envoi de courriels)
BREVO_API_KEY=votre_cle_api_brevo
BREVO_SENDER_EMAIL=votre@email.com

# Email de l'administrateur (destinataire des alertes)
ADMIN_EMAIL=admin@lacitec.on.ca

# Cloudinary (optionnel — images stockées localement si absent)
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
```

### Frontend — `frontend/.env` (si nécessaire)

```env
VITE_GOOGLE_MAPS_API_KEY=votre_cle_google_maps
```

---

## 5. Lancer le projet

### 5.1 Démarrer le backend

```bash
cd backend
npm run dev
# → Serveur démarré sur http://localhost:5000
```

### 5.2 Démarrer le frontend

Dans un second terminal :

```bash
cd frontend
npm run dev
# → Application disponible sur http://localhost:5173
```

### 5.3 Vérifier que tout fonctionne

Ouvrir http://localhost:5173 dans le navigateur. Le frontend communique avec le backend via le proxy Vite configuré dans `frontend/vite.config.js`.

Pour vérifier que le backend répond :
```bash
curl http://localhost:5000/health
# → {"status":"ok"}
```

---

## 6. Tester le projet

### 6.1 Tests manuels — parcours utilisateur complet

#### Compte passager

| Étape | Action | URL |
|---|---|---|
| 1 | Créer un compte avec un courriel @lacite.on.ca | `/register` |
| 2 | Se connecter | `/login` |
| 3 | Compléter son profil (téléphone, zones préférées, photo) | `/profil/infos` |
| 4 | Rechercher un trajet | `/passager/search` |
| 5 | Réserver une place | `/passager/trajets` |
| 6 | Suivre ses réservations | `/passager/mes-reservations` |
| 7 | Envoyer un message au conducteur | `/passager/messages` |
| 8 | Évaluer le conducteur après le trajet | `/passager/mes-reservations` |

#### Compte conducteur

| Étape | Action | URL |
|---|---|---|
| 1 | Enregistrer un véhicule | `/profil/voitures` |
| 2 | Publier un trajet | `/passager/post` |
| 3 | Accepter une réservation | `/conducteur/reservations-recues` |
| 4 | Démarrer le trajet | `/conducteur/mes-trajets` |
| 5 | Mettre à jour sa position GPS (pendant le trajet) | auto via l'interface |
| 6 | Terminer le trajet | `/conducteur/mes-trajets` |
| 7 | Évaluer les passagers | `/conducteur/mes-trajets` |

#### Compte administrateur

| Étape | Action | URL |
|---|---|---|
| 1 | Consulter les statistiques globales | `/admin` |
| 2 | Activer / désactiver un compte | `/admin` → onglet Utilisateurs |
| 3 | Changer le rôle d'un utilisateur | `/admin` → onglet Utilisateurs |
| 4 | Annuler un trajet | `/admin` → onglet Trajets |
| 5 | Traiter un signalement | `/admin` → onglet Signalements |
| 6 | Émettre un avertissement | `/admin` → onglet Signalements |

### 6.2 Tester les endpoints API directement

Avec **curl** ou **Postman** :

```bash
# Inscription
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"prenom":"Jean","nom":"Dupont","email":"jean.dupont@lacite.on.ca","motDePasse":"Azerty123"}'

# Connexion
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.dupont@lacite.on.ca","motDePasse":"Azerty123"}'
# → récupérer le token JWT dans la réponse

# Rechercher des trajets (avec token)
curl http://localhost:5000/trajets/recherche?depart=Ottawa&destination=Orléans \
  -H "Authorization: Bearer <token>"
```

### 6.3 Vérifier la base de données

```bash
psql -U postgres -d campusR

-- Lister les utilisateurs
SELECT id, prenom, nom, email, role, actif FROM utilisateurs;

-- Lister les trajets actifs
SELECT id, lieu_depart, destination, dateheure_depart, statut FROM trajets WHERE statut = 'PLANIFIE';

-- Lister les réservations
SELECT r.id, r.statut, u.email AS passager FROM reservations r JOIN utilisateurs u ON u.id = r.passager_id;
```

---

## 7. Architecture du projet

```
CampusRide/
├── backend/
│   ├── server.js                  # Point d'entrée — démarre le serveur HTTP
│   └── src/
│       ├── app.js                 # Configuration Express (middlewares, routes)
│       ├── DB/
│       │   ├── db.js              # Connexion PostgreSQL (Pool)
│       │   └── script DB.sql      # Schéma complet de la base de données
│       ├── routes/                # Contrôleurs HTTP (11 fichiers)
│       │   ├── auth.routes.js
│       │   ├── utilisateurs.routes.js
│       │   ├── trajets.routes.js
│       │   ├── vehicules.routes.js
│       │   ├── reservations.routes.js
│       │   ├── notifications.routes.js
│       │   ├── messages.routes.js
│       │   ├── evaluations.routes.js
│       │   ├── signalements.routes.js
│       │   ├── admin.routes.js
│       │   └── push.routes.js
│       ├── model/                 # Couche accès aux données (5 fichiers)
│       │   ├── utilisateurs.model.js
│       │   ├── trajets.model.js
│       │   ├── vehicules.model.js
│       │   ├── reservations.model.js
│       │   └── notifications.model.js
│       ├── middlewares/           # Middlewares Express (2 fichiers)
│       │   ├── auth.middlewares.js   # Vérification JWT et rôle admin
│       │   └── upload.middleware.js  # Upload de fichiers (Multer/Cloudinary)
│       └── utils/                 # Services transversaux (4 fichiers)
│           ├── mailer.js          # Envoi de courriels (Brevo)
│           ├── sendEmail.js       # Templates HTML courriels
│           ├── pushNotification.js # Notifications push web
│           └── cron.js            # Tâches planifiées (rappels, statuts)
│
└── frontend/
    ├── index.html
    ├── vite.config.js             # Config Vite + proxy backend
    └── src/
        ├── main.jsx               # Point d'entrée React
        ├── App.jsx                # Routeur principal
        ├── index.css              # Système de design (variables CSS)
        ├── components/            # Composants réutilisables (15 fichiers)
        │   ├── Header.jsx
        │   ├── HeaderPrivate.jsx
        │   ├── Footer.jsx
        │   ├── AdminRoute.jsx
        │   ├── PlacesInput.jsx
        │   ├── TripMap.jsx
        │   ├── TrajetMapModal.jsx
        │   ├── LiveTrackingMap.jsx
        │   ├── UserAvatar.jsx
        │   ├── UserProfileModal.jsx
        │   ├── ReportModal.jsx
        │   ├── CropPhotoModal.jsx
        │   ├── ConfirmModal.jsx
        │   ├── EmergencyButton.jsx
        │   └── InstallBanner.jsx
        ├── pages/                 # Pages de l'application (20+ fichiers)
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── ForgotPassword.jsx
        │   ├── ResetPassword.jsx
        │   ├── Disclaimer.jsx
        │   ├── Passager/
        │   │   ├── Dashboard.jsx
        │   │   ├── Search.jsx
        │   │   ├── Post.jsx
        │   │   ├── Trajets.jsx
        │   │   ├── MesReservations.jsx
        │   │   ├── Messages.jsx
        │   │   ├── Notifications.jsx
        │   │   └── Aide.jsx
        │   ├── Conducteur/
        │   │   ├── MesTrajets.jsx
        │   │   └── ReservationsRecues.jsx
        │   ├── Profil/
        │   │   ├── ProfilLayout.jsx
        │   │   ├── ProfilInfos.jsx
        │   │   ├── ProfilVoitures.jsx
        │   │   └── ProfilParametres.jsx
        │   └── Admin/
        │       └── AdminDashboard.jsx
        ├── hooks/
        │   └── usePWAInstall.js   # Hook PWA (détection + installation)
        ├── services/
        │   └── api.js             # Client Axios avec token JWT
        └── utils/
            ├── auth.js            # Déconnexion
            └── pushSubscription.js # Abonnement push
```

### Patron d'architecture

CampusRide suit une architecture **client-serveur en couches** :

```
Navigateur (React)
       ↕  HTTPS / JSON
Serveur Express (Routes → Modèles → PostgreSQL)
       ↕
Services externes (Brevo · Cloudinary · Web Push)
```

**Séparation des responsabilités :**
- **Routes** : validation des entrées, orchestration, réponses HTTP
- **Modèles** : requêtes SQL, transactions, logique métier de données
- **Middlewares** : transversal (auth, upload)
- **Utils** : services externes (email, push, cron)

---

## 8. Schéma de la base de données

### Diagramme des relations

```
utilisateurs (UUID PK)
│
├──< profils (utilisateur_id FK, 1:1)
├──< vehicules (utilisateur_id FK, 1:1)
│
├──< trajets (conducteur_id FK)
│       └──< reservations (trajet_id FK)
│               └── passager_id → utilisateurs
│
├──< notifications (utilisateur_id FK)
│
├──< conversations (user1_id FK, user2_id FK)
│       └──< messages (conversation_id FK, expediteur_id FK)
│
├──< evaluations (evaluateur_id FK, evalue_id FK, trajet_id FK)
│
├──< signalements (signaleur_id FK, cible_id FK)
│
├──< blocages (bloqueur_id FK, bloque_id FK)
│
└──< push_subscriptions (utilisateur_id FK)
```

### Tables principales

#### `utilisateurs`
| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | Identifiant unique |
| prenom | VARCHAR(100) | NOT NULL | Prénom |
| nom | VARCHAR(100) | NOT NULL | Nom de famille |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Courriel institutionnel |
| mot_de_passe_hash | TEXT | NOT NULL | Hash bcrypt (10 rounds) |
| role | ENUM | NOT NULL, default PASSAGER | PASSAGER / CONDUCTEUR / ADMIN |
| actif | BOOLEAN | default TRUE | Compte actif (soft delete) |
| avertissements | INTEGER | default 0 | Compteur d'avertissements admin |
| cree_le | TIMESTAMP | default NOW() | Date de création |

#### `trajets`
| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | Identifiant unique |
| conducteur_id | UUID | FK utilisateurs | Conducteur du trajet |
| lieu_depart | TEXT | NOT NULL | Adresse de départ |
| destination | TEXT | NOT NULL | Adresse de destination |
| dateheure_depart | TIMESTAMP | NOT NULL | Date et heure de départ |
| places_total | INTEGER | 1–8 | Nombre de places total |
| places_dispo | INTEGER | ≥ 0 | Places disponibles restantes |
| statut | ENUM | default PLANIFIE | PLANIFIE / EN_COURS / TERMINE / ANNULE |
| depart_lat/lng | FLOAT | nullable | Coordonnées GPS du départ |
| dest_lat/lng | FLOAT | nullable | Coordonnées GPS de la destination |
| conducteur_lat/lng | FLOAT | nullable | Position en temps réel du conducteur |

#### `reservations`
| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK | Identifiant unique |
| trajet_id | UUID | FK trajets | Trajet concerné |
| passager_id | UUID | FK utilisateurs | Passager |
| statut | ENUM | default EN_ATTENTE | EN_ATTENTE / ACCEPTEE / REFUSEE / ANNULEE |
| | | UNIQUE(trajet_id, passager_id) | Une seule réservation par passager par trajet |

#### `signalements`
| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| id | TEXT | PK | Identifiant (préfixé SIG-) |
| signaleur_id | UUID | FK utilisateurs | Auteur du signalement |
| type | ENUM | NOT NULL | UTILISATEUR / TRAJET |
| cible_id | UUID | FK utilisateurs | Cible du signalement |
| motif | TEXT | NOT NULL | Raison du signalement |
| niveau | INTEGER | 1–3 | 1=mineur, 2=modéré, 3=grave |
| statut | ENUM | default EN_ATTENTE | EN_ATTENTE / TRAITE / REJETE |

---

## 9. Référence des endpoints API

### Authentification `/auth`

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Non | Créer un compte |
| POST | `/auth/login` | Non | Se connecter |
| GET | `/auth/me` | JWT | Vérifier le token |
| POST | `/auth/forgot-password` | Non | Demander réinitialisation |
| POST | `/auth/reset-password` | Non | Réinitialiser le mot de passe |
| POST | `/auth/contact-admin` | Non | Contacter l'admin (compte désactivé) |

### Utilisateurs `/utilisateurs`

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/utilisateurs/me` | JWT | Profil courant |
| PATCH | `/utilisateurs/me` | JWT | Modifier le profil |
| PATCH | `/utilisateurs/me/password` | JWT | Changer le mot de passe |
| DELETE | `/utilisateurs/me` | JWT | Désactiver le compte |
| GET | `/utilisateurs/me/stats` | JWT | Statistiques personnelles |
| POST | `/utilisateurs/me/photo` | JWT | Uploader une photo de profil |
| GET | `/utilisateurs/:id/public` | Non | Profil public d'un utilisateur |
| PATCH | `/utilisateurs/me/mode-conducteur` | JWT | Basculer rôle conducteur/passager |

### Trajets `/trajets`

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/trajets` | JWT | Publier un trajet |
| GET | `/trajets/recherche` | JWT | Rechercher des trajets |
| GET | `/trajets/mes-trajets` | JWT | Mes trajets publiés |
| GET | `/trajets/populaires` | Non | Trajets populaires |
| PATCH | `/trajets/:id/demarrer` | JWT | Démarrer le trajet |
| PATCH | `/trajets/:id/terminer` | JWT | Terminer le trajet |
| PATCH | `/trajets/:id/annuler` | JWT | Annuler le trajet |
| PATCH | `/trajets/:id/position` | JWT | Mettre à jour la position GPS |
| GET | `/trajets/:id/live` | JWT | Obtenir la position en temps réel |
| PATCH | `/trajets/:id` | JWT | Modifier un trajet |

### Réservations `/reservations`

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/reservations` | JWT | Créer une réservation |
| GET | `/reservations` | JWT | Mes réservations (passager) |
| GET | `/reservations/recues` | JWT | Réservations reçues (conducteur) |
| PATCH | `/reservations/:id/accepter` | JWT | Accepter une réservation |
| PATCH | `/reservations/:id/refuser` | JWT | Refuser une réservation |
| PATCH | `/reservations/:id/annuler` | JWT | Annuler une réservation |

### Notifications, Messages, Évaluations, Signalements

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | JWT | Lister les notifications |
| PATCH | `/notifications/read-all` | JWT | Marquer tout comme lu |
| GET | `/messages/conversations` | JWT | Mes conversations |
| POST | `/messages/conversations` | JWT | Créer une conversation |
| GET | `/messages/conversations/:id/messages` | JWT | Messages d'une conversation |
| POST | `/messages/conversations/:id/messages` | JWT | Envoyer un message |
| POST | `/evaluations` | JWT | Évaluer un utilisateur |
| GET | `/evaluations/conducteur/:id` | Non | Avis sur un conducteur |
| POST | `/signalements` | JWT | Signaler un utilisateur/trajet |

### Administration `/admin`

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Statistiques globales |
| GET | `/admin/users` | Admin | Liste des utilisateurs |
| PATCH | `/admin/users/:id/toggle-actif` | Admin | Activer/Désactiver un compte |
| PATCH | `/admin/users/:id/role` | Admin | Changer le rôle |
| GET | `/admin/trajets` | Admin | Tous les trajets |
| PATCH | `/admin/trajets/:id/annuler` | Admin | Annuler un trajet |
| GET | `/admin/signalements` | Admin | Tous les signalements |
| PATCH | `/admin/signalements/:id/statut` | Admin | Changer le statut |
| POST | `/admin/signalements/:id/avertir` | Admin | Émettre un avertissement |

---

## 10. Décisions de conception

### 10.1 Authentification par JWT

**Décision** : utiliser des JSON Web Tokens (JWT) stockés côté client dans `localStorage`.

**Justification** :
- Architecture stateless facilitant le déploiement sur Render (pas de sessions serveur)
- Expiration de 7 jours avec renouvellement automatique au login
- Payload minimal : `{ id, role }` pour limiter la taille du token

**Alternative considérée** : sessions serveur avec cookies HTTP-only. Rejetée car nécessite du stockage serveur persistant (Redis) incompatible avec le plan gratuit Render.

### 10.2 Séparation Routes / Modèles

**Décision** : architecture en deux couches — routes (contrôleurs) et modèles (accès données).

**Justification** :
- Les routes gèrent la validation des entrées, les autorisations et la réponse HTTP
- Les modèles encapsulent les requêtes SQL et les transactions PostgreSQL
- Réutilisabilité : plusieurs routes peuvent appeler le même modèle

### 10.3 Transactions PostgreSQL pour les opérations critiques

**Décision** : utiliser `BEGIN / COMMIT / ROLLBACK` pour les opérations multi-étapes.

**Cas d'utilisation** : création d'une réservation (décrémenter places_dispo + insérer la réservation), acceptation (mettre à jour statut + gérer places), suppression d'un véhicule (annuler les trajets + rétrograder le rôle).

**Justification** : garantir la cohérence des données en cas d'erreur partielle.

### 10.4 Soft delete pour les comptes utilisateurs

**Décision** : désactiver les comptes avec `actif = FALSE` plutôt que de les supprimer.

**Justification** :
- Préserve l'historique des trajets et réservations (intégrité référentielle)
- Permet la réactivation par l'administrateur
- Conformité RGPD : l'utilisateur peut demander la suppression complète ultérieurement

### 10.5 Algorithme de recherche de trajets (Haversine)

**Décision** : recherche géographique par score de proximité plutôt que correspondance exacte.

**Algorithme** :
1. Calculer la distance entre le départ demandé et le départ du trajet (formule Haversine, 70 pts max)
2. Calculer la distance entre la destination demandée et la destination du trajet (30 pts max)
3. Retourner les 100 meilleurs résultats triés par score décroissant

**Justification** : les utilisateurs ne saisissent pas toujours l'adresse exacte. Un rayon de tolérance configurable (défaut : 10 km) améliore la pertinence des résultats.

### 10.6 Notifications multi-canal

**Décision** : triple canal de notification — base de données, push web, courriel.

| Canal | Usage | Implémentation |
|---|---|---|
| Base de données | Toutes les notifications, persistées | Table `notifications` |
| Push web | Alertes temps réel (PWA) | Web Push API + VAPID |
| Courriel | Actions importantes (réservation, départ) | Brevo API |

**Justification** : garantir que l'utilisateur reçoit l'information même s'il n'a pas l'application ouverte.

### 10.7 PWA (Progressive Web App)

**Décision** : transformer l'application en PWA installable.

**Justification** :
- Pas de frais de publication sur un store d'applications
- Installation directe depuis le navigateur sur iOS/Android/bureau
- Cache des ressources statiques pour une meilleure performance

### 10.8 Escalade automatique des signalements

**Décision** : suspension automatique au niveau 3 et à 3 avertissements cumulés.

**Justification** : réduire la charge de travail de l'administrateur pour les cas évidents, tout en conservant sa capacité de révision manuelle.

---

## 11. Flux de données principaux

### Réservation d'un trajet

```
Passager              Backend              Conducteur
   │                     │                     │
   │── POST /reservations ─>                   │
   │        Validation : places dispo ?        │
   │        Transaction : decrement places_dispo │
   │        Insérer réservation EN_ATTENTE      │
   │        Notifier conducteur (DB+push+email) ─>
   │<── 201 Created ──────│                    │
   │                      │<── GET /reservations/recues
   │                      │<── PATCH /:id/accepter ──
   │                      │   Transaction : ACCEPTEE  │
   │<── notification ──────│                    │
   │                                            │
   │    [Jour J]                                │
   │                      │<── PATCH /:id/demarrer ──
   │<── notification ──────│   statut EN_COURS   │
   │── GET /trajets/:id/live ──>                │
   │<── GPS conducteur ────│                    │
```

### Escalade d'un signalement

```
Utilisateur          Backend              Admin
    │                   │                   │
    │── POST /signalements (niveau 3) ──>   │
    │         Suspend compte cible          │
    │         Email alerte admin ─────────>│
    │                   │                  │
    │                   │<── GET /admin/signalements
    │                   │<── POST /:id/avertir ──
    │                   │   avertissements + 1 │
    │<── notification ──│   si ≥ 3 : suspend  │
```

---

## 12. Déploiement

### Frontend — Vercel

1. Connecter le dépôt GitHub à Vercel
2. Configurer le dossier racine : `frontend`
3. Commande de build : `npm run build`
4. Répertoire de sortie : `dist`
5. Variables d'environnement : `VITE_GOOGLE_MAPS_API_KEY`

### Backend — Render

1. Créer un service Web sur Render
2. Connecter le dépôt GitHub
3. Commande de démarrage : `node server.js`
4. Répertoire racine : `backend`
5. Configurer toutes les variables d'environnement du fichier `.env`
6. Ajouter une base PostgreSQL sur Render et utiliser `DATABASE_URL`

### Variables à configurer en production (Render)

```
NODE_ENV=production
DATABASE_URL=<fourni par Render PostgreSQL>
JWT_SECRET=<générer un secret fort>
FRONTEND_URL=https://votre-app.vercel.app
ALLOWED_ORIGIN=https://votre-app.vercel.app
APP_URL=https://votre-app.vercel.app
BREVO_API_KEY=<votre clé>
BREVO_SENDER_EMAIL=<votre email>
ADMIN_EMAIL=<email admin>
VAPID_PUBLIC_KEY=<votre clé>
VAPID_PRIVATE_KEY=<votre clé>
VAPID_EMAIL=mailto:admin@campusride.ca
CLOUDINARY_CLOUD_NAME=<si utilisé>
CLOUDINARY_API_KEY=<si utilisé>
CLOUDINARY_API_SECRET=<si utilisé>
```

---

## 13. Guide vidéo

La démonstration vidéo couvre les fonctionnalités suivantes (à enregistrer avec un outil de capture d'écran) :

### Séquence recommandée

1. **Inscription et connexion** — créer un compte, se connecter, thème clair/sombre
2. **Profil** — modifier les infos, uploader une photo, zones préférées
3. **Véhicule** — enregistrer un véhicule, uploader une photo de véhicule
4. **Publier un trajet** — formulaire de publication avec sélection d'adresse
5. **Rechercher un trajet** — recherche par localisation + résultats avec scores
6. **Réserver un trajet** — sélectionner un trajet et réserver
7. **Accepter une réservation** (compte conducteur) — recevoir et accepter une demande
8. **Messagerie** — envoyer un message à un autre utilisateur
9. **Notifications** — voir les notifications en temps réel
10. **Démarrer / terminer un trajet** — cycle complet d'un trajet
11. **Suivi GPS en temps réel** — vue passager du trajet en cours
12. **Évaluation** — noter le conducteur / le passager
13. **Signalement** — signaler un utilisateur
14. **Administration** — tableau de bord admin, activer/désactiver un compte, traiter un signalement
15. **Compte désactivé** — message d'erreur + formulaire de contact admin
16. **PWA** — installer l'application depuis le navigateur

---

*Projet réalisé dans le cadre du cours de projet intégrateur — Collège La Cité, Semestre 4.*
