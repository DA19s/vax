"use client";

import { useAuth } from "@/context/AuthContext";
import { Bell, CheckCircle, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { socket } from "@/utils/socketClient";
import { apiFetch } from "@/app/lib/api";
import ProfileModal from "./ProfileModal";

interface Notification {
  _id?: string;
  title: string;
  message: string;
  read?: boolean;
  createdAt?: string;
}

export default function Header() {
  const { user, logout } = useAuth();
  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const t = useT() as (key: string, params?: Record<string, string>) => string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* -------------------------------------------------------------------------- */
  /* 🔌 SOCKET.IO : réception en temps réel                                     */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!mounted || !user?.id) return;

    socket.emit("registerUser", { userId: user.id, role: user.role });
    console.log("📡 Utilisateur enregistré sur socket:", user.role);

    socket.on("newNotification", (notif: Notification) => {
      console.log("📥 Nouvelle notification reçue :", notif);
      setNotifications((prev) => {
        const updated = [{ ...notif, read: false }, ...prev];
        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      socket.off("newNotification");
    };
  }, [user, mounted]);

  /* -------------------------------------------------------------------------- */
  /* 📦 Chargement initial des notifications (backend + localStorage)           */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const loadNotifs = async () => {
      if (!mounted || !user) return;
      try {
        const saved = localStorage.getItem("notifications");
        if (saved) setNotifications(JSON.parse(saved));

        const data = await apiFetch<any>(`/api/notifications`);
        if (data?.notifications) {
          const formatted = data.notifications.map((n: any) => ({
            ...n,
            read: n.readBy?.includes(user.id),
          }));
          setNotifications(formatted);
          localStorage.setItem("notifications", JSON.stringify(formatted));
        }
      } catch (err) {
        console.error("❌ Erreur chargement notifications:", err);
      }
    };

    loadNotifs();
  }, [user, mounted]);

  /* -------------------------------------------------------------------------- */
  /* 🔖 Marquer comme lue                                                      */
  /* -------------------------------------------------------------------------- */
  const markAsRead = async (notifId?: string) => {
    if (!notifId) return;
    try {
      await apiFetch(`/api/notifications/${notifId}/read`, { method: "PUT" });
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n._id === notifId ? { ...n, read: true } : n
        );
        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("⚠️ Erreur lors du marquage:", err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🔢 Compteur de notifications non lues                                     */
  /* -------------------------------------------------------------------------- */
  const unreadCount = notifications.filter((n) => !n.read).length;

  /* -------------------------------------------------------------------------- */
  /* 🧱 Interface Header                                                       */
  /* -------------------------------------------------------------------------- */
  const ready = mounted && !!user;
  if (!ready) return null;

  return (
    <header
      className="flex items-center justify-between px-6 py-3 shadow-sm border-b"
      style={{ backgroundColor: "var(--header-color, #ffffff)" }}
    >
      {/* 👋 Titre dynamique */}
      <h1 className="text-lg font-semibold" style={{ color: "var(--header-text-color, #1f2937)" }}>
        {user.role === 'national'
          ? `Bienvenue, ${user.email} - ${user.role}`
          : `Bienvenue, ${user.firstName} - ${user.role}: ${user.region || "N/A"}`
        }

      </h1>

      <div className="flex items-center gap-6">
        {/* 🔔 Icône notifications */}
        <div className="relative">
          <button
            className="relative p-2 rounded-full hover:bg-gray-100"
            onClick={() => {
              setOpenNotif((prev) => !prev);
              setOpenProfile(false);
            }}
          >
            <Bell className="h-6 w-6" style={{ color: "var(--header-icon-color, #6b7280)" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center bg-red-500 text-white text-xs font-semibold h-4 w-4 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* 🔽 Liste des notifications */}
          {openNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-50">
              <div className="px-3 py-2 font-semibold border-b text-gray-700 flex justify-between items-center">
                {t("notifications")}
                {unreadCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y">
                {notifications.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    {t("no_notifications")}
                  </div>
                ) : (
                  notifications.map((n, idx) => (
                    <div
                      key={idx}
                      className={`p-3 text-sm cursor-pointer flex items-start gap-2 ${
                        n.read ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100`}
                      onClick={() => markAsRead(n._id)}
                    >
                      {n.read ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <span className="h-2 w-2 mt-1 rounded-full bg-red-500"></span>
                      )}

                      <div className="flex-1">
                        <div className="font-medium">
                          {n.title || t("notification")}
                        </div>
                        <div className="text-gray-600 text-xs">{n.message}</div>
                        <div className="text-gray-400 text-[10px] mt-0.5">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString("fr-FR")
                            : ""}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 👤 Icône Profil */}
        <div className="relative">
          <button
            className="p-2 rounded-full hover:bg-gray-100 border border-gray-200 flex items-center justify-center"
            onClick={() => {
              setOpenProfile((prev) => !prev);
              setOpenNotif(false);
            }}
          >
            <User className="h-6 w-6" style={{ color: "var(--header-icon-color, #6b7280)" }} />
          </button>

          {/* 🔽 Menu Profil */}
          {openProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-50">
              <div className="px-3 py-2 border-b text-gray-700 font-medium">
                {user.email || "Profil utilisateur"}
              </div>

              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  setProfileModalOpen(true);
                  setOpenProfile(false);
                }}
              >
                <User className="h-4 w-4 text-gray-500" />
                Voir mon profil
              </button>

              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />
    </header>
  );
}