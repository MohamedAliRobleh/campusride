# Tests fonctionnels – CAM-19 (Connexion Administrateur)

## Test 1 – Connexion admin valide
- Requête : POST /auth/login
- Email admin valide
- Mot de passe valide
- Résultat attendu : 200 OK + token JWT

## Test 2 – Connexion utilisateur non admin
- Requête : POST /auth/login
- Email utilisateur normal
- Mot de passe valide
- Résultat attendu : 403 Accès admin requis

## Test 3 – Mauvais mot de passe
- Requête : POST /auth/login
- Email valide
- Mot de passe incorrect
- Résultat attendu : 401 Identifiants invalides

## Test 4 – Accès route admin sans token
- Requête : GET /admin/dashboard
- Sans header Authorization
- Résultat attendu : 401 Token manquant ou invalide
