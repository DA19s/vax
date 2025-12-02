SELECT email, COUNT(*) as count FROM "User" WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;


