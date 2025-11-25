"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import StatsGrid from "@/app/components/StatsGrid";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, TrendingUp, Activity } from "lucide-react";
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
import { apiFetch } from "@/app/lib/api";

// ✅ Typage des stats venant du backend
type RegionalDashboardStats = {
  totalChildren: number;
  vaccinatedChildren: number;
  coverageRate: number;
  activeCampaigns: number;
  monthlyVaccinations: { month: string; value: number }[];
  topAgents: { name: string; retard: number }[];
  coverageByVaccine: { name: string; value: number }[];
  region: string;
};

type StatCard = {
  title: string;
  value: string | number;
  color: string;
};

export default function RegionalDashboardPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<RegionalDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Debug: derive region from JWT if missing
  const derived = (() => {
    let region = user?.region as string | undefined;
    let role = user?.role as string | undefined;
    try {
      if ((!region || !role) && token) {
        const base = token.split(".")[1];
        if (base) {
          const payload = JSON.parse(
            typeof atob === "function"
              ? atob(base)
              : Buffer.from(base, "base64").toString("utf-8")
          );
          region = region || payload.region;
          role = role || payload.role;
        }
      }
    } catch {}
    return { region, role } as { region?: string; role?: string };
  })();

  useEffect(() => {
    if (!loading && (!user || user.role !== "regional")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // 🔥 Récupération des données backend (utilise le cookie HttpOnly, pas besoin de token en JS)
  useEffect(() => {
    if (user && user.role === "regional") {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const result = await apiFetch<RegionalDashboardStats>("/api/dashboard/regional", {
        method: "GET",
      });
      setStats(result);
    } catch (error) {
      console.error("❌ Erreur fetch dashboard:", error);
      console.warn("🔄 Utilisation de données par défaut");
      setStats(defaultStats);
    } finally {
      setStatsLoading(false);
    }
  };

  // 📊 Données simulées pour les graphiques
  const monthlyEvolutionData = [
    { month: "Jan", vaccinations: 245, enfants: 180, couverture: 73 },
    { month: "Fév", vaccinations: 312, enfants: 220, couverture: 78 },
    { month: "Mar", vaccinations: 389, enfants: 285, couverture: 82 },
    { month: "Avr", vaccinations: 445, enfants: 340, couverture: 85 },
    { month: "Mai", vaccinations: 523, enfants: 420, couverture: 88 },
    { month: "Jun", vaccinations: 612, enfants: 495, couverture: 91 },
  ];

  const vaccineDistributionData = [
    { name: "BCG", value: 95, color: "#3B82F6" },
    { name: "DTC-HepB-Hib", value: 88, color: "#10B981" },
    { name: "Polio", value: 92, color: "#F59E0B" },
    { name: "Rougeole", value: 85, color: "#EF4444" },
    { name: "Fièvre Jaune", value: 78, color: "#8B5CF6" },
  ];

  const weeklyActivityData = [
    { day: "Lun", consultations: 45, vaccinations: 32 },
    { day: "Mar", consultations: 52, vaccinations: 38 },
    { day: "Mer", consultations: 48, vaccinations: 35 },
    { day: "Jeu", consultations: 61, vaccinations: 42 },
    { day: "Ven", consultations: 55, vaccinations: 39 },
    { day: "Sam", consultations: 38, vaccinations: 28 },
    { day: "Dim", consultations: 25, vaccinations: 18 },
  ];

  const defaultStats: RegionalDashboardStats = {
    totalChildren: 1000,
    vaccinatedChildren: 800,
    coverageRate: 80,
    activeCampaigns: 5,
    monthlyVaccinations: monthlyEvolutionData.map((item) => ({
      month: item.month,
      value: item.vaccinations,
    })),
    topAgents: [
      { name: "Agent 1", retard: 10 },
      { name: "Agent 2", retard: 8 },
      { name: "Agent 3", retard: 12 },
      { name: "Agent 4", retard: 9 },
      { name: "Agent 5", retard: 11 },
    ],
    coverageByVaccine: vaccineDistributionData,
    region: "Région 1",
  };

  if (loading || statsLoading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ✅ Cartes résumées en haut
  const statCards: StatCard[] = [
    {
      title: "Enfants enregistrés",
      value: stats.totalChildren || 0,
      color: "text-blue-600",
    },
    {
      title: "Enfants vaccinés",
      value: stats.vaccinatedChildren || 0,
      color: "text-green-600",
    },
    {
      title: "Couverture régionale",
      value: `${stats.coverageRate || 0}%`,
      color: "text-purple-600",
    },
    {
      title: "Campagnes actives",
      value: stats.activeCampaigns || 0,
      color: "text-orange-600",
    },
  ];

  const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <LayoutDashboard className="h-8 w-8 text-blue-600" />
                Tableau de Bord
              </h1>
              <p className="text-gray-600">
                Vue d'ensemble de la région <span className="font-semibold">{stats.region || derived.region || "Non définie"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 📌 Cartes stats */}
        <StatsGrid stats={statCards} />

        {/* 📊 Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* 📈 Évolution régionale */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Évolution régionale
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Vaccinations</span>
                </div>
              </div>
            </div>
            {(() => {
              // Créer les 12 mois complets avec des valeurs par défaut à 0
              const allMonths = [
                "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
                "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"
              ];
              
              // Mapping pour les noms complets du backend vers les noms courts
              const monthMapping: { [key: string]: string } = {
                "Janvier": "Jan", "Février": "Fév", "Mars": "Mar", "Avril": "Avr",
                "Mai": "Mai", "Juin": "Jun", "Juillet": "Jul", "Août": "Aoû",
                "Septembre": "Sep", "Octobre": "Oct", "Novembre": "Nov", "Décembre": "Déc"
              };
              
              // Créer un objet avec les données du backend (convertir les noms longs en courts)
              const backendData: { [key: string]: number } = {};
              (stats.monthlyVaccinations || []).forEach(m => {
                const shortMonth = monthMapping[m.month] || m.month;
                backendData[shortMonth] = m.value;
              });
              
              // Générer les données complètes pour tous les mois
              const chartData = allMonths.map(month => ({
                month: month,
                vaccinations: backendData[month] || 0, // 0 si pas de données pour ce mois
              }));
              return (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                    domain={[0, 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vaccinations" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 3, fill: '#ffffff' }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              );
            })()}
          </div>

          {/* 🥧 Répartition par vaccin */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Répartition par vaccin
            </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.coverageByVaccine || []}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {(stats.coverageByVaccine || []).map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {(!stats.coverageByVaccine ||
            stats.coverageByVaccine.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée de vaccination disponible
            </div>
          )}
          </div>

          {/* 🏆 Top 5 agents en retard */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Top 5 agents en retard
            </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topAgents || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`${value} en retard`, 'Vaccinations']}
              />
              <Bar 
                dataKey="retard" 
                fill="#EF4444" 
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
          {(!stats.topAgents || stats.topAgents.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée dagent disponible
            </div>
          )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
