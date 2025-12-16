# Système de Notifications Automatiques

Ce document décrit le système de notifications automatiques pour les stocks expirés et les rendez-vous de vaccination.

## 📦 Notifications de Stock Expiré

### Fonctionnement

Le système vérifie quotidiennement (par défaut à 8h00) les lots de vaccins qui sont sur le point d'expirer et envoie des emails d'alerte aux agents concernés.

### Seuils d'expiration

Par défaut, les notifications sont envoyées :
- **30 jours** avant l'expiration
- **14 jours** avant l'expiration
- **7 jours** avant l'expiration

Ces seuils sont configurables via la variable d'environnement `STOCK_EXPIRATION_WARNING_DAYS` (ex: `"30,14,7"`).

### Agents notifiés

Les agents notifiés dépendent du type de stock :

- **HEALTHCENTER** : Tous les agents du centre de santé
- **DISTRICT** : Agents ADMIN du district + Administrateur du district
- **REGIONAL** : Administrateurs régionaux
- **NATIONAL** : Administrateurs nationaux

### Prévention des doublons

Le système enregistre chaque notification envoyée dans la table `StockExpirationNotification` pour éviter d'envoyer plusieurs fois la même alerte.

## 📅 Notifications de Rendez-vous

### Fonctionnement

Le système vérifie régulièrement (par défaut toutes les 6 heures) les rendez-vous de vaccination et envoie des notifications aux parents.

### Types de notifications

Les notifications sont envoyées selon les règles suivantes :

1. **1 semaine avant** : Si le rendez-vous est dans plus de 7 jours
2. **2 jours avant** : Si le rendez-vous est dans plus de 2 jours mais ≤ 7 jours
3. **La veille** : Si le rendez-vous est demain
4. **Le jour même** : Si le rendez-vous est aujourd'hui

### Sources de rendez-vous

Le système vérifie deux sources :
- `ChildVaccineScheduled.scheduledFor` : Rendez-vous spécifiques par vaccin
- `Children.nextAppointment` : Prochain rendez-vous global de l'enfant

### Canaux de notification

1. **WhatsApp** (prioritaire) : Si le parent a un numéro de téléphone
2. **Email** (fallback) : Si WhatsApp échoue ou n'est pas disponible

### Prévention des doublons

Le système enregistre chaque notification dans la table `AppointmentNotification` pour éviter les envois multiples.

## ⚙️ Configuration

### Variables d'environnement

```env
# Seuils d'expiration en jours (séparés par des virgules)
STOCK_EXPIRATION_WARNING_DAYS=30,14,7

# Planification de la vérification des stocks (format cron)
STOCK_CHECK_CRON="0 8 * * *"  # Tous les jours à 8h00

# Planification de la vérification des rendez-vous (format cron)
APPOINTMENT_CHECK_CRON="0 */6 * * *"  # Toutes les 6 heures
```

### Format Cron

- `0 8 * * *` : Tous les jours à 8h00
- `0 */6 * * *` : Toutes les 6 heures
- `0 9 * * 1` : Tous les lundis à 9h00
- `*/30 * * * *` : Toutes les 30 minutes

## 🗄️ Base de données

### Nouvelles tables

#### StockExpirationNotification
Enregistre les notifications de stock expiré envoyées.

#### AppointmentNotification
Enregistre les notifications de rendez-vous envoyées.

## 🚀 Démarrage

Les tâches planifiées démarrent automatiquement avec le serveur. Aucune action manuelle n'est requise.

Pour tester manuellement :

```javascript
// Dans Node.js ou un script
const { checkStockExpirations } = require('./src/jobs/stockExpirationJob');
const { checkAppointmentNotifications } = require('./src/jobs/appointmentNotificationJob');

// Exécuter manuellement
await checkStockExpirations();
await checkAppointmentNotifications();
```

## 📝 Logs

Les logs sont affichés dans la console avec les préfixes suivants :
- `📦` : Vérification des stocks
- `📅` : Vérification des rendez-vous
- `✅` : Succès
- `❌` : Erreur
- `⏭️` : Ignoré (déjà envoyé ou aucun contact)

## 🔧 Maintenance

### Migration Prisma

Après avoir ajouté les nouvelles tables, exécutez :

```bash
npm run prisma:migrate -- --name add_notification_tables
npm run prisma:generate
```

### Installation des dépendances

```bash
npm install
```

La dépendance `node-cron` est automatiquement ajoutée.

## 📧 Templates d'emails

Les emails sont générés avec des templates HTML dans :
- `src/services/emailService.js` : `sendStockExpirationAlert()` et `sendAppointmentReminderEmail()`

Vous pouvez personnaliser ces templates selon vos besoins.


