const prisma = require("../config/prismaClient");

const getSystemSettings = async (_req, res) => {
  try {
    let settings = await prisma.appSettings.findFirst();

    // Si aucun paramètre n'existe, utiliser les valeurs par défaut
    if (!settings) {
      return res.json({
        appName: "Imunia",
        appSubtitle: "Plateforme de gestion de vaccination",
        logoUrl: "/logo.png",
      });
    }

    res.json({
      appName: settings.appName || "Imunia",
      appSubtitle: "Plateforme de gestion de vaccination",
      logoUrl: settings.logoPath || "/logo.png",
    });
  } catch (error) {
    // En cas d'erreur, retourner les valeurs par défaut
    console.error("Erreur récupération paramètres:", error);
    res.json({
      appName: "Imunia",
      appSubtitle: "Plateforme de gestion de vaccination",
      logoUrl: "/logo.png",
    });
  }
};

module.exports = { getSystemSettings };