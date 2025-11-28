-- Script pour identifier et corriger les doublons de téléphone par rôle

-- 1. Identifier les doublons
SELECT phone, role, COUNT(*) as count
FROM "User"
GROUP BY phone, role
HAVING COUNT(*) > 1
ORDER BY count DESC, phone, role;

-- 2. Voir les utilisateurs concernés (remplacez '03 38 20 46 34' par le numéro trouvé)
SELECT id, "firstName", "lastName", email, phone, role, "isActive", "createdAt"
FROM "User"
WHERE phone = '03 38 20 46 34' AND role = 'AGENT'
ORDER BY "createdAt" DESC;

-- 3. Option A : Supprimer les doublons (garder le plus récent, supprimer les autres)
-- ATTENTION : Modifiez les IDs selon vos résultats de la requête 2
-- DELETE FROM "User" WHERE id IN ('id1', 'id2', ...);

-- 3. Option B : Modifier les numéros des doublons pour les rendre uniques
-- Par exemple, ajouter un suffixe ou modifier légèrement le numéro
-- UPDATE "User" 
-- SET phone = phone || '-2'
-- WHERE id = 'id_du_doublon_a_modifier';

-- 4. Après nettoyage, vérifier qu'il n'y a plus de doublons
SELECT phone, role, COUNT(*) as count
FROM "User"
GROUP BY phone, role
HAVING COUNT(*) > 1;

