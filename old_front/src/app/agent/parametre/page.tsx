"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Eye,
  FileDown,
  Save,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/app/lib/api";

type TabType = "profil" | "notifications" | "securite" | "preferences" | "exports";

interface AgentSettings {
  twoFactorEnabled?: boolean;
  notificationPreferences?: {
    appointmentReminders: boolean;
    vaccinationAlerts: boolean;
    weeklyReports: boolean;
  };
  displayPreferences?: {
    pageSize: number;
    defaultView: string;
  };
}

export default function AgentParametrePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profil");
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        setUserProfile(userData);
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Valeurs par défaut pour l'agent
      setSettings({
        twoFactorEnabled: false,
        notificationPreferences: {
          appointmentReminders: true,
          vaccinationAlerts: true,
          weeklyReports: false,
        },
        displayPreferences: {
          pageSize: 10,
          defaultView: "table",
        },
      });
    } catch (error) {
      console.error("Erreur chargement paramètres:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      const updatedUser = await response.json();
      setUserProfile(updatedUser.user);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Erreur mise à jour profil:", error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour' });
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (updates: Partial<AgentSettings>) => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setSettings({ ...settings, ...updates } as AgentSettings);
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
    { id: "profil" as TabType, label: "Profil", icon: User },
    { id: "notifications" as TabType, label: "Notifications", icon: Bell },
    { id: "securite" as TabType, label: "Sécurité", icon: Shield },
    { id: "preferences" as TabType, label: "Préférences", icon: Eye },
    { id: "exports" as TabType, label: "Exports", icon: FileDown },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fadeIn max-w-7xl mx-auto">
        {/* En-tête moderne */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Settings className="h-8 w-8 text-blue-600" />
                </div>
                Paramètres
              </h1>
              <p className="text-gray-600">Gérez vos préférences et paramètres de compte</p>
            </div>
          </div>
          
          {/* Message de notification */}
          {message && (
            <div className={`mt-4 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{message.text}</span>
            </div>
          )}
        </div>

        {/* Navigation par onglets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
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
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "profil" && (
                  <ProfilTab user={userProfile || user} onSave={updateProfile} saving={saving} />
                )}
                {activeTab === "notifications" && settings && (
                  <NotificationsTab settings={settings} onSave={saveSettings} saving={saving} />
                )}
                {activeTab === "securite" && settings && (
                  <SecuriteTab settings={settings} onSave={saveSettings} saving={saving} />
                )}
                {activeTab === "preferences" && settings && (
                  <PreferencesTab settings={settings} onSave={saveSettings} saving={saving} />
                )}
                {activeTab === "exports" && <ExportsTab />}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Composants des onglets (réutilisés depuis la page régionale)
function ProfilTab({ user, onSave, saving }: any) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // ✅ Mettre à jour le formulaire quand les données utilisateur arrivent
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    try {
      setPasswordSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }

      setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'Erreur lors du changement de mot de passe' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Informations personnelles */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Votre prénom"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+221 XX XXX XX XX"
            />
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

      {/* Changement de mot de passe */}
      <form onSubmit={handlePasswordChange} className="space-y-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h3>
          {passwordMessage && (
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
              passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="h-4 w-4" />
              <span>{passwordMessage.text}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez votre mot de passe actuel"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Au moins 6 caractères"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirmez le nouveau mot de passe"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={passwordSaving}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Shield className="h-5 w-5" />
            {passwordSaving ? "Modification..." : "Changer le mot de passe"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Autres composants simplifiés pour l'agent
function NotificationsTab({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    appointmentReminders: settings.notificationPreferences?.appointmentReminders ?? true,
    vaccinationAlerts: settings.notificationPreferences?.vaccinationAlerts ?? true,
    weeklyReports: settings.notificationPreferences?.weeklyReports ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ notificationPreferences: form });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Préférences de notification</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Rappels de rendez-vous</label>
            <p className="text-xs text-gray-500">Recevoir des rappels pour les rendez-vous à venir</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.appointmentReminders}
              onChange={(e) => setForm({ ...form, appointmentReminders: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Alertes de vaccination</label>
            <p className="text-xs text-gray-500">Recevoir des alertes pour les vaccinations dues</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.vaccinationAlerts}
              onChange={(e) => setForm({ ...form, vaccinationAlerts: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Rapports hebdomadaires</label>
            <p className="text-xs text-gray-500">Recevoir un résumé hebdomadaire de votre activité</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.weeklyReports}
              onChange={(e) => setForm({ ...form, weeklyReports: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
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

function SecuriteTab({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    twoFactorEnabled: settings.twoFactorEnabled ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ twoFactorEnabled: form.twoFactorEnabled });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sécurité du compte</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Authentification à deux facteurs</label>
            <p className="text-xs text-gray-500">Ajouter une couche de sécurité supplémentaire à votre compte</p>
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

function PreferencesTab({ settings, onSave, saving }: any) {
  const [form, setForm] = useState({
    pageSize: settings.displayPreferences?.pageSize ?? 10,
    defaultView: settings.displayPreferences?.defaultView ?? "table",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ displayPreferences: form });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Préférences d'affichage</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Taille de page par défaut</label>
          <select
            value={form.pageSize}
            onChange={(e) => setForm({ ...form, pageSize: Number(e.target.value) })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10 éléments</option>
            <option value={25}>25 éléments</option>
            <option value={50}>50 éléments</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vue par défaut</label>
          <select
            value={form.defaultView}
            onChange={(e) => setForm({ ...form, defaultView: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="table">Tableau</option>
            <option value="grid">Grille</option>
            <option value="list">Liste</option>
          </select>
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

function ExportsTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Exports de données</h3>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-3">
          <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-left flex items-center justify-between">
            <span>Exporter mes enfants suivis (CSV)</span>
            <FileDown className="h-4 w-4" />
          </button>
          <button className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-left flex items-center justify-between">
            <span>Exporter mes rendez-vous (CSV)</span>
            <FileDown className="h-4 w-4" />
          </button>
          <button className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-left flex items-center justify-between">
            <span>Exporter mes rapports (PDF)</span>
            <FileDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
