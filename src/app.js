require("dotenv").config();

const express = require("express");
const prisma = require("./config/prismaClient");
const routes = require("./routes");
const prismaMiddleware = require("./middleware/prisma");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.locals.prisma = prisma;

const cors = require("cors");

app.use(
     cors({
       origin: ["http://localhost:3001"],
       credentials: true,
     })
   );

app.use(express.json());
app.use(prismaMiddleware);

// Servir les fichiers statiques depuis le dossier uploads
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);

app.use(errorHandler);

module.exports = app;

