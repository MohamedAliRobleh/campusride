// src/components/ConfirmModal.jsx
// Usage:
//   const { confirm, ConfirmDialog } = useConfirm();
//   ...
//   const ok = await confirm({ title: "Supprimer", message: "...", variant: "danger", confirmLabel: "Supprimer" });
//   if (!ok) return;
//   ...
//   return <>{ConfirmDialog}</>;

import { useState, useCallback } from "react";

const VARIANT = {
  danger:  { icon: "bi-exclamation-octagon-fill", color: "#dc3545", bg: "#fdf0f0", btnClass: "btn-danger" },
  warning: { icon: "bi-exclamation-triangle-fill", color: "#fd7e14", bg: "#fff3e8", btnClass: "btn-warning" },
  success: { icon: "bi-check-circle-fill", color: "#198754", bg: "#f0fdf4", btnClass: "btn-success" },
  info:    { icon: "bi-info-circle-fill", color: "#0d6efd", bg: "#eff6ff", btnClass: "btn-primary" },
};

function ConfirmModal({ title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", variant = "danger", onConfirm, onCancel }) {
  const v = VARIANT[variant] || VARIANT.danger;

  return (
    <div
      className="modal d-block"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 1080 }}
      onClick={onCancel}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 380 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
          {/* Barre colorée */}
          <div style={{ height: 4, background: v.color }} />

          <div className="p-4">
            {/* Icône + titre */}
            <div className="d-flex align-items-start gap-3 mb-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 42, height: 42, background: v.bg }}
              >
                <i className={`bi ${v.icon}`} style={{ color: v.color, fontSize: "1.25rem" }} />
              </div>
              <div>
                <div className="fw-bold mb-1" style={{ fontSize: "1rem" }}>{title}</div>
                <div className="text-muted" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{message}</div>
              </div>
            </div>

            {/* Boutons */}
            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 px-4"
                style={{ fontSize: "0.85rem" }}
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`btn ${v.btnClass} rounded-3 px-4 fw-semibold`}
                style={{ fontSize: "0.85rem" }}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState({ open: false, resolve: null, options: {} });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, options });
    });
  }, []);

  const handleClose = useCallback((result) => {
    setState((s) => {
      s.resolve?.(result);
      return { open: false, resolve: null, options: {} };
    });
  }, []);

  const ConfirmDialog = state.open ? (
    <ConfirmModal
      {...state.options}
      onConfirm={() => handleClose(true)}
      onCancel={() => handleClose(false)}
    />
  ) : null;

  return { confirm, ConfirmDialog };
}
