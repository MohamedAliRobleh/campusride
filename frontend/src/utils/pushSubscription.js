// Gestion des Web Push Notifications

/**
 * Enregistre le service worker et s'abonne si la permission est déjà accordée.
 * Appelé automatiquement au chargement — sans demander la permission.
 */
export async function registerPush(token) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    if (Notification.permission !== "granted") return;
    await _subscribe(reg, token);
  } catch (err) {
    console.error("Push init error:", err);
  }
}

/**
 * Demande la permission et s'abonne. À appeler sur un clic utilisateur.
 * Retourne true si la permission a été accordée.
 */
export async function requestPushPermission(token) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
    const reg = await navigator.serviceWorker.register("/sw.js");
    await _subscribe(reg, token);
    return true;
  } catch (err) {
    console.error("Push permission error:", err);
    return false;
  }
}

async function _subscribe(reg, token) {
  const vapidRes = await fetch("/push/vapid-public-key");
  if (!vapidRes.ok) throw new Error("Impossible de récupérer la clé VAPID (statut " + vapidRes.status + ")");
  const { publicKey } = await vapidRes.json();
  if (!publicKey) throw new Error("Clé VAPID manquante sur le serveur");

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const saveRes = await fetch("/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(subscription),
  });
  if (!saveRes.ok) throw new Error("Impossible de sauvegarder la subscription (statut " + saveRes.status + ")");
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
