"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  LayoutDashboard,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardShell from "@/app/dashboard/components/DashboardShell";
import StatCard from "@/app/dashboard/components/StatCard";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

type ChildrenResponse =
  | {
      total?: number;
      items?: unknown[];
    }
  | unknown[];

type MonthlyVaccinationPoint = {
  month: string;
  value: number;
};

type VaccineCoverageSlice = {
  name: string;
  value: number;
};

type RegionAttention = {
  region: string;
  retard: number;
};

type LaggingEntry = {
  name: string;
  retard: number;
};

type HealthCenterMonthlySeries = {
  name: string;
  monthly: MonthlyVaccinationPoint[];
};

type NationalDashboardStats = {
  totalChildren: number;
  totalVaccinations: number;
  monthlyVaccinations: MonthlyVaccinationPoint[];
  coverageByVaccine: VaccineCoverageSlice[];
  topRegions: RegionAttention[];
};

type RegionalDashboardStats = {
  region: string;
  totalChildren: number;
  vaccinatedChildren: number;
  coverageRate: number;
  activeCampaigns: number;
  monthlyVaccinations: MonthlyVaccinationPoint[];
  coverageByVaccine: VaccineCoverageSlice[];
  topDistricts: LaggingEntry[];
};

type AgentDosePoint = {
  date: string;
  value: number;
};

type AgentStockAlert = {
  vaccine: string;
  remaining: number;
};

type AgentLotAlert = {
  vaccine: string;
  lot: string;
  expiresInDays: number;
};

type AgentDashboardStats = {
  totalChildren: number;
  appointmentsToday: number;
  totalAppointmentsPlanned: number;
  vaccinationsSaisies: number;
  remindersSent: number;
  lowStocks: AgentStockAlert[];
  expiringLots: AgentLotAlert[];
  dosesPerDay: AgentDosePoint[];
};

type AgentAlert = {
  title: string;
  message: string;
  createdAt: string;
  icon?: string;
};

type AgentPeriod = "week" | "month" | "year";
type DoseFilter = "day" | "month" | "year";

type HealthCenterMonthlySeries = {
  name: string;
  monthly: MonthlyVaccinationPoint[];
};

type DistrictDashboardStats = {
  district: string;
  totalChildren: number;
  vaccinatedChildren: number;
  coverageRate: number;
  activeCampaigns: number;
  coverageByVaccine: VaccineCoverageSlice[];
  topHealthCenters: LaggingEntry[];
  monthlyByHealthCenter: HealthCenterMonthlySeries[];
};

const CHART_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
const MONTH_LABEL_NORMALIZER: Record<string, string> = {
  janv: "Jan",
  "janv.": "Jan",
  févr: "Fév",
  "févr.": "Fév",
  mars: "Mar",
  avr: "Avr",
  "avr.": "Avr",
  mai: "Mai",
  juin: "Jun",
  juil: "Jul",
  "juil.": "Jul",
  août: "Aoû",
  sept: "Sep",
  "sept.": "Sep",
  oct: "Oct",
  "oct.": "Oct",
  nov: "Nov",
  "nov.": "Nov",
  déc: "Déc",
  "déc.": "Déc",
};

const normalizeMonthLabel = (label?: string | null) => {
  if (!label) return "";
  const normalizedKey = label.toLowerCase().replace(/\s/g, "");
  return MONTH_LABEL_NORMALIZER[normalizedKey] ?? label;
};

const AGENT_DAY_DISPLAY_ORDER = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
];

const FRENCH_DAY_LOOKUP = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const FRENCH_MONTH_ORDER = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const dayLabelFromDate = (dateString: string) => {
  const date = new Date(dateString);
  return FRENCH_DAY_LOOKUP[date.getDay()] ?? "Jour";
};

const monthLabelFromDate = (dateString: string) => {
  const date = new Date(dateString);
  return FRENCH_MONTH_ORDER[date.getMonth()] ?? "Mois";
};

