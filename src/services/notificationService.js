const prisma = require("../config/prismaClient");
const {
  sendNotification,
  sendNotificationToChild,
  sendNotificationToParent,
} = require("../socket");

/**
 * Créer une notification et l'envoyer via Socket.io
 */
const createAndSendNotification = async ({
  childId,
  title,
  message,
  type = "system",
  sendSocket = true,
}) => {
  try {
    // Créer la notification en base
    const notification = await prisma.notification.create({
      data: {
        childId,
        title,
        message,
        type,
      },
      include: {
        child: {
          select: {
            phoneParent: true,
          },
        },
      },
    });

    // Envoyer via Socket.io si demandé
    if (sendSocket) {
      const notificationData = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
      };

      // Envoyer à l'enfant spécifique (room childId) - PRIORITAIRE
      sendNotificationToChild(childId, notificationData);
      console.log(`📩 Notification "${notification.title}" envoyée à la room ${childId}`);

      // Envoyer aussi à la room "all" pour tous les clients connectés
      const { sendNotificationToAll } = require("../socket");
      sendNotificationToAll(notificationData);
      console.log(`📩 Notification "${notification.title}" envoyée à la room "all"`);

      // Envoyer au parent (via la room parent)
      if (notification.child.phoneParent) {
        sendNotificationToParent(notification.child.phoneParent, notificationData);
        console.log(`📩 Notification "${notification.title}" envoyée au parent ${notification.child.phoneParent}`);
      }
    }

    return notification;
  } catch (error) {
    console.error("Erreur création notification:", error);
    throw error;
  }
};

/**
 * Créer une notification pour un vaccin programmé
 */
const notifyVaccineScheduled = async ({ childId, vaccineName, scheduledDate }) => {
  return createAndSendNotification({
    childId,
    title: "Vaccin programmé",
    message: `Le vaccin ${vaccineName} est programmé pour le ${new Date(scheduledDate).toLocaleDateString("fr-FR")}`,
    type: "vaccination",
  });
};

/**
 * Créer une notification pour un vaccin raté
 */
const notifyVaccineMissed = async ({ childId, vaccineName, dueDate }) => {
  return createAndSendNotification({
    childId,
    title: "Vaccin raté",
    message: `Le vaccin ${vaccineName} était prévu pour le ${new Date(dueDate).toLocaleDateString("fr-FR")} et n'a pas été effectué`,
    type: "vaccination",
  });
};

/**
 * Créer une notification pour un vaccin en retard
 */
const notifyVaccineLate = async ({ childId, vaccineName, dueDate }) => {
  return createAndSendNotification({
    childId,
    title: "Vaccin en retard",
    message: `Le vaccin ${vaccineName} était prévu pour le ${new Date(dueDate).toLocaleDateString("fr-FR")} et est maintenant en retard`,
    type: "vaccination",
  });
};

/**
 * Créer une notification pour un nouveau conseil
 */
const notifyNewAdvice = async ({ childId, adviceTitle }) => {
  return createAndSendNotification({
    childId,
    title: "Nouveau conseil disponible",
    message: `Un nouveau conseil est disponible : ${adviceTitle}`,
    type: "advice",
  });
};

/**
 * Créer une notification pour une nouvelle campagne
 */
const notifyNewCampaign = async ({ childId, campaignTitle }) => {
  return createAndSendNotification({
    childId,
    title: "Nouvelle campagne de vaccination",
    message: `Une nouvelle campagne est disponible : ${campaignTitle}`,
    type: "campaign",
  });
};

/**
 * Créer une notification pour un rendez-vous
 */
const notifyAppointment = async ({ childId, vaccineName, appointmentDate }) => {
  return createAndSendNotification({
    childId,
    title: "Rendez-vous de vaccination",
    message: `Rendez-vous pour le vaccin ${vaccineName} le ${new Date(appointmentDate).toLocaleDateString("fr-FR")}`,
    type: "appointment",
  });
};

module.exports = {
  createAndSendNotification,
  notifyVaccineScheduled,
  notifyVaccineMissed,
  notifyVaccineLate,
  notifyNewAdvice,
  notifyNewCampaign,
  notifyAppointment,
};

