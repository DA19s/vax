# Liste Complète des Fonctions à Tester pour SUPERADMIN

## 📋 Vue d'Ensemble

Le SUPERADMIN a des privilèges étendus dans plusieurs contrôleurs. Cette liste recense **toutes les fonctions** qui nécessitent des tests spécifiques pour le rôle SUPERADMIN.

---

## 🔴 STOCK CONTROLLER (`stockController.js`)

### 1. **`getStockNATIONAL()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut voir tous les stocks nationaux (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir tous les stocks nationaux', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, tous les stocks nationaux retournés
});
```

---

### 2. **`listNationalLots()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut lister tous les lots nationaux (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de lister tous les lots nationaux', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, tous les lots nationaux retournés
});
```

---

### 3. **`listRegionalLots()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `regionId` depuis query params (`overrideRegionId`)
- Si `overrideRegionId` fourni : filtrer par cette région
- Si pas de `overrideRegionId` : voir tous les lots régionaux

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de lister les lots d\'une région spécifique', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni
  // Attendu: 200, lots filtrés par regionId
});

it('devrait permettre à SUPERADMIN de lister tous les lots régionaux sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de req.query.regionId
  // Attendu: 200, tous les lots régionaux retournés
});
```

---

### 4. **`listDistrictLots()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `districtId` ou `regionId` depuis query params
- Priorité : `districtId` > `regionId`
- Si `districtId` fourni : filtrer par ce district
- Si `regionId` fourni (sans `districtId`) : filtrer par cette région
- Si aucun : voir tous les lots districtaux

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de lister les lots d\'un district spécifique', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.districtId fourni
  // Attendu: 200, lots filtrés par districtId
});

it('devrait permettre à SUPERADMIN de lister les lots d\'une région (via district)', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni (pas districtId)
  // Attendu: 200, lots filtrés par regionId
});

it('devrait permettre à SUPERADMIN de lister tous les lots districtaux sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de query params
  // Attendu: 200, tous les lots districtaux retournés
});
```

---

### 5. **`listHealthCenterLots()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `healthCenterId`, `districtId` ou `regionId` depuis query params
- Priorité : `healthCenterId` > `districtId` > `regionId`
- Si `healthCenterId` fourni : filtrer par ce centre
- Si `districtId` fourni (sans `healthCenterId`) : filtrer par ce district
- Si `regionId` fourni (sans les autres) : filtrer par cette région
- Si aucun : voir tous les lots des centres de santé

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de lister les lots d\'un centre spécifique', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.healthCenterId fourni
  // Attendu: 200, lots filtrés par healthCenterId
});

it('devrait permettre à SUPERADMIN de lister les lots d\'un district (via centre)', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.districtId fourni (pas healthCenterId)
  // Attendu: 200, lots filtrés par districtId
});

it('devrait permettre à SUPERADMIN de lister les lots d\'une région (via centre)', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni (pas les autres)
  // Attendu: 200, lots filtrés par regionId
});

it('devrait permettre à SUPERADMIN de lister tous les lots des centres sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de query params
  // Attendu: 200, tous les lots des centres retournés
});
```

---

### 6. **`getStockREGIONAL()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `regionId` depuis query params (`overrideRegionId`)
- Si `overrideRegionId` fourni : filtrer par cette région
- Si pas de `overrideRegionId` : voir tous les stocks régionaux

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir le stock d\'une région spécifique', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni
  // Attendu: 200, stock filtré par regionId
});

it('devrait permettre à SUPERADMIN de voir tous les stocks régionaux sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de req.query.regionId
  // Attendu: 200, tous les stocks régionaux retournés
});
```

---

### 7. **`getStockDISTRICT()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `districtId` ou `regionId` depuis query params
- Priorité : `districtId` > `regionId`
- Si `districtId` fourni : filtrer par ce district
- Si `regionId` fourni (sans `districtId`) : filtrer par cette région
- Si aucun : voir tous les stocks districtaux

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir le stock d\'un district spécifique', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.districtId fourni
  // Attendu: 200, stock filtré par districtId
});

