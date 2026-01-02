# Modifications Nécessaires dans les Tests Unitaires

## 📋 Résumé Exécutif

Suite aux modifications récentes du backend, plusieurs tests unitaires doivent être **ajoutés** ou **modifiés** pour maintenir une couverture complète.

---

## 🔴 PRIORITÉ HAUTE - Nouvelles Fonctionnalités à Tester

### 1. **authController.test.js** - Fonction `refreshToken` ❌ MANQUANTE

**Nouvelle fonction ajoutée :**
- `refreshToken(req, res, next)` - Rafraîchit le token d'accès avec le refresh token

**Tests à ajouter :**
```javascript
describe('refreshToken()', () => {
  it('devrait retourner 400 si refreshToken manquant', async () => {
    // Test: req.body.refreshToken est undefined/null
    // Attendu: 400 avec message "Refresh token requis"
  });

  it('devrait retourner 401 si refreshToken invalide', async () => {
    // Test: tokenService.verifyRefreshToken lève une erreur
    // Attendu: 401 avec message "Refresh token invalide ou expiré"
  });

  it('devrait retourner 401 si utilisateur non trouvé', async () => {
    // Test: prisma.user.findUnique retourne null
    // Attendu: 401 avec message "Utilisateur non trouvé ou inactif"
  });

  it('devrait retourner 401 si utilisateur inactif', async () => {
    // Test: user.isActive === false
    // Attendu: 401 avec message "Utilisateur non trouvé ou inactif"
  });

  it('devrait retourner nouveaux tokens si refreshToken valide', async () => {
    // Test: refreshToken valide, utilisateur actif
    // Attendu: 200 avec { accessToken, refreshToken }
    // Vérifier que tokenService.signAccessToken et signRefreshToken sont appelés
    // Vérifier que le payload contient sub, role, agentLevel
  });
});
```

**Mocks à ajouter :**
- `tokenService.verifyRefreshToken` (déjà mocké mais pas utilisé)

---

### 2. **stockController.test.js** - Nouvelles Fonctions ❌ MANQUANTES

**Nouvelles fonctions ajoutées :**
- `reduceLotREGIONAL(req, res, next)` - Réduit un lot spécifique au niveau régional
- `reduceLotDISTRICT(req, res, next)` - Réduit un lot spécifique au niveau district

**Tests à ajouter :**
```javascript
describe('reduceLotREGIONAL()', () => {
  it('devrait retourner 403 si pas REGIONAL ou SUPERADMIN', async () => {
    // Test: req.user.role !== "REGIONAL" && !== "SUPERADMIN"
    // Attendu: 403
  });

  it('devrait retourner 404 si lot non trouvé', async () => {
    // Test: prisma.stockLot.findUnique retourne null
    // Attendu: 404
  });

  it('devrait réduire le lot et mettre à jour le stock', async () => {
    // Test: Lot trouvé, quantité valide
    // Attendu: 200, lot.remainingQuantity mis à jour, stock.totalQuantity mis à jour
  });
});

describe('reduceLotDISTRICT()', () => {
  // Mêmes tests que reduceLotREGIONAL mais pour DISTRICT
});
```

**Modifications à apporter aux tests existants :**

#### `addStockREGIONAL()` - Logique SUPERADMIN
```javascript
it('devrait permettre à SUPERADMIN d\'ajouter directement sans prélever du national', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration fournie
  // Attendu: Création directe d'un nouveau lot, pas de prélevement du national
  // Vérifier que expiration est requise pour SUPERADMIN
});
```

#### `addStockDISTRICT()` - Logique SUPERADMIN
```javascript
it('devrait permettre à SUPERADMIN d\'ajouter directement sans prélever du régional', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration fournie
  // Attendu: Création directe d'un nouveau lot, pas de prélevement du régional
});
```

