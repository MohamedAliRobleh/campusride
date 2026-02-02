import jwt from "jsonwebtoken";

// Vérifie le token "Bearer <token>"
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization; // "Bearer xxx"
    if (!header) return res.status(401).json({ error: "Token manquant" });

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ error: "Format token invalide" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // ex: { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
