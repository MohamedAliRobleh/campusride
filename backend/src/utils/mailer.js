const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_SENDER_EMAIL || "campusride@lacitec.on.ca";
const FROM_NAME = "CampusRide";

async function sendMail({ to, subject, html }) {
  if (!BREVO_API_KEY) {
    console.warn("[mailer] BREVO_API_KEY manquant, email non envoyé");
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
      console.error("[mailer] Brevo erreur:", res.status, body);
    } else {
      console.log(`[mailer] Email envoyé à ${to} (${subject})`);
    }
  } catch (err) {
    console.error("[mailer] Erreur envoi:", err.message);
  }
}

export async function sendSignalementGraveEmail({ motif, cible_prenom, cible_nom, cible_email, signaleur_email, description }) {
  const adminEmail = process.env.ADMIN_EMAIL || "campusride@lacitec.on.ca";
  return sendMail({
    to: adminEmail,
    subject: "🚨 CampusRide — Signalement GRAVE reçu",
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:560px">
        <div style="background:#dc3545;padding:16px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;color:#fff;font-size:1.2rem">🚨 Signalement de niveau GRAVE</h2>
        </div>
        <div style="border:1px solid #f5c6cb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
          <p><strong>Motif :</strong> ${motif}</p>
          ${description ? `<p><strong>Description :</strong> ${description}</p>` : ""}
          <hr style="border-color:#f5c6cb"/>
          <p><strong>Cible signalée :</strong> ${cible_prenom} ${cible_nom} (${cible_email})</p>
          <p><strong>Signalé par :</strong> ${signaleur_email}</p>
          <hr style="border-color:#f5c6cb"/>
          <p style="font-size:0.9rem;color:#7a0000">
            Une suspension préventive a été appliquée automatiquement sur le compte cible.
            Veuillez vous connecter au tableau de bord administrateur pour examiner ce signalement.
          </p>
          <a href="https://campusride.vercel.app/admin" style="display:inline-block;padding:10px 18px;background:#dc3545;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px">
            Accéder au tableau de bord admin
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendResetPasswordEmail(to, resetLink) {
  return sendMail({
    to,
    subject: "🔑 Réinitialisation de votre mot de passe — CampusRide",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0">
        <div style="background:linear-gradient(90deg,#198754,#20c374);padding:20px 24px">
          <span style="color:#fff;font-size:18px;font-weight:bold">🚗 CampusRide</span>
        </div>
        <div style="padding:24px">
          <p style="font-size:16px;color:#333">Bonjour,</p>
          <p style="color:#555">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${resetLink}" style="background-color:#198754;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color:#888;font-size:13px">Ce lien expire dans <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
        </div>
        <div style="padding:14px 24px;background:#f0f0f0;font-size:12px;color:#888;text-align:center">
          Collège La Cité · Covoiturage étudiant · Ne pas répondre à cet email
        </div>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to, prenom) {
  const appUrl = process.env.APP_URL || "https://campusride-delta.vercel.app";
  return sendMail({
    to,
    subject: "🎉 Bienvenue sur CampusRide !",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0">
        <div style="background:linear-gradient(90deg,#198754,#20c374);padding:20px 24px">
          <span style="color:#fff;font-size:18px;font-weight:bold">🚗 CampusRide</span>
        </div>
        <div style="padding:24px">
          <p style="font-size:16px;color:#333">Bonjour <strong>${prenom}</strong> ! 👋</p>
          <p style="color:#555">Bienvenue sur <strong>CampusRide</strong>, le covoiturage étudiant du Collège La Cité.</p>
          <p style="color:#555">Vous pouvez maintenant :</p>
          <ul style="color:#555;line-height:2">
            <li>🔍 Rechercher et réserver des trajets</li>
            <li>🚗 Publier vos propres trajets en tant que conducteur</li>
            <li>🔔 Recevoir des notifications en temps réel</li>
          </ul>
          <div style="text-align:center;margin:24px 0">
            <a href="${appUrl}" style="background:linear-gradient(135deg,#198754,#20c374);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
              Accéder à CampusRide
            </a>
          </div>
        </div>
        <div style="padding:14px 24px;background:#f0f0f0;font-size:12px;color:#888;text-align:center">
          Collège La Cité · Covoiturage étudiant · Ne pas répondre à cet email
        </div>
      </div>
    `,
  });
}
