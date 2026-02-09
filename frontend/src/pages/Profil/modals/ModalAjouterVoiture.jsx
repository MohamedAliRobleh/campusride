import { useEffect } from "react";

export default function ModalAjouterVoiture({ show, onClose, isDark }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (show) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onClose]);

  if (!show) return null;

  const inputClass = `form-control ${isDark ? "bg-dark text-light border-secondary" : ""}`;

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className={`modal-content ${isDark ? "bg-dark text-light border-secondary" : ""}`}>
            <div className="modal-header">
              <h5 className="modal-title">Ajouter une voiture</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Marque</label>
                  <input className={inputClass} placeholder="Ex: Toyota" />
                </div>
                <div className="col-12">
                  <label className="form-label">Modèle</label>
                  <input className={inputClass} placeholder="Ex: Corolla" />
                </div>
                <div className="col-6">
                  <label className="form-label">Année</label>
                  <input className={inputClass} placeholder="Ex: 2020" />
                </div>
                <div className="col-6">
                  <label className="form-label">Plaque</label>
                  <input className={inputClass} placeholder="Ex: ABC123" />
                </div>
                <div className="col-12">
                  <label className="form-label">Nombre de places</label>
                  <input className={inputClass} placeholder="Ex: 4" />
                </div>
              </div>

              <div className="text-muted small mt-3">
                UI seulement pour le moment (on branchera le backend après).
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Annuler
              </button>
              <button type="button" className="btn btn-success" disabled>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}
