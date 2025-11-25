const nodemailer = require("nodemailer");

if (process.env.NODE_ENV !== "production") {
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_PASS défini ? ", process.env.SMTP_PASS ? "oui" : "non");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendInvitationEmail = async ({
  email,
  token,
  role,
  region,
  healthCenter,
  district,
  user,
}) => {
  let roleDescription;

  switch (role) {
    case "AGENT":
      roleDescription = `en tant qu’<b>Agent de santé</b> du centre <b>${healthCenter || "inconnu"}</b>`;
      break;
    case "REGIONAL":
      roleDescription = `en tant qu’<b>Administrateur régional</b> de <b>${region || "inconnue"}</b>`;
      break;
    case "DISTRICT":
      roleDescription = `en tant qu’<b>Administrateur de district</b> du district <b>${district || "inconnu"}</b>`;
      break;
    case "NATIONAL":
      roleDescription = `en tant qu’<b>Administrateur national</b>`;
      break;
    default:
      roleDescription = `en tant qu’<b>Utilisateur</b>`;
  }

  console.log(process.env.FRONTEND_URL);
  

const url = `${process.env.FRONTEND_URL}/activate?id=${user.id}&token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#2c7be5;">Bienvenue sur VacxCare 🎉</h2>
      <p>Bonjour,</p>
      <p>Vous avez été invité à rejoindre la plateforme VacxCare ${roleDescription}.</p>
      <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
      <p style="text-align:center; margin:20px 0;">
        <a href="${url}" style="background:#2c7be5; color:#fff; padding:12px 24px; text-decoration:none; border-radius:5px; font-size:16px;">
          Activer mon compte
        </a>
      </p>
      <p style="font-size:12px; color:#888;">
        🔒 Ce lien est valable <b>24 heures</b>. Si vous n’êtes pas à l’origine de cette invitation, ignorez ce message.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"VacxCare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Invitation à rejoindre VacxCare",
      html,
    });
    console.log("Email d'invitation envoyé :", info.response);
  } catch (error) {
    console.error("Erreur envoi invitation:", error.message);
  }
};

const sendPasswordResetEmail = async ({ email, resetLink }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#2c7be5;">Réinitialisation de mot de passe</h2>
      <p>Bonjour,</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
      <p style="text-align:center; margin:20px 0;">
        <a href="${resetLink}" style="background:#2c7be5; color:#fff; padding:12px 24px; text-decoration:none; border-radius:5px; font-size:16px;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p style="font-size:12px; color:#888;">
        Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"VacxCare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Réinitialisation de mot de passe",
      html,
    });
    console.log("Email reset envoyé :", info.response);
  } catch (error) {
    console.error("Erreur envoi reset:", error.message);
  }
};

const sendTwoFactorCode = async ({ email, code }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#2c7be5;">Code de vérification</h2>
      <p>Bonjour,</p>
      <p>Voici votre code de vérification à 2 facteurs :</p>
      <p style="font-size:24px; font-weight:bold; letter-spacing:4px;">${code}</p>
      <p style="font-size:12px; color:#888;">Ce code expire dans 5 minutes.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"VacxCare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Votre code de vérification",
      html,
    });
    console.log("Email 2FA envoyé :", info.response);
  } catch (error) {
    console.error("Erreur envoi 2FA:", error.message);
  }
};

const sendInvitationParentEmail = async ({
  email,
  code,
  firstName,
  lastName,
  healthCenter,
}) => {
  let roleDescription;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#2c7be5;">Bienvenue sur VacxCare 🎉</h2>
      <p>Bonjour chers parents,</p>
      <p>Votre enfant: ${firstName} ${lastName} a été enregistré .</p>
      <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
      <p style="text-align:center; margin:20px 0;">
        <a href="${url}" style="background:#2c7be5; color:#fff; padding:12px 24px; text-decoration:none; border-radius:5px; font-size:16px;">
          Activer mon compte
        </a>
      </p>
      <p style="font-size:12px; color:#888;">
        🔒 Ce lien est valable <b>24 heures</b>. Si vous n’êtes pas à l’origine de cette invitation, ignorez ce message.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"VacxCare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Invitation à rejoindre VacxCare",
      html,
    });
    console.log("Email d'invitation envoyé :", info.response);
  } catch (error) {
    console.error("Erreur envoi invitation:", error.message);
  }
};

module.exports = {
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendTwoFactorCode,
};