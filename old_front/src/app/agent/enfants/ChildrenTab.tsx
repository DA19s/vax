"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, MapPin, AlertCircle, Baby, Calendar, Phone, User, CheckCircle, UserPlus, Pencil, Trash2, Clock, Users } from "lucide-react";
import { ChildUI } from "@/app/agent/enfants/types";
import { ageFromBirthDate } from "@/app/data/children.mock";
import { apiFetch } from "@/app/lib/api";
import { useAuth } from "@/context/AuthContext";
import AgentChildDetailsModal from "./ChildDetailsModal";
import RegionalChildDetailsModal from "@/app/regional/enfants/ChildDetailsModal";

interface ChildrenTabProps {
  children: ChildUI[];
  loading: boolean;
  error: string | null;
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

export default function ChildrenTab({ children, loading, error }: ChildrenTabProps) {
  const [selectedChild, setSelectedChild] = useState<ChildUI | null>(null);
  const [isDistrictChild, setIsDistrictChild] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showLinkParentModal, setShowLinkParentModal] = useState(false);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [districtFilter, setDistrictFilter] = useState<"all" | "district" | "actors">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const router = useRouter();
  const { user } = useAuth();
  const [healthCenters, setHealthCenters] = useState<any[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDateInput, setBirthDateInput] = useState("");
  const [genderInput, setGenderInput] = useState<"M"|"F">("M");
  const [parentNameInput, setParentNameInput] = useState("");
  const [parentPhoneInput, setParentPhoneInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [regionInput, setRegionInput] = useState("");
  const [savingChild, setSavingChild] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildUI | null>(null);
  const [linkChildId, setLinkChildId] = useState("");
  const [linkParentPhone, setLinkParentPhone] = useState("");
  const [linkParentName, setLinkParentName] = useState("");
  const [linkStep, setLinkStep] = useState<1 | 2 | 3>(1);
  const [parentData, setParentData] = useState<any>(null);
  const [parentChildren, setParentChildren] = useState<any[]>([]);
  const [linking, setLinking] = useState(false);
  const [linkedChildData, setLinkedChildData] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<ChildUI | null>(null);

  // Source de vérité locale pour voir immédiatement les changements
  const [childrenLocal, setChildrenLocal] = useState<ChildUI[]>(children);
  useEffect(() => {
    setChildrenLocal(children);
  }, [children]);

  // Charger les centres de santé si l'utilisateur est district
  useEffect(() => {
    if (user?.role === "district") {
      apiFetch<any[]>("/api/healthcenters")
        .then(setHealthCenters)
        .catch((e) => console.error("Erreur chargement centres:", e));
    }
  }, [user]);

  // Régions disponibles
  const regions = useMemo(
    () => Array.from(new Set(childrenLocal.map((c) => c.region))).filter(Boolean),
    [childrenLocal]
  );

  // Filtrage
  const filteredChildren = useMemo(() => {
    return childrenLocal.filter((c) => {
      const matchSearch =
        (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.parentName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.parentPhone ?? "").includes(search);

      const matchRegion = regionFilter === "Toutes" || c.region === regionFilter;

      const matchStatus =
        statusFilter === "Tous"
          ? true
          : statusFilter === "En retard"
          ? c.status === "En retard" || c.status === "Pas à jour"
          : c.status === statusFilter;

      // Filtre district (uniquement si l'utilisateur est district)
      let matchDistrict = true;
      if (user?.role === "district" && user?.healthCenter) {
        if (districtFilter === "district") {
          matchDistrict = c.healthCenter === user.healthCenter;
        } else if (districtFilter === "actors") {
          matchDistrict = c.healthCenter !== user.healthCenter;
        }
      }

      return matchSearch && matchRegion && matchStatus && matchDistrict;
    });
  }, [childrenLocal, search, regionFilter, statusFilter, districtFilter, user]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredChildren.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filteredChildren.slice(start, start + pageSize);

  // Statistiques
  const stats = useMemo(() => {
    const total = childrenLocal.length;
    const upToDate = childrenLocal.filter((c) => c.status === "À jour").length;
    const late = childrenLocal.filter((c) => c.status === "En retard" || c.status === "Pas à jour").length;
    const scheduled = childrenLocal.filter((c) => c.nextAppointment).length;
    
    // Statistiques spécifiques au district
    let districtDirect = 0;
    let districtActors = 0;
    if (user?.role === "district" && user?.healthCenter) {
      districtDirect = childrenLocal.filter((c) => c.healthCenter === user.healthCenter).length;
      districtActors = childrenLocal.filter((c) => c.healthCenter !== user.healthCenter).length;
    }
    
    return { total, upToDate, late, scheduled, districtDirect, districtActors };
  }, [childrenLocal, user]);

  return (
    <div className="w-full overflow-x-auto">
      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total enfants</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Baby className="h-10 w-10 text-blue-600 opacity-80" />
          </div>
        </div>

        {user?.role === "district" ? (
          <>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">District Direct</p>
                  <p className="text-3xl font-bold text-green-900">{stats.districtDirect}</p>
                </div>
                <MapPin className="h-10 w-10 text-green-600 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Acteurs de Santé</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.districtActors}</p>
                </div>
                <Users className="h-10 w-10 text-purple-600 opacity-80" />
              </div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

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
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Filtres de recherche</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e')] bg-no-repeat bg-[right_0.5rem_center]"
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
              className="w-full pl-9 pr-8 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e')] bg-no-repeat bg-[right_0.5rem_center]"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="À jour">✅ À jour</option>
              <option value="En retard">⚠️ En retard</option>
              <option value="Pas à jour">🔴 Pas à jour</option>
              <option value="Non programmé">⚪ Non programmé</option>
            </select>
          </div>

          {/* Filtre district (uniquement pour le rôle district) */}
          {user?.role === "district" && (
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setDistrictFilter("all")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    districtFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Tous ({stats.total})
                </button>
                <button
                  onClick={() => setDistrictFilter("district")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    districtFilter === "district"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  District ({stats.districtDirect})
                </button>
                <button
                  onClick={() => setDistrictFilter("actors")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    districtFilter === "actors"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Acteurs ({stats.districtActors})
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={() => setShowAddChildModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" />
              <span>Enregistrer un enfant</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowLinkParentModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Liaison parentale</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
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
          <div className="min-w-full">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Enfant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Âge</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Région</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Centre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap hidden sm:table-cell">Prochain RDV</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pageItems.map((c) => {
                    const isDirect = user?.role === "district" && c.healthCenter === user?.healthCenter;
                    return (
                    <tr
                      key={c.id}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedChild(c);
                        setIsDistrictChild(isDirect);
                      }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.name} gender={c.gender} />
                          <span className="font-medium text-gray-900 text-sm sm:text-base">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-sm sm:text-base">
                        {ageFromBirthDate(c.birthDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 hidden md:table-cell">{c.region || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 hidden lg:table-cell">{c.healthCenter || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "À jour"
                              ? "bg-green-100 text-green-800"
                              : c.status === "En retard" || c.status === "Pas à jour"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell text-gray-700">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            {c.nextAppointment
                              ? new Date(c.nextAppointment).toLocaleDateString("fr-FR", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user?.role === "district" && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                isDirect
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {isDirect ? "District" : "Acteur"}
                            </span>
                          )}
                          <button
                            title="Modifier"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Préremplir le formulaire et ouvrir en mode édition
                              setEditingChild(c);
                              setFirstName(c.name.split(" ")[0] || "");
                              setLastName(c.name.split(" ").slice(1).join(" ") || "");
                              setBirthDateInput(c.birthDate ? c.birthDate.substring(0,10) : "");
                              setGenderInput(c.gender);
                              setParentNameInput(c.parentName || "");
                              setParentPhoneInput(c.parentPhone || "");
                              setAddressInput(c.address || "");
                              setRegionInput(c.region || "");
                              setShowAddChildModal(true);
                            }}
                            className="p-2 rounded hover:bg-blue-50 text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Supprimer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChildToDelete(c);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 rounded hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredChildren.length > pageSize && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 whitespace-nowrap">
                Affichage {start + 1} à {Math.min(start + pageSize, filteredChildren.length)} sur {filteredChildren.length}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Précédent
                </button>
                <button
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>

      {/* Modal détails enfant - Différent selon le type */}
      {selectedChild && isDistrictChild && (
        <AgentChildDetailsModal
          child={selectedChild}
          onClose={() => {
            setSelectedChild(null);
            setIsDistrictChild(false);
          }}
          BASE=""
          onUpdate={(updatedChild) => {
            setSelectedChild(null);
            setIsDistrictChild(false);
            router.refresh();
          }}
        />
      )}

      {selectedChild && !isDistrictChild && user?.role === "district" && (
        <RegionalChildDetailsModal
          child={selectedChild}
          onClose={() => {
            setSelectedChild(null);
            setIsDistrictChild(false);
          }}
          BASE=""
          onUpdate={(updatedChild) => {
            setSelectedChild(null);
            setIsDistrictChild(false);
            router.refresh();
          }}
        />
      )}

      {selectedChild && user?.role !== "district" && (
        <AgentChildDetailsModal
          child={selectedChild}
          onClose={() => setSelectedChild(null)}
          BASE=""
          onUpdate={(updatedChild) => {
            setSelectedChild(null);
            router.refresh();
          }}
        />
      )}

      {/* Modal d'ajout d'enfant */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Enregistrer un nouvel enfant</h3>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Prénom</label>
                          <input
                            type="text"
                            id="firstName"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Prénom"
                            value={firstName}
                            onChange={(e)=>setFirstName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nom</label>
                          <input
                            type="text"
                            id="lastName"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Nom"
                            value={lastName}
                            onChange={(e)=>setLastName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Date de naissance</label>
                        <input
                          type="date"
                          id="birthDate"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={birthDateInput}
                          onChange={(e)=>setBirthDateInput(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Genre</label>
                        <div className="mt-1 space-x-4">
                          <label className="inline-flex items-center">
                            <input type="radio" name="gender" value="M" checked={genderInput==="M"} onChange={()=>setGenderInput("M")} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                            <span className="ml-2 text-sm text-gray-700">Garçon</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input type="radio" name="gender" value="F" checked={genderInput==="F"} onChange={()=>setGenderInput("F")} className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300" />
                            <span className="ml-2 text-sm text-gray-700">Fille</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">Nom du parent</label>
                        <input
                          type="text"
                          id="parentName"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Nom et prénom du parent"
                          value={parentNameInput}
                          onChange={(e)=>setParentNameInput(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">Téléphone du parent</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                            +221
                          </span>
                          <input
                            type="tel"
                            id="parentPhone"
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="77 123 45 67"
                            value={parentPhoneInput}
                            onChange={(e)=>setParentPhoneInput(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse</label>
                        <input
                          type="text"
                          id="address"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Adresse complète"
                          value={addressInput}
                          onChange={(e)=>setAddressInput(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-700">Région</label>
                        <input
                          type="text"
                          id="region"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Région"
                          value={regionInput}
                          onChange={(e)=>setRegionInput(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  disabled={savingChild}
                  onClick={async () => {
                    try {
                      setSavingChild(true);
                      const payload:any = {
                        firstName,
                        lastName,
                        birthDate: birthDateInput,
                        gender: genderInput,
                        address: addressInput,
                        parentInfo: { parentName: parentNameInput, parentPhone: parentPhoneInput },
                      };
                      if (regionInput) payload.region = regionInput;
                      if (editingChild) {
                        const res:any = await apiFetch(`/api/children/${editingChild.id}`, { method: "PUT", body: JSON.stringify(payload) });
                        // Mise à jour locale immédiate
                        setChildrenLocal(prev => prev.map(c => c.id === editingChild.id ? {
                          ...c,
                          name: `${firstName} ${lastName}`.trim(),
                          birthDate: birthDateInput,
                          gender: genderInput,
                          parentName: parentNameInput,
                          parentPhone: parentPhoneInput,
                          address: addressInput,
                          region: regionInput || c.region,
                        } : c));
                      } else {
                        const res:any = await apiFetch("/api/children", { method: "POST", body: JSON.stringify(payload) });
                        const created = res?.child || res?.data || res; // selon la structure backend
                        // Ajout local immédiat en tête de liste
                        const newChild: ChildUI = {
                          id: created?._id || created?.id || Math.random().toString(36).slice(2),
                          name: `${firstName} ${lastName}`.trim(),
                          birthDate: birthDateInput,
                          gender: genderInput,
                          parentName: parentNameInput,
                          parentPhone: parentPhoneInput,
                          address: addressInput,
                          region: regionInput,
                          healthCenter: user?.healthCenter || "",
                          status: "Non programmé",
                          nextAppointment: null,
                        } as any;
                        setChildrenLocal(prev => [newChild, ...prev]);
                      }
                      setShowAddChildModal(false);
                      setEditingChild(null);
                      setFirstName(""); setLastName(""); setBirthDateInput(""); setParentNameInput(""); setParentPhoneInput(""); setAddressInput(""); setRegionInput(""); setGenderInput("M");
                      // Synchronisation serveur en arrière-plan
                      router.refresh();
                    } catch (e) {
                    } finally {
                      setSavingChild(false);
                    }
                  }}
                >
                  {savingChild ? (editingChild ? "Mise à jour..." : "Enregistrement...") : (editingChild ? "Mettre à jour" : "Enregistrer")}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => { setShowAddChildModal(false); setEditingChild(null); }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de liaison parentale - 3 étapes */}
      {showLinkParentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              
              {/* Étape 1 : Recherche parent */}
              {linkStep === 1 && (
                <>
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                    <h3 className="text-2xl font-bold">Rechercher un parent</h3>
                    <p className="text-blue-100 mt-1">Entrez le numéro de téléphone et le nom de la maman</p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de téléphone *
                      </label>
                      <div className="flex rounded-lg shadow-sm">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 font-medium">
                          +221
                        </span>
                        <input
                          type="tel"
                          value={linkParentPhone}
                          onChange={(e) => setLinkParentPhone(e.target.value)}
                          placeholder="77 123 45 67"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de la maman
                      </label>
                      <input
                        type="text"
                        value={linkParentName}
                        onChange={(e) => setLinkParentName(e.target.value)}
                        placeholder="Fatou Diop"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowLinkParentModal(false);
                        setLinkStep(1);
                        setLinkParentPhone("");
                        setLinkParentName("");
                      }}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        if (!linkParentPhone) {
                          alert("Veuillez entrer un numéro de téléphone");
                          return;
                        }
                        try {
                          setLinking(true);
                          const result: any = await apiFetch("/api/children/search-parent", {
                            method: "POST",
                            body: JSON.stringify({
                              phone: linkParentPhone,
                              parentName: linkParentName
                            })
                          });
                          
                          if (result.success) {
                            setParentData(result.parent);
                            // Charger les enfants
                            const childrenResult: any = await apiFetch(
                              `/api/children/parent-children?phone=${encodeURIComponent(linkParentPhone)}`
                            );
                            if (childrenResult.success) {
                              setParentChildren(childrenResult.children);
                              setLinkStep(2);
                            }
                          } else {
                            alert(result.message || "Parent introuvable");
                          }
                        } catch (e: any) {
                          alert(e.message || "Erreur lors de la recherche");
                        } finally {
                          setLinking(false);
                        }
                      }}
                      disabled={linking || !linkParentPhone}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {linking ? "Recherche..." : "Rechercher"}
                    </button>
                  </div>
                </>
              )}
              
              {/* Étape 2 : Sélection enfant */}
              {linkStep === 2 && parentData && (
                <>
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
                    <h3 className="text-2xl font-bold">{parentData.name}</h3>
                    <p className="text-green-100 mt-1">{parentData.phone}</p>
                    <p className="text-sm text-green-200 mt-2">
                      {parentData.childrenCount} {parentData.childrenCount > 1 ? "enfants" : "enfant"}
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Sélectionnez un enfant à lier</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {parentChildren.map((child) => (
                        <div
                          key={child.id || child._id}
                          onClick={async () => {
                            try {
                              setLinking(true);
                              const result: any = await apiFetch("/api/children/link-selected", {
                                method: "POST",
                                body: JSON.stringify({
                                  childId: child.id || child._id,
                                  healthCenter: user?.healthCenter,
                                  region: user?.region
                                })
                              });
                              
                              if (result.success) {
                                setLinkedChildData(result.child);
                                setLinkStep(3);
                                router.refresh();
                              } else {
                                alert(result.message || "Erreur lors de la liaison");
                              }
                            } catch (e: any) {
                              alert(e.message || "Erreur lors de la liaison");
                            } finally {
                              setLinking(false);
                            }
                          }}
                          className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                child.gender === "F" ? "bg-gradient-to-br from-pink-400 to-pink-500" : "bg-gradient-to-br from-blue-400 to-blue-500"
                              }`}>
                                {(child.firstName?.[0] || "?") + (child.lastName?.[0] || "")}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {child.name || `${child.firstName || ""} ${child.lastName || ""}`.trim()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {child.gender === "F" ? "Fille" : "Garçon"} • {child.ageFormatted || "Âge inconnu"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {child.healthCenter || "Centre non assigné"}
                                </p>
                              </div>
                            </div>
                            
                            {child.vaccinationProgress && (
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  {child.vaccinationProgress.percentage}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {child.vaccinationProgress.done}/{child.vaccinationProgress.total} vaccins
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-between">
                    <button
                      onClick={() => {
                        setLinkStep(1);
                        setParentData(null);
                        setParentChildren([]);
                      }}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      ← Retour
                    </button>
                    <button
                      onClick={() => {
                        setShowLinkParentModal(false);
                        setLinkStep(1);
                        setLinkParentPhone("");
                        setLinkParentName("");
                        setParentData(null);
                        setParentChildren([]);
                      }}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}
              
              {/* Étape 3 : Succès */}
              {linkStep === 3 && linkedChildData && (
                <>
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Enfant lié avec succès !</h3>
                    <p className="text-gray-600 mb-6">
                      <span className="font-semibold">{linkedChildData.name}</span> a été ajouté à votre liste d'enfants
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        Vous pouvez maintenant suivre les vaccinations de cet enfant
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-center">
                    <button
                      onClick={() => {
                        setShowLinkParentModal(false);
                        setLinkStep(1);
                        setLinkParentPhone("");
                        setLinkParentName("");
                        setParentData(null);
                        setParentChildren([]);
                        setLinkedChildData(null);
                      }}
                      className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteModalOpen && childToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer cet enfant ?</h3>
                <p className="text-sm text-gray-500 mt-0.5">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-gray-700">Vous êtes sur le point de supprimer:</p>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="font-medium text-gray-900">{childToDelete.name}</p>
                <p className="text-sm text-gray-600">{childToDelete.healthCenter || childToDelete.region || ""}</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setChildToDelete(null); }}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!childToDelete) return;
                  try {
                    await apiFetch(`/api/children/${childToDelete.id}`, { method: "DELETE" });
                    setDeleteModalOpen(false);
                    setChildToDelete(null);
                    router.refresh();
                  } catch (e) {}
                }}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
