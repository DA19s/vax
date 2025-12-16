const { checkStockExpirations } = require("./src/jobs/stockExpirationJob");

console.log("🧪 Test manuel de la vérification des stocks expirés...\n");

checkStockExpirations()
  .then((result) => {
    console.log("\n✅ Résultat:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  });



