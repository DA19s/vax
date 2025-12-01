-- Appliquer manuellement la contrainte unique sur (phone, role)
-- Exécutez cette requête dans PostgreSQL

-- Vérifier d'abord qu'il n'y a plus de doublons
SELECT phone, role, COUNT(*) as count
FROM "User"
GROUP BY phone, role
HAVING COUNT(*) > 1;

-- Si aucun résultat, créer la contrainte
ALTER TABLE "User" 
ADD CONSTRAINT "User_phone_role_key" UNIQUE (phone, role);



