const app = require("./app");
const prisma = require("./config/prismaClient");
const { initSocket } = require("./socket");

const port = process.env.PORT || 5050;

let server;

const startServer = async () => {
  try {
    // Créer le dossier uploads s'il n'existe pas
    const fs = require("fs");
    const path = require("path");
    const uploadDir = path.join(__dirname, "../uploads/campaigns");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Uploads directory created");
    }

    await prisma.$connect();
    console.log("Database connected");

    server = app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });

    // Initialiser Socket.io
    initSocket(server);
    console.log("Socket.io initialized");
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

const shutDown = async () => {
  console.log("Shutting down server...");
  await prisma.$disconnect();
  if (typeof prisma.$pool?.end === "function") {
    await prisma.$pool.end();
  }
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);

startServer();

