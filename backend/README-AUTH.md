# Authentification CampusRide

## Rôles
- USER : utilisateur normal
- ADMIN : administrateur

## Accès
- /auth/login : public
- /auth/register : public
- /admin/* : ADMIN uniquement

## Sécurité
- JWT obligatoire
- Le token contient id + role
