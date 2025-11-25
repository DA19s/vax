"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Shield,
  Key,
  FileText,
  Database,
  Wrench,
  Save,
  Upload,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, API_BASE_URL } from "@/app/lib/api";
import LogoPreview from "@/app/components/LogoPreview";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { useSettings } from "@/context/SettingsContext";

type TabType = "general" | "mobile" | "notifications" | "security" | "apikeys" | "logs" | "backups";

interface SystemSettings {
  appName: string;
  appSubtitle?: string;
  logoUrl: string;
  primaryColor: string;
  language: string;
  timezone: string;
  // 📱 Paramètres mobile
  mobileBackgroundColor?: string;
  mobileButtonColor?: string;
  // Onboarding slides
  onboardingSlide1Image?: string;
  onboardingSlide1Title?: string;
  onboardingSlide1Subtitle?: string;
  onboardingSlide2Image?: string;
  onboardingSlide2Title?: string;
  onboardingSlide2Subtitle?: string;
  onboardingSlide3Image?: string;
  onboardingSlide3Title?: string;
  onboardingSlide3Subtitle?: string;
  // Dashboard slides
  dashboardSlide1Image?: string;
  dashboardSlide1Title?: string;
  dashboardSlide1Subtitle?: string;
  dashboardSlide2Image?: string;
  dashboardSlide2Title?: string;
  dashboardSlide2Subtitle?: string;
  dashboardSlide3Image?: string;
  dashboardSlide3Title?: string;
  dashboardSlide3Subtitle?: string;
  // Autres
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationEmail?: string;
  notificationPhone?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  backupEnabled: boolean;
  backupFrequency: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireSpecialChar: boolean;
  twoFactorEnabled: boolean;
}

