/**
 * @fileoverview Middleware de téléversement de fichiers images pour CampusRide.
 *
 * Gère deux stratégies de stockage selon l'environnement :
 * - **Production** : stockage sur Cloudinary (si les variables CLOUDINARY_* sont définies)
 *   avec redimensionnement automatique à 800×800 px.
 * - **Développement** : stockage local dans le dossier `uploads/` du backend.
 *
 * Formats acceptés : JPG, PNG, WEBP.
 * Taille maximale : 5 Mo.
 *
 * @module middlewares/upload.middleware
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

/**
 * Filtre de type MIME — accepte uniquement les images JPG, PNG et WEBP.
 *
 * @param {import("express").Request} req - Requête Express.
 * @param {Express.Multer.File} file - Fichier reçu par Multer.
 * @param {Function} cb - Callback Multer : cb(erreur, accepter).
 * @returns {void}
 */
const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Seuls les formats JPG, PNG et WEBP sont acceptés."), false);
};

/** @type {multer.StorageEngine} Stratégie de stockage sélectionnée selon l'environnement. */
let storage;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  // --- Stratégie Cloudinary (production) ---
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "campusride",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      // Redimensionnement automatique côté Cloudinary
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    },
  });
} else {
  // --- Stratégie disque local (développement) ---
  const uploadDir = path.resolve("uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `photo_${Date.now()}${ext}`);
    },
  });
}

/**
 * Instance Multer configurée pour l'upload de photos (profil et véhicule).
 *
 * Utiliser avec `.single("photo")` dans les routes.
 *
 * @type {import("multer").Multer}
 *
 * @example
 * import { upload } from "../middlewares/upload.middleware.js";
 *
 * router.post("/me/photo", requireAuth, upload.single("photo"), async (req, res) => {
 *   const photoUrl = req.file?.path || req.file?.secure_url;
 *   // ...
 * });
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo maximum
});
