// src/components/CropPhotoModal.jsx
import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

/**
 * Retourne un Blob JPEG recadré depuis un HTMLImageElement + une région crop.
 */
async function cropImageToBlob(imgEl, crop, circular = false) {
  const canvas = document.createElement("canvas");
  const scaleX = imgEl.naturalWidth  / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;

  const pixelCrop = {
    x:      crop.x      * scaleX,
    y:      crop.y      * scaleY,
    width:  crop.width  * scaleX,
    height: crop.height * scaleY,
  };

  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");

  if (circular) {
    ctx.beginPath();
    ctx.arc(pixelCrop.width / 2, pixelCrop.height / 2, pixelCrop.width / 2, 0, Math.PI * 2);
    ctx.clip();
  }

  ctx.drawImage(
    imgEl,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

/**
 * Props:
 *  - imageSrc   : string (data URL de l'image source)
 *  - onSave     : (blob: Blob) => void
 *  - onClose    : () => void
 *  - isDark     : bool
 *  - circular   : bool  — recadrage circulaire (photo de profil) ou libre (voiture)
 *  - title      : string
 */
export default function CropPhotoModal({ imageSrc, onSave, onClose, isDark, circular = false, title = "Recadrer la photo" }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [saving, setSaving] = useState(false);

  const aspect = circular ? 1 : 16 / 9;

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, aspect, width, height),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }, [aspect]);

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) return;
    try {
      setSaving(true);
      const blob = await cropImageToBlob(imgRef.current, completedCrop, circular);
      onSave(blob);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 11000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`rounded-4 shadow-lg overflow-hidden w-100 ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}
        style={{ maxWidth: 520 }}
      >
        {/* Header */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374)" }} />
        <div className="p-3 p-md-4">

          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 36, height: 36, background: "rgba(25,135,84,0.1)" }}
            >
              <i className="bi bi-crop text-success" style={{ fontSize: "1rem" }} />
            </div>
            <div className="flex-grow-1">
              <div className="fw-bold" style={{ fontSize: "0.95rem" }}>{title}</div>
              <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
                {circular
                  ? "Ajustez la zone de recadrage circulaire puis cliquez sur Enregistrer."
                  : "Ajustez la zone de recadrage puis cliquez sur Enregistrer."}
              </div>
            </div>
            <button
              type="button"
              className={`btn-close ${isDark ? "btn-close-white" : ""}`}
              onClick={onClose}
            />
          </div>

          {/* Zone de crop */}
          <div
            className={`rounded-3 overflow-hidden mb-3 d-flex align-items-center justify-content-center`}
            style={{
              background: isDark ? "#111" : "#f0f0f0",
              maxHeight: 360,
            }}
          >
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop={circular}
              keepSelection
              minWidth={60}
              minHeight={60}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Aperçu"
                onLoad={onImageLoad}
                style={{ maxHeight: 340, maxWidth: "100%", display: "block" }}
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>

          {/* Hint */}
          <p className={`small text-center mb-3 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
            <i className="bi bi-hand-index me-1" />
            Glissez les coins pour ajuster le recadrage
          </p>

          {/* Boutons */}
          <div className="d-flex gap-2">
            <button
              type="button"
              className={`btn rounded-3 fw-semibold flex-fill ${isDark ? "btn-outline-secondary" : "btn-outline-secondary"}`}
              style={{ fontSize: "0.88rem" }}
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-success rounded-3 fw-semibold flex-fill"
              style={{ fontSize: "0.88rem" }}
              onClick={handleSave}
              disabled={saving || !completedCrop}
            >
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</>
                : <><i className="bi bi-check-lg me-2" />Enregistrer</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
