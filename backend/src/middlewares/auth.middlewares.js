/**
 * @fileoverview Middlewares d'authentification et d'autorisation pour l'API CampusRide.
 *
 * Deux middlewares sont exportés :
 * - {@link requireAuth} : vérifie la présence et la validité d'un token JWT.
 * - {@link requireAdmin} : vérifie que l'utilisateur authentifié possède le rôle ADMIN.
 *
 * @module middlewares/auth.middlewares
 */

import jwt from "jsonwebtoken";

/**
 * Middleware Express — vérifie le token JWT dans l'en-tête Authorization.
 *
 * Le token doit être fourni sous la forme : `Authorization: Bearer <token>`.
 * En cas de succès, le payload décodé `{ id, role }` est attaché à `req.user`.
 *
 * @param {import("express").Request}  req  - Requête Express.
 * @param {import("express").Response} res  - Réponse Express.
 * @param {import("express").NextFunction} next - Fonction suivante dans la chaîne.
 * @returns {void}
 *
 * @example
 * // Protéger une route
 * router.get("/profil", requireAuth, (req, res) => {
 *   res.json({ userId: req.user.id });
 * });
 */
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Token manquant" });

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ error: "Format token invalide" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

/**
 * Middleware Express — vérifie que l'utilisateur authentifié a le rôle ADMIN.
 *
 * Doit être utilisé après {@link requireAuth} dans la chaîne de middlewares.
 * Retourne 401 si `req.user` est absent, 403 si le rôle n'est pas ADMIN.
 *
 * @param {import("express").Request}  req  - Requête Express (avec req.user défini par requireAuth).
 * @param {import("express").Response} res  - Réponse Express.
 * @param {import("express").NextFunction} next - Fonction suivante dans la chaîne.
 * @returns {void}
 *
 * @example
 * // Protéger une route réservée aux admins
 * router.get("/admin/stats", requireAuth, requireAdmin, (req, res) => {
 *   res.json({ stats: "..." });
 * });
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Accès refusé" });
  }

  next();
}
