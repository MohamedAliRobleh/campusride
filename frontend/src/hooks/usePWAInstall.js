import { useEffect, useState } from "react";

// Capture l'événement au niveau module (avant tout montage de composant)
let _cachedPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _cachedPrompt = e;
});

const DISMISS_KEY = "pwa_install_dismissed_until";

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(_cachedPrompt);
  const [installed, setInstalled] = useState(false);

  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 900;
  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !/crios/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      _cachedPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const isDismissed = () => {
    const until = localStorage.getItem(DISMISS_KEY);
    return until && Date.now() < parseInt(until);
  };

  const dismiss = (days = 30) => {
    if (days > 0) {
      localStorage.setItem(DISMISS_KEY, Date.now() + days * 24 * 60 * 60 * 1000);
    } else {
      localStorage.removeItem(DISMISS_KEY);
    }
  };

  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      _cachedPrompt = null;
      setDeferredPrompt(null);
      setInstalled(true);
    }
    return outcome === "accepted";
  };

  // Peut montrer la bannière si : mobile, pas installé, pas refusé récemment
  const canShowBanner =
    isMobile && !isStandalone && !installed && !isDismissed() && (!!deferredPrompt || isIos);

  return { deferredPrompt, isMobile, isIos, isStandalone, installed, canShowBanner, install, dismiss, isDismissed };
}
