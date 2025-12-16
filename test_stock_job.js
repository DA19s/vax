require("dotenv").config();
const { checkStockExpirations } = require("./src/jobs/stockExpirationJob");

console.log("🧪 Test manuel de la vérification des stocks expirés...\n");
console.log(`Date actuelle: ${new Date().toISOString()}\n`);

checkStockExpirations()
  .then((result) => {
    console.log("\n✅ Résultat final:", JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur:", error);
    console.error(error.stack);
    process.exit(1);
  });


