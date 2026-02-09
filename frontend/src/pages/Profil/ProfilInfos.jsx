import { useOutletContext } from "react-router-dom";

export default function ProfilInfos() {
  const { isDark, user } = useOutletContext();

  const cardClass = `border rounded-4 shadow-sm ${
    isDark ? "bg-dark bg-opacity-10 border-secondary text-light" : "bg-white"
  }`;

  const sectionLabelClass = isDark ? "text-secondary" : "text-muted";

  const Row = ({ label, value }) => (
    <div className="d-flex align-items-center justify-content-between py-3 px-3 border-bottom">
      <div className="fw-semibold">{label}</div>
      <div className="d-flex align-items-center gap-2">
        {value ? <span className={isDark ? "text-secondary fw-semibold" : "text-muted fw-semibold"}>{value}</span> : null}
        <i className="bi bi-chevron-right text-muted" />
      </div>
    </div>
  );

  const RowLast = ({ label, value }) => (
    <div className="d-flex align-items-center justify-content-between py-3 px-3">
      <div className="fw-semibold">{label}</div>
      <div className="d-flex align-items-center gap-2">
        {value ? <span className={isDark ? "text-secondary fw-semibold" : "text-muted fw-semibold"}>{value}</span> : null}
        <i className="bi bi-chevron-right text-muted" />
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="m-0 fw-bold" style={{ letterSpacing: "-0.2px", fontSize: 26 }}>
        Mes informations
      </h2>

      <div className={`mt-3 small fw-bold ${sectionLabelClass}`} style={{ letterSpacing: 0.8 }}>
        VOS IDENTIFIANTS
      </div>

      <div className={`${cardClass} mt-2 overflow-hidden`}>
        <Row label="Courriels" value={user?.email || ""} />
        <Row label="Courriel alternatif" value="" />
        <Row label="Nom d'usager" value={user?.email || ""} />
        <RowLast label="Mot de passe" value="" />
      </div>

      <p className={`mt-3 small ${sectionLabelClass}`} style={{ lineHeight: 1.4 }}>
        Spécifier une adresse courriel alternative est un bon moyen de s'assurer que vous recevez toutes nos communications.
      </p>

      <div className={`mt-4 small fw-bold ${sectionLabelClass}`} style={{ letterSpacing: 0.8 }}>
        VOS INFOS PRIVÉES
      </div>

      <div className={`${cardClass} mt-2 overflow-hidden`}>
        <Row label="Ville" value="Ottawa" />
        <Row label="Numéros de téléphone" value="" />
        <Row label="Quelques mots sur moi" value="" />
        <RowLast label="Témoignage" value="" />
      </div>
    </div>
  );
}
