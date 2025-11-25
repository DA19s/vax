import { Building2, Users, Activity, TrendingUp, AlertTriangle, UserCheck, CheckCircle, BarChart3, Package, ChevronRight } from "lucide-react";
import type { DistrictDetailedStats } from "../types";

interface DistrictDetailViewProps {
  stats: DistrictDetailedStats;
  onHealthCenterClick?: (healthCenterName: string) => void;
}

export default function DistrictDetailView({ stats, onHealthCenterClick }: DistrictDetailViewProps) {
  const maxMonthlyValue = Math.max(...stats.monthlyVaccinations.map((m) => m.value), 1);
  const maxVaccinations = Math.max(...stats.healthCenterStats.map((h) => h.vaccinations), 1);

  return (
    <div className="space-y-6">
      {/* En-tête district */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-600 rounded-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{stats.district}</h2>
            <p className="text-gray-600">{stats.region} - Statistiques détaillées du district</p>
          </div>
        </div>

        {/* KPIs du district */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.summary.totalChildren.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Enfants</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Activity className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.summary.totalVaccinations.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Vaccinations</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.summary.coverageRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Couverture</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Building2 className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.summary.totalHealthCenters}</div>
            <div className="text-xs text-gray-600">Centres</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.summary.activeHealthCenters}</div>
            <div className="text-xs text-gray-600">Actifs</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <UserCheck className="h-6 w-6 text-teal-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.summary.totalAgents}</div>
            <div className="text-xs text-gray-600">Agents</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.summary.activeAgents}</div>
            <div className="text-xs text-gray-600">Actifs</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.summary.overdueVaccinations}</div>
            <div className="text-xs text-gray-600">En retard</div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Évolution mensuelle - {stats.district}
          </h3>
          <div className="space-y-3">
            {stats.monthlyVaccinations.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium text-gray-700">{item.month}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-end pr-3 text-white text-xs font-bold transition-all duration-500"
                      style={{ 
                        width: item.value > 0 ? `${Math.max((item.value / maxMonthlyValue) * 100, 5)}%` : '0%',
                        minWidth: item.value > 0 ? '40px' : '0'
                      }}
                    >
                      {item.value > 0 && item.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution par vaccin */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Répartition par vaccin
          </h3>
          {stats.vaccineDistribution && stats.vaccineDistribution.length > 0 ? (
            <div className="space-y-3">
              {stats.vaccineDistribution.map((vaccine, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{vaccine.name}</span>
                  <span className="text-sm font-bold text-gray-900">{vaccine.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Liste des centres de santé */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-indigo-600" />
          Centres de Santé du District ({stats.healthCenterStats.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.healthCenterStats.map((center, idx) => (
            <div
              key={idx}
              onClick={() => onHealthCenterClick && onHealthCenterClick(center.healthCenterName)}
              className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border-2 border-transparent transition-all duration-200 ${
                onHealthCenterClick ? 'cursor-pointer hover:border-indigo-500 hover:shadow-lg transform hover:scale-105' : ''
              }`}
            >
              {/* En-tête centre */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-bold text-lg text-gray-900">{center.healthCenterName}</h4>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{center.healthCenterType}</div>
                  <div className="flex items-center gap-2">
                    {!center.active && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Inactif</span>
                    )}
                    {center.active && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Actif</span>
                    )}
                  </div>
                </div>
                {onHealthCenterClick && (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Statistiques du centre */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded p-3 text-center">
                  <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900">{center.totalChildren}</div>
                  <div className="text-xs text-gray-600">Enfants</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <Activity className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900">{center.vaccinations}</div>
                  <div className="text-xs text-gray-600">Vaccinations</div>
                </div>
              </div>

              {/* Couverture */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Taux de couverture</span>
                  <span className="text-sm font-bold text-gray-900">{center.coverage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      center.coverage >= 90
                        ? "bg-green-500"
                        : center.coverage >= 75
                        ? "bg-blue-500"
                        : center.coverage >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${center.coverage}%` }}
                  />
                </div>
              </div>

              {/* Agents */}
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-gray-600">Agents de santé</span>
                <span className="font-semibold text-gray-900">
                  {center.activeAgentsCount} / {center.agentsCount}
                </span>
              </div>

              {/* Performance relative */}
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">Performance relative</div>
                <div className="h-3 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                    style={{
                      width: `${Math.max((center.vaccinations / maxVaccinations) * 100, 5)}%`,
                      minWidth: center.vaccinations > 0 ? '20px' : '0'
                    }}
                  />
                </div>
              </div>

              {/* Badge de performance */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  center.coverage >= 90
                    ? "bg-green-100 text-green-800"
                    : center.coverage >= 75
                    ? "bg-blue-100 text-blue-800"
                    : center.coverage >= 60
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {center.coverage >= 90
                    ? "🏆 Excellent"
                    : center.coverage >= 75
                    ? "✅ Bon"
                    : center.coverage >= 60
                    ? "⚠️ Moyen"
                    : "❌ Faible"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {stats.healthCenterStats.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Aucun centre de santé dans ce district</p>
          </div>
        )}
      </div>
    </div>
  );
}
