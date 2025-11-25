"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Baby,
  Calendar,
  HeartPulse,
  Home,
  MapPin,
  Phone,
  Stethoscope,
  Syringe,
  User,
  X,
} from "lucide-react";
import VaccinationRecordModal from "./VaccinationRecordModal";
import { Child, VaccinationDetail } from "./types";

const formatDate = (value?: string | null, withTime = false): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", {
    weekday: withTime ? "long" : undefined,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  });
};

const deriveStatusLabel = (child: Child): string => {
  if (child.status === "A_JOUR") return "À jour";
  if (child.vaccinesLate.length > 0 || child.vaccinesOverdue.length > 0) return "En retard";
  if (child.vaccinesDue.length > 0) return "À faire";
  return "Pas à jour";
};

type Props = {
  child: Child;
  token: string;
  apiBase: string;
  onClose: () => void;
  onRefresh?: () => void;
};

export default function ChildDetailsModal({ child, token, apiBase, onClose, onRefresh }: Props) {
  const [detail, setDetail] = useState<VaccinationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecord, setShowRecord] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase}/api/children/${child.id}/vaccinations`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? `Erreur ${response.status}`);
        }

        const payload: VaccinationDetail = await response.json();
        setDetail(payload);
      } catch (err) {
        console.error("Erreur chargement vaccination detail:", err);
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [apiBase, child.id, token]);

  const statusLabel = useMemo(() => deriveStatusLabel(child), [child]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">Dossier médical</p>
            <h2 className="text-xl font-semibold">{child.name}</h2>
            <p className="text-sm text-blue-100">{statusLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <User className="h-4 w-4 text-blue-500" />
              Informations de l'enfant
            </h3>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <Baby className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  <span className="inline-block w-28 text-slate-500">Nom</span>
                  <span className="font-medium text-slate-900">{child.name}</span>
                </p>
                <p>
                  <span className="inline-block w-28 text-slate-500">Naissance</span>
                  <span className="font-medium text-slate-900">{formatDate(child.birthDate)}</span>
                </p>
                <p>
                  <span className="inline-block w-28 text-slate-500">Genre</span>
                  <span className="font-medium text-slate-900">{child.gender === "M" ? "Garçon" : "Fille"}</span>
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Home className="h-4 w-4 text-blue-500" />
              Responsable légal
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs uppercase text-slate-400">Parent</p>
                  <p className="font-medium text-slate-900">{child.parentName || "Non renseigné"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs uppercase text-slate-400">Téléphone</p>
                  <p className="font-medium text-slate-900">{child.parentPhone || "Non renseigné"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 md:col-span-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs uppercase text-slate-400">Adresse</p>
                  <p className="font-medium text-slate-900">{child.address || "Non renseignée"}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Stethoscope className="h-4 w-4 text-blue-500" />
              Suivi vaccinal
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Syringe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">Vaccins à venir</p>
                      <p>{child.vaccinesDue.length > 0 ? `${child.vaccinesDue.length} vaccin(s) en attente` : "Aucun vaccin prévu"}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">Prochain rendez-vous</p>
                      <p>{formatDate(child.nextAppointment ?? undefined, true)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={() => setShowRecord(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            disabled={loading || !!error}
          >
            <Syringe className="h-4 w-4" />
            Voir le carnet complet
          </button>
        </div>
      </div>

      {detail && (
        <VaccinationRecordModal
          isOpen={showRecord}
          onClose={() => setShowRecord(false)}
          detail={detail}
        />
      )}
    </div>
  );
}

