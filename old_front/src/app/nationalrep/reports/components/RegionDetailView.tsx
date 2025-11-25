import { MapPin, Users, Activity, TrendingUp, Building2, AlertTriangle, BarChart3, Package } from "lucide-react";
import type { RegionDetailedStats } from "../types";

interface RegionDetailViewProps {
  stats: RegionDetailedStats;
  onDistrictClick?: (districtName: string) => void;
}

export default function RegionDetailView({ stats, onDistrictClick }: RegionDetailViewProps) {
  const maxVaccinations = Math.max(...stats.districtStats.map((d) => d.vaccinations), 1);
  const maxMonthlyValue = Math.max(...stats.monthlyVaccinations.map((m) => m.value), 1);

  return (
    <div className="space-y-6">
      {/* En-tête région */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{stats.region}</h2>
            <p className="text-gray-600">Statistiques détaillées de la région</p>
          </div>
        </div>

        {/* KPIs de la région */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
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
            <Building2 className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.summary.totalDistricts}</div>
            <div className="text-xs text-gray-600">Districts</div>
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
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Évolution mensuelle - {stats.region}
          </h3>
          <div className="space-y-3">
            {stats.monthlyVaccinations.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium text-gray-700">{item.month}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-3 text-white text-xs font-bold transition-all duration-500"
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

      {/* Liste des districts */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          Districts de la région ({stats.districtStats.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.districtStats.map((district, idx) => (
            <div
              key={idx}
              onClick={() => onDistrictClick && onDistrictClick(district.district)}
              className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-transparent transition-all duration-200 ${
                onDistrictClick ? 'cursor-pointer hover:border-blue-500 hover:shadow-lg transform hover:scale-105' : ''
              }`}
            >
              {/* En-tête */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className={`h-5 w-5 ${district.active ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-bold text-gray-900">{district.district}</span>
                </div>
                {!district.active && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Inactif</span>
                )}
              </div>

              {/* Type */}
              <div className="text-xs text-gray-500 mb-3">{district.districtType}</div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Enfants:</span>
                  <span className="font-bold text-gray-900">{district.totalChildren}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Vaccinations:</span>
                  <span className="font-bold text-gray-900">{district.vaccinations}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Agents:</span>
                  <span className="font-bold text-gray-900">{district.agentsCount}</span>
                </div>
              </div>

              {/* Couverture */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Couverture</span>
                  <span className="text-sm font-bold text-gray-900">{district.coverage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      district.coverage >= 90
                        ? "bg-green-500"
                        : district.coverage >= 75
                        ? "bg-blue-500"
                        : district.coverage >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${district.coverage}%` }}
                  />
                </div>
              </div>

              {/* Performance relative */}
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Performance</div>
                <div className="h-4 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{
                      width: `${Math.max((district.vaccinations / maxVaccinations) * 100, 5)}%`,
                      minWidth: district.vaccinations > 0 ? '20px' : '0'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
