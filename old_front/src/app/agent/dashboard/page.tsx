"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/DashboardLayout";
import { API_BASE_URL } from "@/app/lib/api";
import {
  Users,
  Shield,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Baby,
  Activity,
  Target,
  Award,
  MapPin,
} from "lucide-react";

interface AgentStats {
  totalChildren: number;
  vaccinatedChildren: number;
  pendingVaccinations: number;
  overdueVaccinations: number;
  upcomingAppointments: number;
  completionRate: number;
  recentActivity: Array<{
    type: string;
    child: string;
    date: string;
    vaccine?: string;
  }>;
}

export default function AgentDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "agent" && user.role !== "district"))) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);
 
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/dashboard/agent/stats`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("❌ Erreur chargement stats:", error);
      // En cas d'erreur, afficher des données par défaut
      setStats({
        totalChildren: 0,
        vaccinatedChildren: 0,
        pendingVaccinations: 0,
        overdueVaccinations: 0,
        upcomingAppointments: 0,
        completionRate: 0,
        recentActivity: [],
      });
    } finally {
      setStatsLoading(false);
    }
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

  const statCards = [
    {
      title: "Enfants suivis",
      value: stats.totalChildren,
      icon: Users,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Enfants vaccinés",
      value: stats.vaccinatedChildren,
      icon: Shield,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Vaccinations en attente",
      value: stats.pendingVaccinations,
      icon: Clock,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Vaccinations ratées",
      value: stats.overdueVaccinations,
      icon: AlertCircle,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fadeIn max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord Agent
          </h1>
          <p className="text-gray-600">
            Bienvenue {user?.firstName} {user?.lastName}  
          </p>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Taux de complétion */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Taux de complétion vaccinal
              </h2>
              <span className="text-3xl font-bold text-blue-600">{stats.completionRate}%</span>
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200">
                <div
                  style={{ width: `${stats.completionRate}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.vaccinatedChildren}</div>
                <div className="text-xs text-gray-600">À jour</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingVaccinations}</div>
                <div className="text-xs text-gray-600">En attente</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.overdueVaccinations}</div>
                <div className="text-xs text-gray-600">En retard</div>
              </div>
            </div>
          </div>

          {/* Prochains rendez-vous */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Rendez-vous
            </h2>
            <div className="text-center py-8">
              <div className="text-5xl font-bold text-purple-600 mb-2">{stats.upcomingAppointments}</div>
              <p className="text-gray-600">Rendez-vous à venir</p>
              <button
                onClick={() => router.push("/agent/calendrier")}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Voir le calendrier
              </button>
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Activité récente
          </h2>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className={`p-2 rounded-full ${
                  activity.type === "vaccination" ? "bg-green-100" : "bg-blue-100"
                }`}>
                  {activity.type === "vaccination" ? (
                    <Shield className="h-5 w-5 text-green-600" />
                  ) : (
                    <Baby className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.child}</p>
                  <p className="text-sm text-gray-600">
                    {activity.type === "vaccination" 
                      ? `Vaccination ${activity.vaccine}` 
                      : "Nouvel enregistrement"}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(activity.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <button
            onClick={() => router.push("/agent/enfants")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
          >
            <Users className="h-8 w-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Gérer les enfants</h3>
            <p className="text-blue-100 text-sm">Voir et gérer tous les enfants suivis</p>
          </button>
          <button
            onClick={() => router.push("/agent/enfants")}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
          >
            <Shield className="h-8 w-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Vaccinations</h3>
            <p className="text-green-100 text-sm">Enregistrer une nouvelle vaccination</p>
          </button>
          <button
            onClick={() => router.push("/agent/reports")}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
          >
            <Activity className="h-8 w-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Rapports</h3>
            <p className="text-purple-100 text-sm">Consulter les rapports d'activité</p>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
