"use client";

import { useEffect, useState } from "react";
import { X, ShieldCheck, Save } from "lucide-react";

export interface Permissions {
  dashboard: boolean;
  enfants: boolean;
  rendezvous: boolean;
  campagnes: boolean;
  vaccins: boolean;
  rapports: boolean;
  agents: boolean;
  stocks: boolean;
  parametres: boolean;
}

interface AgentRolesModalProps {
  agentId: string;
  token: string;
  onClose: () => void;
}

export default function AgentRolesModal({
  agentId,
  token,
  onClose,
}: AgentRolesModalProps) {
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🧩 Charger les rôles
  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/users/${agentId}/roles`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPermissions(data.permissions);
      } catch (err) {
        console.error("❌ Erreur chargement permissions:", err);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [agentId]);

  // ✅ Fonction pour basculer une permission
  const togglePermission = (key: keyof Permissions) => {
    setPermissions((prev) => {
      if (!prev) return prev; // pas de crash si null
      return {
        ...prev,
        [key]: !prev[key],
      } as Permissions;
    });
  };

  // 💾 Sauvegarde des permissions
  const handleSave = async () => {
    if (!permissions) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/users/${agentId}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ permissions }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert("✅ Permissions mises à jour avec succès !");
      onClose();
    } catch (err) {
      console.error("❌ Erreur sauvegarde permissions:", err);
      alert("❌ Échec de la mise à jour des permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (!permissions && !loading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Rôles et permissions de l’agent
          </h2>
        </div>

        {loading ? (
          <p className="text-gray-600">⏳ Chargement des permissions...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(permissions || {}).map(([key, value]) => (
              <div
                key={key}
                className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer transition ${
                  value ? "bg-green-50 border-green-400" : "bg-gray-50"
                }`}
                onClick={() => togglePermission(key as keyof Permissions)}
              >
                <span className="text-gray-700 capitalize">{key}</span>
                <div
                  className={`w-10 h-5 rounded-full transition-all duration-300 flex items-center ${
                    value ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
                      value ? "translate-x-5" : "translate-x-1"
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

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
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700 transition"
          >
            <Save size={16} />
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}