#### `addStockHEALTHCENTER()` - Logique SUPERADMIN
```javascript
it('devrait permettre à SUPERADMIN d\'ajouter directement sans prélever du district', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration fournie
  // Attendu: Création directe d'un nouveau lot, pas de prélevement du district
});

it('devrait retourner 400 si SUPERADMIN ajoute sans expiration', async () => {
  // Test: req.user.role === "SUPERADMIN", expiration manquante
  // Attendu: 400 avec message "expiration est requise pour ajouter du stock"
});
```

#### `createStockHEALTHCENTER()` - Logique SUPERADMIN
```javascript
it('devrait permettre à SUPERADMIN de créer un stock sans districtId requis', async () => {
  // Test: req.user.role === "SUPERADMIN", healthCenterId fourni
  // Attendu: Création réussie même si req.user.districtId est null
});
```

---

### 3. **vaccineController.test.js** - Modifications Existantes ⚠️ À MODIFIER

**Modifications à apporter :**

#### `ScheduleVaccine()` - Warning non-bloquant pour genre
```javascript
it('devrait retourner genderWarning si vaccin "autre" ne correspond pas au genre', async () => {
  // Test: vaccineCalendarId === null, genre ne correspond pas
  // Attendu: 201 avec { genderWarning: "Ce vaccin n'est pas adapté..." }
  // Vérifier que le rendez-vous est créé malgré le warning
});

it('devrait bloquer si vaccin du calendrier ne correspond pas au genre', async () => {
  // Test: vaccineCalendarId !== null, genre ne correspond pas
  // Attendu: 400 avec erreur bloquante
});
```

#### `ScheduleVaccine()` - Notifications agents
```javascript
it('devrait notifier les agents du centre lors de la création', async () => {
  // Test: Création réussie
  // Attendu: notifyHealthCenterAgents appelé avec les bons paramètres
  // Vérifier: healthCenterId, title, message, type, excludeUserId
});
```

#### `updateScheduledVaccine()` - Notifications agents
```javascript
it('devrait notifier les agents du centre lors de la mise à jour', async () => {
  // Test: Mise à jour réussie
  // Attendu: notifyHealthCenterAgents appelé
});
```

#### `cancelScheduledVaccine()` - Notifications agents
```javascript
it('devrait notifier les agents du centre lors de l\'annulation', async () => {
  // Test: Annulation réussie
  // Attendu: notifyHealthCenterAgents appelé
});
```

#### `completeVaccine()` - Notifications agents
```javascript
it('devrait notifier les agents du centre lors de la complétion', async () => {
  // Test: Complétion réussie
  // Attendu: notifyHealthCenterAgents appelé
});
```

#### `listScheduledVaccines()` - Champ `administeredBy`
```javascript
it('devrait retourner administeredBy au lieu de planner', async () => {
  // Test: Rendez-vous avec administeredById
  // Attendu: administeredBy contient les infos de l'agent qui administrera
  // Vérifier que administeredBy est inclus dans le include Prisma
  // Vérifier que le mapping retourne entry.administeredBy et non entry.planner
});
```

**Mocks à ajouter :**
- `notificationService.notifyHealthCenterAgents` (déjà mocké mais vérifier les appels)

---

### 4. **childrenController.test.js** - Notifications Agents ⚠️ À MODIFIER

**Modifications à apporter :**

#### `createChildren()` - Notifications agents
```javascript
it('devrait notifier les agents du centre lors de la création', async () => {
  // Test: Création réussie
  // Attendu: notifyHealthCenterAgents appelé avec:
  //   - healthCenterId: child.healthCenterId
  //   - title: "Nouvel enfant enregistré"
  //   - message: Contient le nom de l'enfant
  //   - type: "CHILD_CREATED"
  //   - excludeUserId: req.user.id
});
```

#### `updateChildren()` - Notifications agents
```javascript
it('devrait notifier les agents du centre lors de la mise à jour', async () => {
  // Test: Mise à jour réussie
  // Attendu: notifyHealthCenterAgents appelé
});
```

