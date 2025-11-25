"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/app/lib/api";
import { useEffect, useState } from "react";
import { Plus, Building2, MapPin } from "lucide-react";

type HealthCenterType =
  | "district"
  | "health_center"
  | "health_post"
  | "health_case"
  | "clinic"
  | "company_infirmary"
  | "other";

interface ActorHealthCenter {
  _id: string;
  name: string;
  address: string;
  region: string;
  commune?: string;
  type?: HealthCenterType;
}

type ActorTab = "health_center" | "health_post" | "health_case" | "clinic" | "eps";

export default function DistrictActorsPage() {
  const { user } = useAuth();
  const [actors, setActors] = useState<ActorHealthCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    commune: "",
    type: "health_center" as HealthCenterType,
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ActorTab>("health_center");

  useEffect(() => {
    if (!user || (user.role !== "agent" && user.role !== "district")) return;

    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/api/healthcenters`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        const normalized: ActorHealthCenter[] = list
          .filter((c: any) => c.type !== "district")
          .map((c: any) => ({
            _id: c._id,
            name: c.name,
            address: c.address,
            region: c.region,
            commune: c.commune,
            type: c.type as HealthCenterType | undefined,
          }));
        setActors(normalized);
      })
      .catch((err) => {
        console.error("❌ Erreur chargement acteurs de santé (district):", err);
        setError("Impossible de charger les acteurs de santé.");
      })
      .finally(() => setLoading(false));
  }, [user?.role]);

  const addActor = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      alert("Nom et adresse sont obligatoires");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/api/healthcenters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          commune: form.commune || undefined,
          type: form.type,
          region: user?.region, // Envoyer la région de l'utilisateur
          districtName: user?.healthCenter, // Envoyer le centre de santé de l'utilisateur
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.healthCenter) {
        console.error("Erreur serveur création acteur:", data);
        alert(data?.error || "Erreur lors de la création de l'acteur de santé");
        return;
      }

      setActors((prev) => [
        ...prev,
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
    } catch (e) {
      console.error("❌ Erreur lors de la création de l'acteur:", e);
      alert("Erreur lors de la création de l'acteur de santé");
    } finally {
      setSaving(false);
    }
  };

  if (!user || (user.role !== "agent" && user.role !== "district")) {
    return (
      <DashboardLayout>
        <p className="p-4 text-sm text-gray-600">
          Accès réservé aux agents.
        </p>
      </DashboardLayout>
    );
  }

  // Les districts et les anciens comptes agent sans agentLevel peuvent créer des acteurs
  const isDistrictAgent = user.role === "district" || (user.role === "agent" && !user.agentLevel);

  const filteredActors = actors.filter((c) => {
    if (!c.type) return false;
    if (activeTab === "eps") {
      return c.type === "other" || c.type === "company_infirmary";
    }
    return c.type === activeTab;
  });

  const tabLabel = (tab: ActorTab) => {
    switch (tab) {
      case "health_center":
        return "Centres de santé";
      case "health_post":
        return "Postes de santé";
      case "health_case":
        return "Cases de santé";
      case "clinic":
        return "Cabinets de soins";
      case "eps":
        return "Établissements publics de santé";
      default:
        return "Acteurs";
    }
  };

  const currentTabLabel = tabLabel(activeTab);

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                Acteurs de santé du district
              </h1>
              <p className="text-gray-600">
                Gestion des centres, postes, cases, cabinets et EPS rattachés au district
                {user.healthCenter ? (
                  <>
                    {" "}
                    <span className="font-semibold">{user.healthCenter}</span>
                  </>
                ) : null}
              </p>
            </div>
            {isDistrictAgent && (
              <button
                onClick={() => {
                  setForm({
                    name: "",
                    address: "",
                    commune: "",
                    type:
                      activeTab === "eps"
                        ? "other"
                        : (activeTab as Exclude<
                            ActorTab,
                            "eps"
                          > as HealthCenterType),
                  });
                  setShowModal(true);
                }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-5 w-5" />
                {activeTab === "eps"
                  ? "Nouvel EPS"
                  : activeTab === "health_center"
                  ? "Nouveau centre de santé"
                  : activeTab === "health_post"
                  ? "Nouveau poste de santé"
                  : activeTab === "health_case"
                  ? "Nouvelle case de santé"
                  : activeTab === "clinic"
                  ? "Nouveau cabinet de soins"
                  : "Nouvel acteur de santé"}
              </button>
            )}
          </div>
        </div>

        {/* Onglets par type d'acteur */}
        <div className="mb-4 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto px-1">
            {(
              [
                "health_center",
                "health_post",
                "health_case",
                "clinic",
                "eps",
              ] as ActorTab[]
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs sm:text-sm rounded-t-md border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-700 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tabLabel(tab)}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <p className="text-sm text-gray-600 px-2">Chargement des acteurs...</p>
        ) : error ? (
          <p className="text-sm text-red-600 px-2">{error}</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        Nom de la structure
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredActors.length > 0 ? (
                    filteredActors.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{c.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{c.address}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{c.commune || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {c.type === "health_center"
                            ? "Centre de santé"
                            : c.type === "health_post"
                            ? "Poste de santé"
                            : c.type === "health_case"
                            ? "Case de santé"
                            : c.type === "clinic"
                            ? "Cabinet / Clinique"
                            : c.type === "company_infirmary"
                            ? "Infirmerie d'entreprise"
                            : c.type === "other"
                            ? "Établissement public de santé"
                            : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium mb-1">
                              Aucun {currentTabLabel.toLowerCase()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Commencez par ajouter des {currentTabLabel.toLowerCase()} pour votre district.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal création d'un acteur de santé du type courant */}
        {showModal && isDistrictAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  {activeTab === "eps"
                    ? "Nouvel établissement public de santé"
                    : currentTabLabel.replace("s", "")}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la structure
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Poste de santé de Ndiakhate"
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
                      placeholder="Ex: Thiès Nord"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de structure
                    </label>
                    <input
                      value={
                        activeTab === "health_center"
                          ? "Centre de santé"
                          : activeTab === "health_post"
                          ? "Poste de santé"
                          : activeTab === "health_case"
                          ? "Case de santé"
                          : activeTab === "clinic"
                          ? "Cabinet de soins"
                          : "Établissement public de santé"
                      }
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse complète
                  </label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Ex: Quartier, rue, repère"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={addActor}
                  disabled={saving}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
