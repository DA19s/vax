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

        <div className="h-full overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className={sectionClasses}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Syringe className="h-4 w-4 text-blue-500" />
                Vaccins à venir
              </div>
              <div className="space-y-3 text-sm">
                {vaccinations.due.length === 0 ? (
                  <p className="text-slate-500">Aucun vaccin en attente.</p>
                ) : (
                  vaccinations.due.map((item) => (
                    <div key={item.id} className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <p className="font-semibold text-blue-900">{item.vaccineName}</p>
                      <p className="text-xs text-blue-700">Prévu le {formatDate(item.scheduledFor)}</p>
                      <p className="text-xs text-blue-600">
                        Tranche : {item.minAge ?? item.specificAge ?? "?"} - {item.maxAge ?? item.specificAge ?? "?"} {item.ageUnit.toLowerCase()}
                      </p>
                    </div>
                  ))
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
                  vaccinations.scheduled.map((item) => (
                    <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                      <p className="font-semibold text-amber-900">{item.vaccineName}</p>
                      <p className="text-xs text-amber-700">Prévu le {formatDate(item.scheduledFor)}</p>
                      {item.plannerName && (
                        <p className="text-xs text-amber-600">Planifié par {item.plannerName}</p>
                      )}
                    </div>
                  ))
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
                  [...vaccinations.late, ...vaccinations.overdue].map((item) => (
                    <div key={item.id} className="rounded-xl border border-red-100 bg-red-50 p-3">
                      <p className="font-semibold text-red-900">{item.vaccineName}</p>
                      <p className="text-xs text-red-700">Date limite dépassée : {formatDate(item.dueDate)}</p>
                    </div>
                  ))
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
                  vaccinations.completed.map((item) => (
                    <div key={item.id} className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                      <p className="font-semibold text-emerald-900">{item.vaccineName}</p>
                      <p className="text-xs text-emerald-700">Administré le {formatDate(item.administeredAt)}</p>
                      {item.administeredByName && (
                        <p className="text-xs text-emerald-600">Par {item.administeredByName}</p>
                      )}
                    </div>
                  ))
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