#### `deleteChild()` - Notifications agents
```javascript
it('devrait notifier les agents du centre lors de la suppression', async () => {
  // Test: Suppression réussie
  // Attendu: notifyHealthCenterAgents appelé
});
```

**Mocks à vérifier :**
- `notificationService.notifyHealthCenterAgents` doit être mocké

---

### 5. **vaccineRequestController.test.js** - Notifications Agents ⚠️ À MODIFIER

**Modifications à apporter :**

#### `createVaccineRequest()` - Notifications agents
```javascript
it('devrait notifier les agents du centre lors d\'une demande parent', async () => {
  // Test: Création de demande réussie
  // Attendu: notifyHealthCenterAgents appelé avec:
  //   - healthCenterId: child.healthCenterId
  //   - title: "Nouvelle demande de vaccination"
  //   - message: Contient le nom de l'enfant et le vaccin
  //   - type: "VACCINE_REQUEST"
});
```

#### `cancelVaccineRequest()` - Suppression et notification parent
```javascript
it('devrait supprimer la demande et notifier le parent si annulée par agent', async () => {
  // Test: Annulation par agent (req.user.role === "AGENT")
  // Attendu: 
  //   - prisma.vaccineRequest.delete appelé (pas update)
  //   - Notification envoyée au parent avec message de refus
});
```

---

## 🟡 PRIORITÉ MOYENNE - Modifications de Schéma

### 6. **childrenController.test.js** - Suppression `emailParent` ⚠️ À MODIFIER

**Modifications à apporter :**

#### `createChildren()` - Suppression emailParent
```javascript
// Supprimer tous les tests qui utilisent emailParent
// Vérifier que emailParent n'est plus dans les données créées
it('ne devrait pas inclure emailParent dans les données créées', async () => {
  // Test: Création d'enfant
  // Attendu: emailParent absent de prisma.children.create
});
```

#### `getParentsOverview()` - Suppression emailParent
```javascript
it('ne devrait pas retourner parentEmail dans la réponse', async () => {
  // Test: Liste des parents
  // Attendu: parentEmail absent de la réponse
});
```

---

### 7. **vaccineController.test.js** - Champ `administeredById` ✅ DÉJÀ TESTÉ

**Statut :** Les tests pour `administeredById` existent déjà dans `ScheduleVaccine()`.

**Vérifications à faire :**
- ✅ Test avec `administeredById` fourni
- ✅ Test avec `administeredById` non fourni (null)
- ✅ Test avec `administeredById` invalide
- ✅ Test avec `administeredById` utilisateur inactif
- ✅ Test avec `administeredById` agent d'un autre centre

**À ajouter si manquant :**
- Test que `administeredById` est bien sauvegardé dans la base
- Test que `administeredById` est utilisé lors de `completeVaccine` si présent

---

## 🟢 PRIORITÉ BASSE - Améliorations

### 8. **notificationService.test.js** - Nouvelle Fonction ❌ À CRÉER

**Nouvelle fonction à tester :**
- `notifyHealthCenterAgents({ healthCenterId, title, message, type, excludeUserId })`

**Fichier de test à créer :**
```javascript
// tests/unit/notificationService.test.js

describe('notifyHealthCenterAgents()', () => {
  it('devrait retourner tableau vide si healthCenterId manquant', async () => {
    // Test: healthCenterId === null/undefined
    // Attendu: []
  });

  it('devrait récupérer les agents actifs du centre', async () => {
    // Test: healthCenterId valide
    // Attendu: prisma.user.findMany appelé avec les bons filtres
  });

  it('devrait exclure excludeUserId de la liste', async () => {
    // Test: excludeUserId fourni
    // Attendu: Agent exclu de la liste
  });

  it('devrait créer des notifications pour tous les agents', async () => {
    // Test: 3 agents trouvés
    // Attendu: createNotificationsForUsers appelé avec 3 userIds
  });

  it('devrait retourner tableau vide si aucun agent trouvé', async () => {
    // Test: Aucun agent actif
    // Attendu: []
  });
});
```

