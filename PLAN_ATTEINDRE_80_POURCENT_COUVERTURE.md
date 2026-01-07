# Plan pour Atteindre 80% de Couverture de Tests

## 📊 État Actuel
- **Couverture estimée**: ~61%
- **Objectif**: 80%
- **Écart**: ~19% à combler

---

## 🎯 Plan d'Action par Priorité

### Phase 1 : CRITIQUE (Impact élevé, ~10% de couverture)

#### 1.1 Tests pour les Jobs (0% → 90% cible)
**Fichiers à tester**:
- `src/jobs/stockExpirationJob.js`
- `src/jobs/appointmentNotificationJob.js`
- `src/jobs/scheduler.js`

**Tests à créer**:
```javascript
// tests/integration/stockExpirationJob.test.js (existe déjà mais à compléter)
// tests/integration/appointmentNotificationJob.test.js (existe déjà mais à compléter)
// tests/unit/scheduler.test.js (NOUVEAU)
```

**Cas de test prioritaires**:
- ✅ Job détecte les lots expirés correctement
- ✅ Job envoie les notifications aux bons agents
- ✅ Job évite les doublons de notifications
- ✅ Job gère les erreurs d'envoi d'email
- ✅ Job calcule correctement les jours restants
- ✅ Scheduler démarre/arrête les jobs correctement

**Impact estimé**: +5% de couverture globale

---

#### 1.2 Tests unitaires pour stockLotService.js (~10% → 85% cible)
**Fichier**: `src/services/stockLotService.js` (1100 lignes)

**Tests à créer/améliorer**:
```javascript
// tests/integration/stockLotService.test.js (existe mais à compléter)
```

**Fonctions critiques à tester**:
- ✅ `createLot()` - Création avec validation
- ✅ `modifyStockQuantity()` - Modification atomique
- ✅ `consumeLots()` - Consommation pour vaccinations
- ✅ `restoreOrRecreateLotForRejectedTransfer()` - Restauration après refus
- ✅ `transferLot()` - Transfert entre niveaux
- ✅ `splitLot()` - Division de lots
- ✅ `mergeLots()` - Fusion de lots
- ✅ `updateLotStatus()` - Mise à jour statut
- ✅ Gestion des transactions Prisma
- ✅ Normalisation des ownerId (NATIONAL = null)

**Cas limites à tester**:
- Quantités négatives
- Dates d'expiration invalides
- Lots supprimés pendant transfert
- Stocks supprimés pendant transfert
- Transactions échouées

**Impact estimé**: +4% de couverture globale

---

#### 1.3 Tests pour les services d'expiration (~0% → 85% cible)
**Fichiers**:
- `src/services/stockExpirationService.js`
- `src/services/appointmentNotificationService.js`

**Tests à créer**:
```javascript
// tests/unit/stockExpirationService.test.js (NOUVEAU)
// tests/unit/appointmentNotificationService.test.js (NOUVEAU)
```

**Fonctions à tester**:
- ✅ `findAllValidLots()` / `findAllValidAppointments()`
- ✅ `calculateDaysUntilExpiration()`
- ✅ `findNextThreshold()`
- ✅ `getConcernedAgents()`
- ✅ `hasNotificationBeenSent()`
- ✅ `recordNotificationSent()`
- ✅ Gestion des seuils multiples (7, 14, 30 jours)

**Impact estimé**: +3% de couverture globale

---

### Phase 2 : IMPORTANTE (Impact moyen, ~6% de couverture)

#### 2.1 Tests pour le middleware auth.js (~20% → 90% cible)
**Fichier**: `src/middleware/auth.js`

**Tests à créer/améliorer**:
```javascript
// tests/integration/authMiddleware.test.js (existe mais à compléter)
```

**Chemins à tester**:
- ✅ Token manquant → 401
- ✅ Token invalide → 401
- ✅ Token expiré → 401
- ✅ Utilisateur inactif → 401
- ✅ Utilisateur supprimé → 401
- ✅ Token valide → next()
- ✅ requireMobileAuth (tous les chemins)
- ✅ requireRole (tous les rôles)
- ✅ requireAgentLevel (tous les niveaux)

**Impact estimé**: +2% de couverture globale

---

#### 2.2 Tests pour emailService.js (~0% → 80% cible)
**Fichier**: `src/services/emailService.js`

**Tests à créer**:
```javascript
// tests/unit/emailService.test.js (NOUVEAU)
```

**Fonctions à tester**:
- ✅ `sendStockExpirationAlert()` - Mock SMTP
- ✅ `sendAppointmentReminder()` - Mock SMTP
- ✅ Gestion des erreurs SMTP
- ✅ Formatage des emails

**Impact estimé**: +1% de couverture globale

---

#### 2.3 Compléter les tests des contrôleurs (~40% → 75% cible)

