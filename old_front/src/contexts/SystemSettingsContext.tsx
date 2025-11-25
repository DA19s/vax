"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SystemSettings {
  appName: string;
  appSubtitle: string;
  logoUrl: string;
  mobileBackgroundColor: string;
  mobileButtonColor: string;
  onboardingSlide1Image: string;
  onboardingSlide1Title: string;
  onboardingSlide1Subtitle: string;
  onboardingSlide2Image: string;
  onboardingSlide2Title: string;
  onboardingSlide2Subtitle: string;
  onboardingSlide3Image: string;
  onboardingSlide3Title: string;
  onboardingSlide3Subtitle: string;
}

interface SystemSettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

const defaultSettings: SystemSettings = {
  appName: "VaxCare",
  appSubtitle: "Santé de votre enfant simplifiée",
  logoUrl: "/logo.png",
  mobileBackgroundColor: "#0A1A33",
  mobileButtonColor: "#3B760F",
  onboardingSlide1Image: "/onboarding1.png",
  onboardingSlide1Title: "Calendrier vaccinal simplifié",
  onboardingSlide1Subtitle: "Suivez facilement les vaccinations de votre enfant",
  onboardingSlide2Image: "/onboarding2.png",
  onboardingSlide2Title: "Rappels automatiques",
  onboardingSlide2Subtitle: "Ne manquez jamais un rendez-vous important",
  onboardingSlide3Image: "/onboarding3.png",
  onboardingSlide3Title: "Conseils de santé",
  onboardingSlide3Subtitle: "Recevez des conseils personnalisés pour votre enfant"
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};

interface SystemSettingsProviderProps {
  children: ReactNode;
}

export const SystemSettingsProvider: React.FC<SystemSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/system-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Fonction helper pour construire les URLs complètes
      const buildFullUrl = (url: string | undefined, defaultUrl: string) => {
        if (!url) return defaultUrl;
        // Si l'URL commence déjà par http, la retourner telle quelle
        if (url.startsWith('http')) return url;
        // Si c'est une URL relative, ajouter le préfixe
        return url.startsWith('/') ? `http://localhost:5000${url}` : url;
      };

      // Merger les données reçues avec les valeurs par défaut
      const mergedSettings = {
        ...defaultSettings,
        ...data,
        // S'assurer que les URLs des images sont complètes
        logoUrl: buildFullUrl(data.logoUrl, defaultSettings.logoUrl),
        onboardingSlide1Image: buildFullUrl(data.onboardingSlide1Image, defaultSettings.onboardingSlide1Image),
        onboardingSlide2Image: buildFullUrl(data.onboardingSlide2Image, defaultSettings.onboardingSlide2Image),
        onboardingSlide3Image: buildFullUrl(data.onboardingSlide3Image, defaultSettings.onboardingSlide3Image),
      };

      setSettings(mergedSettings);
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres système:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      // En cas d'erreur, utiliser les paramètres par défaut
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    // Fonction helper pour construire les URLs complètes (même logique que fetchSettings)
    const buildFullUrl = (url: string | undefined, fallback: string) => {
      if (!url) return fallback;
      if (url.startsWith('http')) return url;
      return url.startsWith('/') ? `http://localhost:5000${url}` : url;
    };

    setSettings(prev => ({
      ...prev,
      ...newSettings,
      // S'assurer que les URLs des images sont complètes
      logoUrl: newSettings.logoUrl ? buildFullUrl(newSettings.logoUrl, prev.logoUrl) : prev.logoUrl,
    }));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const value: SystemSettingsContextType = {
    settings,
    loading,
    error,
    refreshSettings,
    updateSettings,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};
