"use client";

import { useState, useEffect } from "react";
import { MapPin, Users, Baby, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/app/lib/api";
import { ChildUI } from "@/app/agent/enfants/types";
import ChildDetailsModal from "./ChildDetailsModal";
import { ageFromBirthDate } from "@/app/data/children.mock";

interface District {
  district: string;
  totalChildren: number;
  children: any[];
}

interface DistrictStatsResponse {
  success: boolean;
  region: string;
  totalDistricts: number;
  totalChildren: number;
  districts: District[];
}

function Avatar({ name, gender }: { name: string; gender: "F" | "M" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bg = gender === "F" ? "bg-gradient-to-br from-pink-400 to-pink-500" : "bg-gradient-to-br from-blue-400 to-blue-500";

  return (
    <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-white ${bg} shadow-sm ring-2 ring-white transition-transform hover:scale-110`}>
      {initials}
    </div>
  );
}

export default function DistrictView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DistrictStatsResponse | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildUI | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les enfants et les centres de santé en parallèle
      const [children, healthCenters] = await Promise.all([
        apiFetch<any[]>("/api/children"),
        apiFetch<any[]>("/api/healthcenters"),
      ]);
      
      // Créer une map pour identifier rapidement les structures et leur district
      const structureToDistrict = new Map<string, string>();
      const districtSet = new Set<string>();
      
      // Identifier les districts et mapper les structures à leur district
      healthCenters.forEach((center: any) => {
        if (center.districtName) {
          // Cette structure appartient à un district
          structureToDistrict.set(center.name, center.districtName);
          districtSet.add(center.districtName);
        } else if (center.type === "district" || center.name.toLowerCase().includes("district")) {
          // C'est un district lui-même
          districtSet.add(center.name);
        }
      });
      
      // Grouper les enfants par district
      const districtMap = new Map<string, any[]>();
      
      children.forEach((child: any) => {
        // Normaliser l'ID pour garantir l'unicité
        const normalizedChild = {
          ...child,
          id: child.id || child._id,
        };
        
        // Déterminer le district de l'enfant
        let districtName = "Non assigné";
        
        if (normalizedChild.healthCenter) {
          // Vérifier si c'est directement un district
          if (districtSet.has(normalizedChild.healthCenter)) {
            districtName = normalizedChild.healthCenter;
          } 
          // Sinon, chercher le district de la structure
          else if (structureToDistrict.has(normalizedChild.healthCenter)) {
            districtName = structureToDistrict.get(normalizedChild.healthCenter)!;
          }
          // Sinon, utiliser le healthCenter comme district par défaut
          else {
            districtName = normalizedChild.healthCenter;
          }
        }
        
        if (!districtMap.has(districtName)) {
          districtMap.set(districtName, []);
        }
        districtMap.get(districtName)!.push(normalizedChild);
      });
      
      // Construire la réponse avec uniquement les districts
      const districts = Array.from(districtMap.entries()).map(([name, childrenList]) => ({
        district: name,
        totalChildren: childrenList.length,
        children: childrenList,
      }));
      
      // Trier par nombre d'enfants décroissant
      districts.sort((a, b) => b.totalChildren - a.totalChildren);
      
      const response: DistrictStatsResponse = {
        success: true,
        region: "Région", // Sera visible dans les données
        totalDistricts: districts.length,
        totalChildren: children.length,
        districts,
      };
      
      setData(response);
    } catch (e: any) {
      setError(e.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictClick = (district: District) => {
    setSelectedDistrict(district);
  };

  const handleBack = () => {
    setSelectedDistrict(null);
  };

  const mapToChildUI = (child: any): ChildUI => {
    return {
      id: child.id || child._id || "",
      name: child.name || `${child.firstName || ""} ${child.lastName || ""}`.trim(),
      gender: child.gender === "M" ? "M" : "F",
      birthDate: child.birthDate ? new Date(child.birthDate).toISOString() : "",
      region: child.region || "",
      healthCenter: child.healthCenter || "",
      parentName: child.parentName || "",
      parentPhone: child.parentPhone || "",
      address: child.address || "",
      status: child.status || "Non programmé",
      nextAppointment: child.nextAppointment ? new Date(child.nextAppointment).toISOString() : "",
      vaccinesDue: child.vaccinesDue || [],
      vaccinesDone: child.vaccinesDone || [],
      createdBy: child.createdBy || "",
      createdAt: child.createdAt || "",
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Vue liste des districts
  if (!selectedDistrict) {
    return (
      <div className="p-6 space-y-6">
        {/* Statistiques générales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Région</p>
                <p className="text-2xl font-bold text-blue-900">{data.region}</p>
              </div>
              <MapPin className="h-10 w-10 text-blue-600 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Districts</p>
                <p className="text-2xl font-bold text-purple-900">{data.totalDistricts}</p>
              </div>
              <Users className="h-10 w-10 text-purple-600 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Total Enfants</p>
                <p className="text-2xl font-bold text-green-900">{data.totalChildren}</p>
              </div>
              <Baby className="h-10 w-10 text-green-600 opacity-80" />
            </div>
          </div>
        </div>

        {/* Liste des districts */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Districts de votre région
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Cliquez sur un district pour voir tous les enfants enregistrés dans ce district et ses structures de santé
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.districts.map((district) => (
              <button
                key={district.district}
                onClick={() => handleDistrictClick(district)}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {district.district}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Baby className="h-4 w-4" />
                      <span className="font-medium text-lg text-gray-900">
                        {district.totalChildren}
                      </span>
                      <span>enfant{district.totalChildren > 1 ? "s" : ""} enregistré{district.totalChildren > 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      District + toutes structures
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vue détail d'un district
  return (
    <div className="p-6 space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Retour
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedDistrict.district}
            </h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {selectedDistrict.totalChildren} enfant{selectedDistrict.totalChildren > 1 ? "s" : ""} enregistré{selectedDistrict.totalChildren > 1 ? "s" : ""} dans ce district et ses structures de santé
          </p>
        </div>
      </div>

      {/* Liste des enfants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  Enfant
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  Âge
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  Parent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  Téléphone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wide">
                  Structure
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedDistrict.children.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    Aucun enfant enregistré dans ce district
                  </td>
                </tr>
              ) : (
                selectedDistrict.children.map((child) => (
                  <tr
                    key={child.id}
                    onClick={() => setSelectedChild(mapToChildUI(child))}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={child.name || `${child.firstName || ""} ${child.lastName || ""}`}
                          gender={child.gender === "M" ? "M" : "F"}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {child.name || `${child.firstName || ""} ${child.lastName || ""}`}
                          </p>
                          <p className="text-xs text-gray-500">{child.gender === "M" ? "Garçon" : "Fille"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {child.birthDate ? ageFromBirthDate(child.birthDate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {child.parentName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {child.parentPhone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          child.status === "À jour"
                            ? "bg-green-100 text-green-800"
                            : child.status === "En retard" || child.status === "Pas à jour"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {child.status || "Non programmé"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {child.healthCenter || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détails enfant */}
      {selectedChild && (
        <ChildDetailsModal
          child={selectedChild}
          onClose={() => setSelectedChild(null)}
          BASE="/api"
          onUpdate={(updatedChild) => {
            // Rechargement optionnel après modification
            loadData();
          }}
        />
      )}
    </div>
  );
}
