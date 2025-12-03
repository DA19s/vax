-- Vérifier les index sur User
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'User';

-- Vérifier les utilisateurs avec l'email spécifique
SELECT id, email, role, "createdAt" FROM "User" WHERE email = 'daibra2005@gmail.com';

-- Compter tous les emails
SELECT email, COUNT(*) as count FROM "User" WHERE email IS NOT NULL GROUP BY email ORDER BY count DESC;




