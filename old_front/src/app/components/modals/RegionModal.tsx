"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Save } from "lucide-react";

interface Region {
  _id: string;
  name: string;
  active: boolean;
}

interface RegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function RegionModal({ isOpen, onClose, token }: RegionModalProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔄 Charger les régions
  useEffect(() => {
    if (!isOpen) return;
    const fetchRegions = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/regions", {
          credentials: "include",
        });
        const data = await res.json();
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setRegions(arr as Region[]);
      } catch (err) {
        console.error("Erreur chargement régions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, [isOpen]);

  // 🟢⚪ Toggle activation
  const toggleRegion = (id: string) => {
    setRegions((prev) =>
      prev.map((r) =>
        r._id === id ? { ...r, active: !r.active } : r
      )
    );
  };

  // 💾 Sauvegarde
  const saveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/regions/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          updates: regions.map(({ _id, active }) => ({ id: _id, active })),
        }),
      });
      if (!res.ok) {
        let details = await res.text().catch(() => "");
        try {
          const j = JSON.parse(details);
          details = j.error || j.message || details;
        } catch {}
        throw new Error(`Erreur de sauvegarde (HTTP ${res.status})${details ? ` – ${details}` : ""}`);
      }
      // notifier les autres vues
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("regions-updated"));
      }
      alert("✅ États des régions mis à jour avec succès !");
      onClose();
    } catch (err) {
      console.error(err);
      alert((err as Error)?.message || "❌ Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-amber-600" /> Gestion des Régions
        </h2>

        {loading ? (
          <p className="text-gray-600">⏳ Chargement des régions...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Array.isArray(regions) ? regions : []).map((region) => (
              <div
                key={region._id}
                className="flex items-center justify-between bg-gray-50 border rounded-lg p-4 shadow-sm hover:bg-gray-100 transition"
              >
                <span className="font-medium text-gray-800">{region.name}</span>

                {/* Bouton activation style ON/OFF */}
                <button
                  onClick={() => toggleRegion(region._id)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    region.active ? "bg-green-500" : "bg-gray-400"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      region.active ? "translate-x-6" : "translate-x-0"
                    }`}
                  ></span>
                </button>
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
            onClick={saveChanges}
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