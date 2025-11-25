"use client";

import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import LogoPreview from "@/app/components/LogoPreview";

export default function TestLogoPage() {
  const { settings, loading, error, refreshSettings } = useSystemSettings();

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test du Logo Global</h1>
        <p>Chargement des paramètres...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test du Logo Global</h1>
        <p className="text-red-600">Erreur: {error}</p>
        <button 
          onClick={refreshSettings}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test du Logo Global</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Paramètres actuels:</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Nom de l'app:</strong> {settings.appName}</p>
            <p><strong>URL du logo:</strong> {settings.logoUrl}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Aperçu du logo:</h2>
          <div className="flex gap-4 items-center">
            <div className="text-center">
              <LogoPreview size="sm" />
              <p className="text-sm mt-2">Petit (sm)</p>
            </div>
            <div className="text-center">
              <LogoPreview size="md" />
              <p className="text-sm mt-2">Moyen (md)</p>
            </div>
            <div className="text-center">
              <LogoPreview size="lg" />
              <p className="text-sm mt-2">Grand (lg)</p>
            </div>
          </div>
        </div>

        <div>
          <button 
            onClick={refreshSettings}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Rafraîchir les paramètres
          </button>
        </div>
      </div>
    </div>
  );
}
