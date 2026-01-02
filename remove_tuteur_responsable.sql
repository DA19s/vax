-- Supprimer les colonnes tuteur et responsable de la table Children
ALTER TABLE "Children" DROP COLUMN IF EXISTS "tuteur";
ALTER TABLE "Children" DROP COLUMN IF EXISTS "responsable";
