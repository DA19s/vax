"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/app/components/DashboardLayout";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Shield,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  X,
  Check,
  Ban,
  CalendarDays,
} from "lucide-react";
import VaccinationDaysModal from "./components/VaccinationDaysModal";
import VaccinationDaysDisplay from "./components/VaccinationDaysDisplay";
import { API_BASE_URL } from "@/app/lib/api";
import { useSearchParams } from "next/navigation";

interface Appointment {
  id: string;
  childName: string;
  childId: string;
  parentName?: string;
  parentPhone?: string;
  vaccine: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled" | "missed" | "planned" | "done" | "pending" | "confirmed";
  notes?: string;
  healthCenter?: string;
  type?: "district" | "actor"; // district = rendez-vous du district, actor = rendez-vous d'un acteur de santé
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <Clock className="h-3 w-3" />
          Programmé
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3" />
          Complété
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <XCircle className="h-3 w-3" />
          Annulé
        </span>
      );
    case "missed":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertCircle className="h-3 w-3" />
          Manqué
        </span>
      );
    default:
      return null;
  }
};

export default function RendezVousPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const district = searchParams.get("district");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed" | "missed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "district" | "actor">("all"); // Nouveau filtre
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  
  // États pour les jours de vaccination
  const [showVaccinationDaysModal, setShowVaccinationDaysModal] = useState(false);
  const [vaccinationDaysData, setVaccinationDaysData] = useState(null);
  const [loadingVaccinationDays, setLoadingVaccinationDays] = useState(false);

  // États pour les onglets et demandes de RDV
  const [activeTab, setActiveTab] = useState<"appointments" | "requests">("appointments");
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState("");
  const [confirmedTime, setConfirmedTime] = useState("09:00");
  const [acceptMessage, setAcceptMessage] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");

  useEffect(() => {
    if (activeTab === "appointments") {
      fetchAppointments();
      fetchVaccinationDays();
    } else {
      fetchRequests();
    }
  }, [activeTab, district, user]);

  // Fonction pour récupérer les jours de vaccination
  const fetchVaccinationDays = async () => {
    if (!user || !['district', 'agent'].includes(user.role)) return;
    
    try {
      setLoadingVaccinationDays(true);
      const response = await fetch(`${API_BASE_URL}/api/vaccination-days`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Jours de vaccination chargés:', result);
        setVaccinationDaysData(result.data);
      } else if (response.status === 404 || response.status === 200) {
        // Pas encore de planning configuré
        setVaccinationDaysData(null);
      } else {
        console.error('❌ Erreur chargement jours vaccination:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
    } finally {
      setLoadingVaccinationDays(false);
    }
  };

  const handleVaccinationDaysSave = () => {
    fetchVaccinationDays(); // Recharger les données
  };

  // Fonctions pour gérer les demandes de RDV
  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      
      // Test auth d'abord
      const authResponse = await fetch(`${API_BASE_URL}/api/appointment-requests/test-auth`, {
        credentials: 'include',
      });
      
      if (!authResponse.ok) {
        console.error('❌ Erreur auth test:', authResponse.status);
        const authError = await authResponse.json();
        console.error('❌ Auth error details:', authError);
        setRequests([]);
        return;
      }
      
      const authResult = await authResponse.json();
      console.log('✅ Auth test success:', authResult);
      
      const response = await fetch(`${API_BASE_URL}/api/appointment-requests/incoming`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        setRequests(result.requests || []);
      } else {
        console.error('❌ Erreur chargement demandes:', response.status);
        const errorData = await response.json();
        console.error('❌ Error details:', errorData);
        setRequests([]);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest || !confirmedDate) {
      alert("Veuillez sélectionner une date de confirmation");
      return;
    }

    try {
      setActionLoading(true);
      
      const confirmedDateTime = new Date(`${confirmedDate}T${confirmedTime}`);
      
      const response = await fetch(`${API_BASE_URL}/api/appointment-requests/${selectedRequest._id}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          confirmedDate: confirmedDateTime.toISOString(),
          responseMessage: acceptMessage,
        }),
      });

      if (response.ok) {
        alert("Demande acceptée avec succès !");
        setShowAcceptModal(false);
        setSelectedRequest(null);
        setConfirmedDate("");
        setConfirmedTime("09:00");
        setAcceptMessage("");
        fetchRequests(); // Recharger la liste
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message || "Erreur lors de l'acceptation"}`);
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      alert(error.message || "Erreur lors de l'acceptation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectMessage.trim()) {
      alert("Veuillez indiquer le motif de refus");
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/appointment-requests/${selectedRequest._id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          responseMessage: rejectMessage,
        }),
      });

      if (response.ok) {
        alert("Demande refusée");
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectMessage("");
        fetchRequests(); // Recharger la liste
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message || "Erreur lors du refus"}`);
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      alert(error.message || "Erreur lors du refus");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (action: 'complete' | 'miss' | 'cancel', appointmentId: string) => {
    try {
      setActionLoading(true);
      
      // Les rendez-vous sont en fait des vaccinations dans la base
      // On utilise donc l'API vaccinations
      let endpoint: string;
      let apiPath: string;
      
      if (action === 'complete') {
        endpoint = 'complete';
        apiPath = `/api/vaccinations/${appointmentId}/${endpoint}`;
      } else if (action === 'miss') {
        endpoint = 'missed'; // Note: l'API vaccination utilise "missed" pas "miss"
        apiPath = `/api/vaccinations/${appointmentId}/${endpoint}`;
      } else {
        // Pour cancel, utiliser l'endpoint cancel qui envoie la notification
        endpoint = 'cancel';
        apiPath = `/api/vaccinations/${appointmentId}/${endpoint}`;
      }
      
      const body = action === 'cancel' 
        ? JSON.stringify({ reason: cancelReason }) 
        : undefined;
      
      const response = await fetch(`${API_BASE_URL}${apiPath}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Rendez-vous ${action}:`, result);
        
        // Rafraîchir la liste
        await fetchAppointments();
        
        // Fermer le modal
        setShowDetailsModal(false);
        setSelectedAppointment(null);
        setCancelReason("");
        
        // Afficher un message de succès
        alert(result.message);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || error.message}`);
      }
    } catch (error) {
      console.error(`❌ Erreur ${action}:`, error);
      alert('Erreur lors de l\'opération');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Logique de filtrage selon le rôle :
      // - DISTRICT : Voit tous les rendez-vous de son district (les siens + acteurs)
      // - AGENT : Voit uniquement les rendez-vous de son propre centre (filtré par le backend)
      let url = `${API_BASE_URL}/api/appointments`;
      
      if (district) {
        // Si district est passé en query param (vue régionale)
        url += `?district=${encodeURIComponent(district)}`;
      } else if (user?.role === "district" && user?.healthCenter) {
        // Si l'utilisateur est district, passer son healthCenter comme paramètre district
        url += `?district=${encodeURIComponent(user.healthCenter)}`;
      }
      // Pour les agents, pas de paramètre → le backend filtre automatiquement par healthCenter

      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Rendez-vous chargés depuis API:", result);
        console.log(`   → Nombre reçu: ${Array.isArray(result) ? result.length : (result.data || result.appointments || []).length}`);
        
        const appointmentsData = result.data || result.appointments || result;
        
        // Mapper les données du backend
        const mappedAppointments = Array.isArray(appointmentsData) ? appointmentsData.map((apt: any) => {
          const appointmentDate = new Date(apt.date);
          const dateStr = appointmentDate.toISOString().split('T')[0];
          const timeStr = appointmentDate.toTimeString().slice(0, 5);
          
          // Mapper les statuts backend vers frontend
          let status: Appointment['status'] = "scheduled";
          if (apt.status === "done" || apt.status === "completed") status = "completed";
          else if (apt.status === "missed") status = "missed";
          else if (apt.status === "cancelled" || apt.status === "refused") status = "cancelled";
          else if (apt.status === "planned" || apt.status === "confirmed" || apt.status === "pending") status = "scheduled";
          
          // Déterminer le type : district ou acteur (seulement pour les utilisateurs district)
          const healthCenter = apt.healthCenter || "";
          const userHealthCenter = user?.healthCenter || "";
          const type: "district" | "actor" = user?.role === "district" 
            ? (healthCenter === userHealthCenter ? "district" : "actor")
            : "district"; // Pour les agents, tout est considéré comme "district" (leurs propres RDV)
          
          console.log(`📌 Mapping rendez-vous:`, {
            vaccine: apt.vaccine?.name || apt.vaccineName,
            statusBackend: apt.status,
            statusMapped: status,
            date: dateStr,
            healthCenter,
            type
          });
          
          return {
            id: apt._id || apt.id,
            childName: apt.child?.name || apt.childName || "Enfant",
            childId: apt.child?._id || apt.child || apt.childId,
            parentName: apt.parentName || apt.child?.parentName || apt.child?.parentInfo?.parentName,
            parentPhone: apt.parentPhone || apt.child?.parentPhone || apt.child?.parentInfo?.parentPhone,
            vaccine: apt.vaccine?.name || apt.vaccineName || apt.vaccine,
            date: dateStr,
            time: timeStr,
            status,
            notes: apt.notes,
            healthCenter,
            type,
          };
        }) : [];
        
        console.log(`📊 Total rendez-vous après mapping: ${mappedAppointments.length}`);
        console.log(`  - Programmés: ${mappedAppointments.filter(a => a.status === 'scheduled').length}`);
        console.log(`  - Complétés: ${mappedAppointments.filter(a => a.status === 'completed').length}`);
        
        setAppointments(mappedAppointments);
      } else {
        console.warn("Erreur API rendez-vous, code:", response.status);
        setAppointments([]);
      }
    } catch (error) {
      console.error("❌ Erreur chargement rendez-vous:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        const matchesFilter = filter === "all" || apt.status === filter;
        const matchesTypeFilter = typeFilter === "all" || apt.type === typeFilter;
        const matchesSearch = apt.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             apt.vaccine.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtrage par date - NE PAS FILTRER LES RENDEZ-VOUS COMPLÉTÉS/RATÉS
        let matchesDate = true;
        const aptDate = new Date(apt.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // ✅ Si le rendez-vous est complété ou raté, ne pas appliquer le filtre de date
        const isCompleted = apt.status === "completed" || apt.status === "missed";
        
        if (!isCompleted) {
          // Appliquer le filtre de date seulement pour les rendez-vous programmés
          if (dateFilter === "today") {
            matchesDate = aptDate.toDateString() === today.toDateString();
          } else if (dateFilter === "week") {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(today.getDate() + 7);
            matchesDate = aptDate >= today && aptDate <= weekFromNow;
          } else if (dateFilter === "month") {
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(today.getMonth() + 1);
            matchesDate = aptDate >= today && aptDate <= monthFromNow;
          } else if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            matchesDate = aptDate >= start && aptDate <= end;
          }
        }
        
        const result = matchesFilter && matchesTypeFilter && matchesSearch && matchesDate;
        
        // Log détaillé pour debugging
        if (!result) {
          console.log(`❌ Rendez-vous filtré:`, {
            vaccine: apt.vaccine,
            status: apt.status,
            type: apt.type,
            matchesFilter,
            matchesTypeFilter,
            matchesSearch,
            matchesDate,
            isCompleted,
            dateFilter
          });
        }
        
        return result;
      })
      .sort((a, b) => {
        // 🎯 TRI : Programmés en haut, Complétés en bas
        const getPriority = (status: string) => {
          switch (status) {
            case 'scheduled':
              return 1; // Programmés en premier
            case 'pending':
              return 2;
            case 'completed':
              return 3;  // Complétés ensuite
            case 'done':
              return 3;
            case 'missed':
              return 4;     // Ratés
            case 'cancelled':
              return 5;
            default:
              return 6;
          }
        };
        
        const prioA = getPriority(a.status);
        const prioB = getPriority(b.status);
        
        if (prioA !== prioB) {
          return prioA - prioB; // Tri par priorité
        }
        
        // Si même priorité, tri par date
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        // Pour programmés : plus proche en premier
        if (a.status === 'scheduled' || a.status === 'pending') {
          return dateA - dateB;
        }
        // Pour complétés/ratés : plus récent en premier
        return dateB - dateA;
      });
  }, [appointments, filter, typeFilter, searchTerm, dateFilter, startDate, endDate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des rendez-vous...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fadeIn max-w-7xl mx-auto">
        {/* Message d'info selon le rôle */}
        {user?.role === "district" && user?.healthCenter && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
            <span className="font-semibold">ℹ️ Vue district</span> : Vous voyez tous les rendez-vous du district 
            {" "}<span className="font-semibold">{district || user?.healthCenter}</span>
            {" "}(vos rendez-vous + ceux des acteurs de santé sous votre supervision).
          </div>
        )}
        {user?.role === "agent" && user?.healthCenter && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
            <span className="font-semibold">ℹ️ Vue centre de santé</span> : Vous voyez uniquement les rendez-vous de votre centre 
            {" "}<span className="font-semibold">{user.healthCenter}</span>.
          </div>
        )}
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                Rendez-vous
              </h1>
              <p className="text-gray-600">Gérez vos rendez-vous de vaccination</p>
            </div>
            {/* Bouton Mes jours de vaccination pour districts et agents uniquement */}
            {user && ['district', 'agent'].includes(user.role) ? (
              <button
                onClick={() => setShowVaccinationDaysModal(true)}
                disabled={loadingVaccinationDays}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <CalendarDays className="h-5 w-5" />
                Mes jours de vaccination
              </button>
            ) : (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-5 w-5" />
                Nouveau rendez-vous
              </button>
            )}
          </div>
        </div>

        {/* Statistiques rapides en haut */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilter("scheduled")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Programmés</p>
                <p className="text-3xl font-bold text-blue-600">
                  {appointments.filter(a => a.status === "scheduled").length}
                </p>
              </div>
              <Clock className="h-10 w-10 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilter("completed")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Complétés</p>
                <p className="text-3xl font-bold text-green-600">
                  {appointments.filter(a => a.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilter("missed")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Manqués</p>
                <p className="text-3xl font-bold text-red-600">
                  {appointments.filter(a => a.status === "missed").length}
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
          </div>
        </div>

        {/* Statistiques District vs Acteurs (seulement pour district) */}
        {user?.role === "district" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setTypeFilter("district")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 mb-1 font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Mes rendez-vous (District)
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {appointments.filter(a => a.type === "district").length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Actions disponibles</p>
                </div>
                <Calendar className="h-12 w-12 text-blue-300" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setTypeFilter("actor")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 mb-1 font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Rendez-vous acteurs de santé
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {appointments.filter(a => a.type === "actor").length}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Lecture seule</p>
                </div>
                <MapPin className="h-12 w-12 text-purple-300" />
              </div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-4">
              <button
                onClick={() => setActiveTab("appointments")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "appointments"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Rendez-vous
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {filteredAppointments.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "requests"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Demandes
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                    {requests.filter(r => r.status === "pending").length}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Affichage du planning de vaccination (seulement pour districts et agents) */}
        {user && ['district', 'agent'].includes(user.role) && vaccinationDaysData && activeTab === "appointments" && (
          <div className="mb-6">
            <VaccinationDaysDisplay 
              data={vaccinationDaysData}
              onEdit={() => setShowVaccinationDaysModal(true)}
            />
          </div>
        )}

        {/* Filtres et recherche - uniquement pour l'onglet rendez-vous */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom d'enfant ou vaccin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtres de statut */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilter("scheduled")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  filter === "scheduled"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Programmés
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  filter === "completed"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Complétés
              </button>
            </div>

            {/* Filtre de type (seulement pour district) */}
            {user?.role === "district" && (
              <div className="flex gap-2 border-l border-gray-300 pl-4">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    typeFilter === "all"
                      ? "bg-gray-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setTypeFilter("district")}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    typeFilter === "district"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  District
                </button>
                <button
                  onClick={() => setTypeFilter("actor")}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    typeFilter === "actor"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <User className="h-4 w-4" />
                  Acteurs
                </button>
              </div>
            )}
          </div>

          {/* Filtres de date */}
          <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => { setDateFilter("all"); setStartDate(""); setEndDate(""); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Toutes les dates
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === "today"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setDateFilter("week")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === "week"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cette semaine
              </button>
              <button
                onClick={() => setDateFilter("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === "month"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Ce mois
              </button>
            </div>

            {/* Plage personnalisée */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Période personnalisée:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setDateFilter("all"); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-gray-500">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setDateFilter("all"); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
        )}

        {/* Contenu selon l'onglet actif */}
        {activeTab === "appointments" ? (
          /* Liste des rendez-vous */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun rendez-vous</h3>
              <p className="text-gray-600 mb-6">
                {filter === "all" 
                  ? "Vous n'avez pas encore de rendez-vous programmés"
                  : `Aucun rendez-vous ${filter === "scheduled" ? "programmé" : "complété"}`}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Créer un rendez-vous
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {appointment.childName}
                          </h3>
                          {appointment.parentName && (
                            <p className="text-sm text-blue-600 font-medium">
                              Parent : {appointment.parentName}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">{appointment.vaccine}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-14">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(appointment.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {appointment.time}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(appointment.status)}
                          {user?.role === "district" && appointment.type && (
                            <>
                              {appointment.type === "district" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  <Shield className="h-3 w-3" />
                                  District
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                  <User className="h-3 w-3" />
                                  Acteur
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="ml-14 mt-3 text-sm text-gray-600 italic">
                          Note: {appointment.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {(() => {
                        // Les agents peuvent toujours agir (ils ne voient que leurs RDV)
                        // Les districts peuvent agir seulement sur leurs propres RDV (pas ceux des acteurs)
                        const isActorAppointment = user?.role === "district" && appointment.type === "actor";
                        const canPerformAction = user?.role === "agent" ? true : !isActorAppointment;
                        
                        return (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            
                            {appointment.status === "scheduled" && (
                              <>
                                <button
                                  onClick={() => handleAction('complete', appointment.id)}
                                  disabled={!canPerformAction || actionLoading}
                                  className={`p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 ${!canPerformAction ? 'cursor-not-allowed' : ''}`}
                                  title={!canPerformAction ? "Actions non disponibles pour les rendez-vous des acteurs" : "Marquer comme fait"}
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleAction('miss', appointment.id)}
                                  disabled={!canPerformAction || actionLoading}
                                  className={`p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 ${!canPerformAction ? 'cursor-not-allowed' : ''}`}
                                  title={!canPerformAction ? "Actions non disponibles pour les rendez-vous des acteurs" : "Marquer comme raté"}
                                >
                                  <AlertCircle className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowDetailsModal(true);
                                  }}
                                  disabled={!canPerformAction || actionLoading}
                                  className={`p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ${!canPerformAction ? 'cursor-not-allowed' : ''}`}
                                  title={!canPerformAction ? "Actions non disponibles pour les rendez-vous des acteurs" : "Annuler"}
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        ) : (
          /* Interface pour les demandes de RDV */
          <div className="space-y-6">
            {requestsLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des demandes...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande</h3>
                <p className="text-gray-600">Vous n'avez reçu aucune demande de rendez-vous des parents.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-orange-50 rounded-lg">
                            <User className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {request.child?.prenom} {request.child?.nom}
                              {request.urgencyLevel === "urgent" && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  🚨 Urgent
                                </span>
                              )}
                            </h3>
                            {request.child?.parentInfo?.parentName && (
                              <p className="text-sm text-orange-600 font-medium">
                                Parent : {request.child.parentInfo.parentName}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              Vaccination {request.vaccine} • Demandée le {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          request.status === "accepted" ? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {request.status === "pending" ? "En attente" :
                           request.status === "accepted" ? "Acceptée" : "Refusée"}
                        </span>
                      </div>
                    </div>

                    {/* Informations de la demande */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>Date souhaitée: {new Date(request.requestedDate).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{request.healthCenter}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Stock disponible:</span>{" "}
                          <span className={request.availableDoses > 0 ? "text-green-600" : "text-red-600"}>
                            {request.availableDoses} doses
                          </span>
                        </div>
                        {(request.child?.parentInfo?.parentName || request.child?.parentInfo?.phone) && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-600">
                              Parent qui a fait la demande :
                            </div>
                            {request.child?.parentInfo?.parentName && (
                              <div className="text-sm text-gray-900 font-medium">
                                {request.child.parentInfo.parentName}
                              </div>
                            )}
                            {request.child?.parentInfo?.phone && (
                              <div className="text-sm text-gray-600">
                                {request.child.parentInfo.phone}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message de la demande */}
                    {request.requestMessage && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium mb-1">Message du parent:</p>
                        <p className="text-sm text-gray-700">{request.requestMessage}</p>
                      </div>
                    )}

                    {/* Actions pour les demandes en attente */}
                    {request.status === "pending" && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setConfirmedDate(request.requestedDate.split('T')[0]);
                            setConfirmedTime("09:00");
                            setShowAcceptModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Accepter
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          Refuser
                        </button>
                      </div>
                    )}

                    {/* Message de réponse pour les demandes traitées */}
                    {request.responseMessage && (
                      <div className={`mt-4 p-3 rounded-lg ${
                        request.status === "accepted" ? "bg-green-50 border border-green-200" : 
                        "bg-red-50 border border-red-200"
                      }`}>
                        <p className="text-sm font-medium mb-1">
                          {request.status === "accepted" ? "Message d'acceptation:" : "Motif de refus:"}
                        </p>
                        <p className="text-sm">{request.responseMessage}</p>
                        {request.responseDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Le {new Date(request.responseDate).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de détails */}
        {showDetailsModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* En-tête du modal */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8" />
                    <div>
                      <h2 className="text-2xl font-bold">{selectedAppointment.childName}</h2>
                      {selectedAppointment.parentName && (
                        <p className="text-blue-200 text-sm font-medium">Parent : {selectedAppointment.parentName}</p>
                      )}
                      <p className="text-blue-100 text-sm">{selectedAppointment.vaccine}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedAppointment(null);
                      setCancelReason("");
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contenu du modal */}
              <div className="p-6 space-y-6">
                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Date</span>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      {new Date(selectedAppointment.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Heure</span>
                    </div>
                    <p className="text-gray-900 font-semibold">{selectedAppointment.time}</p>
                  </div>
                </div>

                {/* Informations parent */}
                {selectedAppointment.parentName && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">Informations parent</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-blue-900 font-semibold">{selectedAppointment.parentName}</p>
                      {selectedAppointment.parentPhone && (
                        <p className="text-sm text-blue-700">{selectedAppointment.parentPhone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Statut actuel */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-600 mb-2">Statut actuel</div>
                  <div>{getStatusBadge(selectedAppointment.status)}</div>
                </div>

                {/* Notes */}
                {selectedAppointment.notes && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-sm font-medium text-gray-600 mb-2">Notes</div>
                    <p className="text-gray-900">{selectedAppointment.notes}</p>
                  </div>
                )}

                {/* Actions disponibles si programmé */}
                {selectedAppointment.status === "scheduled" && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions disponibles</h3>
                    
                    <div className="space-y-3">
                      {/* Bouton Fait */}
                      <button
                        onClick={() => handleAction('complete', selectedAppointment.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-200"
                      >
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">
                          {actionLoading ? 'Traitement...' : 'Marquer comme fait'}
                        </span>
                      </button>

                      {/* Bouton Raté */}
                      <button
                        onClick={() => handleAction('miss', selectedAppointment.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-orange-200"
                      >
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-semibold">
                          {actionLoading ? 'Traitement...' : 'Marquer comme raté'}
                        </span>
                      </button>

                      {/* Section Annuler avec raison */}
                      <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                        <label className="block text-sm font-medium text-red-900 mb-2">
                          Raison de l'annulation (optionnel)
                        </label>
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Ex: Patient absent, matériel non disponible..."
                          className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
                          rows={2}
                        />
                        <button
                          onClick={() => handleAction('cancel', selectedAppointment.id)}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-center gap-3 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Ban className="h-5 w-5" />
                          <span className="font-semibold">
                            {actionLoading ? 'Annulation...' : 'Annuler le rendez-vous'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>ℹ️ Note:</strong> Le parent recevra automatiquement une notification sur son application mobile après chaque action.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal d'acceptation de demande */}
        {showAcceptModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Accepter la demande de rendez-vous
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Confirmer le rendez-vous pour {selectedRequest.child?.prenom} {selectedRequest.child?.nom}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date confirmée
                    </label>
                    <input
                      type="date"
                      value={confirmedDate}
                      onChange={(e) => setConfirmedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure
                    </label>
                    <input
                      type="time"
                      value={confirmedTime}
                      onChange={(e) => setConfirmedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message pour le parent (optionnel)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Message de confirmation..."
                      value={acceptMessage}
                      onChange={(e) => setAcceptMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAcceptModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAcceptRequest}
                    disabled={actionLoading || !confirmedDate}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? "Confirmation..." : "Confirmer le RDV"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de refus de demande */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Refuser la demande
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Indiquez le motif de refus pour {selectedRequest.child?.prenom} {selectedRequest.child?.nom}
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motif du refus (obligatoire)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Motif du refus..."
                    value={rejectMessage}
                    onChange={(e) => setRejectMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    disabled={actionLoading || !rejectMessage.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? "Refus..." : "Refuser la demande"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal des jours de vaccination */}
        <VaccinationDaysModal
          isOpen={showVaccinationDaysModal}
          onClose={() => setShowVaccinationDaysModal(false)}
          onSave={handleVaccinationDaysSave}
          existingData={vaccinationDaysData}
        />
      </div>
    </DashboardLayout>
  );
}