export default function NationalParametreMainPage() {
  const { token } = useAuth();
  const { refreshSettings } = useSystemSettings();
  const { refreshSettings: refreshSettingsContext } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Charger les paramètres
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<SystemSettings>("/api/system-settings");
      setSettings(data);
    } catch (error) {
      console.error("Erreur chargement paramètres:", error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des paramètres' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates: Partial<SystemSettings>) => {
    try {
      setSaving(true);
      const data = await apiFetch<{ settings: SystemSettings }>("/api/system-settings", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setSettings(data.settings);
      
      // Rafraîchir les deux contextes globaux pour mettre à jour le sidebar et logo partout
      await refreshSettings();
      await refreshSettingsContext();
      
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general" as TabType, label: "Général", icon: Settings },
    { id: "mobile" as TabType, label: "Application Mobile", icon: Settings },
    { id: "notifications" as TabType, label: "Notifications", icon: Bell },
    { id: "security" as TabType, label: "Sécurité", icon: Shield },
    { id: "apikeys" as TabType, label: "Clés API", icon: Key },
    { id: "logs" as TabType, label: "Logs d'audit", icon: FileText },
    { id: "backups" as TabType, label: "Sauvegardes", icon: Database },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête compact */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Settings className="h-6 w-6 text-blue-600" />
                Paramètres Système
              </h1>
              <p className="text-sm text-gray-600">Configuration de l'application</p>
            </div>
            {message && (
              <div className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <AlertCircle className="h-4 w-4" />
                <span>{message.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Contenu des onglets */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "general" && settings && (
                  <GeneralTab settings={settings} onSave={saveSettings} saving={saving} />
                )}
                {activeTab === "mobile" && settings && (
                  <MobileTab settings={settings} onSave={saveSettings} saving={saving} />
                )}
                {activeTab === "notifications" && settings && (
                  <NotificationsTab settings={settings} onSave={saveSettings} saving={saving} />
                )}
                {activeTab === "security" && settings && (
                  <SecurityTab settings={settings} onSave={saveSettings} saving={saving} />
                )}
                {activeTab === "apikeys" && <ApiKeysTab />}
                {activeTab === "logs" && <LogsTab />}
                {activeTab === "backups" && settings && (
                  <BackupsTab settings={settings} onSave={saveSettings} saving={saving} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Onglet Général
function GeneralTab({ settings, onSave, saving }: any) {
  const { setLocalSettings } = useSettings();
  
  const [form, setForm] = useState({
    appName: settings.appName || "",
    language: settings.language || "fr",
    timezone: settings.timezone || "Africa/Dakar",
    primaryColor: settings.primaryColor || "#2563eb",
    headerColor: settings.headerColor || "#ffffff",
    headerTextColor: settings.headerTextColor || "#1f2937",
    headerIconColor: settings.headerIconColor || "#6b7280",
    sidebarBgColor: settings.sidebarBgColor || "#0A1A33",
    sidebarTextColor: settings.sidebarTextColor || "#ffffff",
    accentColor: settings.accentColor || settings.primaryColor || "#2563eb",
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Mettre à jour le formulaire quand les settings changent
  useEffect(() => {
    if (settings) {
      setForm({
        appName: settings.appName || "",
        language: settings.language || "fr",
        timezone: settings.timezone || "Africa/Dakar",
        primaryColor: settings.primaryColor || "#2563eb",
        headerColor: settings.headerColor || "#ffffff",
        headerTextColor: settings.headerTextColor || "#1f2937",
        headerIconColor: settings.headerIconColor || "#6b7280",
        sidebarBgColor: settings.sidebarBgColor || "#0A1A33",
        sidebarTextColor: settings.sidebarTextColor || "#ffffff",
        accentColor: settings.accentColor || settings.primaryColor || "#2563eb",
      });
    }
  }, [settings]);

  // Appliquer les changements de couleur en temps réel
  useEffect(() => {
    setLocalSettings({
      primaryColor: form.primaryColor,
      headerColor: form.headerColor,
      headerTextColor: form.headerTextColor,
      headerIconColor: form.headerIconColor,
      sidebarBgColor: form.sidebarBgColor,
      sidebarTextColor: form.sidebarTextColor,
      accentColor: form.accentColor,
    });
  }, [form.primaryColor, form.headerColor, form.headerTextColor, form.headerIconColor, form.sidebarBgColor, form.sidebarTextColor, form.accentColor]);

  const uploadLogo = async (file: File) => {
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${API_BASE_URL}/api/system-settings/upload-logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      const data = await res.json();
      if (res.ok) {
        await onSave({ logoUrl: data.url });
      } else {
        alert(data.error || "Erreur upload logo");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'upload");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section Upload Logo - En évidence */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🎨 Logo de l'Application
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0 text-center">
            <LogoPreview 
              logoUrl={settings?.logoUrl}
              appName={settings?.appName}
              size="lg"
              className="border-2 border-gray-200 p-2 shadow-sm"
            />
            <p className="text-xs text-gray-600 mt-2">Logo actuel</p>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <p className="font-medium">Aperçu pages d'authentification :</p>
              <div className="mt-1 flex justify-center">
                <LogoPreview 
                  logoUrl={settings?.logoUrl}
                  appName={settings?.appName}
                  size="md"
                />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Changer le logo (affiché sur web et mobile)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(file);
                }}
                disabled={uploadingLogo}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
              />
              {uploadingLogo && (
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Upload...</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Formats acceptés: PNG, JPG, JPEG. Taille recommandée: 200x200px
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom de l'application
          </label>
          <input
            type="text"
            value={form.appName}
            onChange={(e) => setForm({ ...form, appName: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VacXCare"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur principale
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="h-11 w-20 rounded-lg border border-gray-200"
            />
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#2563eb"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur du header
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={form.headerColor}
              onChange={(e) => setForm({ ...form, headerColor: e.target.value })}
              className="h-11 w-20 rounded-lg border border-gray-200"
            />
            <input
              type="text"
              value={form.headerColor}
              onChange={(e) => setForm({ ...form, headerColor: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur du texte du header
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={form.headerTextColor}
              onChange={(e) => setForm({ ...form, headerTextColor: e.target.value })}
              className="h-11 w-20 rounded-lg border border-gray-200"
            />
            <input
              type="text"
              value={form.headerTextColor}
              onChange={(e) => setForm({ ...form, headerTextColor: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#1f2937"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur des icônes du header
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={form.headerIconColor}
              onChange={(e) => setForm({ ...form, headerIconColor: e.target.value })}
              className="h-11 w-20 rounded-lg border border-gray-200"
            />
            <input
              type="text"
              value={form.headerIconColor}
              onChange={(e) => setForm({ ...form, headerIconColor: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#6b7280"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur de fond du menu (sidebar)
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={form.sidebarBgColor}
              onChange={(e) => setForm({ ...form, sidebarBgColor: e.target.value })}
              className="h-11 w-20 rounded-lg border border-gray-200"
            />
            <input
              type="text"
              value={form.sidebarBgColor}
              onChange={(e) => setForm({ ...form, sidebarBgColor: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#0A1A33"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur du texte du menu (sidebar)
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={form.sidebarTextColor}
              onChange={(e) => setForm({ ...form, sidebarTextColor: e.target.value })}
              className="h-11 w-20 rounded-lg border border-gray-200"
            />
            <input
              type="text"
              value={form.sidebarTextColor}
              onChange={(e) => setForm({ ...form, sidebarTextColor: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur d'accent (sélections, boutons)
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
              className="h-11 w-20 rounded-lg border border-gray-200"
            />
            <input
              type="text"
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#2563eb"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Langue
          </label>
          <select
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="wo">Wolof</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fuseau horaire
          </label>
          <select
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Africa/Dakar">Africa/Dakar (GMT)</option>
            <option value="Africa/Abidjan">Africa/Abidjan (GMT)</option>
            <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
            <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

// Onglet Application Mobile
function MobileTab({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    appSubtitle: settings.appSubtitle || "Santé de votre enfant simplifiée",
    mobileBackgroundColor: settings.mobileBackgroundColor || "#0A1A33",
    mobileButtonColor: settings.mobileButtonColor || "#3B760F",
    onboardingSlide1Title: settings.onboardingSlide1Title || "Calendrier vaccinal simplifié",
    onboardingSlide1Subtitle: settings.onboardingSlide1Subtitle || "Consultez tous les rendez-vous de vaccination de vos enfants en un seul endroit.",
    onboardingSlide2Title: settings.onboardingSlide2Title || "Suivi professionnel et personnalisé",
    onboardingSlide2Subtitle: settings.onboardingSlide2Subtitle || "Des agents de santé qualifiés pour accompagner chaque étape de la vaccination.",
    onboardingSlide3Title: settings.onboardingSlide3Title || "Notifications et rappels intelligents",
    onboardingSlide3Subtitle: settings.onboardingSlide3Subtitle || "Ne manquez plus jamais un vaccin important pour la santé de votre enfant.",
    dashboardSlide1Title: settings.dashboardSlide1Title || "Suivi Vaccinal Complet",
    dashboardSlide1Subtitle: settings.dashboardSlide1Subtitle || "Tous les vaccins de votre enfant en un clin d'œil",
    dashboardSlide2Title: settings.dashboardSlide2Title || "Rendez-vous à Venir",
    dashboardSlide2Subtitle: settings.dashboardSlide2Subtitle || "Ne manquez jamais un rendez-vous important",
    dashboardSlide3Title: settings.dashboardSlide3Title || "Santé de Votre Enfant",
    dashboardSlide3Subtitle: settings.dashboardSlide3Subtitle || "Suivez la croissance et le développement",
  });

  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [uploadingDashboard, setUploadingDashboard] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Helpers pour éviter l'indexation dynamique non typée
  const getSlideTitle = (slideNumber: number): string => {
    switch (slideNumber) {
      case 1:
        return form.onboardingSlide1Title as string;
      case 2:
        return form.onboardingSlide2Title as string;
      case 3:
        return form.onboardingSlide3Title as string;
      default:
        return "";
    }
  };

  const getSlideSubtitle = (slideNumber: number): string => {
    switch (slideNumber) {
      case 1:
        return form.onboardingSlide1Subtitle as string;
      case 2:
        return form.onboardingSlide2Subtitle as string;
      case 3:
        return form.onboardingSlide3Subtitle as string;
      default:
        return "";
    }
  };

  const setSlideTitle = (slideNumber: number, value: string) => {
    switch (slideNumber) {
      case 1:
        setForm({ ...form, onboardingSlide1Title: value });
        break;
      case 2:
        setForm({ ...form, onboardingSlide2Title: value });
        break;
      case 3:
        setForm({ ...form, onboardingSlide3Title: value });
        break;
    }
  };

  const setSlideSubtitle = (slideNumber: number, value: string) => {
    switch (slideNumber) {
      case 1:
        setForm({ ...form, onboardingSlide1Subtitle: value });
        break;
      case 2:
        setForm({ ...form, onboardingSlide2Subtitle: value });
        break;
      case 3:
        setForm({ ...form, onboardingSlide3Subtitle: value });
        break;
    }
  };

  // Helpers pour dashboard slides
  const getDashboardTitle = (slideNumber: number): string => {
    switch (slideNumber) {
      case 1:
        return form.dashboardSlide1Title as string;
      case 2:
        return form.dashboardSlide2Title as string;
      case 3:
        return form.dashboardSlide3Title as string;
      default:
        return "";
    }
  };

  const getDashboardSubtitle = (slideNumber: number): string => {
    switch (slideNumber) {
      case 1:
        return form.dashboardSlide1Subtitle as string;
      case 2:
        return form.dashboardSlide2Subtitle as string;
      case 3:
        return form.dashboardSlide3Subtitle as string;
      default:
        return "";
    }
  };

  const setDashboardTitle = (slideNumber: number, value: string) => {
    switch (slideNumber) {
      case 1:
        setForm({ ...form, dashboardSlide1Title: value });
        break;
      case 2:
        setForm({ ...form, dashboardSlide2Title: value });
        break;
      case 3:
        setForm({ ...form, dashboardSlide3Title: value });
        break;
    }
  };

  const setDashboardSubtitle = (slideNumber: number, value: string) => {
    switch (slideNumber) {
      case 1:
        setForm({ ...form, dashboardSlide1Subtitle: value });
        break;
      case 2:
        setForm({ ...form, dashboardSlide2Subtitle: value });
        break;
      case 3:
        setForm({ ...form, dashboardSlide3Subtitle: value });
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const uploadLogo = async (file: File) => {
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${API_BASE_URL}/api/system-settings/upload-logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      const data = await res.json();
      if (res.ok) {
        await onSave({ logoUrl: data.url });
      } else {
        alert(data.error || "Erreur upload logo");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'upload");
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadOnboardingImage = async (slideNumber: number, file: File) => {
    try {
      setUploadingImage(slideNumber);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slideNumber", slideNumber.toString());
      
      const res = await fetch(`${API_BASE_URL}/api/system-settings/upload-onboarding-image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      const data = await res.json();
      if (res.ok) {
        const fieldName = `onboardingSlide${slideNumber}Image`;
        await onSave({ [fieldName]: data.url });
      } else {
        alert(data.error || "Erreur upload image");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'upload");
    } finally {
      setUploadingImage(null);
    }
  };

  const uploadDashboardImage = async (slideNumber: number, file: File) => {
    try {
      setUploadingDashboard(slideNumber);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slideNumber", slideNumber.toString());
      
      const res = await fetch(`${API_BASE_URL}/api/system-settings/upload-dashboard-slide-image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      const data = await res.json();
      if (res.ok) {
        const fieldName = `dashboardSlide${slideNumber}Image`;
        await onSave({ [fieldName]: data.url });
      } else {
        alert(data.error || "Erreur upload image dashboard");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'upload");
    } finally {
      setUploadingDashboard(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section Général Mobile */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📱 Paramètres Généraux Mobile
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sous-titre de l'application
            </label>
            <input
              type="text"
              value={form.appSubtitle}
              onChange={(e) => setForm({ ...form, appSubtitle: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Santé de votre enfant simplifiée"
            />
            <p className="text-xs text-gray-500 mt-1">Affiché sous le logo sur le splash screen</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur de fond mobile
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.mobileBackgroundColor}
                  onChange={(e) => setForm({ ...form, mobileBackgroundColor: e.target.value })}
                  className="h-11 w-20 rounded-lg border border-gray-200"
                />
                <input
                  type="text"
                  value={form.mobileBackgroundColor}
                  onChange={(e) => setForm({ ...form, mobileBackgroundColor: e.target.value })}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Fond du splash et onboarding</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur des boutons
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.mobileButtonColor}
                  onChange={(e) => setForm({ ...form, mobileButtonColor: e.target.value })}
                  className="h-11 w-20 rounded-lg border border-gray-200"
                />
                <input
                  type="text"
                  value={form.mobileButtonColor}
                  onChange={(e) => setForm({ ...form, mobileButtonColor: e.target.value })}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Boutons de l'onboarding</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slides d'Onboarding */}
      {[1, 2, 3].map((slideNum) => (
        <div key={slideNum} className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🖼️ Slide {slideNum} - Onboarding
          </h3>
          
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image du slide
              </label>
              <div className="flex items-center gap-4">
                {settings[`onboardingSlide${slideNum}Image`] && (
                  <img 
                    src={settings[`onboardingSlide${slideNum}Image`]} 
                    alt={`Slide ${slideNum}`} 
                    className="h-24 w-24 object-cover rounded border" 
                  />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadOnboardingImage(slideNum, file);
                  }}
                  disabled={uploadingImage === slideNum}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingImage === slideNum && (
                  <span className="text-sm text-gray-500">Upload...</span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre
              </label>
              <input
                type="text"
                value={getSlideTitle(slideNum)}
                onChange={(e) => setSlideTitle(slideNum, e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sous-titre
              </label>
              <textarea
                value={getSlideSubtitle(slideNum)}
                onChange={(e) => setSlideSubtitle(slideNum, e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Logo de l'application mobile */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎨 Logo de l'Application Mobile
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo affiché dans l'application mobile
            </label>
            <div className="flex items-center gap-4">
              {settings?.logoUrl && (
                <img 
                  src={settings.logoUrl} 
                  alt="Logo mobile" 
                  className="h-24 w-24 object-contain rounded border bg-white p-2" 
                />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(file);
                }}
                disabled={uploadingLogo}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploadingLogo && (
                <span className="text-sm text-gray-500">Upload...</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ce logo sera affiché dans le splash screen, l'onboarding et toutes les pages du mobile
            </p>
          </div>
        </div>
      </div>

      {/* Slides du Dashboard Mobile */}
      {[1, 2, 3].map((slideNum) => (
        <div key={`dashboard-${slideNum}`} className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Slide {slideNum} - Header Dashboard
          </h3>
          
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image du slide dashboard
              </label>
              <div className="flex items-center gap-4">
                {settings[`dashboardSlide${slideNum}Image`] && (
                  <img 
                    src={settings[`dashboardSlide${slideNum}Image`]} 
                    alt={`Dashboard Slide ${slideNum}`} 
                    className="h-24 w-24 object-cover rounded border" 
                  />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadDashboardImage(slideNum, file);
                  }}
                  disabled={uploadingDashboard === slideNum}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {uploadingDashboard === slideNum && (
                  <span className="text-sm text-gray-500">Upload...</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Affiché dans le carrousel en haut du dashboard mobile
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre
              </label>
              <input
                type="text"
                value={getDashboardTitle(slideNum)}
                onChange={(e) => setDashboardTitle(slideNum, e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sous-titre
              </label>
              <textarea
                value={getDashboardSubtitle(slideNum)}
                onChange={(e) => setDashboardSubtitle(slideNum, e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          {saving ? "Enregistrement..." : "Enregistrer les textes"}
        </button>
      </div>
    </form>
  );
}

function NotificationsTab({ settings }: any) {
  const [form, setForm] = useState({
    emailNotifications: !!settings.emailNotifications,
    smsNotifications: !!settings.smsNotifications,
    pushNotifications: !!settings.pushNotifications,
    notificationEmail: settings.notificationEmail || "",
    notificationPhone: settings.notificationPhone || "",
    notificationChannels: {
      alerts: settings.notificationChannels?.alerts || ["inapp"],
      auth: settings.notificationChannels?.auth || ["email"],
      onboarding_parent: settings.notificationChannels?.onboarding_parent || ["sms"],
    },
  });

  const [savingLocal, setSavingLocal] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggleChannel = (group: "alerts" | "auth" | "onboarding_parent", channel: "inapp" | "email" | "sms") => {
    setForm((prev) => {
      const set = new Set(prev.notificationChannels[group]);
      if (set.has(channel)) set.delete(channel);
      else set.add(channel);
      // Always keep at least one channel selected per group
      if (set.size === 0) set.add(group === "alerts" ? "inapp" : group === "auth" ? "email" : "sms");
      return {
        ...prev,
        notificationChannels: { ...prev.notificationChannels, [group]: Array.from(set) },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingLocal(true);
      const payload = {
        emailNotifications: form.emailNotifications,
        smsNotifications: form.smsNotifications,
        pushNotifications: form.pushNotifications,
        notificationEmail: form.notificationEmail,
        notificationPhone: form.notificationPhone,
        notificationChannels: form.notificationChannels,
      };
      await apiFetch("/api/system-settings/notifications", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMsg("Paramètres de notifications enregistrés");
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg("Erreur lors de l'enregistrement");
      setTimeout(() => setMsg(null), 2500);
    } finally {
      setSavingLocal(false);
    }
  };

  const ChannelRow = ({
    title,
    desc,
    group,
  }: {
    title: string;
    desc: string;
    group: "alerts" | "auth" | "onboarding_parent";
  }) => (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-600">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {([
          { key: "inapp", label: "In‑App" },
          { key: "email", label: "Email" },
          { key: "sms", label: "SMS" },
        ] as const).map((c) => (
          <label key={c.key} className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.notificationChannels[group].includes(c.key)}
              onChange={() => toggleChannel(group, c.key)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">{c.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Notifications Email</p>
              <p className="text-sm text-gray-600">Recevoir les alertes par email</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.emailNotifications}
              onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {form.emailNotifications && (
          <div className="ml-4 pl-4 border-l-2 border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email de notification
            </label>
            <input
              type="email"
              value={form.notificationEmail}
              onChange={(e) => setForm({ ...form, notificationEmail: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@vacxcare.sn"
            />
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Notifications SMS</p>
              <p className="text-sm text-gray-600">Recevoir les alertes par SMS</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.smsNotifications}
              onChange={(e) => setForm({ ...form, smsNotifications: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {form.smsNotifications && (
          <div className="ml-4 pl-4 border-l-2 border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={form.notificationPhone}
              onChange={(e) => setForm({ ...form, notificationPhone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+221 XX XXX XX XX"
            />
          </div>
        )}
      </div>

      {/* Per-event channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChannelRow
          title="Alertes (In‑App)"
          desc="Notifications d'alertes systèmes, seuils, etc."
          group="alerts"
        />
        <ChannelRow
          title="Authentification"
          desc="Codes, liens de connexion, 2FA"
          group="auth"
        />
        <ChannelRow
          title="Onboarding Parent"
          desc="Messages d'accueil et d'activation pour le parent"
          group="onboarding_parent"
        />
      </div>

      {msg && (
        <div className="px-4 py-2 rounded bg-blue-50 text-blue-700">{msg}</div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={savingLocal}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {savingLocal ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function SecurityTab({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    sessionTimeout: settings.sessionTimeout || 3600,
    maxLoginAttempts: settings.maxLoginAttempts || 5,
    passwordMinLength: settings.passwordMinLength || 8,
    requireSpecialChar: settings.requireSpecialChar || false,
    twoFactorEnabled: settings.twoFactorEnabled || false,
    maintenanceMode: settings.maintenanceMode || false,
    maintenanceMessage: settings.maintenanceMessage || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {/* Sessions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Gestion des sessions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée de session (secondes)
              </label>
              <input
                type="number"
                value={form.sessionTimeout}
                onChange={(e) => setForm({ ...form, sessionTimeout: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="300"
                max="86400"
              />
              <p className="text-xs text-gray-500 mt-1">
                {Math.floor(form.sessionTimeout / 60)} minutes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tentatives de connexion max
              </label>
              <input
                type="number"
                value={form.maxLoginAttempts}
                onChange={(e) => setForm({ ...form, maxLoginAttempts: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="3"
                max="10"
              />
            </div>
          </div>
        </div>

        {/* Politique de mot de passe */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Politique de mot de passe
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longueur minimale
              </label>
              <input
                type="number"
                value={form.passwordMinLength}
                onChange={(e) => setForm({ ...form, passwordMinLength: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="6"
                max="20"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Caractères spéciaux requis</p>
                <p className="text-sm text-gray-600">Exiger au moins un caractère spécial</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireSpecialChar}
                  onChange={(e) => setForm({ ...form, requireSpecialChar: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Authentification à deux facteurs */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Authentification à deux facteurs</p>
              <p className="text-sm text-gray-600">Activer 2FA pour tous les utilisateurs</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.twoFactorEnabled}
                onChange={(e) => setForm({ ...form, twoFactorEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Mode maintenance */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Mode maintenance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-900">Activer le mode maintenance</p>
                <p className="text-sm text-orange-700">Bloque l'accès à l'application</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.maintenanceMode}
                  onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {form.maintenanceMode && (
              <div>
                <label className="block text-sm font-medium text-orange-900 mb-2">
                  Message de maintenance
                </label>
                <textarea
                  value={form.maintenanceMessage}
                  onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
                  className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Maintenance en cours. L'application sera disponible bientôt."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function ApiKeysTab() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState({ name: "", permissions: "", expiresIn: "" });
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ keys: any[] }>("/api/system-settings/api-keys");
      setApiKeys(data.keys || []);
    } catch (error) {
      console.error("Erreur chargement clés API:", error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      const data = await apiFetch<{ apiKey: any }>("/api/system-settings/api-keys", {
        method: "POST",
        body: JSON.stringify({
          name: newKey.name,
          permissions: newKey.permissions.split(",").map(p => p.trim()),
          expiresIn: newKey.expiresIn ? Number(newKey.expiresIn) : undefined,
        }),
      });
      setCreatedKey(data.apiKey.plainKey);
      setNewKey({ name: "", permissions: "", expiresIn: "" });
      fetchApiKeys();
    } catch (error) {
      console.error("Erreur création clé API:", error);
      alert("Erreur lors de la création de la clé API");
    }
  };

  const revokeApiKey = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer cette clé API ?")) return;
    try {
      await apiFetch(`/api/system-settings/api-keys/${id}`, { method: "DELETE" });
      fetchApiKeys();
    } catch (error) {
      console.error("Erreur révocation clé API:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Clés API</h3>
          <p className="text-sm text-gray-600">Gérez les clés d'accès à l'API</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Key className="h-5 w-5" />
          Nouvelle clé
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Aucune clé API créée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div key={key._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{key.name}</p>
                <p className="text-sm text-gray-600">
                  Créée le {new Date(key.createdAt).toLocaleDateString("fr-FR")}
                  {key.expiresAt && ` • Expire le ${new Date(key.expiresAt).toLocaleDateString("fr-FR")}`}
                </p>
                {key.permissions?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {key.permissions.map((perm: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {perm}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => revokeApiKey(key._id)}
                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm"
              >
                Révoquer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nouvelle clé API</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="API Production"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions (séparées par virgules)
                </label>
                <input
                  type="text"
                  value={newKey.permissions}
                  onChange={(e) => setNewKey({ ...newKey, permissions: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="read, write, delete"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expire dans (jours)
                </label>
                <input
                  type="number"
                  value={newKey.expiresIn}
                  onChange={(e) => setNewKey({ ...newKey, expiresIn: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKey({ name: "", permissions: "", expiresIn: "" });
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  createApiKey();
                  setShowCreateModal(false);
                }}
                disabled={!newKey.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal clé créée */}
      {createdKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Clé API créée</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Important :</strong> Copiez cette clé maintenant. Elle ne sera plus affichée.
              </p>
              <div className="bg-white p-3 rounded border border-yellow-300 font-mono text-sm break-all">
                {createdKey}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdKey);
                setCreatedKey(null);
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Copier et fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ logs: any[], pagination: any }>(
        `/api/system-settings/audit-logs?page=${page}&limit=20`
      );
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error("Erreur chargement logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-green-100 text-green-700";
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-700";
    if (action.includes("DELETE")) return "bg-red-100 text-red-700";
    if (action.includes("REVOKE")) return "bg-orange-100 text-orange-700";
    return "bg-gray-100 text-gray-700";
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "UPDATE_SYSTEM_SETTINGS": "Mise à jour paramètres",
      "CREATE_API_KEY": "Création clé API",
      "REVOKE_API_KEY": "Révocation clé API",
      "CREATE_BACKUP": "Sauvegarde créée",
      "TOGGLE_MAINTENANCE_MODE": "Mode maintenance",
      "UPDATE_NOTIFICATION_SETTINGS": "Paramètres notifications",
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Journal d'audit</h3>
          <p className="text-sm text-gray-600">Historique des actions administratives</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-5 w-5" />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Aucun log disponible</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {log.userId && (
                    <span className="text-sm text-gray-600">
                      {log.userId.email || log.userId.firstName || "Utilisateur"}
                    </span>
                  )}
                </div>
                {log.details && (
                  <div className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 mt-2">
                    <pre className="overflow-x-auto text-xs">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
                {log.ipAddress && (
                  <div className="text-xs text-gray-500 mt-2">
                    IP: {log.ipAddress}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} sur {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BackupsTab({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    backupEnabled: settings.backupEnabled || false,
    backupFrequency: settings.backupFrequency || "daily",
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const createBackup = async () => {
    if (!confirm("Créer une sauvegarde manuelle maintenant ?")) return;
    try {
      setCreating(true);
      await apiFetch("/api/system-settings/backup", { method: "POST" });
      alert("✅ Sauvegarde créée avec succès !");
    } catch (error) {
      console.error("Erreur création backup:", error);
      alert("❌ Erreur lors de la création de la sauvegarde");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Configuration des sauvegardes
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Sauvegardes automatiques</p>
                <p className="text-sm text-gray-600">Activer les sauvegardes planifiées</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.backupEnabled}
                  onChange={(e) => setForm({ ...form, backupEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {form.backupEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence des sauvegardes
                </label>
                <select
                  value={form.backupFrequency}
                  onChange={(e) => setForm({ ...form, backupFrequency: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hourly">Toutes les heures</option>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>

      {/* Sauvegarde manuelle */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Sauvegarde manuelle</h3>
            <p className="text-sm text-blue-700 mb-4">
              Créez une sauvegarde complète de la base de données immédiatement. Cette opération peut prendre quelques minutes.
            </p>
            <button
              onClick={createBackup}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Database className="h-5 w-5" />
              {creating ? "Création en cours..." : "Créer une sauvegarde"}
            </button>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">💡 Informations</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Les sauvegardes sont stockées de manière sécurisée et chiffrées</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Les anciennes sauvegardes sont automatiquement archivées après 30 jours</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>En cas de problème, contactez l'équipe technique pour restaurer une sauvegarde</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Les sauvegardes incluent : base de données, fichiers uploadés, et configurations</span>
          </li>
        </ul>
      </div>
    </div>
  );
}