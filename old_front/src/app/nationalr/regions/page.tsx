"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Pencil, Plus, Trash2, MapPin, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Region {
  id: string;
  name: string;
  active: boolean;
}

export default function RegionsPage() {
  const { user } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formRegion, setFormRegion] = useState({ id: "", name: "" });
  const [deleteTarget, setDeleteTarget] = useState<Region | null>(null);

  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const fetchRegions = useCallback(async () => {
    if (!user || user.role !== "national") return;
    const res = await fetch(`${BASE}/api/regions?onlyActive=true`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.data)) {
      const items: Region[] = data.data.map(
        (r: { _id: string; name: string; active?: boolean }) => ({
          id: r._id,
          name: r.name,
          active: r.active ?? true,
        })
      );
      setRegions(items.filter((r) => r.active));
    }
  }, [user, BASE]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const saveRegion = async () => {
    if (!formRegion.name.trim()) return;
    const isEdit = !!formRegion.id;
    const url = isEdit ? `${BASE}/api/regions/${formRegion.id}` : `${BASE}/api/regions`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: formRegion.name }),
    });

    const data = await res.json();
    if (res.ok) {
      await fetchRegions();
      setShowModal(false);
      setFormRegion({ id: "", name: "" });
    } else {
      alert(data.error || "Erreur lors de l'enregistrement");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`${BASE}/api/regions/${deleteTarget.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setRegions((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      const data = await res.json();
      alert(data.error || "Erreur lors de la suppression");
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-blue-600" />
                Gestion des Régions
              </h1>
              <p className="text-gray-600">Configuration des régions administratives</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchRegions}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Actualiser
              </button>
              <button
                onClick={() => {
                  setFormRegion({ id: "", name: "" });
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus size={18} />
                Ajouter une région
              </button>
            </div>
          </div>
        </div>

        {/* Statistique */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MapPin className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">Total des régions actives</h3>
                  <p className="text-3xl font-bold text-blue-600">{regions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grille de cartes régions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.length > 0 ? (
            regions.map((r, idx) => (
              <div
                key={r.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-slideUp"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{r.name}</h3>
                      <p className="text-sm text-gray-500">Région active</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setFormRegion({ id: r.id, name: r.name });
                      setShowModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <Pencil size={16} />
                    Modifier
                  </button>
                  <button
                    onClick={() => setDeleteTarget(r)}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <MapPin className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium mb-2">Aucune région configurée</p>
              <p className="text-gray-400 text-sm mb-4">Commencez par ajouter votre première région</p>
              <button
                onClick={() => {
                  setFormRegion({ id: "", name: "" });
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Ajouter une région
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajouter/Modifier */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                {formRegion.id ? "Modifier la région" : "Nouvelle région"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la région
              </label>
              <input
                type="text"
                value={formRegion.name}
                onChange={(e) => setFormRegion({ ...formRegion, name: e.target.value })}
                placeholder="Ex: Dakar, Thiès, Saint-Louis..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={saveRegion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm"
              >
                {formRegion.id ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Supprimer la région ?
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir supprimer la région{" "}
                <span className="font-semibold text-gray-900">{deleteTarget.name}</span> ?
                <br />
                <span className="text-sm text-red-600">Cette action est irréversible.</span>
              </p>
            </div>
            <div className="flex gap-3 p-6 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

