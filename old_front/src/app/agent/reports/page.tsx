"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Activity, Calendar, Package, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

interface StatsData {
  totalVaccinations: number;
  thisMonth: number;
  thisWeek: number;
  stockStatus: { vaccine: string; quantity: number; status: string }[];
  recentActivity: { date: string; child: string; vaccine: string }[];
  monthlyTrend: { month: string; count: number }[];
}

export default function AgentReportsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await apiFetch<StatsData>("/api/stats/agent");
        setStats(data);
      } catch (error) {
        console.error("❌ Erreur chargement stats agent:", error);
        // Fallback vers des données vides si erreur
        setStats({
          totalVaccinations: 0,
          thisMonth: 0,
          thisWeek: 0,
          stockStatus: [],
          recentActivity: [],
          monthlyTrend: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Chargement des statistiques...</div>
        </div>
      </DashboardLayout>
    );
  }

  const maxTrend = Math.max(...(stats?.monthlyTrend.map((m) => m.count) || [1]), 1);
  const hasData = stats && stats.totalVaccinations > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rapport d'Activité</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === "agent" && "Statistiques et performance de votre centre de santé"}
              {user?.role === "district" && "Statistiques agrégées de votre district (vos activités + acteurs de santé)"}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Mis à jour: {new Date().toLocaleDateString("fr-FR")}
          </div>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 opacity-80" />
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Total</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.totalVaccinations}</div>
            <div className="text-sm opacity-90">Vaccinations effectuées</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 opacity-80" />
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Ce mois</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.thisMonth}</div>
            <div className="text-sm opacity-90">Vaccinations en novembre</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 opacity-80" />
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">7 jours</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.thisWeek}</div>
            <div className="text-sm opacity-90">Cette semaine</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 opacity-80" />
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Moyenne</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {Math.round((stats?.thisMonth || 0) / 30 * 7)}
            </div>
            <div className="text-sm opacity-90">Par semaine (moy.)</div>
          </div>
        </div>

        {/* Graphique tendance + État des stocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendance mensuelle */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Évolution mensuelle
            </h2>
            <div className="space-y-3">
              {stats?.monthlyTrend.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-gray-700">{item.month}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-end pr-2 text-white text-sm font-semibold"
                        style={{ 
                          width: item.count > 0 ? `${Math.max((item.count / maxTrend) * 100, 5)}%` : '0%',
                          minWidth: item.count > 0 ? '40px' : '0'
                        }}
                      >
                        {item.count > 0 && item.count}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* État des stocks */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              État des stocks
            </h2>
            <div className="space-y-3">
              {stats?.stockStatus.map((stock, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        stock.status === "critical"
                          ? "bg-red-500"
                          : stock.status === "warning"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    />
                    <span className="font-medium text-gray-900">{stock.vaccine}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{stock.quantity}</span>
                    <span className="text-sm text-gray-500">doses</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Activité récente
          </h2>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Enfant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Vaccin</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivity.map((activity, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(activity.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{activity.child}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {activity.vaccine}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Complété
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Aucune vaccination effectuée récemment</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
