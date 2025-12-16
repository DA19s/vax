require("dotenv").config();
const { checkAppointmentNotifications } = require("./src/jobs/appointmentNotificationJob");

console.log("🧪 Test manuel de la vérification des rendez-vous...\n");
console.log(`Date actuelle: ${new Date().toISOString()}\n`);

checkAppointmentNotifications()
  .then((result) => {
    console.log("\n✅ Résultat final:", JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur:", error);
    console.error(error.stack);
    process.exit(1);
  });


