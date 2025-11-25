"use client";

import { useEffect, useState } from "react";
import { X, Syringe, Save, ChevronDown } from "lucide-react";

interface Dose {
  _id?: string;
  name: string;
  order: number;
  active: boolean;
}

interface Vaccine {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
  doses: Dose[];
}

interface VaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function VaccineModal({ isOpen, onClose, token }: VaccineModalProps) {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // 🔄 Charger la liste des vaccins
  useEffect(() => {
    if (!isOpen) return;
    const fetchVaccines = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/vaccines", {
          credentials: "include",
        });
        const data = await res.json();
        setVaccines(data || []);
      } catch (err) {
        console.error("Erreur chargement vaccins:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVaccines();
  }, [isOpen]);

  // 🟢⚪ Activer/désactiver vaccin
  const toggleVaccine = (id: string) => {
    setVaccines((prev) =>
      prev.map((v) =>
        v._id === id ? { ...v, active: !v.active } : v
      )
    );
  };

  // 🟢⚪ Activer/désactiver dose
  const toggleDose = (vaccineId: string, doseId: string) => {
    setVaccines((prev) =>
      prev.map((v) =>
        v._id === vaccineId
          ? {
              ...v,
              doses: v.doses.map((d) =>
                d._id === doseId ? { ...d, active: !d.active } : d
              ),
            }
          : v
      )
    );
  };

  // 💾 Sauvegarde des changements
  const saveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/vaccines/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          updates: vaccines.map((v) => ({
            id: v._id,
            active: v.active,
            doses: v.doses.map((d) => ({ id: d._id, active: d.active })),
          })),
        }),
      });

      if (!res.ok) throw new Error("Erreur de sauvegarde");
      alert("✅ Vaccins mis à jour avec succès !");
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Échec de la mise à jour des vaccins");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <Syringe className="w-6 h-6 text-purple-600" /> Gestion des Vaccins
        </h2>

        {loading ? (
          <p className="text-gray-600">⏳ Chargement des vaccins...</p>
        ) : (
          <div className="space-y-4">
            {vaccines.map((vaccine) => (
              <div
                key={vaccine._id}
                className="border rounded-lg shadow-sm bg-gray-50 hover:bg-gray-100 transition"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() =>
                    setExpanded(expanded === vaccine._id ? null : vaccine._id)
                  }
                >
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      {vaccine.name}
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          expanded === vaccine._id ? "rotate-180" : ""
                        }`}
                      />
                    </h3>
                    {vaccine.description && (
                      <p className="text-sm text-gray-500">
                        {vaccine.description}
                      </p>
                    )}
                  </div>

                  {/* Toggle principal */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVaccine(vaccine._id);
                    }}
                    className={`relative w-12 h-6 rounded-full transition ${
                      vaccine.active ? "bg-green-500" : "bg-gray-400"
                    }`}
                  >
                    <span
                      className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        vaccine.active ? "translate-x-6" : "translate-x-0"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Doses */}
                {expanded === vaccine._id && (
                  <div className="border-t bg-white px-4 py-3 space-y-2">
                    {vaccine.doses.map((dose) => (
                      <div
                        key={dose._id}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition"
                      >
                        <span className="text-gray-700 font-medium">
                          {dose.name}
                        </span>
                        <button
                          onClick={() => toggleDose(vaccine._id, dose._id!)}
                          className={`relative w-10 h-5 rounded-full transition ${
                            dose.active ? "bg-green-500" : "bg-gray-400"
                          }`}
                        >
                          <span
                            className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              dose.active ? "translate-x-5" : "translate-x-0"
                            }`}
                          ></span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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