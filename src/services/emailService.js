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
      <h2 style="color:#2c7be5;">Bienvenue sur Imunia 🎉</h2>
      <p>Bonjour,</p>
      <p>Vous avez été invité à rejoindre la plateforme Imunia ${roleDescription}.</p>
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
      from: `"Imunia" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Invitation à rejoindre Imunia",
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
      from: `"Imunia" <${process.env.SMTP_USER}>`,
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
      from: `"Imunia" <${process.env.SMTP_USER}>`,
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
      <h2 style="color:#2c7be5;">Bienvenue sur Imunia 🎉</h2>
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
      from: `"Imunia" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Invitation à rejoindre Imunia",
      html,
    });
    console.log("Email d'invitation envoyé :", info.response);
  } catch (error) {
    console.error("Erreur envoi invitation:", error.message);
  }
};

const sendVaccineRequestEmail = async ({
  agentEmail,
  agentName,
  childName,
  vaccineName,
  dose,
  healthCenter,
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#2c7be5;">Nouvelle demande de vaccination</h2>
      <p>Bonjour ${agentName || "Agent"},</p>
      <p>Une nouvelle demande de vaccination a été effectuée :</p>
      <div style="background:#f5f5f5; padding:15px; border-radius:5px; margin:20px 0;">
        <p><strong>Enfant :</strong> ${childName}</p>
        <p><strong>Vaccin :</strong> ${vaccineName}</p>
        <p><strong>Dose :</strong> ${dose}</p>
        <p><strong>Centre de santé :</strong> ${healthCenter || "Non spécifié"}</p>
      </div>
      <p>Veuillez vous connecter à la plateforme pour programmer le rendez-vous.</p>
      <p style="text-align:center; margin:20px 0;">
        <a href="${process.env.FRONTEND_URL}/dashboard/rendezvous" style="background:#2c7be5; color:#fff; padding:12px 24px; text-decoration:none; border-radius:5px; font-size:16px;">
          Voir les demandes
        </a>
      </p>
      <p style="font-size:12px; color:#888;">
        Ceci est un email automatique, merci de ne pas y répondre.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Imunia" <${process.env.SMTP_USER}>`,
      to: agentEmail,
      subject: `Nouvelle demande de vaccination - ${vaccineName}`,
      html,
    });
    console.log("Email de demande de vaccin envoyé :", info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erreur envoi email demande vaccin:", error.message);
    return { success: false, error: error.message };
  }
};

const sendStockTransferNotificationEmail = async ({
  emails,
  vaccineName,
  quantity,
  regionName,
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#2c7be5;">Nouvel envoi de stock</h2>
      <p>Bonjour,</p>
      <p>Un envoi de stock vous a été effectué depuis le niveau national :</p>
      <div style="background:#f5f5f5; padding:15px; border-radius:5px; margin:20px 0;">
        <p><strong>Vaccin :</strong> ${vaccineName}</p>
        <p><strong>Quantité :</strong> ${quantity} doses</p>
        <p><strong>Région :</strong> ${regionName || "Non spécifiée"}</p>
      </div>
      <p>Veuillez vous connecter à la plateforme pour confirmer la réception du stock une fois que vous l'aurez reçu physiquement.</p>
      <p style="text-align:center; margin:20px 0;">
        <a href="${process.env.FRONTEND_URL}/dashboard/stocks" style="background:#2c7be5; color:#fff; padding:12px 24px; text-decoration:none; border-radius:5px; font-size:16px;">
          Voir les envois en attente
        </a>
      </p>
      <p style="font-size:12px; color:#888;">
        Ceci est un email automatique, merci de ne pas y répondre.
      </p>
    </div>
  `;

  const results = [];
  for (const email of emails) {
    try {
      const info = await transporter.sendMail({
        from: `"Imunia" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Nouvel envoi de stock - ${vaccineName}`,
        html,
      });
      console.log(`Email d'envoi de stock envoyé à ${email}:`, info.response);
      results.push({ email, success: true, messageId: info.messageId });
    } catch (error) {
      console.error(`Erreur envoi email à ${email}:`, error.message);
      results.push({ email, success: false, error: error.message });
    }
  }

  return results;
};

module.exports = {
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendVaccineRequestEmail,
  sendTwoFactorCode,
  sendStockTransferNotificationEmail,
};