"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/app/lib/api";

interface StaffAgent {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface FacilityAdmin {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  healthCenter?: string;
}

export default function AgentTeamPage() {
  const { user } = useAuth();
  // District ou Agent de district : rôle district OU rôle agent + agentLevel "district" OU non encore défini (anciens comptes)
  const isDistrictAgent =
    user?.role === "district" || (user?.role === "agent" && (user.agentLevel === "district" || !user.agentLevel));
  const isFacilityAdmin = user?.role === "agent" && user.agentLevel === "facility_admin";
  const [staff, setStaff] = useState<StaffAgent[]>([]);
  const [admins, setAdmins] = useState<FacilityAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [availableCenters, setAvailableCenters] = useState<string[]>([]);

  useEffect(() => {
    if (!user || (user.role !== "agent" && user.role !== "district")) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        // Vue district : chargement des agents
        if (isDistrictAgent) {
          // Si c'est un vrai compte district (role=district), on charge sans scope
          // Si c'est un ancien agent de district, on utilise scope=admins
          const scope = user.role === "district" ? "" : "?scope=admins";
          const [adminsRes, centersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/users${scope}`, {
              credentials: "include",
            }),
            fetch(`${API_BASE_URL}/api/healthcenters`, {
              credentials: "include",
            }),
          ]);

          const adminsData = await adminsRes.json();
          if (!adminsRes.ok) {
            setError(
              adminsData?.error ||
                "Erreur lors du chargement des agents."
            );
          } else {
            const list = (adminsData.data || []) as any[];
            setAdmins(
              list.map((u) => ({
                id: u._id || u.id,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                phone: u.phone,
                healthCenter: u.healthCenter,
              }))
            );
          }

          const centersData = await centersRes.json();
          if (centersRes.ok) {
            const centers = ((Array.isArray(centersData)
              ? centersData
              : centersData.data || []) as any[]).filter(
              (c) => c.type !== "district"
            );
            setAvailableCenters(centers.map((c) => c.name as string));
          }
        }

        // Vue admin de structure : chargement de l'équipe interne
        if (isFacilityAdmin) {
          const res = await fetch(
            `${API_BASE_URL}/api/users?scope=staff`,
            { credentials: "include" }
          );
          const data = await res.json();
          if (!res.ok) {
            setError(data?.error || "Erreur lors du chargement de l'équipe.");
          } else {
            const list = (data.data || []) as any[];
            setStaff(
              list.map((u) => ({
                id: u._id || u.id,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                phone: u.phone,
              }))
            );
          }
        }
      } catch (err) {
        console.error("❌ Erreur chargement équipe/admins:", err);
        setError(
          "Erreur serveur lors du chargement des données d'équipe ou d'admins."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, isDistrictAgent, isFacilityAdmin]);

  if (!user || (user.role !== "agent" && user.role !== "district")) {
    return (
      <DashboardLayout>
        <p className="text-sm text-gray-600 mt-4">
          Accès réservé aux comptes agents.
        </p>
      </DashboardLayout>
    );
  }

  if (!isDistrictAgent && !isFacilityAdmin) {
    return (
      <DashboardLayout>
        <p className="text-sm text-gray-600 mt-4">
          Seuls l'agent de district et l'admin de structure disposent d'une vue
          d'administration ici.
        </p>
      </DashboardLayout>
    );
  }

  // Vue agent district : gestion des admins de structures
  if (isDistrictAgent) {
    return (
      <DashboardLayout>
        <div className="animate-fadeIn">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {user.role === "district" ? "Agents du district" : "Admins des structures du district"}
              </h1>
              <p className="text-sm text-gray-600">
                {user.role === "district" 
                  ? "Gestion des agents de vos centres, postes, cases, cabinets et EPS."
                  : "Gestion des administrateurs de vos centres, postes, cases, cabinets et EPS."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({ firstName: "", lastName: "", phone: "", email: "" });
                setSaveError("");
                setModalOpen(true);
              }}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
            >
              {user.role === "district" ? "Ajouter un agent" : "Ajouter un admin de structure"}
            </button>
          </div>

          {loading && <p className="text-sm text-gray-500">Chargement...</p>}
          {!loading && error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-4 py-2">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-3">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Structure
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Prénom
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Téléphone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        {user.role === "district" 
                          ? "Aucun agent enregistré pour le moment."
                          : "Aucun admin de structure enregistré pour le moment."}
                      </td>
                    </tr>
                  ) : (
                    admins.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {a.healthCenter || "—"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {a.firstName || "—"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {a.lastName || "—"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {a.phone || "—"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {a.email}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {modalOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.role === "district" ? "Nouvel agent" : "Nouvel admin de structure"}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {user.role === "district" 
                      ? "Sélectionnez une structure et renseignez les informations de l'agent."
                      : "Sélectionnez une structure et renseignez les informations de l'admin."}
                  </p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Structure de santé
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      onChange={(e) =>
                        setForm((f) => ({ ...f, healthCenter: e.target.value }))
                      }
                    >
                      <option value="">Sélectionner une structure</option>
                      {availableCenters.map((name) => (
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
                        placeholder="Ex: Awa"
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
                        placeholder="Ex: Ndiaye"
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
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="Ex: admin.centre@exemple.com"
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
                    onClick={() => {
                      setModalOpen(false);
                    }}
                    className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      if (!form.email.trim()) {
                        setSaveError("L'email est obligatoire.");
                        return;
                      }
                      if (!(form as any).healthCenter) {
                        setSaveError("Veuillez sélectionner une structure de santé.");
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
                            role: "agent",
                            healthCenter: (form as any).healthCenter,
                          }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          setSaveError(
                            data?.error ||
                              data?.message ||
                              (user.role === "district" 
                                ? "Erreur lors de la création de l'agent."
                                : "Erreur lors de la création de l'admin de structure.")
                          );
                          return;
                        }

                        setModalOpen(false);
                        setForm({
                          firstName: "",
                          lastName: "",
                          phone: "",
                          email: "",
                        } as any);
                        setSaving(false);
                        setLoading(true);
                        setError("");

                        // Recharger la liste des agents/admins
                        try {
                          const reloadScope = user.role === "district" ? "" : "?scope=admins";
                          const res2 = await fetch(
                            `${API_BASE_URL}/api/users${reloadScope}`,
                            { credentials: "include" }
                          );
                          const data2 = await res2.json();
                          if (!res2.ok) {
                            setError(
                              data2?.error ||
                                (user.role === "district" 
                                  ? "Erreur lors du rechargement des agents."
                                  : "Erreur lors du rechargement des admins.")
                            );
                          } else {
                            const list = (data2.data || []) as any[];
                            setAdmins(
                              list.map((u) => ({
                                id: u._id || u.id,
                                email: u.email,
                                firstName: u.firstName,
                                lastName: u.lastName,
                                phone: u.phone,
                                healthCenter: u.healthCenter,
                              }))
                            );
                          }
                        } catch (e) {
                          console.error("❌ Erreur rechargement:", e);
                          setError(
                            user.role === "district" 
                              ? "Erreur serveur lors du rechargement des agents."
                              : "Erreur serveur lors du rechargement des admins."
                          );
                        } finally {
                          setLoading(false);
                        }
                      } catch (err) {
                        console.error(
                          "❌ Erreur création admin de structure:",
                          err
                        );
                        setSaveError(
                          "Erreur serveur lors de la création de l'admin de structure."
                        );
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? "Création..." : (user.role === "district" ? "Créer l'agent" : "Créer l'admin")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Vue admin de structure : équipe interne (comportement existant)
  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Équipe interne
            </h1>
            <p className="text-sm text-gray-600">
              Agents internes de votre structure ({user.healthCenter || ""}).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm({ firstName: "", lastName: "", phone: "", email: "" });
              setSaveError("");
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
          >
            Ajouter un agent interne
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500">Chargement...</p>}
        {!loading && error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-4 py-2">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-3">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Prénom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Nom
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Téléphone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Aucun agent interne enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  staff.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {a.firstName || "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {a.lastName || "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {a.phone || "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {a.email}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nouvel agent interne
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  L'agent sera rattaché à votre structure ({user.healthCenter || ""}).
                </p>
              </div>
              <div className="px-5 py-4 space-y-3">
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
                      placeholder="Ex: Fatou"
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
                      placeholder="Ex: Ndiaye"
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
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="Ex: agent.interne@exemple.com"
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
                  onClick={() => {
                    setModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    if (!form.email.trim()) {
                      setSaveError("L'email est obligatoire.");
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
                          ...form,
                          role: "agent",
                          // region + healthCenter seront imposés côté backend (facility_admin)
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setSaveError(
                          data?.error || data?.message || "Erreur lors de la création de l'agent interne."
                        );
                        return;
                      }
                      // Recharger la liste
                      setModalOpen(false);
                      setForm({ firstName: "", lastName: "", phone: "", email: "" });
                      setSaving(false);
                      setLoading(true);
                      setError("");
                      // Relancer la récupération du staff
                      try {
                        const res2 = await fetch(
                          `${API_BASE_URL}/api/users?scope=staff`,
                          { credentials: "include" }
                        );
                        const data2 = await res2.json();
                        if (!res2.ok) {
                          setError(
                            data2?.error || "Erreur lors du rechargement de l'équipe."
                          );
                        } else {
                          const list = (data2.data || []) as any[];
                          setStaff(
                            list.map((u) => ({
                              id: u._id || u.id,
                              email: u.email,
                              firstName: u.firstName,
                              lastName: u.lastName,
                              phone: u.phone,
                            }))
                          );
                        }
                      } catch (e) {
                        console.error("❌ Erreur rechargement équipe:", e);
                        setError("Erreur serveur lors du rechargement de l'équipe.");
                      } finally {
                        setLoading(false);
                      }
                    } catch (err) {
                      console.error("❌ Erreur création agent interne:", err);
                      setSaveError("Erreur serveur lors de la création de l'agent interne.");
                    } finally {
                      setSaving(false);
                    }
                  }}
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
