-- Rendre le champ responsable optionnel dans la table Children
ALTER TABLE "Children" ALTER COLUMN "responsable" DROP NOT NULL;
