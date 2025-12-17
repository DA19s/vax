-- Vérifier les notifications envoyées pour le lot qui expire le 18/12/2025
SELECT 
  sen.id,
  sen."stockLotId",
  sen."userId",
  sen."notificationType",
  sen."daysBeforeExpiration",
  sen."notifiedAt",
  u.email,
  u."firstName",
  u."lastName",
  sl.expiration as "lotExpiration"
FROM "StockExpirationNotification" sen
JOIN "StockLot" sl ON sen."stockLotId" = sl.id
JOIN "User" u ON sen."userId" = u.id
WHERE sl.id = '1e3c039e-a40b-44cd-87e1-8366b67a966d'
ORDER BY sen."notifiedAt" DESC;





