"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Plus, Building2, MapPin, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/app/lib/api";

type HealthCenterType =
  | "district"
  | "health_center"
  | "health_post"
  | "health_case"
  | "clinic"
  | "company_infirmary"
  | "other";

interface HealthCenter {
  _id: string; // Assurez-vous que _id est défini ici
  name: string;
  address: string;
  region: string;
  commune?: string;
  type?: HealthCenterType;
}

export default function HealthCentersPage() {
  const { user } = useAuth();
  const [centers, setCenters] = useState<HealthCenter[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    commune: "",
    type: "district" as HealthCenterType,
  });
  const [selectedCenter, setSelectedCenter] = useState<HealthCenter | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<HealthCenter | null>(null);

  // Chargement des centres de santé existants
  useEffect(() => {
    if (!user || user.role !== "regional" || !user.region) return;

    fetch(`${API_BASE_URL}/api/healthcenters`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("📊 Centres reçus:", data);
        // Backend peut renvoyer { data: [...] } ou directement [...]
        const centersList = Array.isArray(data) ? data : (data?.data || []);
        setCenters(centersList);
      })
      .catch((err) =>
        console.error("Erreur lors de la récupération des centres", err)
      );
  }, [user?.role, user?.region]);

  // Préremplir le formulaire lorsqu'on édite
  useEffect(() => {
    if (selectedCenter) {
      setForm({
        name: selectedCenter.name,
        address: selectedCenter.address,
        commune: selectedCenter.commune || "",
        type: (selectedCenter.type as HealthCenterType) || "district",
      });
    } else {
      setForm({ name: "", address: "", commune: "", type: "district" });
    }
  }, [selectedCenter]);

  // Ajouter un nouveau centre de santé
  const addCenter = async () => {
    if (!form.name.trim() || !form.address.trim()) return;

    try {
      // Si un centre est sélectionné, on met à jour (PUT), sinon on crée (POST)
      if (selectedCenter) {
        const res = await fetch(`${API_BASE_URL}/api/healthcenters/${selectedCenter._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: form.name,
            address: form.address,
            commune: form.commune || undefined,
            type: form.type,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.healthCenter) {
          console.error("Erreur serveur:", data);
          alert(data?.error || "Erreur lors de la mise à jour du centre");
          return;
        }
        setCenters((prev) =>
          prev.map((c) =>
            c._id === selectedCenter._id
              ? {
                  ...c,
                  name: data.healthCenter.name,
                  address: data.healthCenter.address,
                  commune: data.healthCenter.commune,
                  type: data.healthCenter.type,
                }
              : c
          )
        );
        setSelectedCenter(null);
        setShowModal(false);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/healthcenters`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: form.name,
            address: form.address,
            region: user?.region,
            commune: form.commune || undefined,
            type: form.type,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data?.healthCenter) {
          console.error("Erreur serveur:", data);
          alert(data?.error || "Erreur lors de l'ajout du centre");
          return;
        }

        setCenters([
          ...centers,
          {
            _id: data.healthCenter._id,
            name: data.healthCenter.name,
            address: data.healthCenter.address,
            region: data.healthCenter.region,
            commune: data.healthCenter.commune,
            type: data.healthCenter.type,
          },
        ]);
        setForm({ name: "", address: "", commune: "", type: "health_center" });
        setShowModal(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du centre:", error);
      alert("Erreur lors de l'ajout du centre");
    }
  };

  // Supprimer un centre
  const deleteCenter = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/healthcenters/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Erreur suppression:", data);
        alert(data?.error || "Suppression impossible");
        return;
      }
      setCenters((prev) => prev.filter((c) => c._id !== id));
      setCenterToDelete(null);
      setDeleteModalOpen(false);
    } catch (e) {
      console.error("Erreur lors de la suppression:", e);
      alert("Erreur lors de la suppression");
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
                <Building2 className="h-8 w-8 text-blue-600" />
                Districts
              </h1>
              <p className="text-gray-600">
                Gestion des districts sanitaires de la région <span className="font-semibold">{user?.region || "—"}</span>
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCenter(null);
                setShowModal(true);
              }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouveau district
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Nom du district
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Adresse
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Commune</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {centers.length > 0 ? (
                  centers.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{c.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{c.address}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{c.commune || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {c.type === "district"
                          ? "District"
                          : c.type === "health_center"
                          ? "Centre de santé"
                          : c.type === "health_post"
                          ? "Poste de santé"
                          : c.type === "health_case"
                          ? "Case de santé"
                          : c.type === "clinic"
                          ? "Cabinet / Clinique"
                          : c.type === "company_infirmary"
                          ? "Infirmerie d'entreprise"
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Modifier"
                            onClick={() => {
                              setSelectedCenter(c);
                              setShowModal(true);
                            }}
                            className="p-2 rounded hover:bg-blue-50 text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Supprimer"
                            onClick={() => {
                              setCenterToDelete(c);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 rounded hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium mb-1">Aucun district</p>
                          <p className="text-sm text-gray-500">Commencez par ajouter un district pour votre région</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal (création / modification) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                {selectedCenter ? "Modifier le district" : "Nouveau district"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du district
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: District de Dakar"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commune
                  </label>
                  <input
                    value={form.commune}
                    onChange={(e) => setForm({ ...form, commune: e.target.value })}
                    placeholder="Ex: Thiès, Tivaouane"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de structure
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as HealthCenterType })}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="district">District (hôpital de référence)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète
                </label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Ex: Avenue Cheikh Anta Diop, Dakar"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={addCenter}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {selectedCenter ? (
                  <>
                    <Pencil className="h-4 w-4" /> Mettre à jour
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteModalOpen && centerToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer ce centre ?</h3>
                <p className="text-sm text-gray-500 mt-0.5">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-gray-700">
                Vous êtes sur le point de supprimer le centre:
              </p>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="font-medium text-gray-900">{centerToDelete.name}</p>
                <p className="text-sm text-gray-600">{centerToDelete.address}</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCenterToDelete(null);
                }}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => centerToDelete && deleteCenter(centerToDelete._id)}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
