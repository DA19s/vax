"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/app/components/DashboardLayout";
import { API_BASE_URL } from "@/app/lib/api";
import {
  Megaphone,
  Calendar,
  Users,
  Target,
  TrendingUp,
  MapPin,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface Campaign {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  targetVaccine: string;
  targetAgeGroup?: string;
  targetRegion?: string;
  targetPopulation?: number;
  vaccinatedCount?: number;
  status: "planned" | "ongoing" | "completed" | "cancelled";
  createdBy?: string;
  createdAt?: string;
}

export default function CampagnesPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "planned" | "ongoing" | "completed">("all");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Campagnes chargées:", result);
        
        // Le backend renvoie { success, campaigns } ou directement un tableau
        const campaignsData = result.campaigns || result.data || result;
        
        // Mapper les données du backend vers le format frontend
        const mappedCampaigns = Array.isArray(campaignsData) ? campaignsData.map((campaign: any) => {
          // Calculer le statut automatiquement si nécessaire
          let status = campaign.status || "planned";
          
          // Si pas de statut ou statut par défaut, calculer selon les dates
          if (!campaign.status || campaign.status === "planned") {
            const now = new Date();
            const start = new Date(campaign.startDate);
            const end = new Date(campaign.endDate);
            
            if (now >= start && now <= end) {
              status = "ongoing";
            } else if (now > end) {
              status = "completed";
            } else {
              status = "planned";
            }
          }
          
          return {
            _id: campaign._id || campaign.id,
            name: campaign.title || campaign.name,
            description: campaign.description,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            targetVaccine: campaign.targetVaccine,
            targetAgeGroup: campaign.targetAgeGroup,
            targetRegion: campaign.region,
            targetPopulation: campaign.targetPopulation,
            vaccinatedCount: campaign.vaccinatedCount || 0,
            status,
            createdBy: campaign.createdBy,
            createdAt: campaign.createdAt,
          };
        }) : [];
        
        setCampaigns(mappedCampaigns);
      } else {
        console.warn("Erreur API campagnes, code:", response.status);
        setCampaigns([]);
      }
    } catch (error) {
      console.error("❌ Erreur chargement campagnes:", error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    return statusFilter === "all" || campaign.status === statusFilter;
  });

  // Debug: Afficher les statuts des campagnes
  console.log("📊 Campagnes par statut:", {
    total: campaigns.length,
    ongoing: campaigns.filter(c => c.status === "ongoing").length,
    planned: campaigns.filter(c => c.status === "planned").length,
    completed: campaigns.filter(c => c.status === "completed").length,
    statuts: campaigns.map(c => ({ name: c.name, status: c.status }))
  });

  const stats = {
    total: campaigns.length,
    ongoing: campaigns.filter(c => c.status === "ongoing").length,
    planned: campaigns.filter(c => c.status === "planned").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  };

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case "ongoing":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1"><Clock className="h-3 w-3" />En cours</span>;
      case "planned":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1"><Calendar className="h-3 w-3" />Planifiée</span>;
      case "completed":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Terminée</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="h-3 w-3" />Annulée</span>;
    }
  };

  const getProgress = (campaign: Campaign) => {
    if (!campaign.targetPopulation || campaign.targetPopulation === 0) return 0;
    return Math.round(((campaign.vaccinatedCount || 0) / campaign.targetPopulation) * 100);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des campagnes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fadeIn max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-blue-600" />
                Campagnes de Vaccination
              </h1>
              <p className="text-gray-600">Suivez et participez aux campagnes de vaccination</p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total campagnes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Megaphone className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter("ongoing")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En cours</p>
                <p className="text-3xl font-bold text-blue-600">{stats.ongoing}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter("planned")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Planifiées</p>
                <p className="text-3xl font-bold text-purple-600">{stats.planned}</p>
              </div>
              <Calendar className="h-10 w-10 text-purple-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter("completed")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Terminées</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setStatusFilter("ongoing")}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                statusFilter === "ongoing"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              En cours
            </button>
            <button
              onClick={() => setStatusFilter("planned")}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                statusFilter === "planned"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Planifiées
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                statusFilter === "completed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Terminées
            </button>
          </div>
        </div>

        {/* Liste des campagnes */}
        <div className="grid grid-cols-1 gap-6">
          {filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
              <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune campagne</h3>
              <p className="text-gray-600">Aucune campagne ne correspond à vos filtres</p>
            </div>
          ) : (
            filteredCampaigns.map((campaign) => {
              const progress = getProgress(campaign);
              return (
                <div key={campaign._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Megaphone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">{campaign.description}</p>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Du {new Date(campaign.startDate).toLocaleDateString('fr-FR')} au {new Date(campaign.endDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="h-4 w-4" />
                      <span>{campaign.targetVaccine}</span>
                    </div>
                    {campaign.targetAgeGroup && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{campaign.targetAgeGroup}</span>
                      </div>
                    )}
                    {campaign.targetPopulation && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>Objectif: {campaign.targetPopulation} personnes</span>
                      </div>
                    )}
                  </div>

                  {campaign.status === "ongoing" && campaign.targetPopulation && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progression</span>
                        <span className="text-sm font-bold text-blue-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {campaign.vaccinatedCount || 0} / {campaign.targetPopulation} personnes vaccinées
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