it('devrait permettre à SUPERADMIN de voir les stocks d\'une région (via district)', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni (pas districtId)
  // Attendu: 200, stocks filtrés par regionId
});

it('devrait permettre à SUPERADMIN de voir tous les stocks districtaux sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de query params
  // Attendu: 200, tous les stocks districtaux retournés
});
```

---

### 8. **`getStockHEALTHCENTER()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `healthCenterId`, `districtId` ou `regionId` depuis query params
- Priorité : `healthCenterId` > `districtId` > `regionId`
- Si `healthCenterId` fourni : filtrer par ce centre
- Si `districtId` fourni (sans `healthCenterId`) : filtrer par ce district
- Si `regionId` fourni (sans les autres) : filtrer par cette région
- Si aucun : voir tous les stocks des centres de santé

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir le stock d\'un centre spécifique', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.healthCenterId fourni
  // Attendu: 200, stock filtré par healthCenterId
});

it('devrait permettre à SUPERADMIN de voir les stocks d\'un district (via centre)', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.districtId fourni (pas healthCenterId)
  // Attendu: 200, stocks filtrés par districtId
});

it('devrait permettre à SUPERADMIN de voir les stocks d\'une région (via centre)', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni (pas les autres)
  // Attendu: 200, stocks filtrés par regionId
});

it('devrait permettre à SUPERADMIN de voir tous les stocks des centres sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de query params
  // Attendu: 200, tous les stocks des centres retournés
});
```

---

### 9. **`createStockREGIONAL()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut créer un stock régional (même logique que NATIONAL/REGIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer un stock régional', async () => {
  // Test: req.user.role === "SUPERADMIN", vaccineId et regionId fournis
  // Attendu: 201, stock créé
});
```

---

### 10. **`createStockDISTRICT()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut créer un stock districtal (même logique que REGIONAL/DISTRICT)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer un stock districtal', async () => {
  // Test: req.user.role === "SUPERADMIN", vaccineId et districtId fournis
  // Attendu: 201, stock créé
});
```

---

### 11. **`createStockHEALTHCENTER()`** 🔴 PRIORITÉ HAUTE
**Logique SUPERADMIN :**
- SUPERADMIN peut créer un stock pour **n'importe quel centre de santé**
- `healthCenterId` doit être fourni dans le body
- Pas besoin que `req.user.districtId` existe
- Vérifie juste que le centre existe

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer un stock pour n\'importe quel centre', async () => {
  // Test: req.user.role === "SUPERADMIN", healthCenterId fourni dans body
  // Attendu: 201, stock créé même si req.user.districtId est null
});

it('devrait retourner 400 si SUPERADMIN crée sans healthCenterId', async () => {
  // Test: req.user.role === "SUPERADMIN", healthCenterId manquant
  // Attendu: 400 avec message "healthCenterId est requis pour créer un stock"
});

it('devrait retourner 404 si SUPERADMIN crée pour un centre inexistant', async () => {
  // Test: req.user.role === "SUPERADMIN", healthCenterId invalide
  // Attendu: 404
});
```

---

### 12. **`addStockNATIONAL()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut ajouter du stock national (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN d\'ajouter du stock national', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock ajouté
});
```

---

### 13. **`addStockREGIONAL()`** 🔴 PRIORITÉ HAUTE
**Logique SUPERADMIN :**
- SUPERADMIN peut ajouter directement du stock régional **sans prélever du national**
- `expiration` est **requise** pour SUPERADMIN
- Crée un nouveau lot directement au niveau régional
- Pas de création de transfert PENDING

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN d\'ajouter directement sans prélever du national', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration fournie
  // Attendu: 200, nouveau lot créé directement, pas de prélevement du national
  // Vérifier: pas de pendingTransfer créé
});

it('devrait retourner 400 si SUPERADMIN ajoute sans expiration', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration manquante
  // Attendu: 400 avec message "expiration est requise pour ajouter du stock"
});

it('devrait créer un nouveau lot VALID directement pour SUPERADMIN', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration fournie
  // Attendu: Lot créé avec status VALID, expiration utilisée
});
```

