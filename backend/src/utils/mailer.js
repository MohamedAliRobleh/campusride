import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

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
