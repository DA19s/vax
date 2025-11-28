# Vax API Boilerplate

## Connexion à la base de données

- Le client Prisma est centralisé dans `src/config/prismaClient.js`. Il utilise l'adapter officiel `@prisma/adapter-pg` et un pool `pg` initialisé avec `process.env.DATABASE_URL`.
- L'application Express expose automatiquement le client Prisma :
  - `req.prisma` est disponible dans toutes les routes et middlewares via `src/middleware/prisma.js`.
  - `app.locals.prisma` permet d'accéder au client depuis les scripts ou utilitaires qui ont besoin d'interagir avec l'application.
- En cas de besoin direct, vous pouvez également importer le client : `const prisma = require("../config/prismaClient");`

## Arrêt propre

Le serveur Express (`src/server.js`) ferme le client Prisma et le pool Postgres lorsque le processus reçoit `SIGINT` ou `SIGTERM`.

## Commandes utiles

- `npm run dev` : démarrer l'API en mode développement (nodemon).
- `npm run prisma:generate` : régénérer le client Prisma après modification du schéma.
- `npm run prisma:migrate -- --name <migration>` : créer/appliquer une migration.










