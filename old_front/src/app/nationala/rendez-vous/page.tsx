"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Search,
  MapPin,
  Building2,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Syringe,
} from "lucide-react";

type Appointment = {
  _id: string;
  child?: { name?: string; parentName?: string; parentPhone?: string } | null;
  vaccine?: { name?: string } | null;
  date: string;
  status: "planned" | "done" | "missed" | "pending" | "confirmed" | "refused";
  notes?: string;
  healthCenter?: string;
  region?: string;
};

export default function NationalAppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [centerFilter, setCenterFilter] = useState<string>("all");

  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  async function fetchAppointments() {
    if (authLoading || !user || user.role !== "national") return;
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/appointments`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const safe: Appointment[] = Array.isArray(data)
        ? data.map((a: any) => ({
            ...a,
            child: a.child || { name: "Inconnu" },
            vaccine: a.vaccine || { name: "—" },
          }))
        : [];
      setAppointments(safe);
    } catch (err) {
      console.error("Erreur chargement rendez-vous (national):", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, [user?.role, authLoading]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => a.region && set.add(a.region));
    return ["all", ...Array.from(set).sort()];
  }, [appointments]);

  const centers = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => a.healthCenter && set.add(a.healthCenter));
    return ["all", ...Array.from(set).sort()];
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments
      .filter(
        (a) =>
          (a.child?.name ?? "").toLowerCase().includes(q) ||
          (a.healthCenter ?? "").toLowerCase().includes(q) ||
          (a.region ?? "").toLowerCase().includes(q)
      )
      .filter((a) => (regionFilter === "all" ? true : (a.region || "") === regionFilter))
      .filter((a) => (centerFilter === "all" ? true : (a.healthCenter || "") === centerFilter));
  }, [appointments, search, regionFilter, centerFilter]);

  // Statistiques
  const stats = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const done = appointments.filter((a) => a.status === "done").length;
    const missed = appointments.filter((a) => a.status === "missed").length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    return { total, confirmed, done, missed, pending };
  }, [appointments]);

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                Gestion des Rendez-vous
              </h1>
              <p className="text-gray-600">Vue d'ensemble nationale des rendez-vous de vaccination</p>
            </div>
            <button
              onClick={fetchAppointments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw size={18} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total RDV</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Confirmés</h3>
            <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Effectués</h3>
            <p className="text-3xl font-bold text-emerald-600">{stats.done}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">En attente</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Manqués</h3>
            <p className="text-3xl font-bold text-red-600">{stats.missed}</p>
          </div>
        </div>

        {/* Filtres modernes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtres de recherche</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher enfant, centre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? "Toutes les régions" : r}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all"
              >
                {centers.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "Tous les centres" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Liste des rendez-vous */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des rendez-vous...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium mb-2">Aucun rendez-vous trouvé</p>
              <p className="text-gray-400 text-sm">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filtered.map((rdv, idx) => (
                <div
                  key={rdv._id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-slideUp"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {rdv.child?.name ?? "Enfant inconnu"}
                        </h3>
                        {rdv.child?.parentName && (
                          <p className="text-xs text-gray-500">{rdv.child.parentName}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={rdv.status} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Syringe className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{rdv.vaccine?.name ?? "—"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {new Date(rdv.date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{rdv.healthCenter || "—"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{rdv.region || "—"}</span>
                    </div>
                  </div>

                  {rdv.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600 italic">"{rdv.notes}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const colors: Record<string, string> = {
    planned: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    missed: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    refused: "bg-gray-200 text-gray-600",
  };

  const labels: Record<string, string> = {
    planned: "Planifié",
    done: "Fait",
    missed: "Manqué",
    pending: "En attente",
    confirmed: "Confirmé",
    refused: "Refusé",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {labels[status] || "—"}
    </span>
  );
}