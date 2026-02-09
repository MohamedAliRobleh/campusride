import { useOutletContext } from "react-router-dom";

export default function ProfilParametres() {
  const { isDark } = useOutletContext();

  const cardClass = `rounded-4 border shadow-sm p-3 p-md-4 ${
    isDark ? "bg-dark bg-opacity-25 border-secondary" : "bg-white"
  }`;

  return (
    <div className={cardClass}>
      <h2 className="h4 fw-bold mb-2">Paramètres</h2>
      <p className={isDark ? "text-secondary mb-0" : "text-muted mb-0"}>
        Cette section sera branchée plus tard (langue, notifications, sécurité, etc.).
      </p>
    </div>
  );
}
