-- Vérifier les lots qui expirent le 18/12/2025
SELECT 
  id,
  "vaccineId",
  "ownerType",
  "ownerId",
  "remainingQuantity",
  expiration,
  status,
  "createdAt"
FROM "StockLot"
WHERE expiration::date = '2025-12-18'
  AND status = 'VALID'
  AND "remainingQuantity" > 0
ORDER BY expiration;

-- Vérifier aussi les lots qui expirent autour de cette date (pour debug)
SELECT 
  id,
  "vaccineId",
  "ownerType",
  "ownerId",
  "remainingQuantity",
  expiration,
  status,
  expiration - NOW() as "daysUntilExpiration"
FROM "StockLot"
WHERE expiration::date BETWEEN '2025-12-16' AND '2025-12-20'
  AND status = 'VALID'
  AND "remainingQuantity" > 0
ORDER BY expiration;





