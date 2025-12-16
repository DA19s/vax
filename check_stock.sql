-- Vérifier les lots qui expirent le 18/12/2025
SELECT 
  id,
  "vaccineId",
  "ownerType",
  "ownerId",
  "remainingQuantity",
  expiration,
  status
FROM "StockLot"
WHERE expiration::date = '2025-12-18'
  AND status = 'VALID'
  AND "remainingQuantity" > 0;

-- Vérifier les notifications déjà envoyées
SELECT 
  sen.id,
  sen."stockLotId",
  sen."userId",
  sen."notificationType",
  sen."daysBeforeExpiration",
  sen."notifiedAt",
  u.email,
  sl.expiration as "lotExpiration"
FROM "StockExpirationNotification" sen
JOIN "StockLot" sl ON sen."stockLotId" = sl.id
JOIN "User" u ON sen."userId" = u.id
WHERE sl.expiration::date = '2025-12-18'
ORDER BY sen."notifiedAt" DESC;



