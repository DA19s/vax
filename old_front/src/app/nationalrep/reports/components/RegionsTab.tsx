import { MapPin, ChevronRight, Users, Activity, TrendingUp, Building2 } from "lucide-react";

interface RegionPerformance {
  region: string;
  totalChildren: number;
  vaccinations: number;
  coverage: number;
}

interface RegionsTabProps {
  regionPerformance: RegionPerformance[];
  onRegionClick: (regionName: string) => void;
}

export default function RegionsTab({ regionPerformance, onRegionClick }: RegionsTabProps) {
  const maxVaccinations = Math.max(...regionPerformance.map((r) => r.vaccinations), 1);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          Analyse Détaillée par Région
        </h2>
        <p className="text-gray-600">
          Cliquez sur une région pour voir les statistiques par district et agents de santé
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {regionPerformance.map((region, idx) => (
          <div
            key={idx}
            onClick={() => onRegionClick(region.region)}
            className="bg-white rounded-xl shadow-md p-6 border-2 border-transparent hover:border-blue-500 cursor-pointer transform hover:scale-105 transition-all duration-200"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{region.region}</h3>
                  <div className="text-sm text-gray-500">Cliquer pour explorer</div>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-blue-600" />
            </div>

            {/* KPIs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Enfants</span>
                </div>
                <span className="font-bold text-gray-900">{region.totalChildren.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Vaccinations</span>
                </div>
                <span className="font-bold text-gray-900">{region.vaccinations.toLocaleString()}</span>
              </div>

              {/* Taux de couverture */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Couverture</span>
                  </div>
                  <span className="font-bold text-gray-900">{region.coverage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      region.coverage >= 90
                        ? "bg-green-500"
                        : region.coverage >= 75
                        ? "bg-blue-500"
                        : region.coverage >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${region.coverage}%` }}
                  />
                </div>
              </div>

              {/* Barre de performance */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Performance relative</div>
                <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                    style={{
                      width: `${Math.max((region.vaccinations / maxVaccinations) * 100, 5)}%`,
                      minWidth: region.vaccinations > 0 ? '40px' : '0'
                    }}
                  >
                    {region.vaccinations > 0 && ((region.vaccinations / maxVaccinations) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Badge de performance */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                region.coverage >= 90
                  ? "bg-green-100 text-green-800"
                  : region.coverage >= 75
                  ? "bg-blue-100 text-blue-800"
                  : region.coverage >= 60
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {region.coverage >= 90
                  ? "🏆 Excellent"
                  : region.coverage >= 75
                  ? "✅ Bon"
                  : region.coverage >= 60
                  ? "⚠️ Moyen"
                  : "❌ Faible"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
