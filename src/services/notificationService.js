const prisma = require("../config/prismaClient");

/**
 * Crée une notification pour un utilisateur
 * @param {Object} params
 * @param {string} params.userId - ID de l'utilisateur
 * @param {string} params.title - Titre de la notification
 * @param {string} params.message - Message de la notification
 * @param {string} params.type - Type de notification (ex: "STOCK_TRANSFER", "ENTITY_CREATED", etc.)
 */
const createNotification = async ({ userId, title, message, type }) => {
  try {
    const notification = await prisma.userNotification.create({
      data: {
        userId,
        title,
        message,
        type,
        read: false,
      },
    });
    return notification;
  } catch (error) {
    console.error("Erreur création notification:", error);
    // Ne pas faire échouer l'opération si la création de notification échoue
    return null;
  }
};

/**
 * Crée des notifications pour plusieurs utilisateurs
 * @param {Array} userIds - Liste des IDs d'utilisateurs
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} type - Type de notification
 */
const createNotificationsForUsers = async ({ userIds, title, message, type }) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  try {
    const notifications = await prisma.userNotification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type,
        read: false,
      })),
    });
    return notifications;
  } catch (error) {
    console.error("Erreur création notifications:", error);
    // Ne pas faire échouer l'opération si la création de notifications échoue
    return [];
  }
};

/**
 * Récupère les notifications d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options de récupération
 * @param {boolean} options.unreadOnly - Récupérer uniquement les non lues
 * @param {number} options.limit - Nombre maximum de notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  const { unreadOnly = false, limit = 500 } = options;

  try {
    const where = {
      userId,
      ...(unreadOnly && { read: false }),
    };

    const notifications = await prisma.userNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    return [];
  }
};

/**
 * Compte les notifications non lues d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await prisma.userNotification.count({
      where: {
        userId,
        read: false,
      },
    });
    return count;
  } catch (error) {
    console.error("Erreur comptage notifications non lues:", error);
    return 0;
  }
};

/**
 * Marque une notification comme lue
 * @param {string} notificationId - ID de la notification
 * @param {string} userId - ID de l'utilisateur (pour vérification)
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await prisma.userNotification.updateMany({
      where: {
        id: notificationId,
        userId, // S'assurer que la notification appartient à l'utilisateur
      },
      data: {
        read: true,
      },
    });
    return notification;
  } catch (error) {
    console.error("Erreur marquage notification comme lue:", error);
    throw error;
  }
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 * @param {string} userId - ID de l'utilisateur
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await prisma.userNotification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
    return result;
  } catch (error) {
    console.error("Erreur marquage toutes notifications comme lues:", error);
    throw error;
  }
};

/**
 * Supprime une notification
 * @param {string} notificationId - ID de la notification
 * @param {string} userId - ID de l'utilisateur (pour vérification)
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await prisma.userNotification.deleteMany({
      where: {
        id: notificationId,
        userId, // S'assurer que la notification appartient à l'utilisateur
      },
    });
    return result;
  } catch (error) {
    console.error("Erreur suppression notification:", error);
    throw error;
  }
};

/**
 * Supprime toutes les notifications d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
const deleteAllNotifications = async (userId) => {
  try {
    const result = await prisma.userNotification.deleteMany({
      where: {
        userId,
      },
    });
    return result;
  } catch (error) {
    console.error("Erreur suppression toutes notifications:", error);
    throw error;
  }
};

/**
 * Supprime toutes les notifications lues d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
const deleteAllReadNotifications = async (userId) => {
  try {
    const result = await prisma.userNotification.deleteMany({
      where: {
        userId,
        read: true,
      },
    });
    return result;
  } catch (error) {
    console.error("Erreur suppression notifications lues:", error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createNotificationsForUsers,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  deleteAllReadNotifications,
};
