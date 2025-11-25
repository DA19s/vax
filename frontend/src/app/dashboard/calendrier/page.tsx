"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Clock,
  FileDown,
  Pencil,
  Plus,
  Syringe,
  Trash2,
  X,
} from "lucide-react";
import DashboardShell from "@/app/dashboard/components/DashboardShell";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

type AgeUnit = "WEEKS" | "MONTHS" | "YEARS";

type CalendarEntry = {
  id: string;
  description: string;
  ageUnit: AgeUnit;
  specificAge: number | null;
  minAge: number | null;
  maxAge: number | null;
  vaccines: {
    id: string;
    name: string;
    description: string;
    dosesRequired: string;
  }[];
};

type VaccineOption = {
  id: string;
  name: string;
  description: string;
};

type EditFormState = {
  id: string;
  description: string;
  ageUnit: AgeUnit;
  specificAge: string;
  minAge: string;
  maxAge: string;
  vaccines: string[];
};

type CalendarResponse =
  | {
      id: string;
      description: string;
      ageUnit: AgeUnit;
      specificAge: number | null;
      minAge: number | null;
      maxAge: number | null;
      vaccines: {
        id: string;
        name: string;
        description: string;
        dosesRequired: string;
      }[];
    }[]
  | {
      calendar: {
        id: string;
        description: string;
        ageUnit: AgeUnit;
        specificAge: number | null;
        minAge: number | null;
        maxAge: number | null;
        vaccines: {
          id: string;
          name: string;
          description: string;
          dosesRequired: string;
        }[];
      }[];
    };