---

### 14. **`addStockDISTRICT()`** 🔴 PRIORITÉ HAUTE
**Logique SUPERADMIN :**
- SUPERADMIN peut ajouter directement du stock districtal **sans prélever du régional**
- `expiration` est **requise** pour SUPERADMIN
- Utilise le `regionId` du district automatiquement
- Crée un nouveau lot directement au niveau districtal
- Pas de création de transfert PENDING

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN d\'ajouter directement sans prélever du régional', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration fournie
  // Attendu: 200, nouveau lot créé directement, pas de prélevement du régional
  // Vérifier: pas de pendingTransfer créé
});

it('devrait retourner 400 si SUPERADMIN ajoute sans expiration', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration manquante
  // Attendu: 400 avec message "expiration est requise pour ajouter du stock"
});

it('devrait utiliser automatiquement le regionId du district pour SUPERADMIN', async () => {
  // Test: req.user.role === "SUPERADMIN", districtId fourni
  // Attendu: regionId récupéré depuis district.commune.regionId
});
```

---

### 15. **`addStockHEALTHCENTER()`** 🔴 PRIORITÉ HAUTE
**Logique SUPERADMIN :**
- SUPERADMIN peut ajouter directement du stock au centre **sans prélever du district**
- `expiration` est **requise** pour SUPERADMIN
- Utilise le `districtId` du centre automatiquement
- Crée un nouveau lot directement au niveau du centre
- Pas de création de transfert PENDING

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN d\'ajouter directement sans prélever du district', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration fournie
  // Attendu: 200, nouveau lot créé directement, pas de prélevement du district
  // Vérifier: pas de pendingTransfer créé
});

it('devrait retourner 400 si SUPERADMIN ajoute sans expiration', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration manquante
  // Attendu: 400 avec message "expiration est requise pour ajouter du stock"
});

it('devrait utiliser automatiquement le districtId du centre pour SUPERADMIN', async () => {
  // Test: req.user.role === "SUPERADMIN", healthCenterId fourni
  // Attendu: districtId récupéré depuis healthCenter.districtId
});
```

---

### 16. **`updateStockREGIONAL()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut mettre à jour un stock régional (même logique que NATIONAL/REGIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de mettre à jour un stock régional', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock mis à jour
});
```

---

### 17. **`updateStockDISTRICT()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut mettre à jour un stock districtal (même logique que REGIONAL/DISTRICT)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de mettre à jour un stock districtal', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock mis à jour
});
```

---

### 18. **`updateStockHEALTHCENTER()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut mettre à jour un stock de centre (même logique que DISTRICT/AGENT)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de mettre à jour un stock de centre', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock mis à jour
});
```

---

### 19. **`reduceLotNATIONAL()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut réduire un lot national (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de réduire un lot national', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, lot réduit
});
```

---

### 20. **`reduceLotREGIONAL()`** 🔴 PRIORITÉ HAUTE - NOUVELLE FONCTION
**Logique SUPERADMIN :**
- SUPERADMIN peut réduire n'importe quel lot régional
- Accès autorisé : `["SUPERADMIN", "NATIONAL", "REGIONAL"]`

**Tests à ajouter :**
```javascript
it('devrait permettre à SUPERADMIN de réduire un lot régional', async () => {
  // Test: req.user.role === "SUPERADMIN", lotId fourni
  // Attendu: 200, lot réduit, stock.totalQuantity mis à jour
});

it('devrait retourner 403 si pas SUPERADMIN/NATIONAL/REGIONAL', async () => {
  // Test: req.user.role === "DISTRICT" ou "AGENT"
  // Attendu: 403
});
```

---

### 21. **`reduceLotDISTRICT()`** 🔴 PRIORITÉ HAUTE - NOUVELLE FONCTION
**Logique SUPERADMIN :**
- SUPERADMIN peut réduire n'importe quel lot districtal
- Accès autorisé : `["SUPERADMIN", "REGIONAL", "DISTRICT"]`

**Tests à ajouter :**
```javascript
it('devrait permettre à SUPERADMIN de réduire un lot districtal', async () => {
  // Test: req.user.role === "SUPERADMIN", lotId fourni
  // Attendu: 200, lot réduit, stock.totalQuantity mis à jour
});

