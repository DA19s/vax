# Tests Manquants pour le Backend

## 📋 Résumé des tests manquants par contrôleur

### 1. **vaccineController.js** ❌
Fonctions exportées mais **NON testées** :
- ❌ `updateVaccineCalendar` - Mise à jour d'un calendrier vaccinal
- ❌ `deleteVaccineCalendar` - Suppression d'un calendrier vaccinal
- ❌ `downloadVaccineCalendarPdf` - Téléchargement du PDF du calendrier
- ❌ `listScheduledVaccines` - Liste des vaccins programmés
- ❌ `missVaccine` - Marquer un vaccin comme manqué

### 2. **stockController.js** ❌
Fonctions exportées mais **NON testées** :
- ❌ `createStockDISTRICT` - Création de stock district
- ❌ `createStockHEALTHCENTER` - Création de stock centre de santé
- ❌ `addStockDISTRICT` - Ajout de stock district
- ❌ `addStockHEALTHCENTER` - Ajout de stock centre de santé
- ❌ `reduceStockDISTRICT` - Réduction de stock district
- ❌ `reduceStockHEALTHCENTER` - Réduction de stock centre de santé
- ❌ `reduceStockNATIONAL` - Réduction de stock national
- ❌ `reduceStockREGIONAL` - Réduction de stock régional
- ❌ `updateStockDISTRICT` - Mise à jour de stock district
- ❌ `updateStockHEALTHCENTER` - Mise à jour de stock centre de santé
- ❌ `updateStockREGIONAL` - Mise à jour de stock régional
- ❌ `listRegionalLots` - Liste des lots régionaux
- ❌ `listDistrictLots` - Liste des lots de district
- ❌ `listHealthCenterLots` - Liste des lots de centre de santé
- ❌ `getStockREGIONAL` - Récupération du stock régional
- ❌ `getStockDISTRICT` - Récupération du stock district
- ❌ `getStockHEALTHCENTER` - Récupération du stock centre de santé
- ❌ `deleteStockREGIONAL` - Suppression de stock régional
- ❌ `deleteStockDISTRICT` - Suppression de stock district
- ❌ `deleteStockHEALTHCENTER` - Suppression de stock centre de santé
- ❌ `getRegionalStockStats` - Statistiques du stock régional
- ❌ `getDistrictStockStats` - Statistiques du stock district
- ❌ `getHealthCenterStockStats` - Statistiques du stock centre de santé
- ❌ `getHealthCenterReservations` - Réservations du centre de santé

### 3. **userController.js** ❌
Fonctions exportées mais **NON testées** :
- ❌ `getHealthCenterAgents` - Liste des agents d'un centre de santé

### 4. **vaccinationProofController.js** ❌ (AUCUN TEST)
**Toutes les fonctions** sont non testées :
- ❌ `uploadVaccinationProofs` - Upload de preuves de vaccination (mobile)
- ❌ `uploadProofFromBackoffice` - Upload de preuve depuis le backoffice
- ❌ `getVaccinationProofs` - Récupération des preuves de vaccination
- ❌ `getProofFileBase64` - Récupération d'une preuve en base64
- ❌ `getProofFile` - Récupération d'un fichier de preuve
- ❌ `deleteProof` - Suppression d'une preuve

### 5. **healthController.js** ❌ (AUCUN TEST)
**Toutes les fonctions** sont non testées :
- ❌ `check` - Vérification de santé de l'API

### 6. **systemSettingsController.js** ❌ (AUCUN TEST)
**Toutes les fonctions** sont non testées :
- ❌ `getSystemSettings` - Récupération des paramètres système

### 7. **mobileController.js** ⚠️
Fonctions exportées mais **NON testées** :
- ❌ `getCalendar` - Récupération du calendrier (déjà testé mais vérifier la couverture)

## 📊 Statistiques

- **Contrôleurs sans tests** : 3 (vaccinationProofController, healthController, systemSettingsController)
- **Fonctions non testées dans stockController** : ~24 fonctions
- **Fonctions non testées dans vaccineController** : 5 fonctions
- **Fonctions non testées dans userController** : 1 fonction

## 🎯 Priorités recommandées

### Priorité HAUTE 🔴
1. **vaccinationProofController** - Gestion des preuves de vaccination (sécurité importante)
2. **stockController** - Fonctions de réduction et transfert de stock (opérations critiques)
3. **vaccineController** - `missVaccine`, `listScheduledVaccines` (fonctions importantes)

### Priorité MOYENNE 🟡
4. **vaccineController** - `updateVaccineCalendar`, `deleteVaccineCalendar`, `downloadVaccineCalendarPdf`
5. **userController** - `getHealthCenterAgents`
6. **healthController** - `check` (simple mais important pour monitoring)

### Priorité BASSE 🟢
7. **systemSettingsController** - `getSystemSettings` (fonction simple, peu de logique)
8. **stockController** - Fonctions de listing et statistiques (lecture seule)

