const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_SENDER_EMAIL || "campusride@lacitec.on.ca";
const FROM_NAME = "CampusRide";

/**
 * Envoie un email HTML via Brevo HTTP API.
 */
export async function sendEmail(to, subject, html) {
  if (!BREVO_API_KEY) {
    console.warn("[sendEmail] BREVO_API_KEY manquant, email non envoyé");
    return;
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[sendEmail] Brevo erreur:", res.status, body);
    } else {
      console.log(`[sendEmail] Email envoyé à ${to} (${subject})`);
    }
  } catch (err) {
    console.error("[sendEmail] Erreur:", err.message);
  }
}

/* ─── Templates ─────────────────────────────────────────── */

function base(contenu) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0">
    <div style="background:linear-gradient(90deg,#198754,#20c374);padding:20px 24px;display:flex;align-items:center;gap:10px">
      <span style="font-size:22px">🚗</span>
      <span style="color:#fff;font-size:18px;font-weight:bold;letter-spacing:-0.3px">CampusRide</span>
    </div>
    <div style="padding:24px">${contenu}</div>
    <div style="padding:14px 24px;background:#f0f0f0;font-size:12px;color:#888;text-align:center">
      Collège La Cité · Covoiturage étudiant · Ne pas répondre à cet email
    </div>
  </div>`;
}

function ligne(depart, destination) {
  return `<div style="background:#f0faf4;border-radius:8px;padding:12px 16px;margin:14px 0;font-size:14px">
    <span style="color:#198754;font-weight:bold">📍 ${depart}</span>
    <span style="color:#aaa;margin:0 8px">→</span>
    <span style="color:#198754;font-weight:bold">🏁 ${destination}</span>
  </div>`;
}

function bouton(texte, url) {
  return `<div style="text-align:center;margin:20px 0">
    <a href="${url}" style="background:linear-gradient(135deg,#198754,#20c374);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">${texte}</a>
  </div>`;
}

/* ─── Emails spécifiques ─────────────────────────────────── */

export function emailNouvelleReservation({ to, passagerPrenom, depart, destination, appUrl }) {
  return sendEmail(to, "🔔 Nouvelle demande de réservation — CampusRide", base(`
    <p style="font-size:16px;color:#333">Bonjour,</p>
    <p style="color:#555"><strong>${passagerPrenom}</strong> demande à rejoindre votre trajet :</p>
    ${ligne(depart, destination)}
    <p style="color:#555">Connectez-vous pour accepter ou refuser cette demande.</p>
    ${bouton("Voir la demande", appUrl + "/conducteur/reservations-recues")}
  `));
}

export function emailReservationAcceptee({ to, depart, destination, dateHeure, appUrl }) {
  return sendEmail(to, "✅ Réservation acceptée — CampusRide", base(`
    <p style="font-size:16px;color:#333">Bonne nouvelle !</p>
    <p style="color:#555">Votre réservation a été <strong style="color:#198754">acceptée</strong> pour le trajet :</p>
    ${ligne(depart, destination)}
    <p style="color:#555">📅 Départ prévu : <strong>${dateHeure}</strong></p>
    ${bouton("Voir mes réservations", appUrl + "/passager/mes-reservations")}
  `));
}

export function emailReservationRefusee({ to, depart, destination, appUrl }) {
  return sendEmail(to, "❌ Réservation refusée — CampusRide", base(`
    <p style="font-size:16px;color:#333">Bonjour,</p>
    <p style="color:#555">Votre demande a été <strong style="color:#dc3545">refusée</strong> pour le trajet :</p>
    ${ligne(depart, destination)}
    <p style="color:#555">Vous pouvez chercher un autre trajet disponible.</p>
    ${bouton("Trouver un trajet", appUrl + "/passager/search")}
  `));
}

export function emailReservationAnnuleeParPassager({ to, passagerPrenom, depart, destination, appUrl }) {
  return sendEmail(to, "⚠️ Réservation annulée — CampusRide", base(`
    <p style="font-size:16px;color:#333">Bonjour,</p>
    <p style="color:#555"><strong>${passagerPrenom}</strong> a annulé sa réservation pour votre trajet :</p>
    ${ligne(depart, destination)}
    ${bouton("Voir mes trajets", appUrl + "/conducteur/mes-trajets")}
  `));
}

export function emailTrajetDemarre({ to, depart, destination, appUrl }) {
  return sendEmail(to, "🚗 Votre trajet a démarré — CampusRide", base(`
    <p style="font-size:16px;color:#333">C'est parti !</p>
    <p style="color:#555">Votre conducteur a démarré le trajet :</p>
    ${ligne(depart, destination)}
    ${bouton("Suivre le trajet", appUrl + "/passager/mes-reservations")}
  `));
}

export function emailTrajetTermine({ to, depart, destination, appUrl }) {
  return sendEmail(to, "🏁 Trajet terminé — CampusRide", base(`
    <p style="font-size:16px;color:#333">Trajet terminé !</p>
    <p style="color:#555">Votre trajet est maintenant terminé :</p>
    ${ligne(depart, destination)}
    <p style="color:#555">N'oubliez pas de laisser une évaluation à votre conducteur.</p>
    ${bouton("Évaluer le conducteur", appUrl + "/passager/mes-reservations")}
  `));
}

export function emailTrajetAnnuleConducteur({ to, depart, destination, appUrl }) {
  return sendEmail(to, "❌ Trajet annulé — CampusRide", base(`
    <p style="font-size:16px;color:#333">Bonjour,</p>
    <p style="color:#555">Le conducteur a <strong style="color:#dc3545">annulé</strong> le trajet :</p>
    ${ligne(depart, destination)}
    <p style="color:#555">Vous pouvez rechercher un autre trajet disponible.</p>
    ${bouton("Trouver un trajet", appUrl + "/passager/search")}
  `));
}