**stockController.js** - Fonctions manquantes:
```javascript
// tests/unit/stockController.test.js (existe mais à compléter)
```
- ✅ `createStockDISTRICT`, `createStockHEALTHCENTER`
- ✅ `addStockDISTRICT`, `addStockHEALTHCENTER`
- ✅ `reduceStockNATIONAL`, `reduceStockREGIONAL`, `reduceStockDISTRICT`, `reduceStockHEALTHCENTER`
- ✅ `updateStockREGIONAL`, `updateStockDISTRICT`, `updateStockHEALTHCENTER`
- ✅ `deleteStockREGIONAL`, `deleteStockDISTRICT`, `deleteStockHEALTHCENTER`
- ✅ `listRegionalLots`, `listDistrictLots`, `listHealthCenterLots`
- ✅ `getStockREGIONAL`, `getStockDISTRICT`, `getStockHEALTHCENTER`
- ✅ `getRegionalStockStats`, `getDistrictStockStats`, `getHealthCenterStockStats`
- ✅ `getHealthCenterReservations`

**vaccineController.js** - Fonctions manquantes:
```javascript
// tests/unit/vaccineController.test.js (existe mais à compléter)
```
- ✅ `updateVaccineCalendar`
- ✅ `deleteVaccineCalendar`
- ✅ `downloadVaccineCalendarPdf`
- ✅ `listScheduledVaccines`
- ✅ `missVaccine`
- ✅ `getVaccineImpact` (nouvelle fonction)

**Impact estimé**: +3% de couverture globale

---

### Phase 3 : AMÉLIORATION (Impact faible, ~3% de couverture)

#### 3.1 Tests pour les utilitaires (~5% → 80% cible)

**errorHandler.js**:
```javascript
// tests/unit/errorHandler.js (NOUVEAU)
```
- ✅ Tous les codes Prisma (P2000-P2025)
- ✅ Erreurs JWT
- ✅ Erreurs de validation
- ✅ Erreurs 404, 500

**whatsapp.js**:
```javascript
// tests/unit/whatsapp.test.js (NOUVEAU)
```
- ✅ Envoi de messages WhatsApp
- ✅ Gestion des erreurs Twilio

**permissions.js**:
```javascript
// tests/unit/permissions.test.js (NOUVEAU)
```
- ✅ Vérification des permissions par rôle
- ✅ Vérification des permissions par niveau

**Impact estimé**: +2% de couverture globale

---

#### 3.2 Tests pour systemSettingsController.js (0% → 80% cible)
**Fichier**: `src/controllers/systemSettingsController.js`

**Tests à créer**:
```javascript
// tests/integration/systemSettings.test.js (existe mais vide)
```

**Fonctions à tester**:
- ✅ `getSystemSettings`
- ✅ `updateSystemSettings` (si existe)

**Impact estimé**: +1% de couverture globale

---

## 📝 Configuration Jest pour 80% Minimum

Ajouter dans `jest.config.js`:

```javascript
module.exports = {
  // ... configuration existante ...
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Seuils par répertoire
    './src/jobs/': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    './src/services/': {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80,
    },
    './src/middleware/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/controllers/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
```

---

## 🚀 Ordre d'Exécution Recommandé

1. **Semaine 1**: Phase 1.1 (Jobs) + Phase 1.2 (stockLotService)
2. **Semaine 2**: Phase 1.3 (Services expiration) + Phase 2.1 (Middleware)
3. **Semaine 3**: Phase 2.2 (emailService) + Phase 2.3 (Contrôleurs)
4. **Semaine 4**: Phase 3 (Utilitaires) + Configuration + Vérification finale

---

## 📊 Métriques de Succès

| Zone | Actuel | Cible | Écart |
|------|--------|-------|-------|
| Jobs | ~0% | 90% | +90% |
| Services Critiques | ~10% | 85% | +75% |
| Middlewares | ~20% | 90% | +70% |
| Contrôleurs | ~40% | 75% | +35% |
| Utilitaires | ~5% | 80% | +75% |
| **GLOBAL** | **~61%** | **80%** | **+19%** |

---

## ✅ Checklist de Vérification

- [ ] Tous les jobs ont des tests d'intégration
- [ ] stockLotService.js a >85% de couverture
- [ ] Tous les services critiques ont des tests unitaires
- [ ] Le middleware auth.js a >90% de couverture
- [ ] Tous les contrôleurs ont >75% de couverture
- [ ] Les utilitaires ont des tests
- [ ] coverageThreshold est configuré dans jest.config.js
- [ ] La couverture globale atteint 80%
- [ ] Les tests passent tous en CI/CD

---

## 🔧 Commandes Utiles

```bash
# Générer le rapport de couverture
npm run test:coverage

# Voir la couverture par fichier
npm run test:coverage | grep -E "(src/|Statements|Branches|Functions|Lines)"

# Tester uniquement les jobs
npm test -- --testPathPattern="jobs"

# Tester uniquement les services
npm test -- --testPathPattern="services" --coverage --collectCoverageFrom="src/services/**/*.js"

# Vérifier la couverture d'un fichier spécifique
npm test -- --coverage --collectCoverageFrom="src/services/stockLotService.js"
```

---

## 📚 Ressources

- [Documentation Jest Coverage](https://jestjs.io/docs/configuration#coveragethreshold-object)
- [Best Practices Testing Node.js](https://github.com/goldbergyoni/nodebestpractices#testing-and-code-quality)
- Fichiers d'analyse existants:
  - `ANALYSE_ZONES_CRITIQUES_NON_COUVERTES.md`
  - `TESTS_MANQUANTS.md`
  - `COMPARAISON_TESTS.md`
