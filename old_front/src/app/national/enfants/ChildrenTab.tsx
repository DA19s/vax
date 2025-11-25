"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, MapPin, AlertCircle, Baby, Calendar, Phone, User, CheckCircle } from "lucide-react";
import { ChildUI } from "@/app/agent/enfants/types";
import { ageFromBirthDate } from "@/app/data/children.mock";
import ChildDetailsModal from "./ChildDetailsModal";

interface ChildrenTabProps {
  children: ChildUI[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

function Avatar({ name, gender }: { name: string; gender: "F" | "M" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bg = gender === "F" ? "bg-gradient-to-br from-pink-400 to-pink-500" : "bg-gradient-to-br from-blue-400 to-blue-500";

  return (
    <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-white ${bg} shadow-sm ring-2 ring-white transition-transform hover:scale-110`}>
      {initials}
    </div>
  );
}

export default function ChildrenTab({ children, loading, error, onRefresh }: ChildrenTabProps) {
  const router = useRouter();
  const [selectedChild, setSelectedChild] = useState<ChildUI | null>(null);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Régions disponibles
  const regions = useMemo(
    () => Array.from(new Set(children.map((c) => c.region))).filter(Boolean),
    [children]
  );

  // Filtrage + Tri (plus récemment enregistré en premier)
  const filteredChildren = useMemo(() => {
    const list = children.filter((c) => {
      const matchSearch =
        (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.parentName ?? "").toLowerCase().includes(search.toLowerCase());

      const matchRegion = regionFilter === "Toutes" || c.region === regionFilter;

      const matchStatus =
        statusFilter === "Tous"
          ? true
          : statusFilter === "En retard"
          ? c.status === "En retard" || c.status === "Pas à jour"
          : c.status === statusFilter;

      return matchSearch && matchRegion && matchStatus;
    });

    // Utilitaire pour convertir ObjectId -> timestamp si createdAt absent
    const objectIdTime = (id?: string) => {
      if (!id || id.length < 8) return 0;
      const tsHex = id.substring(0, 8);
      const seconds = parseInt(tsHex, 16);
      return Number.isNaN(seconds) ? 0 : seconds * 1000;
    };

    // Tri par createdAt desc (les plus récents en haut), fallback sur ObjectId
    return list
      .slice()
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : objectIdTime(a.id);
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : objectIdTime(b.id);
        return tb - ta;
      });
  }, [children, search, regionFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredChildren.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filteredChildren.slice(start, start + pageSize);

  // Statistiques
  const stats = useMemo(() => {
    const total = children.length;
    const upToDate = children.filter((c) => c.status === "À jour").length;
    const late = children.filter((c) => c.status === "En retard" || c.status === "Pas à jour").length;
    const scheduled = children.filter((c) => c.nextAppointment).length;
    
    return { total, upToDate, late, scheduled };
  }, [children]);

  return (
    <div>
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total enfants</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Baby className="h-10 w-10 text-blue-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">À jour</p>
              <p className="text-3xl font-bold text-green-900">{stats.upToDate}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">En retard</p>
              <p className="text-3xl font-bold text-red-900">{stats.late}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">RDV programmés</p>
              <p className="text-3xl font-bold text-purple-900">{stats.scheduled}</p>
            </div>
            <Calendar className="h-10 w-10 text-purple-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtres de recherche</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="Toutes">Toutes les régions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="À jour">✅ À jour</option>
              <option value="En retard">⚠️ En retard</option>
              <option value="Pas à jour">🔴 Pas à jour</option>
              <option value="Non programmé">⚪ Non programmé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des enfants...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Baby className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun enfant trouvé</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Enfant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Âge</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Région</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Centre</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pageItems.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedChild(c)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} gender={c.gender} />
                          <span className="font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {ageFromBirthDate(c.birthDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{c.region}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{c.healthCenter}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            c.status === "À jour"
                              ? "bg-green-100 text-green-700"
                              : c.status === "En retard" || c.status === "Pas à jour"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredChildren.length > pageSize && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage {start + 1} à {Math.min(start + pageSize, filteredChildren.length)} sur {filteredChildren.length}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Précédent
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal détails */}
      {selectedChild && (
        <ChildDetailsModal
          child={selectedChild}
          onClose={() => setSelectedChild(null)}
          BASE=""
          onUpdate={(updatedChild: ChildUI) => {
            // Rafraîchir la page pour recharger les données (liste + stats)
            setSelectedChild(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
