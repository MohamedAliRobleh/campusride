// Gestion des Web Push Notifications

export async function registerPush(token) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    // 1. Enregistrer le service worker
    const reg = await navigator.serviceWorker.register("/sw.js");

    // 2. Demander la permission (si pas encore accordée)
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // 3. Récupérer la clé publique VAPID
    const res = await fetch("/push/vapid-public-key");
    const { publicKey } = await res.json();

    // 4. S'abonner aux push
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // 5. Envoyer la subscription au backend
    await fetch("/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(subscription),
    });
  } catch (err) {
    console.error("Push subscription error:", err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
