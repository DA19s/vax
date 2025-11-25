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

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);

app.use(errorHandler);

module.exports = app;

