# Analyse des Zones Critiques Non Couvertes par les Tests

## Vue d'ensemble

**Couverture globale estimée**: ~61% (avec tests unitaires + intégration)  
**Zones critiques identifiées**: Plusieurs domaines nécessitent une attention particulière

---

## 🔴 Zones CRITIQUES Non Couvertes

### 1. **Jobs et Tâches Planifiées** ❌

#### `src/jobs/stockExpirationJob.js`
**Criticité**: 🔴 TRÈS HAUTE  
**Raison**: Gestion des stocks expirés, notifications critiques

**Fonctionnalités non testées**:
- ✅ `checkStockExpirations()` - Job principal de vérification
- ✅ Gestion des seuils d'expiration multiples
- ✅ Groupement des notifications par agent
- ✅ Vérification des notifications déjà envoyées
- ✅ Gestion des erreurs lors de l'envoi d'emails
- ✅ Calcul des jours restants avant expiration
- ✅ Logique de fenêtre de 24h avant seuil

**Risques**:
- Stocks expirés non détectés
- Notifications non envoyées
- Emails dupliqués
- Perte de données critiques

#### `src/jobs/appointmentNotificationJob.js`
**Criticité**: 🔴 TRÈS HAUTE  
**Raison**: Notifications de rendez-vous de vaccination

**Fonctionnalités non testées**:
- ✅ `checkAppointmentNotifications()` - Job principal
- ✅ Détection des rendez-vous à notifier
- ✅ Envoi de notifications multiples (email, SMS, WhatsApp)
- ✅ Gestion des cas "déjà envoyé"
- ✅ Gestion des cas "pas de contact"
- ✅ Gestion des erreurs d'envoi

**Risques**:
- Rendez-vous manqués
- Parents non notifiés
- Vaccinations ratées

#### `src/jobs/scheduler.js`
**Criticité**: 🟠 HAUTE  
**Raison**: Planification des jobs

**Fonctionnalités non testées**:
- ✅ Configuration et démarrage des jobs
- ✅ Gestion des erreurs de jobs
- ✅ Arrêt propre des jobs

---

### 2. **Services Métier Critiques** ❌

#### `src/services/stockLotService.js` (876 lignes)
**Criticité**: 🔴 TRÈS HAUTE  
**Raison**: Logique métier complexe de gestion des lots de stock

**Fonctionnalités non testées**:
- ✅ `createLot()` - Création de lots avec validation
- ✅ `transferLot()` - Transfert de lots entre niveaux
- ✅ `consumeLot()` - Consommation de lots pour vaccinations
- ✅ `splitLot()` - Division de lots
- ✅ `mergeLots()` - Fusion de lots
- ✅ `updateLotStatus()` - Mise à jour du statut
- ✅ Gestion des quantités négatives
- ✅ Gestion des dates d'expiration invalides
- ✅ Gestion des transactions Prisma
- ✅ Normalisation des ownerId
- ✅ Calcul des statuts (VALID, EXPIRED, PENDING)

**Risques**:
- Stocks incorrects
- Perte de vaccins
- Transferts mal gérés
- Lots expirés non détectés

#### `src/services/stockExpirationService.js` (305 lignes)
**Criticité**: 🔴 TRÈS HAUTE  
**Raison**: Logique de détection d'expiration

**Fonctionnalités non testées**:
- ✅ `findAllValidLots()` - Récupération des lots valides
- ✅ `calculateDaysUntilExpiration()` - Calcul des jours restants
- ✅ `findNextThreshold()` - Trouver le prochain seuil
- ✅ `getConcernedAgents()` - Récupération des agents concernés
- ✅ `hasNotificationBeenSent()` - Vérification des notifications
- ✅ `recordNotificationSent()` - Enregistrement des notifications
- ✅ Gestion des seuils multiples (7, 14, 30 jours)

**Risques**:
- Notifications manquées
- Notifications dupliquées
- Agents non notifiés

#### `src/services/appointmentNotificationService.js` (488 lignes)
**Criticité**: 🔴 TRÈS HAUTE  
**Raison**: Gestion des notifications de rendez-vous

**Fonctionnalités non testées**:
- ✅ `findAllValidAppointments()` - Récupération des rendez-vous
- ✅ `findAppointmentsToNotify()` - Détection des rendez-vous à notifier
- ✅ `sendAppointmentNotification()` - Envoi des notifications
- ✅ Gestion des canaux multiples (email, SMS, WhatsApp)
- ✅ Gestion des cas "déjà envoyé"
- ✅ Gestion des cas "pas de contact"

