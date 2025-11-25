import { Building2, Users, Activity, TrendingUp, AlertTriangle, UserCheck, CheckCircle, XCircle, Clock, BarChart3, Package } from "lucide-react";

interface HealthCenterStats {
  region: string;
  district: string;
  healthCenter: string;
  healthCenterType: string;
  summary: {
    totalChildren: number;
    totalVaccinations: number;
    coverageRate: number;
    totalAgents: number;
    activeAgents: number;
    overdueVaccinations: number;
  };
  agentStats: Array<{
    agentId: string;
    agentName: string;
    agentEmail: string;
    agentPhone?: string;
    agentLevel?: string;
    active: boolean;
    vaccinations: number;
    childrenVaccinated: number;
    completedAppointments: number;
    missedAppointments: number;
    cancelledAppointments: number;
    successRate: number;
  }>;
  monthlyVaccinations: Array<{
    month: string;
    value: number;
  }>;
  vaccineDistribution: Array<{
    name: string;
    value: number;
  }>;
}

interface HealthCenterDetailViewProps {
  stats: HealthCenterStats;
}

export default function HealthCenterDetailView({ stats }: HealthCenterDetailViewProps) {
  const maxMonthlyValue = Math.max(...stats.monthlyVaccinations.map((m) => m.value), 1);
  const maxVaccinations = Math.max(...stats.agentStats.map((a) => a.vaccinations), 1);

  return (
    <div className="space-y-6">
      {/* En-tête centre de santé */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-600 rounded-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{stats.healthCenter}</h2>
            <p className="text-gray-600">
              {stats.healthCenterType} - {stats.district}, {stats.region}
            </p>
          </div>
        </div>

        {/* KPIs du centre */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
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
            <BarChart3 className="h-5 w-5 text-teal-600" />
            Évolution mensuelle - {stats.healthCenter}
          </h3>
          <div className="space-y-3">
            {stats.monthlyVaccinations.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium text-gray-700">{item.month}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-end pr-3 text-white text-xs font-bold transition-all duration-500"
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

      {/* Liste des agents en aperçu (NON CLIQUABLES) */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-teal-600" />
          Agents de Santé - Aperçu ({stats.agentStats.length})
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Vue d'ensemble des agents travaillant dans ce centre de santé. Les agents sont listés uniquement en aperçu.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {stats.agentStats.map((agent, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border-2 border-gray-200"
            >
              {/* En-tête agent */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-lg text-gray-900">{agent.agentName}</h4>
                    {!agent.active && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Inactif</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{agent.agentEmail}</div>
                  {agent.agentPhone && (
                    <div className="text-xs text-gray-500 mt-1">{agent.agentPhone}</div>
                  )}
                  {agent.agentLevel && (
                    <div className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded inline-block mt-2">
                      {agent.agentLevel}
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques de l'agent */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded p-3 text-center">
                  <Activity className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900">{agent.vaccinations}</div>
                  <div className="text-xs text-gray-600">Vaccinations</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900">{agent.childrenVaccinated}</div>
                  <div className="text-xs text-gray-600">Enfants</div>
                </div>
              </div>

              {/* Rendez-vous */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white rounded p-2 text-center">
                  <CheckCircle className="h-3 w-3 text-green-600 mx-auto mb-1" />
                  <div className="text-sm font-bold text-gray-900">{agent.completedAppointments}</div>
                  <div className="text-xs text-gray-500">Faits</div>
                </div>
                <div className="bg-white rounded p-2 text-center">
                  <XCircle className="h-3 w-3 text-red-600 mx-auto mb-1" />
                  <div className="text-sm font-bold text-gray-900">{agent.missedAppointments}</div>
                  <div className="text-xs text-gray-500">Ratés</div>
                </div>
                <div className="bg-white rounded p-2 text-center">
                  <Clock className="h-3 w-3 text-orange-600 mx-auto mb-1" />
                  <div className="text-sm font-bold text-gray-900">{agent.cancelledAppointments}</div>
                  <div className="text-xs text-gray-500">Annulés</div>
                </div>
              </div>

              {/* Taux de succès */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Taux de succès</span>
                  <span className="text-sm font-bold text-gray-900">{agent.successRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      agent.successRate >= 90
                        ? "bg-green-500"
                        : agent.successRate >= 75
                        ? "bg-blue-500"
                        : agent.successRate >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${agent.successRate}%` }}
                  />
                </div>
              </div>

              {/* Performance relative */}
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">Performance relative</div>
                <div className="h-4 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-500"
                    style={{
                      width: `${Math.max((agent.vaccinations / maxVaccinations) * 100, 5)}%`,
                      minWidth: agent.vaccinations > 0 ? '20px' : '0'
                    }}
                  />
                </div>
              </div>

              {/* Badge de performance */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  agent.successRate >= 90
                    ? "bg-green-100 text-green-800"
                    : agent.successRate >= 75
                    ? "bg-blue-100 text-blue-800"
                    : agent.successRate >= 60
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {agent.successRate >= 90
                    ? "🏆 Excellent"
                    : agent.successRate >= 75
                    ? "✅ Bon"
                    : agent.successRate >= 60
                    ? "⚠️ Moyen"
                    : "❌ Faible"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {stats.agentStats.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Aucun agent assigné à ce centre</p>
          </div>
        )}
      </div>
    </div>
  );
}
