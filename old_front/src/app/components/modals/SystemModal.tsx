"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Save, X } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

export interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemParametreModal({ isOpen, onClose }: SystemModalProps) {
  const { settings, updateSettings, refreshSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  // ⚡ Synchronise avec le contexte dès qu’il change
  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;
  if (!localSettings)
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
          <p className="text-gray-600">⏳ Chargement des paramètres...</p>
        </div>
      </div>
    );

  // 💾 Sauvegarde
  const handleSave = async () => {
    if (!localSettings) return;
    setSaving(true);
    await updateSettings(localSettings);
    await refreshSettings();
    alert("✅ Paramètres mis à jour avec succès !");
    setSaving(false);
    onClose();
  };

  // 📤 Upload du logo
  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:5000/api/settings/system/upload-logo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload échoué (${res.status})`);

      const data = await res.json();
      setLocalSettings({ ...localSettings, logoUrl: data.url });
    } catch (err) {
      console.error("Erreur upload logo :", err);
      alert("❌ Échec de l’upload du logo.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          ⚙️ Paramètres Système
        </h2>

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Nom de l’application
            </label>
            <input
              type="text"
              value={localSettings.appName || ""}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, appName: e.target.value })
              }
              className="border rounded p-2 w-full mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Logo
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleLogoUpload}
              className="block w-full text-sm mt-1"
            />
            {localSettings.logoUrl && (
              <img
                src={localSettings.logoUrl}
                alt="Logo"
                className="mt-2 w-24 h-24 object-contain border rounded"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Couleur principale
            </label>
            <input
              type="color"
              value={localSettings.primaryColor || "#0056D2"}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  primaryColor: e.target.value,
                })
              }
              className="w-16 h-10 border rounded mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Langue
            </label>
            <select
              value={localSettings.language || "fr"}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  language: e.target.value,
                })
              }
              className="border rounded p-2 w-full mt-1"
            >
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
              <option value="pt">Portugais</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Fuseau horaire
            </label>
            <input
              type="text"
              value={localSettings.timezone || ""}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  timezone: e.target.value,
                })
              }
              className="border rounded p-2 w-full mt-1"
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700"
          >
            <Save size={16} />
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}