// src/components/PlacesInput.jsx
// Champ d'adresse avec autocomplétion Google Places + coordonnées GPS
import { useEffect, useRef } from "react";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function loadGoogleMapsScript() {
  if (document.getElementById("gm-script")) return;
  const script = document.createElement("script");
  script.id = "gm-script";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

/**
 * Props:
 *  value         : string — valeur contrôlée
 *  onChange      : (address: string) => void
 *  onPlaceSelect : ({ address, lat, lng }) => void  — optionnel, appelé quand Google retourne un lieu
 *  placeholder, className : passés à l'input
 */
export default function PlacesInput({ value, onChange, onPlaceSelect, placeholder, className }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    loadGoogleMapsScript();
  }, []);

  // Synchroniser la valeur externe → DOM
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== (value ?? "")) {
      inputRef.current.value = value ?? "";
    }
  }, [value]);

  // Initialiser l'autocomplete dès que Google Maps est prêt
  useEffect(() => {
    let interval;

    const init = () => {
      if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "ca" },
        fields: ["formatted_address", "name", "geometry"],   // ← geometry pour lat/lng
        types: ["geocode", "establishment"],
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        const address = place.formatted_address || place.name || inputRef.current.value;
        onChange(address);

        // Transmettre les coordonnées si disponibles
        if (onPlaceSelect && place.geometry?.location) {
          onPlaceSelect({
            address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
    };

    if (window.google?.maps?.places) {
      init();
    } else {
      interval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(interval);
          init();
        }
      }, 200);
    }

    return () => {
      clearInterval(interval);
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      className={className}
      placeholder={placeholder}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
    />
  );
}
