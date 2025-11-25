"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  Activity,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type DashboardStats = {
  totalChildren: number;
  totalVaccinations: number;
  campaigns: number;
  coverageRate: number;
  monthlyVaccinations: { month: string; value: number }[];
  coverageByVaccine: { name: string; value: number }[];
  topRegions: { region: string; retard: number }[];
};

type StatCard = {
  title: string;
  value: string | number;
  color: string;
};

export default function NationalDashboardPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔒 Vérifier accès
  useEffect(() => {
    if (!loading && (!user || user.role !== "national")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // 📡 Fetch des stats nationales (utilise le cookie HttpOnly, pas besoin de token en JS)
  useEffect(() => {
    if (user && user.role === "national") {
      fetch("http://localhost:5000/api/dashboard/national", {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log("📊 Dashboard national:", data);
          setStats(data);
        })
        .catch((err) => {
          console.error("❌ Erreur fetch stats national:", err);
          setError("Impossible de charger les données du tableau de bord.");
        });
    }
  }, [user?.role]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Aucune donnée disponible</p>
        </div>
      </DashboardLayout>
    );
  }

  // 📌 Cartes stats avec icônes et animations
  const statCards = [
    {
      title: "Enfants enregistrés",
      value: stats.totalChildren.toLocaleString(),
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Vaccinations totales",
      value: stats.totalVaccinations.toLocaleString(),
      icon: Activity,
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Campagnes actives",
      value: stats.campaigns,
      icon: Calendar,
      color: "orange",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      trend: "2 nouvelles",
      trendUp: true,
    },
    {
      title: "Couverture vaccinale",
      value: `${stats.coverageRate}%`,
      icon: TrendingUp,
      color: "purple",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      trend: stats.coverageRate >= 80 ? "+5%" : "-2%",
      trendUp: stats.coverageRate >= 80,
    },
  ];

  const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord National
          </h1>
          <p className="text-gray-600">
            Vue d'ensemble des statistiques nationales de vaccination
          </p>
        </div>

        {/* Cartes KPI avec animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${card.bgColor} rounded-lg`}>
                    <Icon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {card.trendUp ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`font-medium ${card.trendUp ? "text-green-600" : "text-red-600"}`}
                    >
                      {card.trend}
                    </span>
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-2">
                  {card.title}
                </h3>
                <p className={`text-3xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution mensuelle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Évolution mensuelle
              </h3>
              <div className="text-sm text-gray-500">6 derniers mois</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.monthlyVaccinations || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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

          {/* Répartition par vaccin */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Répartition par vaccin
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.coverageByVaccine || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => entry.name}
                  labelLine={true}
                >
                  {(stats.coverageByVaccine || []).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
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

        {/* Régions en retard */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Régions nécessitant attention
            </h3>
            <span className="text-sm text-gray-500">Top 5</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stats.topRegions || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
    </DashboardLayout>
  );
}
