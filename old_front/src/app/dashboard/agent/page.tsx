"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

/* -------------------------------------------------------------------------- */
/* 🧩 Types ----------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
type DoseData = { day: string; value: number };

type NotificationData = {
  title: string;
  message: string;
  icon?: string;
  createdAt: string;
};

type AgentDashboardStats = {
  totalChildren: number;
  appointmentsToday: number;
  totalAppointmentsPlanned: number;
  vaccinationsSaisies: number;
  remindersSent: number;
  lowStocks: { vaccine: string; remaining: number }[];
  expiringLots: { vaccine: string; lot: string; expiresInDays: number }[];
  dosesPerDay: DoseData[];
};

type DistrictStats = {
  district: string;
  region?: string;
  children: {
    total: number;
    withAtLeastOneVaccination: number;
    withActiveAppointments: number;
  };
  vaccinations: {
    done: number;
    scheduled: number;
    missed: number;
    cancelled: number;
  };
  appointments: {
    planned: number;
    done: number;
    missed: number;
    cancelled: number;
  };
};

type HealthCenterType =
  | "district"
  | "health_center"
  | "health_post"
  | "health_case"
  | "clinic"
  | "company_infirmary"
  | "other";

type HealthCenter = {
  _id: string;
  name: string;
  address: string;
  region: string;
  commune?: string;
  type?: HealthCenterType;
};

const defaultStats: AgentDashboardStats = {
  totalChildren: 0,
  appointmentsToday: 0,
  totalAppointmentsPlanned: 0,
  vaccinationsSaisies: 0,
  remindersSent: 0,
  lowStocks: [],
  expiringLots: [],
  dosesPerDay: [],
};

/* -------------------------------------------------------------------------- */
/* 🧭 Component principal ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */
export default function AgentDashboardPage() {
  useInjectSlideAnimation();
  const { user, loading } = useAuth();
  const router = useRouter();

  /* Données du dashboard */
  const [stats, setStats] = useState<AgentDashboardStats>(defaultStats);
  
  // 🔍 DEBUG: Logger les stats à chaque changement
  useEffect(() => {
    console.log("📈 Stats updated:", stats);
  }, [stats]);
  const [graphStats, setGraphStats] = useState<DoseData[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<NotificationData[]>([]);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [districtStats, setDistrictStats] = useState<DistrictStats | null>(null);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedActor, setSelectedActor] = useState<HealthCenter | null>(null);
  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState("");

  /* 🎛 Filtres */
  const [globalFilter, setGlobalFilter] = useState<"week" | "month" | "year">(
    "week"
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [doseFilter, setDoseFilter] = useState<"day" | "month" | "year">("day");

  /* ---------------------------------------------------------------------- */
  /* 🔄 Redirection vers le nouveau dashboard                              */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    router.replace("/agent/dashboard");
  }, [router]);

  /* ---------------------------------------------------------------------- */
  /* 🔐 Redirection si non agent                                            */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!loading && (!user || (user.role !== "agent" && user.role !== "district"))) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const isDistrict = user?.role === "district" || (user?.role === "agent" && !user?.agentLevel);

  const openAdminModal = (actor: HealthCenter) => {
    setSelectedActor(actor);
    setAdminForm({ firstName: "", lastName: "", email: "", phone: "" });
    setAdminError("");
    setAdminModalOpen(true);
  };

  const createFacilityAdmin = async () => {
    if (!selectedActor) return;
    if (!adminForm.email.trim()) {
      setAdminError("L'email de l'admin est obligatoire.");
      return;
    }

    try {
      setAdminSaving(true);
      setAdminError("");

      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...adminForm,
          role: "agent",
          healthCenter: selectedActor.name,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAdminError(
          data?.error || data?.message || "Erreur lors de la création de l'admin de l'acteur."
        );
        return;
      }

      setAdminModalOpen(false);
      setSelectedActor(null);
      setAdminForm({ firstName: "", lastName: "", email: "", phone: "" });
    } catch (err) {
      console.error("❌ Erreur création admin acteur:", err);
      setAdminError("Erreur serveur lors de la création de l'admin.");
    } finally {
      setAdminSaving(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* 🏥 Charger les centres de santé (pour vue District)                    */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!user || user.role !== "agent") return;

    fetch("http://localhost:5000/api/healthcenters", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        const normalized: HealthCenter[] = list.map((c: any) => ({
          _id: c._id,
          name: c.name,
          address: c.address,
          region: c.region,
          commune: c.commune,
          type: c.type as HealthCenterType | undefined,
        }));
        setHealthCenters(normalized);
      })
      .catch((err) => console.error("❌ Erreur chargement centres (dashboard agent):", err));
  }, [user?.role]);

  const districtCenter =
    isDistrict && user?.healthCenter
      ? healthCenters.find((c) => c.name === user.healthCenter)
      : undefined;

  const actorsInCommune: HealthCenter[] =
    districtCenter && districtCenter.commune
      ? healthCenters.filter(
          (c) =>
            c._id !== districtCenter._id &&
            c.commune === districtCenter.commune &&
            c.type !== "district"
        )
      : [];

  const districtName = districtStats?.district || districtCenter?.name;
  const districtRegion =
    districtStats?.region || districtCenter?.region || user?.region || "";

  /* ---------------------------------------------------------------------- */
  /* 📊 Stats agrégées du district (agents de niveau district uniquement)   */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!isDistrict) return;

    setDistrictLoading(true);
    setDistrictError(null);

    fetch("http://localhost:5000/api/stats/district", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DistrictStats) => {
        setDistrictStats(data);
      })
      .catch((err) => {
        console.error("❌ Erreur chargement stats district:", err);
        setDistrictError("Impossible de charger les statistiques du district.");
      })
      .finally(() => {
        setDistrictLoading(false);
      });
  }, [isDistrict]);

  /* ---------------------------------------------------------------------- */
  /* 📊 Charger les cartes globales                                         */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!user || user.role !== "agent") return;

    let url = "http://localhost:5000/api/dashboard/agent";
    const qs = new URLSearchParams();

    if (globalFilter) qs.append("period", globalFilter);
    if (selectedDate) qs.append("date", selectedDate);
    url += "?" + qs.toString();

    console.log("🔍 Dashboard - Fetching from:", url);
    fetch(url, { credentials: "include" })
      .then((res) => {
        console.log("📊 Dashboard - Response status:", res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: AgentDashboardStats) => {
        console.log("✅ Dashboard - Data received:", data);
        console.log("  - totalChildren:", data.totalChildren);
        console.log("  - vaccinationsSaisies:", data.vaccinationsSaisies);
        setStats({ ...defaultStats, ...data });
      })
      .catch((err) => console.error("❌ Erreur global dashboard:", err));
  }, [user?.role, globalFilter, selectedDate]);

  /* ---------------------------------------------------------------------- */
  /* 📈 Charger les données du graphique (indépendant)                     */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!user || user.role !== "agent") return;

    let url = "http://localhost:5000/api/dashboard/agent";
    const qs = new URLSearchParams();

    if (doseFilter === "day") qs.append("period", "week");
    else if (doseFilter === "month") qs.append("period", "year");
    else if (doseFilter === "year") qs.append("period", "all");

    url += "?" + qs.toString();

    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        let sorted = data.dosesPerDay || [];

        if (doseFilter === "day") {
          const order = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
          sorted = sorted.sort(
            (a: DoseData, b: DoseData) =>
              order.indexOf(a.day) - order.indexOf(b.day)
          );
        } else if (doseFilter === "month") {
          const months = [
            "Jan",
            "Fév",
            "Mar",
            "Avr",
            "Mai",
            "Juin",
            "Juil",
            "Août",
            "Sep",
            "Oct",
            "Nov",
            "Déc",
          ];
          sorted = sorted.sort(
            (a: DoseData, b: DoseData) =>
              months.indexOf(a.day) - months.indexOf(b.day)
          );
        } else if (doseFilter === "year") {
          sorted = sorted.sort(
            (a: DoseData, b: DoseData) => parseInt(a.day) - parseInt(b.day)
          );
        }

        setGraphStats(sorted);
      })
      .catch((err) => console.error("❌ Erreur graphique:", err));
  }, [user?.role, doseFilter]);

  /* ---------------------------------------------------------------------- */
  /* 🔔 Notifications récentes — temps réel (Socket.IO)                     */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!user || user.role !== "agent") return;

    fetch("http://localhost:5000/api/notifications/recent", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRecentNotifs(data.notifications.slice(0, 3) || []);
      })
      .catch((err) =>
        console.error("❌ Erreur chargement notifications:", err)
      );

    const socket = io("http://localhost:5000");

    socket.on("notification", (notif: NotificationData) => {
      setRecentNotifs((prev) => [notif, ...prev].slice(0, 3));
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.role]);

  /* ---------------------------------------------------------------------- */
  /* 🌀 Défilement automatique des alertes toutes les 5 secondes            */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (recentNotifs.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNotifIndex((prev) => (prev + 1) % recentNotifs.length);
    }, 5000); // toutes les 5 secondes

    return () => clearInterval(interval);
  }, [recentNotifs]);

  if (loading) return <p>Chargement...</p>;

  const currentNotif = recentNotifs[currentNotifIndex];

  /* ---------------------------------------------------------------------- */
  /* 🧱 Rendu du Dashboard                                                  */
  /* ---------------------------------------------------------------------- */
  return (
    <DashboardLayout>
      {/* ✅ En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-2xl font-bold">
          {isDistrict ? "Tableau de bord District" : "Tableau de bord Agent"}
        </h2>

        <div className="flex gap-3">
          <select
            value={globalFilter}
            onChange={(e) =>
              setGlobalFilter(e.target.value as "week" | "month" | "year")
            }
            className="border border-gray-300 rounded-md text-sm p-2 focus:outline-none"
          >
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
            <option value="year">Année</option>
          </select>
 
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-md text-sm p-2 focus:outline-none"
          />
        </div>
      </div>

      {isDistrict && districtCenter && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-1">
            District {districtName || districtCenter.name}
            {districtRegion && (
              <>
                {" "}
                <span className="text-blue-900">– Région {districtRegion}</span>
              </>
            )}
          </p>
          <p className="text-sm text-blue-900">
            Hôpital / centre de référence : <span className="font-semibold">{districtCenter.name}</span>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Ce compte District supervise tous les enfants, rendez-vous et acteurs de santé de ce district.
          </p>
          {districtName && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/agent/enfants?district=${encodeURIComponent(districtName)}`
                  )
                }
                className="px-3 py-1.5 text-xs rounded-md border border-blue-500 text-blue-700 bg-white hover:bg-blue-50 transition-colors"
              >
                Voir les enfants du district
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/agent/rendez-vous?district=${encodeURIComponent(districtName)}`
                  )
                }
                className="px-3 py-1.5 text-xs rounded-md border border-blue-500 text-blue-700 bg-white hover:bg-blue-50 transition-colors"
              >
                Voir les rendez-vous du district
              </button>
            </div>
          )}
        </div>
      )}

      {isDistrict && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">Statistiques du district</h3>
          {districtLoading && (
            <p className="text-sm text-gray-500">Chargement des statistiques du district...</p>
          )}
          {districtError && (
            <p className="text-sm text-red-600">{districtError}</p>
          )}
          {!districtLoading && !districtError && districtStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card
                title="Enfants du district"
                value={districtStats.children.total}
              />
              <Card
                title="Enfants vaccinés (≥1 dose)"
                value={districtStats.children.withAtLeastOneVaccination}
              />
              <Card
                title="Enfants avec RDV actifs"
                value={districtStats.children.withActiveAppointments}
              />
              <Card
                title="Vaccinations réalisées"
                value={districtStats.vaccinations.done}
              />
            </div>
          )}
        </div>
      )}

      {/* ✅ 4 Cartes principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card title="Enfants suivis" value={stats.totalChildren} />
        <Card title="Rendez-vous du jour" value={stats.appointmentsToday} />
        <Card
          title="Total rendez-vous prévus"
          value={stats.totalAppointmentsPlanned}
        />
        <Card title="Vaccinations saisies" value={stats.vaccinationsSaisies} />
      </div>

      {/* ✅ Alertes dynamiques défilantes */}
      <div className="bg-white shadow rounded-lg p-4 mb-6 h-28 flex flex-col justify-center overflow-hidden relative">
        <h3 className="font-semibold mb-2 text-lg flex items-center gap-2">
          ⚡ Alertes récentes
        </h3>

        {recentNotifs.length === 0 ? (
          <p className="text-gray-500 text-center">Aucune alerte récente</p>
        ) : (
          <div
            key={currentNotifIndex}
            className="transition-all duration-700 ease-in-out transform animate-slide"
          >
            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-700 flex items-center gap-1">
                  {currentNotif.icon || "🔔"} {currentNotif.title}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(currentNotif.createdAt).toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                {currentNotif.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Graphique indépendant */}
      <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-2">
          <h3 className="font-semibold text-lg">Couverture — Doses</h3>

          <select
            value={doseFilter}
            onChange={(e) =>
              setDoseFilter(e.target.value as "day" | "month" | "year")
            }
            className="border border-gray-300 rounded-md text-sm p-1 focus:outline-none"
          >
            <option value="day">Jour</option>
            <option value="month">Mois</option>
            <option value="year">Année</option>
          </select>
        </div>

        {graphStats.length === 0 ? (
          <p className="text-gray-500 mt-2">Aucune donnée disponible</p>
        ) : (
          <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-2 mt-3">
            <div className="flex flex-col justify-between h-36 text-xs text-gray-500 mr-1">
              {Array.from({ length: 6 }, (_, i) =>
                Math.round(
                  (Math.max(...graphStats.map((d) => d.value)) / 5) * (5 - i)
                )
              ).map((val, i) => (
                <span key={i}>{val}</span>
              ))}
            </div>

            <div className="flex gap-3 items-end justify-center h-36 overflow-x-auto flex-1 relative">
              {graphStats.map((d, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center relative"
                >
                  <div
                    className="bg-blue-600 w-6 md:w-8 rounded transition-all duration-300 relative"
                    style={{ height: `${Math.min(d.value * 10, 120)}px` }}
                  >
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex items-center justify-center px-2 py-1 rounded bg-black text-white text-xs whitespace-nowrap">
                      {d.day} : {d.value} dose{d.value > 1 ? "s" : ""}
                    </div>
                  </div>
                  <span className="text-xs mt-1 text-gray-700 font-medium">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isDistrict && (
        <div className="mt-6 bg-white shadow rounded-lg p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Acteurs de la commune</h3>
            <span className="text-xs text-gray-500">
              {actorsInCommune.length} structure{actorsInCommune.length > 1 ? "s" : ""}
            </span>
          </div>
          {actorsInCommune.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun acteur de santé n'est encore enregistré pour cette commune. Vous pourrez bientôt créer et gérer les
              postes, centres, cliniques, etc. directement depuis cette vue District.
            </p>
          ) : (
            <div className="space-y-2">
              {actorsInCommune.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-md px-3 py-2 bg-gray-50 gap-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-600">
                      {c.commune || c.region} • {c.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    <span className="text-xs text-gray-500">
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
                        : "Acteur de santé"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openAdminModal(c)}
                      className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors"
                    >
                      Créer l'admin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {adminModalOpen && selectedActor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Créer l'admin de l'acteur
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Acteur : <span className="font-medium">{selectedActor.name}</span>
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
                    value={adminForm.firstName}
                    onChange={(e) =>
                      setAdminForm((f) => ({ ...f, firstName: e.target.value }))
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
                    value={adminForm.lastName}
                    onChange={(e) =>
                      setAdminForm((f) => ({ ...f, lastName: e.target.value }))
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
                  value={adminForm.phone}
                  onChange={(e) =>
                    setAdminForm((f) => ({ ...f, phone: e.target.value }))
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
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="Ex: admin.poste@exemple.com"
                />
              </div>
              {adminError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {adminError}
                </p>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  setAdminModalOpen(false);
                  setSelectedActor(null);
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={createFacilityAdmin}
                disabled={adminSaving}
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {adminSaving ? "Création..." : "Créer l'admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/* ✅ Carte compacte, centrée, valeurs en vert */
function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center justify-center text-center">
      <p className="text-gray-600 mb-1 font-medium">{title}</p>
      <p className="text-2xl font-bold text-green-600">{value}</p>
    </div>
  );
}

/* 🌀 Animation CSS glissante (injectée côté client après montage) */
function useInjectSlideAnimation() {
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-agent-slide-style", "true");
    style.innerHTML = `
@keyframes slide {
  0% { opacity: 0; transform: translateY(20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}
.animate-slide {
  animation: slide 5s ease-in-out;
}
`;
    document.head.appendChild(style);
    return () => {
      try {
        document.head.removeChild(style);
      } catch {}
    };
  }, []);
}
