// src/components/LiveTrackingMap.jsx
// Carte de suivi en direct — marqueur bleu animé pour la position du conducteur
import { useEffect, useRef, useState } from "react";

let leafletCSSLoaded = false;
function ensureLeafletCSS() {
  if (leafletCSSLoaded) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
  leafletCSSLoaded = true;
}

async function getRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes?.length) return null;
  const route = data.routes[0];
  return {
    coords: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceKm: (route.distance / 1000).toFixed(1),
    durationMin: Math.round(route.duration / 60),
  };
}

const PULSE_STYLE = `
@keyframes liveRing {
  0%   { transform: scale(1);   opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}
.live-pulse-ring {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 20px; height: 20px;
  border-radius: 50%;
  background: rgba(13,110,253,0.35);
  animation: liveRing 1.4s ease-out infinite;
}
`;

function injectPulseStyle() {
  if (document.getElementById("live-pulse-css")) return;
  const s = document.createElement("style");
  s.id = "live-pulse-css";
  s.textContent = PULSE_STYLE;
  document.head.appendChild(s);
}

/**
 * Props:
 *   conducteurPos — { lat, lng } | null   (null = en attente)
 *   destCoords    — { lat, lng }
 *   departCoords  — { lat, lng } | null   (facultatif)
 *   destination   — string (label popup)
 *   isDark        — boolean
 *   height        — number (px)
 */
export default function LiveTrackingMap({
  conducteurPos,
  destCoords,
  departCoords,
  destination = "Destination",
  isDark,
  height = 280,
}) {
  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const driverMarker  = useRef(null);
  const routeLayer    = useRef(null);
  const [routeInfo, setRouteInfo]   = useState(null);
  const [mapReady, setMapReady]     = useState(false);

  // ── Init carte une seule fois ──────────────────────────────────────────────
  useEffect(() => {
    ensureLeafletCSS();
    injectPulseStyle();
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current || cancelled) return;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

      const center = destCoords
        ? [parseFloat(destCoords.lat), parseFloat(destCoords.lng)]
        : [45.5, -73.6];

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false });
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      // Marqueur destination (rouge)
      if (destCoords) {
        const redIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:#dc3545;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7], className: "",
        });
        L.marker([parseFloat(destCoords.lat), parseFloat(destCoords.lng)], { icon: redIcon })
          .addTo(map)
          .bindPopup(`<b>Destination</b><br>${destination}`);
      }

      map.setView(center, 13);
      if (!cancelled) setMapReady(true);
    }

    init().catch(console.error);

    return () => {
      cancelled = true;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      driverMarker.current = null;
      routeLayer.current = null;
    };
  }, []);

  // ── Mise à jour position conducteur ────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    let cancelled = false;

    async function updatePosition() {
      const L = (await import("leaflet")).default;
      const map = mapInstance.current;
      if (!map || cancelled) return;

      if (!conducteurPos) {
        // Pas de position → supprimer marqueur et route
        if (driverMarker.current) { driverMarker.current.remove(); driverMarker.current = null; }
        if (routeLayer.current)   { routeLayer.current.remove();   routeLayer.current = null; }
        setRouteInfo(null);
        return;
      }

      const pos = [parseFloat(conducteurPos.lat), parseFloat(conducteurPos.lng)];

      // Marqueur conducteur (bleu pulse)
      const blueIcon = L.divIcon({
        html: `<div style="position:relative;width:20px;height:20px">
                 <div class="live-pulse-ring"></div>
                 <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                   width:14px;height:14px;background:#0d6efd;border:3px solid white;
                   border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>
               </div>`,
        iconSize: [20, 20], iconAnchor: [10, 10], className: "",
      });

      if (driverMarker.current) {
        driverMarker.current.setLatLng(pos);
      } else {
        driverMarker.current = L.marker(pos, { icon: blueIcon })
          .addTo(map)
          .bindPopup("<b>Conducteur</b>");
      }

      // Route OSRM conducteur → destination
      if (destCoords) {
        try {
          const route = await getRoute(
            { lat: conducteurPos.lat, lng: conducteurPos.lng },
            { lat: parseFloat(destCoords.lat), lng: parseFloat(destCoords.lng) }
          );
          if (cancelled || !mapInstance.current) return;
          if (routeLayer.current) { routeLayer.current.remove(); routeLayer.current = null; }
          if (route) {
            routeLayer.current = L.polyline(route.coords, { color: "#0d6efd", weight: 5, opacity: 0.85 }).addTo(map);
            setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin });
            map.fitBounds(L.latLngBounds(route.coords), { padding: [40, 40] });
          }
        } catch { /* OSRM indisponible — on garde l'ancienne route */ }
      } else {
        map.setView(pos, 14);
      }
    }

    updatePosition();
    return () => { cancelled = true; };
  }, [conducteurPos, mapReady]);

  return (
    <div className="position-relative" style={{ borderRadius: 12, overflow: "hidden" }}>
      <div ref={mapRef} style={{ height, width: "100%", background: "#e3f2fd" }} />

      {/* En attente de position */}
      {!conducteurPos && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{ background: "rgba(255,255,255,0.82)", zIndex: 999 }}
        >
          <div className="spinner-border text-primary mb-2" style={{ width: "1.6rem", height: "1.6rem" }} />
          <span className="text-muted small">En attente de la position du conducteur…</span>
        </div>
      )}

      {/* Badge ETA */}
      {conducteurPos && routeInfo && (
        <div
          className="position-absolute d-flex gap-2"
          style={{ bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 998 }}
        >
          <span
            className="badge d-flex align-items-center gap-1 px-3 py-2"
            style={{ background: "rgba(13,110,253,0.92)", fontSize: "0.8rem", borderRadius: 20 }}
          >
            <i className="bi bi-clock" />{routeInfo.durationMin} min
          </span>
          <span
            className="badge d-flex align-items-center gap-1 px-3 py-2"
            style={{ background: "rgba(0,0,0,0.65)", fontSize: "0.8rem", borderRadius: 20 }}
          >
            <i className="bi bi-signpost-2" />{routeInfo.distanceKm} km
          </span>
        </div>
      )}
    </div>
  );
}
