  const getSystemSettings = (_req, res) => {
    res.json({
      appName: "VaxCare",
      appSubtitle: "Plateforme de gestion de vaccination",
      logoUrl: "/logo.png",
    });
  };

  module.exports = { getSystemSettings };