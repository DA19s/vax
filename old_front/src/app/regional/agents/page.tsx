"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/app/lib/api";
import { Users, Plus, MapPin, Mail, Phone, Building2 } from "lucide-react";

interface DistrictAgent {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  healthCenter?: string;
  region?: string;
}

export default function RegionalAgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<DistrictAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    healthCenter: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  useEffect(() => {
    if (!user || user.role !== "regional") {
      setLoading(false);
      return;
    }

    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Charger les agents de district et les districts disponibles
      const [agentsRes, centersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users`, {
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/api/healthcenters`, {
          credentials: "include",
        }),
      ]);

      const agentsData = await agentsRes.json();
      if (!agentsRes.ok) {
        setError(
          agentsData?.error ||
            "Erreur lors du chargement des agents de district."
        );
      } else {
        const list = (agentsData.data || []) as any[];
        setAgents(
          list.map((u) => ({
            id: u._id || u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone,
            healthCenter: u.healthCenter,
            region: u.region,
          }))
        );
      }

      const centersData = await centersRes.json();
      if (centersRes.ok) {
        const centers = ((Array.isArray(centersData)
          ? centersData
          : centersData.data || []) as any[]).filter(
          (c) => c.type === "district" || c.name?.toLowerCase().includes("district")
        );
        setAvailableDistricts(centers.map((c) => c.name as string));
      }
    } catch (err) {
      console.error("❌ Erreur chargement agents:", err);
      setError("Erreur serveur lors du chargement des agents de district.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!form.email.trim()) {
      setSaveError("L'email est obligatoire.");
      return;
    }
    if (!form.healthCenter) {
      setSaveError("Veuillez sélectionner un district.");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");

      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          role: "district",
          healthCenter: form.healthCenter,
          region: user?.region,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(
          data?.error ||
            data?.message ||
            "Erreur lors de la création de l'agent de district."
        );
        return;
      }

      // Succès : fermer modal et recharger
      setModalOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        healthCenter: "",
      });
      loadData();
    } catch (err) {
      console.error("❌ Erreur création agent:", err);
      setSaveError("Erreur serveur lors de la création de l'agent.");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "regional") {
    return (
      <DashboardLayout>
        <p className="text-sm text-gray-600 mt-4">
          Accès réservé aux comptes régionaux.
        </p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Agents de District</h1>
              <p className="text-blue-100">
                Gestion des agents responsables de vos districts
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({
                  firstName: "",
                  lastName: "",
                  phone: "",
                  email: "",
                  healthCenter: "",
                });
                setSaveError("");
                setModalOpen(true);
              }}
              className="px-6 py-3 rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Ajouter un agent de district
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Chargement...</p>}
        {!loading && error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-4 py-2">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    District
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    Prénom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    Nom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    Téléphone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Aucun agent de district enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          {agent.healthCenter || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {agent.firstName || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {agent.lastName || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {agent.phone || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {agent.email}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de création */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nouvel agent de district
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Créer un compte pour un responsable de district
                </p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <select
                    value={form.healthCenter}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, healthCenter: e.target.value }))
                    }
                  >
                    <option value="">Sélectionner un district</option>
                    {availableDistricts.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      placeholder="Ex: Moussa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      placeholder="Ex: Diallo"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="Ex: 77 123 45 67"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email (obligatoire)
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="Ex: moussa.diallo@district.sn"
                  />
                </div>
                {saveError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {saveError}
                  </p>
                )}
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCreateAgent}
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Création..." : "Créer l'agent"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