it('devrait retourner 403 si pas SUPERADMIN/REGIONAL/DISTRICT', async () => {
  // Test: req.user.role === "AGENT" ou "NATIONAL"
  // Attendu: 403
});
```

---

### 22. **`reduceLotHEALTHCENTER()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut réduire n'importe quel lot de centre
- Accès autorisé : `["SUPERADMIN", "DISTRICT", "AGENT"]`

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de réduire un lot de centre', async () => {
  // Test: req.user.role === "SUPERADMIN", lotId fourni
  // Attendu: 200, lot réduit
});
```

---

### 23. **`reduceStockREGIONAL()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut réduire un stock régional (même logique que NATIONAL/REGIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de réduire un stock régional', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock réduit
});
```

---

### 24. **`reduceStockDISTRICT()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut réduire un stock districtal (même logique que REGIONAL/DISTRICT)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de réduire un stock districtal', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock réduit
});
```

---

### 25. **`reduceStockHEALTHCENTER()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut réduire un stock de centre (même logique que DISTRICT/AGENT)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de réduire un stock de centre', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock réduit
});
```

---

### 26. **`deleteStockNATIONAL()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut supprimer un stock national (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de supprimer un stock national', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock supprimé
});
```

---

### 27. **`deleteStockREGIONAL()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut supprimer un stock régional (même logique que NATIONAL/REGIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de supprimer un stock régional', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock supprimé
});
```

---

### 28. **`deleteStockDISTRICT()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut supprimer un stock districtal (même logique que REGIONAL/DISTRICT)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de supprimer un stock districtal', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock supprimé
});
```

---

### 29. **`deleteStockHEALTHCENTER()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut supprimer un stock de centre (même logique que DISTRICT/AGENT)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de supprimer un stock de centre', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stock supprimé
});
```

---

### 30. **`getRegionalStockStats()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `regionId` depuis query params
- Si `regionId` fourni : filtrer par cette région
- Si pas de `regionId` : voir toutes les statistiques régionales

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir les stats d\'une région spécifique', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni
  // Attendu: 200, stats filtrées par regionId
});

it('devrait permettre à SUPERADMIN de voir toutes les stats régionales', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de req.query.regionId
  // Attendu: 200, toutes les stats régionales
});
```

---

### 31. **`getDistrictStockStats()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `districtId` ou `regionId` depuis query params
- Priorité : `districtId` > `regionId`
- Si `districtId` fourni : filtrer par ce district
- Si `regionId` fourni (sans `districtId`) : filtrer par cette région
- Si aucun : voir toutes les statistiques districtales

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir les stats d\'un district spécifique', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.districtId fourni
  // Attendu: 200, stats filtrées par districtId
});

it('devrait permettre à SUPERADMIN de voir les stats d\'une région (via district)', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni (pas districtId)
  // Attendu: 200, stats filtrées par regionId
});

it('devrait permettre à SUPERADMIN de voir toutes les stats districtales', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de query params
  // Attendu: 200, toutes les stats districtales
});
```

---

### 32. **`getHealthCenterStockStats()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `healthCenterId`, `districtId` ou `regionId` depuis query params
- Priorité : `healthCenterId` > `districtId` > `regionId`
- Si `healthCenterId` fourni : filtrer par ce centre
- Si `districtId` fourni (sans `healthCenterId`) : filtrer par ce district
- Si `regionId` fourni (sans les autres) : filtrer par cette région
- Si aucun : voir toutes les statistiques des centres

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir les stats d\'un centre spécifique', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.healthCenterId fourni
  // Attendu: 200, stats filtrées par healthCenterId
});

it('devrait permettre à SUPERADMIN de voir les stats d\'un district (via centre)', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.districtId fourni (pas healthCenterId)
  // Attendu: 200, stats filtrées par districtId
});

