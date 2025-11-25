"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  MapPin,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

interface RegionalStats {
  totalCenters: number;
  totalVaccinations: number;
  coverageRate: number;
  activeCampaigns: number;
  centerPerformance: {
    name: string;
    vaccinations: number;
    coverage: number;
    stock: string;
  }[];
  vaccineDistribution: { vaccine: string; total: number; percentage: number }[];
  monthlyTrend: { month: string; count: number }[];
  alerts: { type: string; message: string; severity: string }[];
}

export default function RegionalReportsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<RegionalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("6months");

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await apiFetch<RegionalStats>("/api/stats/regional");
        setStats(data);
      } catch (error) {
        console.error("❌ Erreur chargement stats régional:", error);
        // Fallback vers des données vides si erreur
        setStats({
          totalCenters: 0,
          totalVaccinations: 0,
          coverageRate: 0,
          activeCampaigns: 0,
          centerPerformance: [],
          vaccineDistribution: [],
          monthlyTrend: [],
          alerts: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, selectedPeriod]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Chargement des statistiques régionales...</div>
        </div>
      </DashboardLayout>
    );
  }

  const maxTrend = Math.max(...(stats?.monthlyTrend.map((m) => m.count) || [1]), 1);
  const maxVaccinations = Math.max(
    ...(stats?.centerPerformance.map((c) => c.vaccinations) || [1]),
    1
  );
  const hasData = stats && stats.totalVaccinations > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* En-tête avec filtres */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Rapports & Statistiques
              </h1>
              <p className="text-gray-600">Vue d'ensemble de la performance de votre région (par district)</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1month">1 mois</option>
                <option value="3months">3 mois</option>
                <option value="6months">6 mois</option>
                <option value="1year">1 an</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                Exporter PDF
              </button>
            </div>
          </div>
        </div>

        {/* Alertes */}
        {stats && stats.alerts && stats.alerts.length > 0 && (
          <div className={
            stats.alerts.some((a) => a.severity === "high")
              ? "bg-red-50 border-l-4 border-red-400 p-4 rounded-lg"
              : "bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
          }>
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={
                  stats.alerts.some((a) => a.severity === "high")
                    ? "h-5 w-5 text-red-600 mt-0.5"
                    : "h-5 w-5 text-yellow-600 mt-0.5"
                }
              />
              <div className="flex-1">
                <h3
                  className={
                    stats.alerts.some((a) => a.severity === "high")
                      ? "font-semibold text-red-900 mb-2"
                      : "font-semibold text-yellow-900 mb-2"
                  }
                >
                  {stats.alerts.length} alerte{stats.alerts.length > 1 ? "s" : ""} importante{stats.alerts.length > 1 ? "s" : ""}
                </h3>
                <ul className="space-y-1">
                  {stats.alerts.map((alert, idx) => (
                    <li
                      key={idx}
                      className={
                        alert.severity === "high"
                          ? "text-sm text-red-800 font-medium"
                          : "text-sm text-yellow-800"
                      }
                    >
                      {alert.severity === "high" ? "⚠️" : "•"} {alert.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="h-8 w-8 opacity-80" />
              <MapPin className="h-5 w-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.totalCenters}</div>
            <div className="text-sm opacity-90">Districts actifs</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 opacity-80" />
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Total</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {stats?.totalVaccinations.toLocaleString()}
            </div>
            <div className="text-sm opacity-90">Vaccinations effectuées</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 opacity-80" />
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Objectif: 90%</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.coverageRate}%</div>
            <div className="text-sm opacity-90">Taux de couverture</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 opacity-80" />
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">En cours</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.activeCampaigns}</div>
            <div className="text-sm opacity-90">Campagnes actives</div>
          </div>
        </div>

        {/* Graphiques principaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution mensuelle */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Évolution mensuelle
            </h2>
            <div className="space-y-3">
              {stats?.monthlyTrend.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-gray-700">{item.month}</div>
                  <div className="flex-1">
                    <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-end pr-3 text-white text-sm font-bold"
                        style={{ 
                          width: item.count > 0 ? `${Math.max((item.count / maxTrend) * 100, 5)}%` : '0%',
                          minWidth: item.count > 0 ? '50px' : '0'
                        }}
                      >
                        {item.count > 0 && item.count.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution par vaccin */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Répartition par vaccin
            </h2>
            {stats?.vaccineDistribution && stats.vaccineDistribution.length > 0 ? (
              <div className="space-y-4">
                {stats.vaccineDistribution.map((vaccine, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">{vaccine.vaccine}</span>
                      <span className="text-sm font-bold text-gray-700">
                        {vaccine.total.toLocaleString()} ({vaccine.percentage}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                        style={{ width: `${Math.max(vaccine.percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Aucune donnée de distribution disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance des centres */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Performance par district (district + acteurs de santé)
          </h2>
          {stats?.centerPerformance && stats.centerPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">District</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Vaccinations</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Couverture</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Performance</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">État stock</th>
                </tr>
              </thead>
              <tbody>
                {stats?.centerPerformance.map((center, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{center.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {center.vaccinations.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-gray-900">{center.coverage}%</div>
                        <div className="flex-1 max-w-24">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                center.coverage >= 90
                                  ? "bg-green-500"
                                  : center.coverage >= 75
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${center.coverage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-gray-100 rounded-lg h-8 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold"
                          style={{
                            width: `${Math.max((center.vaccinations / maxVaccinations) * 100, 5)}%`,
                            minWidth: center.vaccinations > 0 ? '40px' : '0'
                          }}
                        >
                          {center.vaccinations > 0 && ((center.vaccinations / maxVaccinations) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          center.stock === "critical"
                            ? "bg-red-100 text-red-700"
                            : center.stock === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {center.stock === "critical"
                          ? "Critique"
                          : center.stock === "warning"
                          ? "Attention"
                          : "Bon"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Aucun district dans cette région</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
