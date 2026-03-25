// src/components/TripMap.jsx
// Carte interactive Leaflet — coordonnées directes ou géocodage Nominatim en fallback
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

function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function geocode(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ca`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

async function getRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (!data.routes?.length) return null;
    const route = data.routes[0];
    return {
      coords: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      distanceKm: (route.distance / 1000).toFixed(1),
      durationMin: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}

/**
 * Props:
 *   depart       — string (adresse texte)
 *   destination  — string (adresse texte)
 *   fromCoords   — { lat, lng } ou { lat, lon } — coordonnées directes (évite le géocodage)
 *   toCoords     — { lat, lng } ou { lat, lon } — coordonnées directes
 *   isDark       — boolean
 *   height       — number (px)
 */
export default function TripMap({ depart, destination, fromCoords, toCoords, isDark, height = 320 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    ensureLeafletCSS();
    let cancelled = false;

    async function init() {
      try {
        setStatus("loading");
        setRouteInfo(null);

        const L = (await import("leaflet")).default;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        if (!mapRef.current || cancelled) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Normaliser les coordonnées (lat/lng ou lat/lon)
        const normalize = (c) => c ? { lat: parseFloat(c.lat), lon: parseFloat(c.lon ?? c.lng) } : null;

        let fromCoord = normalize(fromCoords);
        let toCoord   = normalize(toCoords);

        // Si les coordonnées ne sont pas fournies, géocoder
        if (!fromCoord) fromCoord = await geocode(depart);
        if (!toCoord)   toCoord   = await geocode(destination);

        if (cancelled) return;

        if (!fromCoord || !toCoord) {
          setStatus("error");
          return;
        }

        const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        }).addTo(map);

        // Récupérer la route via OSRM
        let route = null;
        try { route = await getRoute(fromCoord, toCoord); } catch { /* fallback */ }
        if (cancelled) return;

        if (route) {
          L.polyline(route.coords, { color: "#198754", weight: 5, opacity: 0.85 }).addTo(map);
          setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin });
          map.fitBounds(L.latLngBounds(route.coords), { padding: [40, 40] });
        } else {
          // Fallback ligne droite
          L.polyline(
            [[fromCoord.lat, fromCoord.lon], [toCoord.lat, toCoord.lon]],
            { color: "#198754", weight: 3, opacity: 0.6, dashArray: "6 6" }
          ).addTo(map);
          map.fitBounds(
            L.latLngBounds([[fromCoord.lat, fromCoord.lon], [toCoord.lat, toCoord.lon]]),
            { padding: [50, 50] }
          );
        }

        const greenIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:#198754;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7], className: "",
        });
        const redIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:#dc3545;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7], className: "",
        });

        L.marker([fromCoord.lat, fromCoord.lon], { icon: greenIcon }).addTo(map).bindPopup(`<b>Départ</b><br>${depart}`);
        L.marker([toCoord.lat, toCoord.lon], { icon: redIcon }).addTo(map).bindPopup(`<b>Arrivée</b><br>${destination}`);

        setStatus("ready");
      } catch (e) {
        console.error("TripMap error:", e);
        if (!cancelled) setStatus("error");
      }
    }

    init();
    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [depart, destination, fromCoords, toCoords]);

  return (
    <div className="position-relative" style={{ borderRadius: 12, overflow: "hidden" }}>
      <div ref={mapRef} style={{ height, width: "100%", background: "#e8f5e9" }} />

      {status === "loading" && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{ background: "rgba(255,255,255,0.85)", zIndex: 999 }}>
          <div className="spinner-border text-success mb-2" style={{ width: "1.8rem", height: "1.8rem" }} />
          <span className="text-muted small">Chargement de la carte…</span>
        </div>
      )}

      {status === "error" && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{ background: "rgba(255,255,255,0.92)", zIndex: 999 }}>
          <i className="bi bi-map text-muted mb-2" style={{ fontSize: "2rem" }} />
          <span className="text-muted small">Carte non disponible</span>
        </div>
      )}

      {status === "ready" && routeInfo && (
        <div className="position-absolute d-flex gap-2"
          style={{ bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 998 }}>
          <span className="badge d-flex align-items-center gap-1 px-3 py-2"
            style={{ background: "rgba(25,135,84,0.92)", fontSize: "0.8rem", borderRadius: 20 }}>
            <i className="bi bi-clock" />{routeInfo.durationMin} min
          </span>
          <span className="badge d-flex align-items-center gap-1 px-3 py-2"
            style={{ background: "rgba(0,0,0,0.65)", fontSize: "0.8rem", borderRadius: 20 }}>
            <i className="bi bi-signpost-2" />{routeInfo.distanceKm} km
          </span>
        </div>
      )}
    </div>
  );
}