it('devrait permettre à SUPERADMIN de voir les stats d\'une région (via centre)', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni (pas les autres)
  // Attendu: 200, stats filtrées par regionId
});

it('devrait permettre à SUPERADMIN de voir toutes les stats des centres', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de query params
  // Attendu: 200, toutes les stats des centres
});
```

---

## 🟡 CHILDREN CONTROLLER (`childrenController.js`)

### 33. **`getChildren()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut appliquer des filtres optionnels depuis query params
- Filtres disponibles : `regionId`, `districtId`, `healthCenterId`
- Priorité : `healthCenterId` > `districtId` > `regionId`
- Si aucun filtre : voir tous les enfants

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de filtrer par healthCenterId', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.healthCenterId fourni
  // Attendu: 200, enfants filtrés par healthCenterId
});

it('devrait permettre à SUPERADMIN de filtrer par districtId', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.districtId fourni (pas healthCenterId)
  // Attendu: 200, enfants filtrés par districtId
});

it('devrait permettre à SUPERADMIN de filtrer par regionId', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni (pas les autres)
  // Attendu: 200, enfants filtrés par regionId
});

it('devrait permettre à SUPERADMIN de voir tous les enfants sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de query params
  // Attendu: 200, tous les enfants retournés
});
```

---

## 🟡 VACCINE CONTROLLER (`vaccineController.js`)

### 34. **`listScheduledVaccines()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut voir **tous les rendez-vous** (même logique que NATIONAL)
- Pas de filtre appliqué (`whereClause = {}`)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir tous les rendez-vous', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, tous les rendez-vous retournés (pas de filtre)
});
```

---

### 35. **`createVaccine()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut créer un vaccin (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer un vaccin', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 201, vaccin créé
});
```

---

### 36. **`updateVaccine()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut mettre à jour un vaccin (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de mettre à jour un vaccin', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, vaccin mis à jour
});
```

---

### 37. **`deleteVaccine()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut supprimer un vaccin (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de supprimer un vaccin', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, vaccin supprimé
});
```

---

### 38. **`createVaccineCalendar()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut créer un calendrier vaccinal (même logique que NATIONAL/REGIONAL/DISTRICT)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer un calendrier vaccinal', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 201, calendrier créé
});
```

---

### 39. **`listVaccineCalendars()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut lister tous les calendriers (même logique que NATIONAL/REGIONAL/DISTRICT)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de lister tous les calendriers', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, tous les calendriers retournés
});
```

---

## 🟡 REGION CONTROLLER (`regionController.js`)

### 40. **`createRegion()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut créer une région (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer une région', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 201, région créée
});
```

---

### 41. **`getRegions()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut lister toutes les régions (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de lister toutes les régions', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, toutes les régions retournées
});
```

---

### 42. **`updateRegion()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut mettre à jour une région (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de mettre à jour une région', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, région mise à jour
});
```

---

### 43. **`deleteRegion()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut supprimer une région (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de supprimer une région', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, région supprimée
});
```

---

### 44. **`getRegionDeletionSummary()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut voir le résumé de suppression d'une région (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir le résumé de suppression d\'une région', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, résumé retourné
});
```

---

## 🟡 DISTRICT CONTROLLER (`districtController.js`)

### 45. **`listDistricts()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `regionId` ou `communeId` depuis query params
- Priorité : `communeId` > `regionId`
- Si `communeId` fourni : filtrer par cette commune
- Si `regionId` fourni (sans `communeId`) : filtrer par cette région
- Si aucun : voir tous les districts

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de filtrer par communeId', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.communeId fourni
  // Attendu: 200, districts filtrés par communeId
});

it('devrait permettre à SUPERADMIN de filtrer par regionId', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni (pas communeId)
  // Attendu: 200, districts filtrés par regionId
});

