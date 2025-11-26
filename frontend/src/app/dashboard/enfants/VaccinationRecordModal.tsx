"use client";

import { AlertCircle, Calendar, CheckCircle, Clock, Syringe, X } from "lucide-react";
import type { VaccinationDetail } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  detail: VaccinationDetail;
};

const sectionClasses = "rounded-2xl border border-slate-200 bg-white p-4";

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

function VaccinationRecordModal({ isOpen, onClose, detail }: Props) {
  if (!isOpen) return null;

  const { vaccinations } = detail;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 px-4 py-8">
      <div className="h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-100">Carnet de vaccination</p>
            <h2 className="text-xl font-semibold">{detail.child.name}</h2>
            <p className="text-sm text-purple-100">Dernière mise à jour le {formatDate(new Date().toISOString())}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-full overflow-y-auto px-6 py-6 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/70">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className={sectionClasses}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Syringe className="h-4 w-4 text-blue-500" />
                Vaccins à faire
              </div>
              <div className="space-y-3 text-sm">
                {vaccinations.due.length === 0 ? (
                  <p className="text-slate-500">Aucun vaccin en attente.</p>
                ) : (
                  Object.entries(
                    vaccinations.due.reduce<Record<string, { entry: typeof vaccinations.due[number]; doses: number[] }>>(
                      (acc, item) => {
                        if (!acc[item.vaccineId]) {
                          acc[item.vaccineId] = { entry: item, doses: [] };
                        }
                        acc[item.vaccineId].doses.push(item.dose);
                        return acc;
                      },
                      {},
                    ),
                  ).map(([vaccineId, group]) => {
                    const { entry, doses } = group;
                    const doseLabel =
                      doses.length === 1
                        ? `Dose ${doses[0]}`
                        : `Doses ${doses.sort((a, b) => a - b).join(", ")}`;
                    return (
                      <div key={vaccineId} className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <p className="font-semibold text-blue-900">{entry.vaccineName}</p>
                        <p className="text-xs text-blue-700">{doseLabel}</p>
                        {entry.specificAge != null ||
                        (entry.minAge != null && entry.maxAge != null) ? (
                          <p className="text-xs text-blue-600">
                            Tranche d&apos;âge recommandée :{" "}
                            {entry.specificAge != null
                              ? `${entry.specificAge} ${entry.ageUnit?.toLowerCase() ?? ""}`
                              : `${entry.minAge ?? "?"} - ${entry.maxAge ?? "?"} ${
                                  entry.ageUnit?.toLowerCase() ?? ""
                                }`}
                          </p>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className={sectionClasses}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Clock className="h-4 w-4 text-amber-500" />
                Vaccins programmés
              </div>
              <div className="space-y-3 text-sm">
                {vaccinations.scheduled.length === 0 ? (
                  <p className="text-slate-500">Aucun rendez-vous programmé.</p>
                ) : (
                  Object.entries(
                    vaccinations.scheduled.reduce<
                      Record<string, { entry: typeof vaccinations.scheduled[number]; doses: number[] }>
                    >((acc, item) => {
                      if (!acc[item.vaccineId]) {
                        acc[item.vaccineId] = { entry: item, doses: [] };
                      }
                      acc[item.vaccineId].doses.push(item.dose);
                      return acc;
                    }, {}),
                  ).map(([vaccineId, group]) => {
                    const { entry, doses } = group;
                    const doseLabel =
                      doses.length === 1
                        ? `Dose ${doses[0]}`
                        : `Doses ${doses.sort((a, b) => a - b).join(", ")}`;
                    return (
                      <div key={vaccineId} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <p className="font-semibold text-amber-900">{entry.vaccineName}</p>
                        <p className="text-xs text-amber-700">{doseLabel}</p>
                        <p className="text-xs text-amber-700">Prévu le {formatDate(entry.scheduledFor)}</p>
                        {entry.plannerName && (
                          <p className="text-xs text-amber-600">Planifié par {entry.plannerName}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className={sectionClasses}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Vaccins en retard
              </div>
              <div className="space-y-3 text-sm">
                {vaccinations.late.length === 0 && vaccinations.overdue.length === 0 ? (
                  <p className="text-slate-500">Aucun retard signalé.</p>
                ) : (
                  Object.entries(
                    [...vaccinations.late, ...vaccinations.overdue].reduce<
                      Record<string, { entry: typeof vaccinations.late[number]; doses: number[] }>
                    >((acc, item) => {
                      const key = `${item.vaccineId}-${item.calendarId ?? "none"}`;
                      if (!acc[key]) {
                        acc[key] = { entry: item, doses: [] };
                      }
                      acc[key].doses.push(item.dose);
                      return acc;
                    }, {}),
                  ).map(([key, group]) => {
                    const { entry, doses } = group;
                    const doseLabel =
                      doses.length === 1
                        ? `Dose ${doses[0]}`
                        : `Doses ${doses.sort((a, b) => a - b).join(", ")}`;
                    return (
                      <div key={key} className="rounded-xl border border-red-100 bg-red-50 p-3">
                        <p className="font-semibold text-red-900">{entry.vaccineName}</p>
                        <p className="text-xs text-red-700">{doseLabel}</p>
                        <p className="text-xs text-red-700">Date limite dépassée : {formatDate(entry.dueDate)}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className={sectionClasses}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Vaccins administrés
              </div>
              <div className="space-y-3 text-sm">
                {vaccinations.completed.length === 0 ? (
                  <p className="text-slate-500">Aucun vaccin enregistré.</p>
                ) : (
                  Object.entries(
                    vaccinations.completed.reduce<
                      Record<string, { entry: typeof vaccinations.completed[number]; doses: number[] }>
                    >((acc, item) => {
                      if (!acc[item.vaccineId]) {
                        acc[item.vaccineId] = { entry: item, doses: [] };
                      }
                      acc[item.vaccineId].doses.push(item.dose);
                      return acc;
                    }, {}),
                  ).map(([vaccineId, group]) => {
                    const { entry, doses } = group;
                    const doseLabel =
                      doses.length === 1
                        ? `Dose ${doses[0]}`
                        : `Doses ${doses.sort((a, b) => a - b).join(", ")}`;
                    return (
                      <div key={vaccineId} className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="font-semibold text-emerald-900">{entry.vaccineName}</p>
                        <p className="text-xs text-emerald-700">{doseLabel}</p>
                        <p className="text-xs text-emerald-700">Administré le {formatDate(entry.administeredAt)}</p>
                        {entry.administeredByName && (
                          <p className="text-xs text-emerald-600">Par {entry.administeredByName}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VaccinationRecordModal;
