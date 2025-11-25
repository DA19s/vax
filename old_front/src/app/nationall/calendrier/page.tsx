"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useEffect, useState } from "react";
import { FileDown, Pencil, Trash2, Plus, Calendar, Syringe, Clock, X, AlertCircle } from "lucide-react";
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

type VaccineCalendarPayload = {
  vaccine: string[];
  dose: string;
  ageUnit: "weeks" | "months" | "years";
  description?: string;
  specificAge?: number | null;
  minAge?: number | null;
  maxAge?: number | null;
};

export default function VaccineCalendarPage() {
  const [calendars, setCalendars] = useState<VaccineCalendar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Formulaire
  const [mode, setMode] = useState<"single" | "range">("single");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [unit, setUnit] = useState<"weeks" | "months" | "years">("months");
  const [vaccines, setVaccines] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Pour modifier une entrée
  const [editId, setEditId] = useState<string | null>(null);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<VaccineCalendar[]>(`/api/vaccine-calendar`);
      setCalendars(Array.isArray(data) ? data : []);
    } catch {
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vaccines) return setError("Veuillez saisir les vaccins.");
    if (!minAge) return setError("Veuillez saisir un âge minimum.");

    let payload: VaccineCalendarPayload = {
      vaccine: vaccines.split(",").map((v) => v.trim()),
      dose: "1ère dose",
      ageUnit: unit,
      description,
    };

    if (mode === "single") {
      payload = { ...payload, specificAge: Number(minAge), minAge: null, maxAge: null };
    } else {
      if (!maxAge) return setError("Veuillez saisir l'âge maximum.");
      payload = {
        ...payload,
        minAge: Number(minAge),
        maxAge: Number(maxAge),
        specificAge: null,
      };
    }

    try {
      const method = editId ? "PUT" : "POST";
      const url = editId
        ? `${BASE_URL}/api/vaccine-calendar/${editId}`
        : `${BASE_URL}/api/vaccine-calendar`;

      await apiFetch<VaccineCalendar>(url.replace(BASE_URL, ""), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await fetchCalendars();
      resetForm();
    } catch {
      setError("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmer la suppression ?")) return;
    try {
      await apiFetch(`/api/vaccine-calendar/${id}`, {
        method: "DELETE",
      });
      setCalendars((prev) => prev.filter((c) => c._id !== id));
    } catch {
      setError("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setMinAge("");
    setMaxAge("");
    setVaccines("");
    setDescription("");
    setUnit("months");
    setMode("single");
    setEditId(null);
  };

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
      link.download = "vaccine-calendar.pdf";
      link.click();
    } catch {
      alert("Erreur lors du téléchargement du PDF");
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                Calendrier Vaccinal National
              </h1>
              <p className="text-gray-600">Configuration du programme de vaccination</p>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <FileDown size={18} />
              Exporter PDF
            </button>
          </div>
        </div>

        {/* Statistique */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Syringe className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">Vaccins configurés</h3>
                  <p className="text-3xl font-bold text-blue-600">{calendars.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {editId ? (
                <><Pencil className="h-5 w-5 text-blue-600" /> Modifier le calendrier</>
              ) : (
                <><Plus className="h-5 w-5 text-blue-600" /> Ajouter au calendrier</>
              )}
            </h3>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <X size={16} />
                Annuler
              </button>
            )}
          </div>

          <form onSubmit={handleAddOrUpdate} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type d&apos;âge</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "single" | "range")}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="single">Âge unique</option>
                  <option value="range">Tranche d&apos;âge</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unité</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as "weeks" | "months" | "years")}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="weeks">Semaines</option>
                  <option value="months">Mois</option>
                  <option value="years">Années</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mode === "single" ? "Âge" : "Âge minimum"}
                </label>
                <input
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  placeholder={`En ${translateUnit(unit)}`}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {mode === "range" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Âge maximum</label>
                  <input
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    placeholder={`En ${translateUnit(unit)}`}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vaccins</label>
              <input
                type="text"
                value={vaccines}
                onChange={(e) => setVaccines(e.target.value)}
                placeholder="Ex: BCG, Polio, Hépatite B (séparés par des virgules)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnelle)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Informations complémentaires..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm font-medium"
              >
                {editId ? (
                  <><Pencil size={18} /> Mettre à jour</>
                ) : (
                  <><Plus size={18} /> Ajouter</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Timeline des vaccinations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Programme de vaccination
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement du calendrier...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            </div>
          ) : calendars.length > 0 ? (
            <div className="space-y-4">
              {calendars.map((calendar, idx) => (
                <div
                  key={calendar._id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all duration-300 animate-slideUp"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      <Syringe className="h-6 w-6" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                            {calendar.specificAge != null
                              ? `${calendar.specificAge} ${translateUnit(calendar.ageUnit)}`
                              : calendar.maxAge != null
                              ? `${calendar.minAge}-${calendar.maxAge} ${translateUnit(calendar.ageUnit)}`
                              : `${calendar.minAge} ${translateUnit(calendar.ageUnit)}`}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">
                          {calendar.vaccine.join(", ")}
                        </h4>
                        {calendar.description && (
                          <p className="text-sm text-gray-600 mt-1">{calendar.description}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditId(calendar._id);
                            setMode(calendar.specificAge != null ? "single" : "range");
                            setUnit(calendar.ageUnit);
                            setMinAge(String(calendar.specificAge ?? calendar.minAge ?? ""));
                            setMaxAge(String(calendar.maxAge ?? ""));
                            setVaccines(calendar.vaccine.join(", "));
                            setDescription(calendar.description || "");
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(calendar._id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Calendar className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium mb-2">Aucun calendrier configuré</p>
              <p className="text-gray-400 text-sm">Ajoutez votre premier vaccin au calendrier</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}