it('devrait permettre à SUPERADMIN de voir tous les districts sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de query params
  // Attendu: 200, tous les districts retournés
});
```

---

### 46. **`createDistrict()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut créer un district **sans vérification de région**
- Vérifie juste que la commune existe

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer un district sans vérification de région', async () => {
  // Test: req.user.role === "SUPERADMIN", communeId fourni
  // Attendu: 201, district créé, pas de vérification de région
});
```

---

### 47. **`updateDistrict()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut mettre à jour un district **sans vérification de région**
- Vérifie juste que le district existe

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de mettre à jour un district sans vérification de région', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, district mis à jour, pas de vérification de région
});
```

---

### 48. **`deleteDistrict()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut supprimer un district **sans vérification de région**

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de supprimer un district sans vérification de région', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, district supprimé, pas de vérification de région
});
```

---

## 🟡 COMMUNE CONTROLLER (`communeController.js`)

### 49. **`listCommunes()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `regionId` depuis query params
- Si `regionId` fourni : filtrer par cette région
- Si pas de `regionId` : voir toutes les communes

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de filtrer par regionId', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.regionId fourni
  // Attendu: 200, communes filtrées par regionId
});

it('devrait permettre à SUPERADMIN de voir toutes les communes sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de req.query.regionId
  // Attendu: 200, toutes les communes retournées
});
```

---

### 50. **`createCommune()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut créer une commune
- Vérifie juste que la région existe (pas de vérification d'appartenance)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer une commune pour n\'importe quelle région', async () => {
  // Test: req.user.role === "SUPERADMIN", regionId fourni
  // Attendu: 201, commune créée, vérification que région existe seulement
});
```

---

## 🟡 HEALTH CENTER CONTROLLER (`healthCenterController.js`)

### 51. **`listHealthCenters()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `districtId` depuis query params
- Si `districtId` fourni : filtrer par ce district
- Si pas de `districtId` : voir tous les centres

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de filtrer par districtId', async () => {
  // Test: req.user.role === "SUPERADMIN", req.query.districtId fourni
  // Attendu: 200, centres filtrés par districtId
});

it('devrait permettre à SUPERADMIN de voir tous les centres sans filtre', async () => {
  // Test: req.user.role === "SUPERADMIN", pas de req.query.districtId
  // Attendu: 200, tous les centres retournés
});
```

---

### 52. **`createHealthCenter()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut accepter `districtId` depuis le body
- Pas de vérification de district (contrairement aux autres rôles)
- Vérifie juste que le centre n'existe pas déjà

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer un centre pour n\'importe quel district', async () => {
  // Test: req.user.role === "SUPERADMIN", districtId fourni dans body
  // Attendu: 201, centre créé, pas de vérification de district
});
```

---

### 53. **`updateHealthCenter()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut mettre à jour un centre **sans vérification de district**
- Vérifie juste que le centre existe

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de mettre à jour un centre sans vérification de district', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, centre mis à jour, pas de vérification de district
});
```

---

### 54. **`deleteHealthCenter()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut supprimer un centre **sans vérification de district**
- Vérifie juste que le centre existe

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de supprimer un centre sans vérification de district', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, centre supprimé, pas de vérification de district
});
```

---

### 55. **`getHealthCenterDeletionSummary()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut voir le résumé **sans vérification de district**
- Vérifie juste que le centre existe

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir le résumé sans vérification de district', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, résumé retourné, pas de vérification de district
});
```

---

## 🟡 DASHBOARD CONTROLLER (`dashboardController.js`)

### 56. **`getNationalDashboardStats()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut voir le dashboard national (même logique que NATIONAL)

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de voir le dashboard national', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, stats nationales retournées
});
```

---

## 🔴 SUPERADMIN CONTROLLER (`superadminController.js`)

### 57. **`createUser()`** 🔴 PRIORITÉ HAUTE
**Logique SUPERADMIN :**
- SUPERADMIN peut créer **tous les types d'utilisateurs** (SUPERADMIN, NATIONAL, REGIONAL, DISTRICT, AGENT)
- Pour SUPERADMIN : personne n'est supérieur
- Pour NATIONAL : seuls les SUPERADMIN sont supérieurs

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de créer un autre SUPERADMIN', async () => {
  // Test: req.user.role === "SUPERADMIN", role: "SUPERADMIN"
  // Attendu: 201, utilisateur créé
});

it('devrait permettre à SUPERADMIN de créer un NATIONAL', async () => {
  // Test: req.user.role === "SUPERADMIN", role: "NATIONAL"
  // Attendu: 201, utilisateur créé
});

it('devrait permettre à SUPERADMIN de créer un REGIONAL', async () => {
  // Test: req.user.role === "SUPERADMIN", role: "REGIONAL"
  // Attendu: 201, utilisateur créé
});

it('devrait permettre à SUPERADMIN de créer un DISTRICT', async () => {
  // Test: req.user.role === "SUPERADMIN", role: "DISTRICT"
  // Attendu: 201, utilisateur créé
});

it('devrait permettre à SUPERADMIN de créer un AGENT', async () => {
  // Test: req.user.role === "SUPERADMIN", role: "AGENT"
  // Attendu: 201, utilisateur créé
});
```

