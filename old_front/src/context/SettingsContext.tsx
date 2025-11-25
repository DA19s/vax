"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/app/lib/api";

interface Settings {
  appName: string;
  logoUrl: string;
  primaryColor: string;
  headerColor?: string;
  headerTextColor?: string;
  headerIconColor?: string;
  sidebarBgColor?: string;
  sidebarTextColor?: string;
  accentColor?: string;
  language: string;
  timezone: string;
}

interface SettingsContextType {
  settings: Settings | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  setLocalSettings: (data: Partial<Settings>) => void; // ⚡ Nouveau
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const { user } = useAuth();

  /** 🟢 Applique les couleurs dans le CSS global */
  const applyTheme = (color?: string, theme?: Partial<Settings>) => {
    if (color) {
      document.documentElement.style.setProperty("--primary-color", color);
    }
    if (theme?.headerColor) {
      document.documentElement.style.setProperty("--header-color", theme.headerColor);
    }
    if (theme?.headerTextColor) {
      document.documentElement.style.setProperty("--header-text-color", theme.headerTextColor);
    }
    if (theme?.headerIconColor) {
      document.documentElement.style.setProperty("--header-icon-color", theme.headerIconColor);
    }
    if (theme?.sidebarBgColor) {
      document.documentElement.style.setProperty("--sidebar-bg", theme.sidebarBgColor);
    }
    if (theme?.sidebarTextColor) {
      document.documentElement.style.setProperty("--sidebar-text", theme.sidebarTextColor);
    }
    if (theme?.accentColor) {
      document.documentElement.style.setProperty("--accent-color", theme.accentColor);
    }
  };

  /** 🌐 Applique la langue au document (par défaut: fr) */
  const applyLanguage = (language?: string) => {
    const lang = language || "fr";
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);
  };

  /** 🔄 Rafraîchir depuis le backend */
  const refreshSettings = async () => {
  try {
    // ✅ Tous les rôles peuvent lire les paramètres (pour le thème)
    const json = await apiFetch<Partial<Settings>>("/api/system-settings", { method: "GET" });
    const next = { 
      language: "fr", 
      headerTextColor: "#1f2937", // Valeur par défaut si manquante
      headerIconColor: "#6b7280", // Valeur par défaut si manquante
      ...(json || {}) 
    } as Settings;
    setSettings(next);
    applyTheme(next.primaryColor, next);
    applyLanguage(next.language);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      // Si pas autorisé, appliquer des valeurs par défaut minimales (sans couleurs)
      const defaultSettings: Settings = {
        appName: "VacXCare",
        logoUrl: "",
        primaryColor: "#2563eb",
        headerColor: "#ffffff", // Blanc par défaut, sera changé par le national
        headerTextColor: "#1f2937", // Gris foncé par défaut pour le texte du header
        headerIconColor: "#6b7280", // Gris par défaut pour les icônes du header
        sidebarBgColor: "#1e293b",
        sidebarTextColor: "#ffffff",
        accentColor: "#2563eb",
        language: "fr",
        timezone: "Africa/Dakar",
      };
      setSettings(defaultSettings);
      applyTheme(defaultSettings.primaryColor, defaultSettings);
      applyLanguage(defaultSettings.language);
      return;
    }
    console.error("❌ Erreur chargement paramètres:", err);
  }
};

  /** 💾 Mise à jour API + thème */
  const updateSettings = async (data: Partial<Settings>) => {
    try {
      if (user?.role && user.role !== "national") throw new Error("Non autorisé");
      const json = await apiFetch<any>("/api/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const next = (json && json.settings) ? json.settings : json;
      setSettings(next as Settings);
      applyTheme((next as Settings).primaryColor, next as Settings);
      applyLanguage((next as Settings).language);
      await refreshSettings();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return;
      console.error("❌ Erreur mise à jour paramètres:", err);
      throw err;
    }
  };

  /** ⚡ Mise à jour locale instantanée */
  const setLocalSettings = (data: Partial<Settings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...data } as Settings;
      applyTheme(newSettings.primaryColor, newSettings);
      applyLanguage(newSettings.language);
      return newSettings;
    });
  };

  useEffect(() => {
    // recharge au montage et à chaque changement de rôle
    refreshSettings();
  }, [user?.role]);

  return (
    <SettingsContext.Provider
      value={{ settings, refreshSettings, updateSettings, setLocalSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings doit être utilisé dans un SettingsProvider");
  return ctx;
};