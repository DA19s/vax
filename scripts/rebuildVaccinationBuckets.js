/* eslint-disable no-console */
const { rebuildAllVaccinationBuckets } = require("../src/services/vaccineBucketService");

const run = async () => {
  try {
    console.log("Recalcule des vaccins à faire / en retard...");
    await rebuildAllVaccinationBuckets();
    console.log("✅ Recalcul terminé.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur pendant le recalcul:", error);
    process.exit(1);
  }
};

run();




