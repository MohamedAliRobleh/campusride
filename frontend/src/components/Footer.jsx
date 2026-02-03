// src/components/Footer.jsx
export default function Footer({ isDark, style }) {
  return (
    <footer
      className="text-center mt-5 pt-4 pb-4"
      style={style}
    >
      <div className="d-flex justify-content-center gap-3 small text-uppercase fw-semibold opacity-75">
        <span>Collège La Cité</span>
        <span className="opacity-50">•</span>
        <span>Ottawa, Canada</span>
      </div>

      <p className={`mt-2 small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
        © {new Date().getFullYear()} CampusRide. Tous droits réservés.
      </p>
    </footer>
  );
}
