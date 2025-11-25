"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Users, Baby, RefreshCw, AlertCircle } from "lucide-react";
import ParentCard from "@/app/components/ParentCard";
import ChildInfoCard from "@/app/components/ChildInfoCard";
import { apiFetch } from "@/app/lib/api";

interface Parent {
  parentPhone: string;
  parentName: string;
  parentEmail?: string;
  childrenCount: number;
  children: any[];
  regions?: string[];
  healthCenters?: string[];
}

export default function ParentsTab() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);

  // Charger les parents
  const loadParents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<any>("/api/parents", { cache: "no-store" });
      if (response.success && Array.isArray(response.data)) {
        setParents(response.data);
      } else {
        setParents([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParents();
  }, []);

  // Filtrage
  const filteredParents = useMemo(() => {
    if (!search) return parents;
    
    return parents.filter((p) =>
      p.parentName.toLowerCase().includes(search.toLowerCase()) ||
      p.parentPhone.includes(search)
    );
  }, [parents, search]);

  // Statistiques
  const stats = useMemo(() => {
    const totalParents = parents.length;
    const totalChildren = parents.reduce((sum, p) => sum + p.childrenCount, 0);
    const avgChildren = totalParents > 0 ? (totalChildren / totalParents).toFixed(1) : "0";
    const maxChildren = parents.length > 0 ? Math.max(...parents.map(p => p.childrenCount)) : 0;
    
    return { totalParents, totalChildren, avgChildren, maxChildren };
  }, [parents]);

  return (
    <div>
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Total parents</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalParents}</p>
            </div>
            <Users className="h-10 w-10 text-purple-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total enfants</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalChildren}</p>
            </div>
            <Baby className="h-10 w-10 text-blue-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Moyenne enfants/parent</p>
              <p className="text-3xl font-bold text-green-900">{stats.avgChildren}</p>
            </div>
            <Baby className="h-10 w-10 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Max enfants</p>
              <p className="text-3xl font-bold text-orange-900">{stats.maxChildren}</p>
            </div>
            <Baby className="h-10 w-10 text-orange-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un parent par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadParents}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Liste des parents */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des parents...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={loadParents}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun parent trouvé</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParents.map((parent) => (
            <ParentCard
              key={parent.parentPhone}
              parent={parent}
              onClick={() => setSelectedParent(parent)}
            />
          ))}
        </div>
      )}

      {/* Modal liste des enfants du parent */}
      {selectedParent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedParent.parentName}</h2>
                  <p className="text-purple-100 mt-1">{selectedParent.parentPhone}</p>
                  <p className="text-purple-200 text-sm mt-2">
                    {selectedParent.childrenCount} {selectedParent.childrenCount > 1 ? "enfants" : "enfant"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedParent(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Liste des enfants */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enfants de ce parent</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedParent.children.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => {
                      setSelectedChild(child);
                      setSelectedParent(null);
                    }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        child.gender === "F" ? "bg-gradient-to-br from-pink-400 to-pink-500" : "bg-gradient-to-br from-blue-400 to-blue-500"
                      }`}>
                        {child.firstName?.[0]}{child.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{child.firstName} {child.lastName}</p>
                        <p className="text-sm text-gray-500">{child.gender === "F" ? "Fille" : "Garçon"}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Région</span>
                        <span className="font-medium text-gray-900">{child.region}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Centre</span>
                        <span className="font-medium text-gray-900">{child.healthCenter}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Statut</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          child.status === "À jour"
                            ? "bg-green-100 text-green-700"
                            : child.status === "En retard"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {child.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedParent(null)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détails enfant */}
      {selectedChild && (
        <ChildInfoCard
          child={selectedChild}
          onClose={() => setSelectedChild(null)}
        />
      )}
    </div>
  );
}
