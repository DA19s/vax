"use client";

import DashboardLayout from "@/app/components/DashboardLayout"; // ✅ Sidebar + Header
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Users, Mail, Phone, Building2, MapPin, AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/app/lib/api";

type HealthCenterType =
  | "district"
  | "health_center"
  | "health_post"
  | "health_case"
  | "clinic"
  | "company_infirmary"
  | "other";

interface Agent {
  id: string;
  email: string;
  role: "agent" | "district"; // Peut être agent ou district
  region: string;
  healthCenter: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  agentLevel?: "district" | "facility_admin" | "facility_staff";
}

interface HealthCenter {
  id: string;
  name: string;
  region: string;
  address: string;
  commune?: string;
  type?: HealthCenterType;
}

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [centers, setCenters] = useState<HealthCenter[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    healthCenter: "",
  });

  useEffect(() => {
    if (!user || user.role !== "regional") return;

    // Charger les districts (pas les agents)
    fetch(`${API_BASE_URL}/api/users?role=district`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { data: Agent[] }) => setAgents(data.data || []))
      .catch((err) => console.error("❌ Erreur chargement agents:", err));

    // Charger les centres
    fetch(`${API_BASE_URL}/api/healthcenters`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: any) => {
        // Backend peut renvoyer soit un tableau direct, soit { data: [...] }
        const list = Array.isArray(data) ? data : (data?.data || []);
        const normalized = list.map((c: any) => ({
          id: c._id ?? c.id ?? c.name,
          name: c.name,
          region: c.region,
          address: c.address,
          commune: c.commune,
          type: c.type as HealthCenterType | undefined,
        }));
        setCenters(normalized);
      })
      .catch((err) => console.error("❌ Erreur chargement centres:", err));
  }, [user?.role]);

  const districtCenters = useMemo(
    () => centers.filter((c) => c.type === "district"),
    [centers]
  );

  const districtAgents = useMemo(
    () => agents, // Tous les agents chargés sont déjà des districts (role=district)
    [agents]
  );

  const addAgent = async () => {
    if (!form.email || !form.healthCenter) {
      alert("Veuillez remplir les champs obligatoires");
      return;
    }

    const selectedCenter = centers.find((c) => c.name === form.healthCenter);
    if (!selectedCenter || selectedCenter.type !== "district") {
      alert("Un compte régional ne peut créer que des comptes pour les centres de type 'District'.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ...form, role: "district" }),
      });

      const data = await res.json();
      if (res.ok) {
        setAgents([...agents, data.user]);
        setShowModal(false);
        setForm({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          healthCenter: "",
        });
      } else {
        alert(data.error || "Erreur lors de la création");
      }
    } catch (err) {
      console.error("❌ Erreur création agent:", err);
      alert("Erreur serveur");
    }
  };

  const deleteAgent = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setAgents(agents.filter((a) => a.id !== deleteId));
        setDeleteId(null);
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("❌ Erreur suppression agent:", err);
      alert("Erreur serveur");
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
                <Users className="h-8 w-8 text-blue-600" />
                Agents de district
              </h1>
              <p className="text-gray-600">
                Gestion des représentants des districts de votre région
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouvel agent district
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Prénom</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nom</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Téléphone
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Email
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Centre
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Région
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {districtAgents.length > 0 ? (
                  districtAgents.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.firstName || "—"}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.lastName || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.phone || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.healthCenter}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.region}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setDeleteId(a.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium mb-1">Aucun agent de district</p>
                          <p className="text-sm text-gray-500">Commencez par ajouter un représentant de district</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Ajout */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h2 className="text-lg font-bold mb-4">Nouvel Agent</h2>
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                placeholder="Prénom"
                className="border w-full p-2 rounded mb-3"
              />
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Nom"
                className="border w-full p-2 rounded mb-3"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Téléphone"
                className="border w-full p-2 rounded mb-3"
              />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="border w-full p-2 rounded mb-3"
              />
              <select
                value={form.healthCenter}
                onChange={(e) =>
                  setForm({ ...form, healthCenter: e.target.value })
                }
                className="border w-full p-2 rounded mb-3"
              >
                <option value="">-- Sélectionner un district --</option>
                {districtCenters.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                    {c.commune ? ` – ${c.commune}` : ""}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Annuler
                </button>
                <button
                  onClick={addAgent}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Suppression */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h2 className="text-lg font-bold mb-4">
                Confirmer la suppression ?
              </h2>
              <p className="mb-4 text-gray-600">
                Voulez-vous vraiment supprimer cet agent ?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Annuler
                </button>
                <button
                  onClick={deleteAgent}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