**Risques**:
- Rendez-vous manqués
- Parents non notifiés
- Vaccinations ratées

#### `src/services/tokenService.js` (64 lignes)
**Criticité**: 🟠 HAUTE  
**Raison**: Sécurité, authentification

**Fonctionnalités non testées**:
- ✅ `signAccessToken()` - Génération de tokens
- ✅ `verifyAccessToken()` - Vérification de tokens
- ✅ `signRefreshToken()` - Génération de refresh tokens
- ✅ `verifyRefreshToken()` - Vérification de refresh tokens
- ✅ `generatePasswordResetToken()` - Génération de tokens de réinitialisation
- ✅ `verifyPasswordResetToken()` - Vérification de tokens de réinitialisation
- ✅ Gestion des tokens expirés
- ✅ Gestion des tokens invalides
- ✅ Gestion des secrets manquants

**Risques**:
- Failles de sécurité
- Tokens compromis
- Accès non autorisés

#### `src/services/emailService.js` (1017 lignes)
**Criticité**: 🟠 HAUTE  
**Raison**: Communication avec les utilisateurs

**Fonctionnalités non testées**:
- ✅ Configuration SMTP
- ✅ Envoi d'emails d'invitation
- ✅ Envoi de codes de vérification
- ✅ Envoi de codes de réinitialisation
- ✅ Envoi d'alertes de stock
- ✅ Envoi de notifications de rendez-vous
- ✅ Gestion des erreurs SMTP
- ✅ Gestion des templates d'emails

**Risques**:
- Emails non envoyés
- Emails mal formatés
- Perte de communication

#### `src/services/whatsapp.js` (191 lignes)
**Criticité**: 🟠 HAUTE  
**Raison**: Communication WhatsApp

**Fonctionnalités non testées**:
- ✅ Envoi de messages WhatsApp
- ✅ Activation de compte
- ✅ Demandes de photos
- ✅ Gestion des erreurs API WhatsApp

**Risques**:
- Messages non envoyés
- Communication perdue

---

### 3. **Middlewares Critiques** ❌

#### `src/middleware/auth.js` (135 lignes)
**Criticité**: 🔴 TRÈS HAUTE  
**Raison**: Sécurité, authentification

**Fonctionnalités non testées**:
- ✅ `requireAuth()` - Authentification standard
  - Tokens expirés
  - Tokens invalides
  - Utilisateurs inactifs
  - Utilisateurs non trouvés
- ✅ `requireMobileAuth()` - Authentification mobile
  - Vérification du type de token (parent)
  - Vérification de l'accès à l'enfant
  - Vérification du numéro de téléphone
  - Enfants non trouvés
- ✅ `optionalAuth()` - Authentification optionnelle
  - Token dans le header
  - Token dans les paramètres de requête
  - Gestion des erreurs

**Risques**:
- Accès non autorisés
- Fuites de données
- Failles de sécurité

#### `src/middleware/errorHandler.js` (145 lignes)
**Criticité**: 🟠 HAUTE  
**Raison**: Gestion centralisée des erreurs

**Fonctionnalités non testées**:
- ✅ Gestion des erreurs Prisma P2002 (contrainte unique)
  - Messages spécifiques par modèle
  - Messages spécifiques par champ
  - Messages génériques
- ✅ Gestion des erreurs Prisma P2003 (clé étrangère)
- ✅ Gestion des erreurs Prisma P2025 (non trouvé)
- ✅ Gestion des erreurs Prisma P2014 (relation)
- ✅ Gestion des autres erreurs Prisma
- ✅ Gestion des erreurs serveur (500+)
- ✅ Mode développement vs production
- ✅ Format de réponse d'erreur

**Risques**:
- Messages d'erreur peu clairs
- Fuites d'informations sensibles
- Erreurs mal gérées

---

### 4. **Contrôleurs avec Logique Métier Complexe** ⚠️

#### `src/controllers/stockController.js` (4934 lignes)
**Criticité**: 🔴 TRÈS HAUTE  
**Raison**: Gestion complète des stocks

**Fonctionnalités potentiellement non couvertes**:
- ⚠️ Transferts de stock complexes
- ⚠️ Gestion des réservations
- ⚠️ Gestion des lots multiples
- ⚠️ Validations de quantité
- ⚠️ Gestion des erreurs de transaction
- ⚠️ Cas limites de transfert

#### `src/controllers/vaccineController.js` (2840 lignes)
**Criticité**: 🟠 HAUTE  
**Raison**: Gestion des vaccins et calendriers

**Fonctionnalités potentiellement non couvertes**:
- ⚠️ Calculs de calendrier vaccinal
- ⚠️ Gestion des doses multiples
- ⚠️ Validations de dates
- ⚠️ Gestion des âges

