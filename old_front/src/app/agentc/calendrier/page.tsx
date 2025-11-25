"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useEffect, useState } from "react";
import { FileDown, Calendar, Info } from "lucide-react";
import { apiFetch } from "@/app/lib/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type VaccineCalendar = {
  _id: string;
  vaccine: string[];
  dose: string;
  ageUnit: "weeks" | "months" | "years";
  minAge?: number;
  maxAge?: number;
  specificAge?: number | null;
  description?: string;
};

export default function AgentCalendrierPage() {
  const [calendars, setCalendars] = useState<VaccineCalendar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<VaccineCalendar[]>(`/api/vaccine-calendar`);
      setCalendars(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, []);

  const translateUnit = (u: string) =>
    u === "weeks" ? "semaines" : u === "months" ? "mois" : "ans";

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/vaccine-calendar/download-pdf`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Erreur lors de la génération du PDF");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "calendrier-vaccinal.pdf";
      link.click();
    } catch (err) {
      alert("Erreur lors du téléchargement du PDF");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="text-blue-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Calendrier Vaccinal National
              </h1>
              <p className="text-gray-600 text-sm">Visualisation en lecture seule</p>
            </div>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-md"
          >
            <FileDown size={18} /> Télécharger PDF
          </button>
        </div>

        {/* Encart informatif */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-5 rounded-lg mb-6 shadow-sm">
          <div className="flex gap-3">
            <Info className="text-blue-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2 text-lg">
                💉 À propos du Calendrier Vaccinal
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Ce calendrier vaccinal est établi par le niveau national et contient les recommandations 
                officielles pour la vaccination des enfants au Sénégal. Il précise <strong>l'âge recommandé</strong> pour 
                chaque vaccin, les <strong>doses nécessaires</strong>, et des informations complémentaires.
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                👨‍⚕️ En tant qu'<strong>agent de santé</strong>, consultez ce calendrier pour programmer les vaccinations 
                des enfants suivis dans votre centre. Ce calendrier est mis à jour régulièrement par le ministère de la santé.
              </p>
            </div>
          </div>
        </div>

        {/* Tableau du calendrier */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📅 Calendrier des Vaccinations
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Chargement du calendrier...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <th className="p-4 text-left font-semibold">Âge</th>
                    <th className="p-4 text-left font-semibold">Vaccins</th>
                    <th className="p-4 text-left font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {calendars.length > 0 ? (
                    calendars.map((calendar, idx) => (
                      <tr
                        key={calendar._id}
                        className={`border-t hover:bg-blue-50 transition ${
                          idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <td className="p-4">
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold text-sm">
                            {calendar.specificAge != null
                              ? `${calendar.specificAge} ${translateUnit(calendar.ageUnit)}`
                              : calendar.maxAge != null
                              ? `${calendar.minAge}-${calendar.maxAge} ${translateUnit(
                                  calendar.ageUnit
                                )}`
                              : `${calendar.minAge} ${translateUnit(calendar.ageUnit)}`}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {calendar.vaccine.map((v, i) => (
                              <span
                                key={i}
                                className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-gray-700">
                          {calendar.description || (
                            <span className="text-gray-400 italic">Aucune description</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-gray-500 italic"
                      >
                        📅 Aucun calendrier disponible pour le moment
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer informatif */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            ✅ <strong>Note :</strong> Ce calendrier est fourni à titre informatif. 
            Pour toute question, veuillez contacter votre superviseur régional ou le niveau national.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}