export default function CalendrierVaccinalPage() {
  const { accessToken, user } = useAuth();
  const isNational = user?.role === "NATIONAL";

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [vaccines, setVaccines] = useState<VaccineOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ageUnit, setAgeUnit] = useState<AgeUnit>("MONTHS");
  const [specificAge, setSpecificAge] = useState<string>("");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

  const createEmptyEditForm = (): EditFormState => ({
    id: "",
    description: "",
    ageUnit: "MONTHS",
    specificAge: "",
    minAge: "",
    maxAge: "",
    vaccines: [],
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(() => createEmptyEditForm());
  const [editError, setEditError] = useState<string | null>(null);

  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchCalendar = useCallback(async () => {
    if (!accessToken) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/vaccine/calendar`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      const data: CalendarResponse = await response.json();
      const list = Array.isArray(data) ? data : data?.calendar ?? [];

      const mapped: CalendarEntry[] = list.map((entry) => ({
        id: entry.id,
        description: entry.description,
        ageUnit: entry.ageUnit,
        specificAge:
          entry.specificAge != null ? Number(entry.specificAge) : null,
        minAge: entry.minAge != null ? Number(entry.minAge) : null,
        maxAge: entry.maxAge != null ? Number(entry.maxAge) : null,
        vaccines: entry.vaccines ?? [],
      }));

      setEntries(mapped);
    } catch (err) {
      console.error("Erreur chargement calendrier:", err);
      setEntries([]);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger le calendrier vaccinal"
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const fetchVaccines = useCallback(async () => {
    if (!isNational || !accessToken) {
      setVaccines([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/vaccine`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.vaccines ?? [];

      const mapped: VaccineOption[] = list.map(
        (v: {
          id: string;
          name: string;
          description?: string;
          dosesRequired?: string;
        }) => ({
          id: v.id,
          name: v.name,
          description: v.description ?? "",
        })
      );

      setVaccines(mapped);
    } catch (err) {
      console.error("Erreur chargement vaccins:", err);
      setVaccines([]);
    }
  }, [accessToken, isNational]);

  useEffect(() => {
    fetchCalendar();
    fetchVaccines();
  }, [fetchCalendar, fetchVaccines]);

  const resetForm = () => {
    setAgeUnit("MONTHS");
    setSpecificAge("");
    setMinAge("");
    setMaxAge("");
    setSelectedVaccines([]);
    setDescription("");
  };

  const translateUnit = (unit: AgeUnit) => {
    switch (unit) {
      case "WEEKS":
        return "semaines";
      case "MONTHS":
        return "mois";
      case "YEARS":
        return "ans";
      default:
        return unit.toLowerCase();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isNational || !accessToken) return;

    if (!specificAge.trim()) {
      setError("Veuillez saisir l'âge ciblé.");
      return;
    }

    if (!minAge.trim() || !maxAge.trim()) {
      setError("Veuillez saisir les âges minimum et maximum.");
      return;
    }

    const specificAgeValue = Number(specificAge);
    const minAgeValue = Number(minAge);
    const maxAgeValue = Number(maxAge);

    if (Number.isNaN(specificAgeValue)) {
      setError("L'âge ciblé doit être un nombre valide.");
      return;
    }

    if (Number.isNaN(minAgeValue) || Number.isNaN(maxAgeValue)) {
      setError("Les âges minimum et maximum doivent être des nombres valides.");
      return;
    }

    if (minAgeValue > maxAgeValue) {
      setError("L'âge minimum doit être inférieur ou égal à l'âge maximum.");
      return;
    }

    if (selectedVaccines.length === 0) {
      setError("Veuillez sélectionner au moins un vaccin.");
      return;
    }

    const payload = {
      description: description.trim(),
      ageUnit,
      specificAge: specificAgeValue,
      minAge: minAgeValue,
      maxAge: maxAgeValue,
      vaccine: selectedVaccines,
    };

    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/vaccine/calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      await fetchCalendar();
      resetForm();
      setCreateOpen(false);
    } catch (err) {
      console.error("Erreur enregistrement calendrier:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer l'entrée du calendrier"
      );
    }
  };

  const handleEdit = (entry: CalendarEntry) => {
    if (!isNational) return;
    setEditForm({
      id: entry.id,
      description: entry.description ?? "",
      ageUnit: entry.ageUnit,
      specificAge: entry.specificAge != null ? String(entry.specificAge) : "",
      minAge: entry.minAge != null ? String(entry.minAge) : "",
      maxAge: entry.maxAge != null ? String(entry.maxAge) : "",
      vaccines: entry.vaccines.map((v) => v.id),
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleEditVaccineSelect = (value: string) => {
    if (!value) return;
    setEditForm((prev) => {
      if (prev.vaccines.includes(value)) {
        return prev;
      }
      return {
        ...prev,
        vaccines: [...prev.vaccines, value],
      };
    });
  };

  const handleEditVaccineRemove = (value: string) => {
    setEditForm((prev) => ({
      ...prev,
      vaccines: prev.vaccines.filter((id) => id !== value),
    }));
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditError(null);
    setEditForm(createEmptyEditForm());
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isNational || !accessToken) return;

    if (!editForm.id) {
      setEditError("Élément introuvable.");
      return;
    }

    if (!editForm.specificAge.trim()) {
      setEditError("Veuillez saisir l'âge ciblé.");
      return;
    }

    if (!editForm.minAge.trim() || !editForm.maxAge.trim()) {
      setEditError("Veuillez saisir les âges minimum et maximum.");
      return;
    }

    if (editForm.vaccines.length === 0) {
      setEditError("Veuillez sélectionner au moins un vaccin.");
      return;
    }

    const specificAgeValue = Number(editForm.specificAge);
    const minAgeValue = Number(editForm.minAge);
    const maxAgeValue = Number(editForm.maxAge);

    if (Number.isNaN(specificAgeValue)) {
      setEditError("L'âge ciblé doit être un nombre valide.");
      return;
    }

    if (Number.isNaN(minAgeValue) || Number.isNaN(maxAgeValue)) {
      setEditError(
        "Les âges minimum et maximum doivent être des nombres valides."
      );
      return;
    }

    if (minAgeValue > maxAgeValue) {
      setEditError("L'âge minimum doit être inférieur ou égal à l'âge maximum.");
      return;
    }

    const payload = {
      description: editForm.description.trim(),
      ageUnit: editForm.ageUnit,
      specificAge: specificAgeValue,
      minAge: minAgeValue,
      maxAge: maxAgeValue,
      vaccine: editForm.vaccines,
    };

    try {
      setEditError(null);
      const response = await fetch(
        `${API_URL}/api/vaccine/calendar/${editForm.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      await fetchCalendar();
      closeEditModal();
    } catch (err) {
      console.error("Erreur mise à jour calendrier:", err);
      setEditError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour l'entrée du calendrier"
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!isNational || !accessToken) return;
    if (!window.confirm("Confirmer la suppression ?")) return;

    try {
      const response = await fetch(`${API_URL}/api/vaccine/calendar/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error("Erreur suppression calendrier:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer l'entrée du calendrier"
      );
    }
  };

  const handleDownloadPdf = async () => {
    if (!accessToken) return;

    try {
      setPdfLoading(true);
      const response = await fetch(
        `${API_URL}/api/vaccine/calendar/download-pdf`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "calendrier-vaccinal.pdf";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Erreur téléchargement PDF:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de télécharger le PDF"
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const totalEntries = useMemo(() => entries.length, [entries]);

  const groupedEntries = useMemo(() => {
    const map = new Map<AgeUnit, CalendarEntry[]>();
    entries.forEach((entry) => {
      const list = map.get(entry.ageUnit) ?? [];
      list.push(entry);
      map.set(entry.ageUnit, list);
    });

    return Array.from(map.entries()).map(([unit, list]) => ({
      unit,
      list: list.sort((a, b) => {
        const ageA = a.specificAge ?? a.minAge ?? 0;
        const ageB = b.specificAge ?? b.minAge ?? 0;
        return ageA - ageB;
      }),
    }));
  }, [entries]);

  return (
    <DashboardShell active="/dashboard/calendrier">
      <div className="space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Calendrier vaccinal national
            </h2>
            <p className="text-sm text-slate-500">
              Configuration et suivi du programme vaccinal.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" />
            {pdfLoading ? "Téléchargement..." : "Exporter PDF"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                  <Syringe className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    Vaccins configurés
                  </p>
                  <p className="text-3xl font-semibold text-blue-600">
                    {totalEntries}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isNational && (
          <div className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm">
            <button
              type="button"
              onClick={() => setCreateOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-3xl border-b border-slate-100 bg-white px-6 py-4 text-left transition hover:bg-slate-50"
            >
              <span className="text-lg font-semibold text-slate-900">
                Ajouter une entrée au calendrier
              </span>
              <ChevronDown
                className={`h-5 w-5 text-slate-500 transition-transform ${
                  createOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {createOpen ? (
              <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">
                      Unité
                    </label>
                    <select
                      value={ageUnit}
                      onChange={(event) =>
                        setAgeUnit(event.target.value.toUpperCase() as AgeUnit)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="WEEKS">Semaines</option>
                      <option value="MONTHS">Mois</option>
                      <option value="YEARS">Années</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">
                      Âge ciblé
                    </label>
                    <input
                      type="number"
                      value={specificAge}
                      onChange={(event) => setSpecificAge(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">
                      Âge minimum
                    </label>
                    <input
                      type="number"
                      value={minAge}
                      onChange={(event) => setMinAge(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">
                      Âge maximum
                    </label>
                    <input
                      type="number"
                      value={maxAge}
                      onChange={(event) => setMaxAge(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-600">
                    Vaccins concernés
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value=""
                      onChange={(event) => {
                        const value = event.target.value;
                        if (!value) return;
                        setSelectedVaccines((prev) =>
                          prev.includes(value) ? prev : [...prev, value]
                        );
                      }}
                    >
                      <option value="">Sélectionner un vaccin</option>
                      {vaccines.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {selectedVaccines.length === 0 ? (
                        <p className="text-slate-400">
                          Aucun vaccin sélectionné pour le moment.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedVaccines.map((vaccineId) => {
                            const option = vaccines.find(
                              (candidate) => candidate.id === vaccineId
                            );
                            if (!option) return null;
                            return (
                              <span
                                key={option.id}
                                className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                              >
                                {option.name}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedVaccines((prev) =>
                                      prev.filter((id) => id !== option.id)
                                    )
                                  }
                                  className="rounded-full bg-blue-200 px-2 py-0.5 text-blue-700 hover:bg-blue-300"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Ajoutez une note pour préciser cette étape vaccinale."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setCreateOpen(false);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            ) : (
              <div className="px-6 py-5 text-sm text-slate-500">
                Cliquez pour déplier et ajouter un nouveau vaccin au calendrier.
              </div>
            )}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Clock className="h-4 w-4 text-blue-600" />
            Programme de vaccination
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
                <p className="text-sm text-slate-500">
                  Chargement du calendrier...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <p className="font-medium text-red-600">
                  {error}
                </p>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-slate-500">
              <Calendar className="h-16 w-16 text-slate-300" />
              <p className="text-lg font-semibold">
                Aucun calendrier configuré
              </p>
              <p className="text-sm text-slate-400">
                Ajoutez une première entrée pour démarrer.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedEntries.map(({ unit, list }) => (
                <div key={unit} className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {translateUnit(unit)}
                  </h4>
                  <div className="space-y-3">
                    {list.map((entry, index) => {
                      return (
                        <div
                          key={entry.id}
                          className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-blue-50"
                          style={{ animationDelay: `${index * 40}ms` }}
                        >
                          <div className="flex-shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                              <Syringe className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                  {`Âge cible : ${entry.specificAge ?? "N/A"} ${translateUnit(entry.ageUnit)}`}
                                </span>
                                <span className="ml-2 inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {`Tranche : ${entry.minAge ?? "N/A"} - ${entry.maxAge ?? "N/A"} ${translateUnit(entry.ageUnit)}`}
                                </span>
                                <h5 className="mt-2 text-base font-semibold text-slate-900">
                                  {entry.vaccines.map((v) => v.name).join(", ")}
                                </h5>
                                {entry.description && (
                                  <p className="mt-1 text-sm text-slate-600">
                                    {entry.description}
                                  </p>
                                )}
                              </div>
                              {isNational && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(entry)}
                                    className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(entry.id)}
                                    className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {isNational && editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeEditModal}
              className="absolute right-4 top-4 rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-semibold text-slate-900">
              Modifier le calendrier vaccinal
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Ajustez les informations puis enregistrez vos modifications.
            </p>
            {editError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
                {editError}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">
                    Unité
                  </label>
                  <select
                    value={editForm.ageUnit}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        ageUnit: event.target.value.toUpperCase() as AgeUnit,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="WEEKS">Semaines</option>
                    <option value="MONTHS">Mois</option>
                    <option value="YEARS">Années</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">
                    Âge ciblé
                  </label>
                  <input
                    type="number"
                    value={editForm.specificAge}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        specificAge: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">
                    Âge minimum
                  </label>
                  <input
                    type="number"
                    value={editForm.minAge}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        minAge: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">
                    Âge maximum
                  </label>
                  <input
                    type="number"
                    value={editForm.maxAge}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        maxAge: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-600">
                  Vaccins concernés
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value=""
                    onChange={(event) => handleEditVaccineSelect(event.target.value)}
                  >
                    <option value="">Sélectionner un vaccin</option>
                    {vaccines.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {editForm.vaccines.length === 0 ? (
                      <p className="text-slate-400">
                        Aucun vaccin sélectionné pour le moment.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {editForm.vaccines.map((id) => {
                          const vaccine = vaccines.find((v) => v.id === id);
                          if (!vaccine) return null;
                          return (
                            <li
                              key={id}
                              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm"
                            >
                              <span className="font-medium text-slate-800">
                                {vaccine.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEditVaccineRemove(id)}
                                className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                              >
                                Retirer
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600">
                  Description (optionnel)
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Informations complémentaires..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Pencil className="h-4 w-4" />
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