#### `src/controllers/childrenController.js` (1704 lignes)
**Criticité**: 🟠 HAUTE  
**Raison**: Gestion des enfants

**Fonctionnalités potentiellement non couvertes**:
- ⚠️ Calculs de statut vaccinal
- ⚠️ Gestion des vaccinations multiples
- ⚠️ Validations complexes

---

### 5. **Services Utilitaires** ❌

#### `src/utils/vaccineDose.js` (97 lignes)
**Criticité**: 🟠 HAUTE  
**Raison**: Calculs de doses vaccinales

**Fonctionnalités non testées**:
- ✅ Calcul des doses requises
- ✅ Gestion des âges
- ✅ Gestion des intervalles entre doses
- ✅ Validations de dates

#### `src/utils/permissions.js` (41 lignes)
**Criticité**: 🟠 HAUTE  
**Raison**: Gestion des permissions

**Fonctionnalités non testées**:
- ✅ Vérification des permissions par rôle
- ✅ Vérification des permissions par niveau
- ✅ Gestion des hiérarchies

---

## 📊 Résumé par Criticité

### 🔴 TRÈS HAUTE Criticité (À tester en PRIORITÉ)
1. **Jobs** (stockExpirationJob, appointmentNotificationJob)
2. **stockLotService.js** - Logique métier complexe
3. **stockExpirationService.js** - Détection d'expiration
4. **appointmentNotificationService.js** - Notifications rendez-vous
5. **middleware/auth.js** - Sécurité

### 🟠 HAUTE Criticité (Important)
1. **tokenService.js** - Sécurité
2. **emailService.js** - Communication
3. **whatsapp.js** - Communication
4. **errorHandler.js** - Gestion d'erreurs
5. **vaccineDose.js** - Calculs critiques
6. **permissions.js** - Sécurité

### 🟡 MOYENNE Criticité
1. **stockController.js** - Cas limites complexes
2. **vaccineController.js** - Calculs complexes
3. **childrenController.js** - Validations complexes

---

## 🎯 Recommandations Prioritaires

### Phase 1 - CRITIQUE (À faire immédiatement)
1. ✅ Tests d'intégration pour les **Jobs** (stockExpirationJob, appointmentNotificationJob)
2. ✅ Tests unitaires pour **stockLotService.js** (fonctions critiques)
3. ✅ Tests unitaires pour **tokenService.js** (sécurité)
4. ✅ Tests d'intégration pour **middleware/auth.js** (tous les chemins d'erreur)

### Phase 2 - IMPORTANTE
1. ✅ Tests unitaires pour **stockExpirationService.js**
2. ✅ Tests unitaires pour **appointmentNotificationService.js**
3. ✅ Tests unitaires pour **errorHandler.js** (tous les codes Prisma)
4. ✅ Tests pour **emailService.js** (mocks SMTP)

### Phase 3 - AMÉLIORATION
1. ✅ Tests pour **whatsapp.js**
2. ✅ Tests pour **vaccineDose.js**
3. ✅ Tests pour **permissions.js**
4. ✅ Tests des cas limites dans les contrôleurs complexes

---

## 📈 Métriques de Couverture Cibles

| Zone | Couverture Actuelle | Couverture Cible |
|------|---------------------|------------------|
| Jobs | ~0% | 90% |
| Services Critiques | ~10% | 85% |
| Middlewares | ~20% | 90% |
| Contrôleurs | ~40% | 75% |
| Utilitaires | ~5% | 80% |
| **GLOBAL** | **~61%** | **80%** |

---

## ⚠️ Risques Identifiés

1. **Stocks expirés non détectés** → Perte de vaccins
2. **Rendez-vous non notifiés** → Vaccinations ratées
3. **Failles de sécurité** → Accès non autorisés
4. **Erreurs mal gérées** → Expérience utilisateur dégradée
5. **Transferts de stock incorrects** → Inventaire erroné
6. **Tokens compromis** → Sécurité compromise

---

## 🔍 Comment Vérifier la Couverture Réelle

```bash
# Couverture complète (unitaires + intégration)
npm test -- --coverage --collectCoverageFrom="src/**/*.js"

# Couverture par fichier
npm test -- --coverage --collectCoverageFrom="src/**/*.js" | grep "src/"

# Couverture des services uniquement
npm test -- --coverage --collectCoverageFrom="src/services/**/*.js"

# Couverture des jobs uniquement
npm test -- --coverage --collectCoverageFrom="src/jobs/**/*.js"
```
