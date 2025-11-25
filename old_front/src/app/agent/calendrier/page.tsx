"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/DashboardLayout";
import { API_BASE_URL } from "@/app/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Syringe,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  X,
} from "lucide-react";

interface Appointment {
  id: string;
  type: "appointment" | "vaccination";
  title: string;
  date: string;
  status: "planned" | "pending" | "confirmed" | "completed" | "cancelled" | "scheduled" | "done" | "missed" | "refused";
  vaccine: string;
  doseNumber?: number;
  notes?: string;
  childId: string;
}

const statusConfig = {
  planned: {
    label: "Planifié",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    dotColor: "bg-blue-500",
    icon: CalendarIcon,
  },
  scheduled: {
    label: "Programmé",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    dotColor: "bg-purple-500",
    icon: Syringe,
  },
  pending: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    dotColor: "bg-yellow-500",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmé",
    color: "bg-green-100 text-green-700 border-green-300",
    dotColor: "bg-green-500",
    icon: CheckCircle,
  },
  completed: {
    label: "Complété",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    dotColor: "bg-emerald-500",
    icon: CheckCircle,
  },
  done: {
    label: "Fait",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    dotColor: "bg-emerald-500",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Annulé",
    color: "bg-red-100 text-red-700 border-red-300",
    dotColor: "bg-red-500",
    icon: XCircle,
  },
  missed: {
    label: "Raté",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    dotColor: "bg-orange-500",
    icon: AlertCircle,
  },
  refused: {
    label: "Refusé",
    color: "bg-red-100 text-red-700 border-red-300",
    dotColor: "bg-red-500",
    icon: XCircle,
  },
};

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function AgentCalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<{day: number, appointments: Appointment[]} | null>(null);
  const [appointmentLoad, setAppointmentLoad] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  useEffect(() => {
    if (!loading && (!user || (user.role !== "agent" && user.role !== "district"))) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, currentDate]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedStatus, searchQuery]);

  const fetchAppointments = async () => {
    try {
      setAppointmentLoad(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/agent/calendar?month=${month}&year=${year}`,
        { credentials: "include" }
      );

      if (!response.ok) throw new Error("Erreur chargement");
      
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("❌ Erreur:", error);
      setAppointments([]);
    } finally {
      setAppointmentLoad(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (selectedStatus !== "all") {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.vaccine.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getAppointmentsForDay = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split("T")[0];

    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.date).toISOString().split("T")[0];
      return aptDate === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  if (loading || appointmentLoad) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Chargement du calendrier...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const days = getDaysInMonth(currentDate);
  const stats = {
    total: filteredAppointments.length,
    planned: filteredAppointments.filter(a => a.status === "planned" || a.status === "scheduled").length,
    confirmed: filteredAppointments.filter(a => a.status === "confirmed").length,
    completed: filteredAppointments.filter(a => a.status === "completed" || a.status === "done").length,
    missed: filteredAppointments.filter(a => a.status === "missed" || a.status === "cancelled" || a.status === "refused").length,
    vaccinations: filteredAppointments.filter(a => a.type === "vaccination").length,
    appointments: filteredAppointments.filter(a => a.type === "appointment").length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              Calendrier des rendez-vous
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez vos rendez-vous de vaccination
            </p>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Aujourd'hui
          </button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Planifiés</p>
                <p className="text-2xl font-bold text-blue-700">{stats.planned}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Confirmés</p>
                <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Complétés</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Ratés</p>
                <p className="text-2xl font-bold text-orange-700">{stats.missed}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un patient ou un vaccin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filtre statut */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="planned">Planifié</option>
                <option value="scheduled">Programmé</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="completed">Complété</option>
                <option value="done">Fait</option>
                <option value="missed">Raté</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Navigation mois */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              
              <h2 className="text-2xl font-bold text-white">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* Grille calendrier */}
          <div className="p-6">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-600 text-sm py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Jours du mois */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayAppointments = day ? getAppointmentsForDay(day) : [];
                const isTodayDay = day ? isToday(day) : false;

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border rounded-lg p-2 transition-all ${
                      day
                        ? isTodayDay
                          ? "bg-blue-50 border-blue-300 shadow-md"
                          : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                        : "bg-gray-50"
                    }`}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-semibold mb-2 ${
                            isTodayDay
                              ? "text-blue-600 flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full"
                              : "text-gray-700"
                          }`}
                        >
                          {day}
                        </div>
                        
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((apt) => {
                            const config = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.planned;
                            return (
                              <button
                                key={apt.id}
                                onClick={() => setSelectedAppointment(apt)}
                                className={`w-full text-left p-1.5 rounded text-xs border ${config.color} hover:opacity-80 transition-opacity`}
                              >
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                                  <span className="truncate font-medium">
                                    {apt.title}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                          {dayAppointments.length > 2 && (
                            <button
                              onClick={() => setSelectedDayAppointments({ day: day!, appointments: dayAppointments })}
                              className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium pl-1 text-left hover:underline"
                            >
                              +{dayAppointments.length - 2} autre(s) →
                            </button>
                          )}
                          {dayAppointments.length > 0 && dayAppointments.length <= 2 && (
                            <button
                              onClick={() => setSelectedDayAppointments({ day: day!, appointments: dayAppointments })}
                              className="w-full text-xs text-gray-500 hover:text-blue-600 font-medium pl-1 text-left"
                            >
                              Voir tout ({dayAppointments.length})
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal détails rendez-vous */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                Détails du rendez-vous
              </h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Statut */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Statut</p>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                    (statusConfig[selectedAppointment.status as keyof typeof statusConfig] || statusConfig.planned).color
                  }`}
                >
                  {React.createElement(
                    (statusConfig[selectedAppointment.status as keyof typeof statusConfig] || statusConfig.planned).icon,
                    { className: "h-4 w-4" }
                  )}
                  {(statusConfig[selectedAppointment.status as keyof typeof statusConfig] || statusConfig.planned).label}
                </span>
              </div>

              {/* Patient */}
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedAppointment.title}
                </p>
              </div>

              {/* Date */}
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedAppointment.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(selectedAppointment.date).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Vaccin */}
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                  <Syringe className="h-4 w-4" />
                  Vaccin
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedAppointment.vaccine}
                  {selectedAppointment.doseNumber && (
                    <span className="text-sm text-gray-600 ml-2">
                      (Dose {selectedAppointment.doseNumber})
                    </span>
                  )}
                </p>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Notes
                  </p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push(`/agent/enfants/${selectedAppointment.childId}`)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Voir le dossier
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal liste complète des rendez-vous d'un jour */}
      {selectedDayAppointments && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setSelectedDayAppointments(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Rendez-vous du {selectedDayAppointments.day} {MONTHS[currentDate.getMonth()]}
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  {selectedDayAppointments.appointments.length} rendez-vous programmé{selectedDayAppointments.appointments.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayAppointments(null)}
                className="text-white hover:bg-blue-500 p-2 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Liste des rendez-vous */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-3">
                {selectedDayAppointments.appointments.map((apt) => {
                  const config = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.planned;
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={apt.id}
                      className={`border-2 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${config.color}`}
                      onClick={() => {
                        setSelectedDayAppointments(null);
                        setSelectedAppointment(apt);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* En-tête de la carte */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${config.color.replace('100', '200')}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{apt.title}</h4>
                              <p className="text-sm opacity-75 flex items-center gap-1">
                                {apt.type === "vaccination" ? (
                                  <>
                                    <Syringe className="h-3 w-3" />
                                    Vaccination programmée
                                  </>
                                ) : (
                                  <>
                                    <CalendarIcon className="h-3 w-3" />
                                    Rendez-vous
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Détails */}
                          <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                            <div>
                              <p className="opacity-75 mb-1">Vaccin</p>
                              <p className="font-semibold">
                                {apt.vaccine}
                                {apt.doseNumber && ` (Dose ${apt.doseNumber})`}
                              </p>
                            </div>
                            <div>
                              <p className="opacity-75 mb-1">Heure</p>
                              <p className="font-semibold">
                                {new Date(apt.date).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>

                          {apt.notes && (
                            <div className="mt-3 text-sm">
                              <p className="opacity-75 mb-1">Notes</p>
                              <p className="font-medium">{apt.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Badge statut */}
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pied de page */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedDayAppointments(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
