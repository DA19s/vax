# Comparaison des Tests Unitaires et d'Intégration

## Vue d'ensemble

**Total contrôleurs**: 21
**Total tests unitaires**: 21 ✅
**Total tests d'intégration**: 25
**Tests d'intégration manquants**: 1 ❌

## Mapping Contrôleurs → Tests

| Contrôleur | Test Unitaire | Test d'Intégration | Statut |
|------------|---------------|-------------------|--------|
| adviceController | ✅ adviceController.test.js | ✅ advice.test.js | ✅ |
| authController | ✅ authController.test.js | ✅ auth.test.js | ✅ |
| campaignController | ✅ campaignController.test.js | ✅ campaign.test.js | ✅ |
| childrenController | ✅ childrenController.test.js | ✅ children.crud.test.js<br>✅ children.parents.test.js<br>✅ children.activation.test.js<br>✅ children.vaccinations.test.js | ✅ |
| communeController | ✅ communeController.test.js | ✅ commune.test.js | ✅ |
| dashboardController | ✅ dashboardController.test.js | ✅ dashboard.test.js | ✅ |
| districtController | ✅ districtController.test.js | ✅ district.test.js | ✅ |
| eventLogController | ✅ eventLogController.test.js | ✅ eventLog.test.js | ✅ |
| healthCenterController | ✅ healthCenterController.test.js | ✅ healthCenter.test.js | ✅ |
| healthController | ✅ healthController.test.js | ✅ health.test.js | ✅ |
| mobileController | ✅ mobileController.test.js | ✅ mobile.test.js | ✅ |
| notificationController | ✅ notificationController.test.js | ✅ notifications.test.js | ✅ |
| regionController | ✅ regionController.test.js | ✅ region.test.js<br>✅ regional.test.js | ✅ |
| reportController | ✅ reportController.test.js | ✅ reports.test.js | ✅ |
| stockController | ✅ stockController.test.js | ✅ stock.test.js | ✅ |
| superadminController | ✅ superadminController.test.js | ✅ superadmin.test.js | ✅ |
| systemSettingsController | ✅ systemSettingsController.test.js | ❌ **MANQUANT** | ❌ |
| userController | ✅ userController.test.js | ✅ users.test.js<br>✅ user.db.test.js | ✅ |
| vaccinationProofController | ✅ vaccinationProofController.test.js | ✅ children.vaccinationProofs.test.js | ✅ |
| vaccineController | ✅ vaccineController.test.js | ✅ vaccine.test.js | ✅ |
| vaccineRequestController | ✅ vaccineRequestController.test.js | ✅ vaccineRequests.test.js | ✅ |

## Tests d'Intégration MANQUANTS

### ❌ systemSettings.test.js

**Contrôleur**: `systemSettingsController.js`  
**Route**: `/api/systemSettings`  
**Fichier de route**: `src/routes/systemSettings.js`

#### Fonctionnalités à tester :

1. **GET /api/systemSettings**
   - Retourne les paramètres système par défaut si aucun paramètre n'existe en base
   - Retourne les paramètres système depuis la base de données s'ils existent
   - Structure de réponse correcte (appName, appSubtitle, logoUrl)
   - Gestion des erreurs (retourne les valeurs par défaut en cas d'erreur)
   - Vérification que appName utilise "Imunia" par défaut si null ou vide

#### Routes à tester :
- `GET /api/systemSettings` - Récupération des paramètres système

#### Scénarios de test suggérés :
1. ✅ Retourne les valeurs par défaut quand aucun paramètre n'existe
2. ✅ Retourne les paramètres depuis la base de données quand ils existent
3. ✅ Utilise "Imunia" comme appName par défaut si null ou vide
4. ✅ Retourne les valeurs par défaut en cas d'erreur de base de données
5. ✅ Structure de réponse correcte avec appName, appSubtitle, logoUrl

## Résumé

**Tests d'intégration manquants**: 1

### Test à créer :
1. **systemSettings.test.js** - Tests d'intégration pour les paramètres système (`/api/systemSettings`)

### Notes :
- Le contrôleur `systemSettingsController` a un test unitaire mais pas de test d'intégration
- La route `/api/systemSettings` est simple (un seul endpoint GET)
- Pas d'authentification requise pour cette route (selon le code actuel)
