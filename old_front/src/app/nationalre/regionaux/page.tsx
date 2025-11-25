"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Pencil, Plus, Trash2, Users, MapPin, Mail, Phone, User, X, AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/app/lib/api";

type Role = "user" | "agent" | "regional" | "national";

interface RegionalRow {
  id: string;
  email: string;
  role: "regional";
  region: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface RegionRow {
  id: string;
  name: string;
}

interface ApiUser {
  id: string;
  email: string;
  role: Role;
  region?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface ApiUsersPayload {
  message?: string;
  data?: ApiUser[];
}

interface ApiRegionsPayload {
  data: { _id: string; name: string }[];
}

// Using centralized apiFetch for timeout and 401 handling

export default function RegionauxPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [regionaux, setRegionaux] = useState<RegionalRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RegionalRow | null>(null);
  const [editTarget, setEditTarget] = useState<RegionalRow | null>(null);

  // Formulaire création/édition
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    region: "",
  });

  // Charger régionaux
  useEffect(() => {
    if (authLoading || !user || user.role !== "national") return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await apiFetch<ApiUsersPayload>(
          "/api/users?role=regional",
          { timeoutMs: 12000 }
        );
        const items =
          (payload.data ?? [])
            .filter((u) => u.role === "regional")
            .map<RegionalRow>((u) => ({
              id: u.id,
              email: u.email,
              role: "regional",
              region: u.region || "",
              firstName: u.firstName,
              lastName: u.lastName,
              phone: u.phone,
            })) || [];
        setRegionaux(items);
      } catch (e) {
        const err = e as ApiError;
        if (err.status === 401) {
          logout();
          router.replace("/login");
        } else {
          setError(err.message || "Erreur lors du chargement des régionaux");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.role, authLoading, logout, router]);

  // Charger régions
  useEffect(() => {
    if (authLoading || !user || user.role !== "national") return;
    (async () => {
      try {
        const payload = await apiFetch<ApiRegionsPayload>("/api/regions", {
          timeoutMs: 12000,
        });
        setRegions(payload.data.map((r) => ({ id: r._id, name: r.name })));
      } catch (e) {
        const err = e as ApiError;
        if (err.status === 401) {
          logout();
          router.replace("/login");
        } else {
          setError((prev) => prev ?? "Erreur lors du chargement des régions");
        }
      }
    })();
  }, [user?.role, authLoading, logout, router]);

  // Ajouter régional
  const addRegional = async () => {
    if (!form.email.trim() || !form.region.trim()) {
      alert("Email et région sont obligatoires.");
      return;
    }
    try {
      const data = await apiFetch<{ user: ApiUser }>("/api/users", {
        method: "POST",
        timeoutMs: 12000,
        body: JSON.stringify({ ...form, role: "regional" }),
      });
      const created = data.user as ApiUser;
      setRegionaux((prev) => [
        ...prev,
        {
          id: created.id,
          email: created.email,
          role: "regional",
          region: created.region || "",
          firstName: created.firstName,
          lastName: created.lastName,
          phone: created.phone,
        },
      ]);
      setShowForm(false);
      setForm({ firstName: "", lastName: "", phone: "", email: "", region: "" });
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) {
        logout();
        router.replace("/login");
      } else {
        alert(err.message || "Erreur lors de la création");
      }
    }
  };

  // Modifier régional
  const updateRegional = async () => {
    if (!editTarget) return;
    try {
      await apiFetch(`/api/users/${editTarget.id}`, {
        method: "PUT",
        timeoutMs: 12000,
        body: JSON.stringify(form),
      });
      setRegionaux((prev) =>
        prev.map((r) => (r.id === editTarget.id ? { ...r, ...form } : r))
      );
      setEditTarget(null);
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) {
        logout();
        router.replace("/login");
      } else {
        alert(err.message || "Erreur lors de la mise à jour");
      }
    }
  };

  // Supprimer régional
  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
        timeoutMs: 12000,
      });
      setRegionaux((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) {
        logout();
        router.replace("/login");
      } else {
        alert(err.message || "Erreur lors de la suppression");
      }
    }
  };

  const regionOptions = useMemo(
    () =>
      regions.map((r) => (
        <option key={r.id} value={r.name}>
          {r.name}
        </option>
      )),
    [regions]
  );

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                Gestion des Régionaux
              </h1>
              <p className="text-gray-600">Utilisateurs responsables des régions</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              Ajouter un régional
            </button>
          </div>
        </div>

        {/* Statistique */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">Total régionaux</h3>
                  <p className="text-3xl font-bold text-blue-600">{regionaux.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grille de cartes régionaux */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des régionaux...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regionaux.length > 0 ? (
              regionaux.map((r, idx) => {
                const initials = `${r.firstName?.charAt(0) || ''}${r.lastName?.charAt(0) || ''}`.toUpperCase() || 'R';
                
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-slideUp"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ring-2 ring-white">
                        {initials}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {r.firstName || r.lastName ? `${r.firstName || ''} ${r.lastName || ''}`.trim() : 'Sans nom'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4" />
                          <span>{r.region || 'Non assigné'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{r.email}</span>
                      </div>
                      {r.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{r.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setEditTarget(r);
                          setForm({
                            firstName: r.firstName || '',
                            lastName: r.lastName || '',
                            phone: r.phone || '',
                            email: r.email,
                            region: r.region || '',
                          });
                        }}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                      >
                        <Pencil size={16} />
                        Modifier
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Users className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium mb-2">Aucun régional enregistré</p>
                <p className="text-gray-400 text-sm mb-4">Commencez par ajouter votre premier régional</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  Ajouter un régional
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Nouveau régional</h2>
            <div className="space-y-3">
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                placeholder="Prénom"
                className="border w-full p-2 rounded"
              />
              <input
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                placeholder="Nom"
                className="border w-full p-2 rounded"
              />
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="Téléphone"
                className="border w-full p-2 rounded"
              />
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="Email"
                className="border w-full p-2 rounded"
              />
              <select
                value={form.region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, region: e.target.value }))
                }
                className="border w-full p-2 rounded"
              >
                <option value="">— Sélectionner une région —</option>
                {regionOptions}
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Annuler
              </button>
              <button
                onClick={addRegional}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edition */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Éditer régional</h2>
            <div className="space-y-3">
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                placeholder="Prénom"
                className="border w-full p-2 rounded"
              />
              <input
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                placeholder="Nom"
                className="border w-full p-2 rounded"
              />
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="Téléphone"
                className="border w-full p-2 rounded"
              />
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="Email"
                className="border w-full p-2 rounded"
              />
              <select
                value={form.region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, region: e.target.value }))
                }
                className="border w-full p-2 rounded"
              >
                <option value="">— Sélectionner une région —</option>
                {regionOptions}
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Annuler
              </button>
              <button
                onClick={updateRegional}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-3">Confirmer la suppression</h2>
            <p className="text-gray-600 mb-5">
              Voulez-vous vraiment supprimer le régional{" "}
              <span className="font-semibold">
                {deleteTarget.firstName || "—"}
              </span>{" "}
              (<span className="font-mono">{deleteTarget.email}</span>) ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Annuler
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2 bg-red-600 text-white rounded"
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