---

### 58. **`getSelf()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN a des éléments spécifiques dans la réponse
- `isSuperAdmin: true`
- Éléments spécifiques SUPERADMIN dans la réponse

**Tests à ajouter/modifier :**
```javascript
it('devrait retourner isSuperAdmin: true pour SUPERADMIN', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, isSuperAdmin: true dans la réponse
});

it('devrait retourner les éléments spécifiques SUPERADMIN', async () => {
  // Test: req.user.role === "SUPERADMIN"
  // Attendu: 200, éléments spécifiques SUPERADMIN présents
});
```

---

### 59. **`updateUser()`** ⚠️ À MODIFIER
**Logique SUPERADMIN :**
- SUPERADMIN peut mettre à jour **tous les types d'utilisateurs**
- Pour SUPERADMIN : personne n'est supérieur
- Pour NATIONAL : seuls les SUPERADMIN sont supérieurs

**Tests à ajouter/modifier :**
```javascript
it('devrait permettre à SUPERADMIN de mettre à jour n\'importe quel utilisateur', async () => {
  // Test: req.user.role === "SUPERADMIN", userId de n'importe quel rôle
  // Attendu: 200, utilisateur mis à jour
});
```

---

## 📊 Résumé par Priorité

### 🔴 PRIORITÉ HAUTE (Nouvelles fonctionnalités ou logiques critiques)
1. `createStockHEALTHCENTER()` - Création sans districtId requis
2. `addStockREGIONAL()` - Ajout direct sans prélevement, expiration requise
3. `addStockDISTRICT()` - Ajout direct sans prélevement, expiration requise
4. `addStockHEALTHCENTER()` - Ajout direct sans prélevement, expiration requise
5. `reduceLotREGIONAL()` - Nouvelle fonction
6. `reduceLotDISTRICT()` - Nouvelle fonction
7. `createUser()` (superadminController) - Création de tous les rôles

### 🟡 PRIORITÉ MOYENNE (Filtres et accès étendus)
- Toutes les fonctions `list*` avec filtres query params
- Toutes les fonctions `get*` avec filtres query params
- Toutes les fonctions `get*Stats` avec filtres query params
- Fonctions de création/mise à jour/suppression sans vérifications de hiérarchie

### 🟢 PRIORITÉ BASSE (Même logique que NATIONAL)
- Fonctions qui ont exactement la même logique que NATIONAL (juste vérifier que SUPERADMIN a accès)

---

## 📝 Total Estimé

- **Fonctions à tester :** ~59 fonctions
- **Tests à ajouter/modifier :** ~150-200 tests
- **Nouvelles fonctions :** 2 (`reduceLotREGIONAL`, `reduceLotDISTRICT`)
- **Logiques critiques :** 7 fonctions (ajout direct, création sans contraintes)

---

## ✅ Checklist de Validation

Pour chaque fonction SUPERADMIN, vérifier :
- [ ] Accès autorisé (pas de 403)
- [ ] Filtres query params fonctionnent (si applicable)
- [ ] Pas de vérifications de hiérarchie inutiles
- [ ] Logique d'ajout direct (si applicable)
- [ ] Expiration requise pour ajouts directs (si applicable)
- [ ] Création sans contraintes (si applicable)
