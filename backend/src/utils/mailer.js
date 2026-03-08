import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

export async function sendSignalementGraveEmail({ motif, cible_prenom, cible_nom, cible_email, signaleur_email, description }) {
  const adminEmail = process.env.ADMIN_EMAIL || "campusride@lacitec.on.ca";
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
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
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "CampusRide - Réinitialisation du mot de passe",
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.5">
        <h2>Réinitialisation du mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 14px;background:#198754;color:#fff;text-decoration:none;border-radius:6px">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p>Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>
      </div>
    `,
  });
}