export default function DashboardPage() {
  const { accessToken, user } = useAuth();
  const [totalChildren, setTotalChildren] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [nationalStats, setNationalStats] =
    useState<NationalDashboardStats | null>(null);
  const [nationalLoading, setNationalLoading] = useState(false);
  const [nationalError, setNationalError] = useState<string | null>(null);
  const [regionalStats, setRegionalStats] =
    useState<RegionalDashboardStats | null>(null);
  const [regionalLoading, setRegionalLoading] = useState(false);
  const [regionalError, setRegionalError] = useState<string | null>(null);
  const [districtStats, setDistrictStats] =
    useState<DistrictDashboardStats | null>(null);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [agentStats, setAgentStats] =
    useState<AgentDashboardStats | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [agentAlerts, setAgentAlerts] = useState<AgentAlert[]>([]);
  const [currentAgentAlertIndex, setCurrentAgentAlertIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState<AgentPeriod>("week");
  const [selectedDate, setSelectedDate] = useState("");
  const [doseFilter, setDoseFilter] = useState<DoseFilter>("day");
  const role = user?.role?.toUpperCase() ?? "";
  const isRegional = role === "REGIONAL";
  const isNational = role === "NATIONAL";
  const isDistrict = role === "DISTRICT";
  const isAgent = role === "AGENT";
  const isAgentAdmin = isAgent && user?.agentLevel === "ADMIN";
  const regionName = (user?.regionName ?? "").trim();
  const districtName = (user?.districtName ?? "").trim();
  const centerLabel = (user?.healthCenterName ?? "").trim();

  useInjectSlideAnimation();

  useEffect(() => {
    const loadChildrenStats = async () => {
      if (!accessToken || isNational || isRegional || isDistrict) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/children`, {
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }

        const data: ChildrenResponse = await res.json();
        if (Array.isArray(data)) {
          setTotalChildren(data.length);
        } else {
          setTotalChildren(
            typeof data.total === "number"
              ? data.total
              : Array.isArray(data.items)
                ? data.items.length
                : 0,
          );
        }
      } catch (error) {
        console.error("Erreur récupération enfants:", error);
        setTotalChildren(0);
      } finally {
        setLoading(false);
      }
    };

    loadChildrenStats();
  }, [accessToken, isDistrict, isNational, isRegional]);

  useEffect(() => {
    const fetchNationalStats = async () => {
      if (!isNational || !accessToken) {
        setNationalStats(null);
        setNationalError(null);
        setNationalLoading(false);
        return;
      }

      try {
        setNationalLoading(true);
        setNationalError(null);

        const res = await fetch(`${API_URL}/api/dashboard/national`, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }

        const data: NationalDashboardStats = await res.json();
        setNationalStats(data);
      } catch (error) {
        console.error("Erreur récupération stats nationales:", error);
        setNationalStats(null);
        setNationalError(
          "Impossible de charger les données du tableau de bord.",
        );
      } finally {
        setNationalLoading(false);
      }
    };

    fetchNationalStats();
  }, [accessToken, isNational, role]);

  useEffect(() => {
    const fetchRegionalStats = async () => {
      if (!isRegional || !accessToken) {
        setRegionalStats(null);
        setRegionalError(null);
        setRegionalLoading(false);
        return;
      }

      try {
        setRegionalLoading(true);
        setRegionalError(null);

        const res = await fetch(`${API_URL}/api/dashboard/regional`, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }

        const data: RegionalDashboardStats = await res.json();
        setRegionalStats(data);
      } catch (error) {
        console.error("Erreur récupération stats régionales:", error);
        setRegionalStats(null);
        setRegionalError(
          "Impossible de charger les données du tableau de bord régional.",
        );
      } finally {
        setRegionalLoading(false);
      }
    };

    fetchRegionalStats();
  }, [accessToken, isRegional, role]);

  useEffect(() => {
    const fetchDistrictStats = async () => {
      if (!isDistrict || !accessToken) {
        setDistrictStats(null);
        setDistrictError(null);
        setDistrictLoading(false);
        return;
      }

      try {
        setDistrictLoading(true);
        setDistrictError(null);

        const res = await fetch(`${API_URL}/api/dashboard/district`, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }

        const data: DistrictDashboardStats = await res.json();
        setDistrictStats(data);
      } catch (error) {
        console.error("Erreur récupération stats district:", error);
        setDistrictStats(null);
        setDistrictError(
          "Impossible de charger les données du tableau de bord district.",
        );
      } finally {
        setDistrictLoading(false);
      }
    };

    fetchDistrictStats();
  }, [accessToken, isDistrict, role]);

  useEffect(() => {
    const fetchAgentStats = async () => {
      if (!isAgent || !accessToken) {
        setAgentStats(null);
        setAgentError(null);
        setAgentLoading(false);
        return;
      }

      try {
        setAgentLoading(true);
        setAgentError(null);

        const params = new URLSearchParams();
        if (globalFilter) {
          params.append("period", globalFilter);
        }
        if (selectedDate) {
          params.append("date", selectedDate);
        }

        const url =
          params.size > 0
            ? `${API_URL}/api/dashboard/agent?${params.toString()}`
            : `${API_URL}/api/dashboard/agent`;

        const res = await fetch(url, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }

        const data: AgentDashboardStats = await res.json();
        setAgentStats(data);
      } catch (error) {
        console.error("Erreur récupération stats agent:", error);
        setAgentStats(null);
        setAgentError(
          "Impossible de charger les données du tableau de bord agent.",
        );
      } finally {
        setAgentLoading(false);
      }
    };

    fetchAgentStats();
  }, [accessToken, globalFilter, isAgent, selectedDate]);

  useEffect(() => {
    if (agentAlerts.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentAgentAlertIndex(
        (prev) => (prev + 1) % agentAlerts.length,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [agentAlerts.length]);

  const agentGraphData = useMemo(() => {
    if (!isAgent || !agentStats?.dosesPerDay) {
      return [];
    }

    if (doseFilter === "day") {
      const counts = new Map<string, number>();
      for (const point of agentStats.dosesPerDay) {
        const label = dayLabelFromDate(point.date);
        counts.set(label, (counts.get(label) ?? 0) + point.value);
      }
      return AGENT_DAY_DISPLAY_ORDER.map((label) => ({
        label,
        value: counts.get(label) ?? 0,
      }));
    }

    if (doseFilter === "month") {
      const counts = new Map<string, number>();
      for (const point of agentStats.dosesPerDay) {
        const label = monthLabelFromDate(point.date);
        counts.set(label, (counts.get(label) ?? 0) + point.value);
      }

      return FRENCH_MONTH_ORDER.map((label) => ({
        label,
        value: counts.get(label) ?? 0,
      })).filter((entry) => entry.value > 0);
    }

    const counts = new Map<string, number>();
    for (const point of agentStats.dosesPerDay) {
      const year = new Date(point.date).getFullYear().toString();
      counts.set(year, (counts.get(year) ?? 0) + point.value);
    }

    return Array.from(counts.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([label, value]) => ({ label, value }));
  }, [agentStats?.dosesPerDay, doseFilter, isAgent]);

  if (isNational) {
    if (nationalLoading) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-gray-600">
                Chargement du tableau de bord...
              </p>
            </div>
          </div>
        </DashboardShell>
      );
    }

    if (nationalError) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="font-medium text-red-600">{nationalError}</p>
            </div>
          </div>
        </DashboardShell>
      );
    }

    if (!nationalStats) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        </DashboardShell>
      );
    }

    const statCards: {
      title: string;
      value: string;
      icon: LucideIcon;
      bgColor: string;
      textColor: string;
      trend: string;
      trendUp: boolean;
    }[] = [
      {
        title: "Enfants enregistrés",
        value: nationalStats.totalChildren.toLocaleString(),
        icon: Users,
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
        trend: "+12%",
        trendUp: true,
      },
      {
        title: "Vaccinations totales",
        value: nationalStats.totalVaccinations.toLocaleString(),
        icon: Activity,
        bgColor: "bg-green-50",
        textColor: "text-green-600",
        trend: "+8%",
        trendUp: true,
      },
    ];

    return (
      <DashboardShell active="/dashboard">
        <div className="animate-fadeIn">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Tableau de bord National
            </h1>
            <p className="text-gray-600">
              Vue d'ensemble des statistiques nationales de vaccination
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="animate-slideUp cursor-pointer rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className={`rounded-lg p-3 ${card.bgColor}`}>
                      <Icon className={`h-6 w-6 ${card.textColor}`} />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {card.trendUp ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`font-medium ${
                          card.trendUp ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {card.trend}
                      </span>
                    </div>
                  </div>
                  <h3 className="mb-2 text-sm font-medium text-gray-600">
                    {card.title}
                  </h3>
                  <p className={`text-3xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Évolution mensuelle
                </h3>
                <div className="text-sm text-gray-500">6 derniers mois</div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={nationalStats.monthlyVaccinations ?? []}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop
                        offset="95%"
                        stopColor="#3B82F6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", r: 4 }}
                    activeDot={{ r: 6 }}
                    fill="url(#colorValue)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Répartition par vaccin
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={nationalStats.coverageByVaccine ?? []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name }) =>
                      typeof name === "string" ? name : ""
                    }
                    labelLine
                  >
                    {(nationalStats.coverageByVaccine ?? []).map(
                      (entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={
                            CHART_COLORS[index % CHART_COLORS.length]
                          }
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Régions nécessitant attention
              </h3>
              <span className="text-sm text-gray-500">Top 5</span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={nationalStats.topRegions ?? []}>
                <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="region"
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                  cursor={{ fill: "rgba(239, 68, 68, 0.1)" }}
                />
                <Bar dataKey="retard" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (isRegional) {
    if (regionalLoading) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-gray-600">
                Chargement du tableau de bord...
              </p>
            </div>
          </div>
        </DashboardShell>
      );
    }

    if (regionalError) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="font-medium text-red-600">{regionalError}</p>
            </div>
          </div>
        </DashboardShell>
      );
    }

    if (!regionalStats) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        </DashboardShell>
      );
    }

    const statCards = [
      {
        title: "Enfants enregistrés",
        value: regionalStats.totalChildren.toLocaleString(),
        color: "text-blue-600",
      },
      {
        title: "Enfants vaccinés",
        value: regionalStats.vaccinatedChildren.toLocaleString(),
        color: "text-green-600",
      },
      {
        title: "Couverture régionale",
        value: `${regionalStats.coverageRate}%`,
        color: "text-purple-600",
      },
      {
        title: "Campagnes actives",
        value: regionalStats.activeCampaigns.toLocaleString(),
        color: "text-orange-600",
      },
    ];

    const regionalLineData =
      regionalStats.monthlyVaccinations?.map((point) => ({
        month: normalizeMonthLabel(point.month),
        vaccinations: point.value,
      })) ?? [];

    return (
      <DashboardShell active="/dashboard">
        <div className="animate-fadeIn">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-gray-900">
                  <LayoutDashboard className="h-8 w-8 text-blue-600" />
                  Tableau de Bord
                </h1>
                <p className="text-gray-600">
                  Vue d'ensemble de la région{" "}
                  <span className="font-semibold">
                    {regionalStats.region || "Non définie"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <p className={`mt-2 text-2xl font-semibold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Évolution régionale
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-flex h-3 w-3 rounded-full bg-blue-500" />
                  Vaccinations
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={regionalLineData}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="vaccinations"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Activity className="h-5 w-5 text-blue-600" />
                Répartition par vaccin
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={regionalStats.coverageByVaccine ?? []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine
                    label={({ name }) => (typeof name === "string" ? name : "")}
                  >
                    {(regionalStats.coverageByVaccine ?? []).map(
                      (entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {(!regionalStats.coverageByVaccine ||
                regionalStats.coverageByVaccine.length === 0) && (
                <div className="py-6 text-center text-gray-500">
                  Aucune donnée de vaccination disponible
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Users className="h-5 w-5 text-blue-600" />
                Top 5 districts en retard
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionalStats.topDistricts ?? []}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number) => [
                      `${value} retard(s)`,
                      "Cas",
                    ]}
                  />
                  <Bar dataKey="retard" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {(!regionalStats.topDistricts ||
                regionalStats.topDistricts.length === 0) && (
                <div className="py-6 text-center text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (isDistrict) {
    if (districtLoading) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-gray-600">
                Chargement du tableau de bord...
              </p>
            </div>
          </div>
        </DashboardShell>
      );
    }

    if (districtError) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="font-medium text-red-600">{districtError}</p>
            </div>
          </div>
        </DashboardShell>
      );
    }

    if (!districtStats) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        </DashboardShell>
      );
    }

    const statCards = [
      {
        title: "Enfants enregistrés",
        value: districtStats.totalChildren.toLocaleString(),
        color: "text-blue-600",
      },
      {
        title: "Enfants vaccinés",
        value: districtStats.vaccinatedChildren.toLocaleString(),
        color: "text-green-600",
      },
      {
        title: "Couverture du district",
        value: `${districtStats.coverageRate}%`,
        color: "text-purple-600",
      },
      {
        title: "Campagnes actives",
        value: districtStats.activeCampaigns.toLocaleString(),
        color: "text-orange-600",
      },
    ];

    const baseMonths =
      districtStats.monthlyByHealthCenter?.[0]?.monthly ?? [];
    const districtLineData = baseMonths.map((point, index) => {
      const label = normalizeMonthLabel(point.month) || point.month;
      const row: Record<string, number | string> = {
        month: label,
      };
      (districtStats.monthlyByHealthCenter ?? []).forEach((series) => {
        row[series.name] = series.monthly[index]?.value ?? 0;
      });
      return row;
    });

    const lineSeries = districtStats.monthlyByHealthCenter ?? [];

    return (
      <DashboardShell active="/dashboard">
        <div className="animate-fadeIn">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-gray-900">
                  <LayoutDashboard className="h-8 w-8 text-blue-600" />
                  Tableau de Bord District
                </h1>
                <p className="text-gray-600">
                  Vue d'ensemble du district{" "}
                  <span className="font-semibold">
                    {districtStats.district || "Non défini"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <p className={`mt-2 text-2xl font-semibold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Évolution par centre de santé
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-flex h-3 w-3 rounded-full bg-blue-500" />
                  Vaccinations
                </div>
              </div>
              {districtLineData.length > 0 && lineSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={districtLineData}>
                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    {lineSeries.map((series, index) => (
                      <Line
                        key={series.name}
                        type="monotone"
                        dataKey={series.name}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Activity className="h-5 w-5 text-blue-600" />
                Répartition par vaccin
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={districtStats.coverageByVaccine ?? []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine
                    label={({ name }) => (typeof name === "string" ? name : "")}
                  >
                    {(districtStats.coverageByVaccine ?? []).map(
                      (entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {(!districtStats.coverageByVaccine ||
                districtStats.coverageByVaccine.length === 0) && (
                <div className="py-6 text-center text-gray-500">
                  Aucune donnée de vaccination disponible
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Users className="h-5 w-5 text-blue-600" />
                Top 5 centres de santé en retard
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={districtStats.topHealthCenters ?? []}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number) => [
                      `${value} retard(s)`,
                      "Cas",
                    ]}
                  />
                  <Bar dataKey="retard" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {(!districtStats.topHealthCenters ||
                districtStats.topHealthCenters.length === 0) && (
                <div className="py-6 text-center text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (isAgent) {
    if (agentLoading) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-gray-600">
                Chargement du tableau de bord...
              </p>
            </div>
          </div>
        </DashboardShell>
      );
    }

    if (agentError) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="font-medium text-red-600">{agentError}</p>
            </div>
          </div>
        </DashboardShell>
      );
    }

    if (!agentStats) {
      return (
        <DashboardShell active="/dashboard">
          <div className="flex h-96 items-center justify-center">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        </DashboardShell>
      );
    }

    const agentCards = [
      { title: "Enfants suivis", value: agentStats.totalChildren },
      { title: "Rendez-vous du jour", value: agentStats.appointmentsToday },
      {
        title: "Rendez-vous planifiés",
        value: agentStats.totalAppointmentsPlanned,
      },
      { title: "Vaccinations saisies", value: agentStats.vaccinationsSaisies },
    ];

    const currentAlert = agentAlerts[currentAgentAlertIndex];
    const lowStocks = agentStats.lowStocks ?? [];
    const expiringLots = agentStats.expiringLots ?? [];
    const maxGraphValue = agentGraphData.reduce(
      (max, entry) => Math.max(max, entry.value),
      0,
    );
    const graphScale = maxGraphValue > 0 ? maxGraphValue : 5;
    const graphTicks = Array.from({ length: 6 }, (_, index) =>
      Math.round((graphScale / 5) * (5 - index)),
    );

    return (
      <DashboardShell active="/dashboard">
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Tableau de bord Agent
              </h1>
              <p className="text-sm text-slate-500">
                Suivi des activités de votre centre.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={globalFilter}
                onChange={(event) =>
                  setGlobalFilter(event.target.value as AgentPeriod)
                }
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
                <option value="year">Année</option>
              </select>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {agentCards.map((card) => (
              <AgentStatCard
                key={card.title}
                title={card.title}
                value={card.value}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">
                ⚡ Alertes récentes
              </h3>
              {agentAlerts.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucune alerte récente
                </p>
              ) : (
                <div
                  key={currentAgentAlertIndex}
                  className="animate-slide rounded-lg border border-blue-100 bg-blue-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-700">
                      {currentAlert.icon ?? "🔔"} {currentAlert.title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(currentAlert.createdAt).toLocaleTimeString(
                        "fr-FR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    {currentAlert.message}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Couverture — Doses
                </h3>
                <select
                  value={doseFilter}
                  onChange={(event) =>
                    setDoseFilter(event.target.value as DoseFilter)
                  }
                  className="rounded-md border border-slate-200 px-3 py-1 text-sm"
                >
                  <option value="day">Jour</option>
                  <option value="month">Mois</option>
                  <option value="year">Année</option>
                </select>
              </div>
              {agentGraphData.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucune donnée disponible
                </p>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex flex-col justify-between text-xs text-slate-400">
                    {graphTicks.map((value, index) => (
                      <span key={`tick-${index}`}>{value}</span>
                    ))}
                  </div>
                  <div className="flex flex-1 items-end gap-3 overflow-x-auto">
                    {agentGraphData.map((entry) => {
                      const heightPercent =
                        graphScale === 0
                          ? 0
                          : Math.round((entry.value / graphScale) * 100);
                      return (
                        <div
                          key={entry.label}
                          className="group flex flex-col items-center"
                        >
                          <div
                            className="relative w-6 rounded bg-blue-600 transition-all duration-300 md:w-8"
                            style={{ height: `${heightPercent}%` }}
                          >
                            <div className="pointer-events-none absolute bottom-full left-1/2 hidden -translate-x-1/2 translate-y-1 rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:flex">
                              {entry.value} dose
                              {entry.value > 1 ? "s" : ""}
                            </div>
                          </div>
                          <span className="mt-2 text-xs font-medium text-slate-600">
                            {entry.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Stocks faibles
                </h3>
                <span className="text-xs text-slate-400">
                  {lowStocks.length} élément
                  {lowStocks.length > 1 ? "s" : ""}
                </span>
              </div>
              {lowStocks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucun stock critique pour l'instant.
                </p>
              ) : (
                <ul className="space-y-3">
                  {lowStocks.map((entry) => (
                    <li
                      key={`${entry.vaccine}-${entry.remaining}`}
                      className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-amber-900">
                        {entry.vaccine}
                      </span>
                      <span className="text-amber-700">
                        {entry.remaining} dose
                        {entry.remaining > 1 ? "s" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Lots proches de l'expiration
                </h3>
                <span className="text-xs text-slate-400">
                  {expiringLots.length} lot
                  {expiringLots.length > 1 ? "s" : ""}
                </span>
              </div>
              {expiringLots.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucun lot à expiration proche.
                </p>
              ) : (
                <ul className="space-y-3">
                  {expiringLots.map((entry) => (
                    <li
                      key={entry.lot}
                      className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-red-800">
                          {entry.vaccine}
                        </span>
                        <span className="text-red-700">
                          {entry.expiresInDays} j
                        </span>
                      </div>
                      <p className="text-xs text-red-600">Lot #{entry.lot}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const title = (() => {
    if (!user) {
      return "Tableau de bord";
    }
    if (role === "NATIONAL") {
      return "Tableau de bord national";
    }
    if (role === "REGIONAL") {
      return regionName
        ? `Régional de la ville de ${regionName}`
        : "Régional";
    }
    if (role === "DISTRICT") {
      return districtName
        ? `Agent du district de ${districtName}`
        : "Agent du district";
    }
    if (isAgentAdmin) {
      return centerLabel
        ? `Administrateur ${centerLabel}`
        : "Administrateur";
    }
    if (isAgent) {
      return centerLabel ? `Agent ${centerLabel}` : "Agent";
    }
    return "Tableau de bord";
  })();

  const subtitle = (() => {
    if (!user) {
      return "Vue d'ensemble de la couverture vaccinale.";
    }
    if (role === "NATIONAL") {
      return "Vue d'ensemble de la couverture vaccinale nationale.";
    }
    if (role === "REGIONAL") {
      return "Vue d'ensemble des performances de votre région.";
    }
    if (role === "DISTRICT") {
      return "Suivi des indicateurs de votre district.";
    }
    if (isAgentAdmin) {
      return "Gestion des ressources et des stocks de votre centre de santé.";
    }
    if (isAgent) {
      return "Suivi des activités de votre centre de santé.";
    }
    return "Vue d'ensemble des indicateurs clés.";
  })();

  return (
    <DashboardShell active="/dashboard">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">
            {title}
          </h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Enfants enregistrés"
            value={totalChildren ?? 0}
            icon={Users}
            accent="emerald"
            loading={loading}
          />
        </div>
      </div>
    </DashboardShell>
  );
}

type AgentStatCardProps = {
  title: string;
  value: number | string;
};

function AgentStatCard({ title, value }: AgentStatCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 text-center shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-emerald-600">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function useInjectSlideAnimation() {
  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const marker = document.querySelector(
      'style[data-agent-slide-style="true"]',
    );
    if (marker) {
      return undefined;
    }

    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-agent-slide-style", "true");
    styleElement.innerHTML = `
@keyframes agent-slide {
  0% { opacity: 0; transform: translateY(20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}
.animate-slide {
  animation: agent-slide 5s ease-in-out;
}`;
    document.head.appendChild(styleElement);

    return () => {
      try {
        document.head.removeChild(styleElement);
      } catch {
        /* noop */
      }
    };
  }, []);
}