---

## 📊 Résumé des Modifications

### Tests à Ajouter (Nouvelles Fonctionnalités)
1. ✅ `authController.test.js` - `refreshToken()` (5 tests)
2. ✅ `stockController.test.js` - `reduceLotREGIONAL()` (3-4 tests)
3. ✅ `stockController.test.js` - `reduceLotDISTRICT()` (3-4 tests)
4. ✅ `notificationService.test.js` - Nouveau fichier (5-6 tests)

### Tests à Modifier (Fonctionnalités Existantes)
1. ⚠️ `stockController.test.js` - Logique SUPERADMIN dans `addStock*` (3-4 tests)
2. ⚠️ `stockController.test.js` - `createStockHEALTHCENTER` pour SUPERADMIN (1 test)
3. ⚠️ `vaccineController.test.js` - Warning genre non-bloquant (2 tests)
4. ⚠️ `vaccineController.test.js` - Notifications agents (4 tests)
5. ⚠️ `vaccineController.test.js` - `listScheduledVaccines` champ `administeredBy` (1 test)
6. ⚠️ `childrenController.test.js` - Notifications agents (3 tests)
7. ⚠️ `childrenController.test.js` - Suppression `emailParent` (2-3 tests)
8. ⚠️ `vaccineRequestController.test.js` - Notifications agents (1 test)
9. ⚠️ `vaccineRequestController.test.js` - Suppression demande (1 test)

### Total Estimé
- **Nouveaux tests :** ~20-25 tests
- **Tests modifiés :** ~15-18 tests
- **Nouveau fichier :** 1 (`notificationService.test.js`)

---

## 🔍 Points de Vérification

### Mocks à Vérifier/Ajouter
- [ ] `tokenService.verifyRefreshToken` (déjà mocké, à utiliser)
- [ ] `notificationService.notifyHealthCenterAgents` (vérifier présence dans tous les tests concernés)
- [ ] `prisma.stockLot.findUnique` pour `reduceLotREGIONAL/DISTRICT`
- [ ] `prisma.user.findMany` pour récupérer les agents

### Schéma Prisma
- [ ] Vérifier que `administeredById` est bien dans les mocks de `childVaccineScheduled`
- [ ] Vérifier que `administeredBy` relation est mockée dans `listScheduledVaccines`
- [ ] Supprimer `emailParent` des mocks de `children`

---

## ✅ Checklist de Validation

Avant de considérer les tests comme complets :

- [ ] Tous les nouveaux endpoints sont testés
- [ ] Toutes les nouvelles logiques (SUPERADMIN, notifications) sont testées
- [ ] Les suppressions (emailParent) sont reflétées dans les tests
- [ ] Les mocks sont à jour avec le code actuel
- [ ] Les tests existants passent toujours
- [ ] Les nouveaux tests passent
- [ ] La couverture de code est maintenue ou améliorée

---

## 📝 Notes Importantes

1. **Notifications agents :** Tous les appels à `notifyHealthCenterAgents` doivent être vérifiés mais ne doivent **pas** faire échouer les tests si la notification échoue (c'est une opération non-bloquante).

2. **SUPERADMIN :** La logique SUPERADMIN permet de contourner certaines validations. Les tests doivent vérifier que :
   - Les validations normales s'appliquent toujours aux autres rôles
   - SUPERADMIN peut faire des opérations directes sans workflow de transfert
   - `expiration` est requise pour SUPERADMIN lors d'ajouts directs

3. **administeredById :** Ce champ est optionnel. Les tests doivent vérifier :
   - Comportement avec `administeredById` fourni
   - Comportement avec `administeredById` null (utilise `plannerId` lors de complétion)
   - Validation que `administeredById` est un agent valide si fourni

4. **Warning genre :** Le warning pour les vaccins "autre" ne doit **pas** bloquer la création, contrairement aux vaccins du calendrier.
