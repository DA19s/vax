"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  FileText,
  MapPin,
  Package,
  TrendingUp,
  Users,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import TabNavigation from "./components/TabNavigation";
import RegionsTab from "./components/RegionsTab";
import RegionDetailView from "./components/RegionDetailView";
import DistrictDetailView from "./components/DistrictDetailView";
import HealthCenterDetailView from "./components/HealthCenterDetailView";
import type { NationalStats, RegionDetailedStats, DistrictDetailedStats, HealthCenterDetailedStats, TabType, DrillLevel } from "./types";

export default function NationalReportsPage() {
  const { user } = useAuth();
  
  // États pour les onglets et navigation
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [drillLevel, setDrillLevel] = useState<DrillLevel>("national");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedHealthCenter, setSelectedHealthCenter] = useState<string | null>(null);
  
  // États pour les données
  const [stats, setStats] = useState<NationalStats | null>(null);
  const [regionStats, setRegionStats] = useState<RegionDetailedStats | null>(null);
  const [districtStats, setDistrictStats] = useState<DistrictDetailedStats | null>(null);
  const [healthCenterStats, setHealthCenterStats] = useState<HealthCenterDetailedStats | null>(null);
  
  // États UI
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("6months");

  // Charger les statistiques nationales
  useEffect(() => {
    const fetchNationalStats = async () => {
      if (!user || activeTab !== "overview") return;
      try {
        setLoading(true);
        const data = await apiFetch<NationalStats>(`/api/reports/national?period=${selectedPeriod}`);
        setStats(data);
      } catch (error) {
        console.error("❌ Erreur chargement stats national:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNationalStats();
  }, [user, selectedPeriod, activeTab]);

  // Les onglets vaccins et performance seront ajoutés dans une prochaine version

  // Fonctions de navigation drill-down
  const handleRegionClick = async (regionName: string) => {
    try {
      setLoading(true);
      setSelectedRegion(regionName);
      setDrillLevel("region");
      const data = await apiFetch<RegionDetailedStats>(`/api/reports/region/${encodeURIComponent(regionName)}?period=${selectedPeriod}`);
      setRegionStats(data);
    } catch (error) {
      console.error("❌ Erreur chargement stats région:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictClick = async (districtName: string) => {
    if (!selectedRegion) return;
    try {
      setLoading(true);
      setSelectedDistrict(districtName);
      setDrillLevel("district");
      const data = await apiFetch<DistrictDetailedStats>(
        `/api/reports/district/${encodeURIComponent(selectedRegion)}/${encodeURIComponent(districtName)}?period=${selectedPeriod}`
      );
      setDistrictStats(data);
    } catch (error) {
      console.error("❌ Erreur chargement stats district:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHealthCenterClick = async (healthCenterName: string) => {
    if (!selectedRegion || !selectedDistrict) return;
    try {
      setLoading(true);
      setSelectedHealthCenter(healthCenterName);
      setDrillLevel("healthcenter");
      const data = await apiFetch<HealthCenterDetailedStats>(
        `/api/reports/healthcenter/${encodeURIComponent(selectedRegion)}/${encodeURIComponent(selectedDistrict)}/${encodeURIComponent(healthCenterName)}?period=${selectedPeriod}`
      );
      setHealthCenterStats(data);
    } catch (error) {
      console.error("❌ Erreur chargement stats centre de santé:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToNational = () => {
    setDrillLevel("national");
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setSelectedHealthCenter(null);
    setRegionStats(null);
    setDistrictStats(null);
    setHealthCenterStats(null);
  };

  const handleBackToRegion = () => {
    setDrillLevel("region");
    setSelectedDistrict(null);
    setSelectedHealthCenter(null);
    setDistrictStats(null);
    setHealthCenterStats(null);
  };

  const handleBackToDistrict = () => {
    setDrillLevel("district");
    setSelectedHealthCenter(null);
    setHealthCenterStats(null);
  };


  const handleExportPDF = async () => {
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${BASE_URL}/api/reports/national/pdf`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'export PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-national-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("❌ Erreur export PDF:", error);
      alert("Erreur lors de l'export PDF. Veuillez réessayer.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Chargement des statistiques nationales...</div>
        </div>
      </DashboardLayout>
    );
  }

  const maxTrend = Math.max(...(stats?.monthlyVaccinations.map((m) => m.value) || [1]), 1);
  const maxVaccinations = Math.max(
    ...(stats?.regionPerformance.map((c) => c.vaccinations) || [1]),
    1
  );
  const hasData = stats && stats.summary.totalVaccinations > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb et en-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {/* Breadcrumb multi-niveaux */}
            {(drillLevel === "region" || drillLevel === "district" || drillLevel === "healthcenter") && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <button 
                  onClick={handleBackToNational}
                  className="hover:text-green-600 transition font-medium"
                >
                  National
                </button>
                {selectedRegion && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <button
                      onClick={drillLevel !== "region" ? handleBackToRegion : undefined}
                      className={`transition font-medium ${
                        drillLevel === "region" 
                          ? "font-semibold text-green-600" 
                          : "hover:text-green-600 cursor-pointer"
                      }`}
                    >
                      {selectedRegion}
                    </button>
                  </>
                )}
                {selectedDistrict && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <button
                      onClick={drillLevel === "healthcenter" ? handleBackToDistrict : undefined}
                      className={`transition font-medium ${
                        drillLevel === "district" 
                          ? "font-semibold text-green-600" 
                          : "hover:text-green-600 cursor-pointer"
                      }`}
                    >
                      {selectedDistrict}
                    </button>
                  </>
                )}
                {selectedHealthCenter && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="font-semibold text-green-600">{selectedHealthCenter}</span>
                  </>
                )}
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {drillLevel === "national" && "Rapports Nationaux Avancés"}
              {drillLevel === "region" && `Région: ${selectedRegion}`}
              {drillLevel === "district" && `District: ${selectedDistrict}`}
              {drillLevel === "healthcenter" && `Centre: ${selectedHealthCenter}`}
            </h1>
            <p className="text-gray-600 mt-1">
              {drillLevel === "national" && "Analyse complète et détaillée de la vaccination"}
              {drillLevel === "region" && "Statistiques détaillées par district"}
              {drillLevel === "district" && "Centres de santé du district"}
              {drillLevel === "healthcenter" && "Détails du centre de santé avec agents en aperçu"}
            </p>
          </div>
          <div className="flex gap-3">
            {drillLevel === "healthcenter" && (
              <button
                onClick={handleBackToDistrict}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour District
              </button>
            )}
            {drillLevel === "district" && (
              <button
                onClick={handleBackToRegion}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour Région
              </button>
            )}
            {drillLevel === "region" && (
              <button
                onClick={handleBackToNational}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour National
              </button>
            )}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="1month">1 mois</option>
              <option value="3months">3 mois</option>
              <option value="6months">6 mois</option>
              <option value="1year">1 an</option>
            </select>
            {drillLevel === "national" && (
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Exporter PDF
              </button>
            )}
          </div>
        </div>

        {/* Onglets de navigation (uniquement au niveau national) */}
        {drillLevel === "national" && (
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Affichage conditionnel selon l'onglet et le niveau */}
        {drillLevel === "national" && activeTab === "overview" && stats && (
          <>
            {/* Alertes stocks critiques */}
            {stats.summary.criticalStocks > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg animate-pulse">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">
                      ⚠️ Alerte stocks critiques
                    </h3>
                    <p className="text-sm text-red-800">
                      {stats.summary.criticalStocks} stock{stats.summary.criticalStocks > 1 ? "s" : ""} critique{stats.summary.criticalStocks > 1 ? "s" : ""} détecté{stats.summary.criticalStocks > 1 ? "s" : ""} (quantité &lt; 30 doses)
                    </p>
                  </div>
                </div>
              </div>
            )}

        {/* KPIs principaux avec animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 opacity-90" />
              <div className="text-xs bg-white/20 px-2 py-1 rounded">Total</div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.summary.totalChildren.toLocaleString()}</div>
            <div className="text-sm opacity-90">Enfants enregistrés</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-8 w-8 opacity-90" />
              <div className="text-xs bg-white/20 px-2 py-1 rounded">Effectuées</div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.summary.totalVaccinations.toLocaleString()}</div>
            <div className="text-sm opacity-90">Vaccinations totales</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 opacity-90" />
              <div className="text-xs bg-white/20 px-2 py-1 rounded">
                {stats?.summary.coverageRate && stats.summary.coverageRate >= 90 ? "Excellent" : stats?.summary.coverageRate && stats.summary.coverageRate >= 75 ? "Bon" : "Faible"}
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.summary.coverageRate.toFixed(1)}%</div>
            <div className="text-sm opacity-90">Taux de couverture</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="h-8 w-8 opacity-90" />
              <div className="text-xs bg-white/20 px-2 py-1 rounded">Actives</div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.summary.campaigns}</div>
            <div className="text-sm opacity-90">Campagnes en cours</div>
          </div>
        </div>

        {/* Statistiques secondaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats?.summary.totalRegions}</div>
                <div className="text-sm text-gray-600">Régions actives</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats?.summary.totalHealthCenters}</div>
                <div className="text-sm text-gray-600">Centres de santé</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Package className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats?.summary.criticalStocks}</div>
                <div className="text-sm text-gray-600">Stocks critiques</div>
              </div>
            </div>
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
              {stats?.monthlyVaccinations.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-gray-700">{item.month}</div>
                  <div className="flex-1">
                    <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-end pr-3 text-white text-sm font-bold"
                        style={{ 
                          width: item.value > 0 ? `${Math.max((item.value / maxTrend) * 100, 5)}%` : '0%',
                          minWidth: item.value > 0 ? '50px' : '0'
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
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Répartition par vaccin
            </h2>
            {stats?.coverageByVaccine && stats.coverageByVaccine.length > 0 ? (
              <div className="space-y-4">
                {stats.coverageByVaccine.map((vaccine, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">{vaccine.name}</span>
                      <span className="text-sm font-bold text-gray-700">
                        {vaccine.value.toLocaleString()} ({vaccine.percentage}%)
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

        {/* Top/Pire régions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 meilleures régions */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border border-green-200">
            <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              🏆 Top 5 meilleures régions
            </h2>
            {stats?.top5BestRegions && stats.top5BestRegions.length > 0 ? (
              <div className="space-y-3">
                {stats.top5BestRegions.map((region, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleRegionClick(region.region)}
                    className="flex items-center justify-between bg-white/60 rounded-lg p-3 cursor-pointer hover:bg-white hover:shadow-md transition-all transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-gray-900">{region.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-green-700">{region.coverage.toFixed(1)}%</div>
                      <ChevronRight className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Aucune donnée disponible</p>
            )}
          </div>

          {/* Top 5 pires régions */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-md p-6 border border-red-200">
            <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
              ⚠️ Régions nécessitant attention
            </h2>
            {stats?.top5WorstRegions && stats.top5WorstRegions.length > 0 ? (
              <div className="space-y-3">
                {stats.top5WorstRegions.map((region, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleRegionClick(region.region)}
                    className="flex items-center justify-between bg-white/60 rounded-lg p-3 cursor-pointer hover:bg-white hover:shadow-md transition-all transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        ⚠
                      </div>
                      <span className="font-medium text-gray-900">{region.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-red-700">{region.coverage.toFixed(1)}%</div>
                      <ChevronRight className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Aucune donnée disponible</p>
            )}
          </div>
        </div>

        {/* Performance détaillée par région */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Performance détaillée par région
          </h2>
          {stats?.regionPerformance && stats.regionPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Région</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Enfants</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Vaccinations</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Couverture</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.regionPerformance.map((region, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => handleRegionClick(region.region)}
                      className="border-b border-gray-100 hover:bg-blue-50 transition cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2">
                          {region.region}
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-700">{region.totalChildren.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{region.vaccinations.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[120px]">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
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
                          <span className="text-sm font-bold text-gray-700">{region.coverage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-full bg-gray-100 rounded-lg h-8 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold"
                            style={{
                              width: `${Math.max((region.vaccinations / maxVaccinations) * 100, 5)}%`,
                              minWidth: region.vaccinations > 0 ? '40px' : '0'
                            }}
                          >
                            {region.vaccinations > 0 && ((region.vaccinations / maxVaccinations) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Aucune donnée régionale disponible</p>
            </div>
          )}
        </div>
          </>
        )}

        {/* Onglet Régions */}
        {drillLevel === "national" && activeTab === "regions" && stats && (
          <RegionsTab 
            regionPerformance={stats.regionPerformance} 
            onRegionClick={handleRegionClick}
          />
        )}

        {/* Vue détaillée d'une région */}
        {drillLevel === "region" && regionStats && (
          <RegionDetailView stats={regionStats} onDistrictClick={handleDistrictClick} />
        )}

        {/* Vue détaillée d'un district - Affiche les centres de santé */}
        {drillLevel === "district" && districtStats && (
          <DistrictDetailView stats={districtStats} onHealthCenterClick={handleHealthCenterClick} />
        )}

        {/* Vue détaillée d'un centre de santé - Affiche agents en aperçu (non cliquables) */}
        {drillLevel === "healthcenter" && healthCenterStats && (
          <HealthCenterDetailView stats={healthCenterStats} />
        )}

        {/* Message si pas de données */}
        {!stats && !regionStats && !districtStats && !healthCenterStats && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
