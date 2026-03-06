import { useState } from "react";

/**
 * Affiche la photo de profil d'un utilisateur.
 * Si l'image est cassée ou absente, affiche les initiales sur fond vert.
 */
export default function UserAvatar({ photoUrl, prenom, nom, size = 40, className = "", style = {} }) {
  const [imgError, setImgError] = useState(false);
  const initial = (prenom?.[0] ?? nom?.[0] ?? "?").toUpperCase();

  const baseStyle = {
    width: size,
    height: size,
    objectFit: "cover",
    flexShrink: 0,
    ...style,
  };

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt="Photo de profil"
        className={`rounded-circle ${className}`}
        style={baseStyle}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white ${className}`}
      style={{
        ...baseStyle,
        background: "linear-gradient(135deg, #198754, #20c374)",
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}
