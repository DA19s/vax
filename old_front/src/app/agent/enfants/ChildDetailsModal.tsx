"use client";

import { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { ChildUI } from "./types";
import { 
  X, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Baby,
  Heart,
  Stethoscope,
  FileText,
  Award,
  TrendingUp,
  Target,
  Plus,
  Edit3,
  Save,
  Syringe
} from "lucide-react";
import VaccinationRecordModal from "@/app/components/VaccinationRecordModal";
import { API_BASE_URL } from "@/app/lib/api";

type VaccineCalendar = {
  _id: string;
  vaccine: string[]; // noms de vaccins selon le calendrier national
  dose: string;
  ageUnit: "weeks" | "months" | "years";
  minAge?: number;
  maxAge?: number | null;
  specificAge?: number | null;
  description?: string;
};

type Vaccine = { _id: string; name: string };
type VaccinationDoc = {
  _id: string;
  vaccine?: { _id: string; name: string }; // ✅ Maintenant optionnel
  status: "scheduled" | "done" | "missed"; // ✅ ajouté ici
  scheduledDate?: string;
  doneDate?: string;
  doseNumber?: number;
  vaccineName?: string; // Fallback
  notes?: string;
};

type VaccineSchedule = {
  minAge: number;
  maxAge?: number | null;
  unit: "weeks" | "months" | "years";
  vaccines: string[]; // Liste des vaccins par leur ID
  description?: string;
};

// Interface complète pour le profil enfant
interface CompleteChildProfile {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "M" | "F";
  parentAccessCode?: string; // Code d'accès parent à 6 chiffres
  parentInfo?: {
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  };
  address?: string;
  healthCenter?: string;
  agent?: string;
  registrationDate?: string;
  lastVisit?: string;
  nextAppointment?: string;
  vaccinationRecords?: VaccinationRecord[];
  medicalInfo?: {
    weight?: number;
    height?: number;
    bloodType?: string;
    allergies?: string[];
    medicalNotes?: string;
    lastVisit?: string;
  };
  status: string;
  vaccinationProgress?: {
    total: number;
    completed: number;
    scheduled: number;
    overdue: number;
    planned: number;
    percentage: number;
  };
}

interface VaccinationRecord {
  vaccineName: string;
  date: string;
  status: "done" | "scheduled" | "overdue" | "planned";
  nextDue?: string;
  ageAtVaccination?: string;
  healthCenter?: string;
  agent?: string;
  batchNumber?: string;
  notes?: string;
}

// Étendre le type ChildUI localement pour les champs optionnels utilisés ici
type ChildWithAppointments = ChildUI & {
  appointments?: { status?: string }[];
  _id?: string;
  id?: string;
  parentName?: string;
  parentPhone?: string;
  birthDate?: string;
  name?: string;
  firstName?: string; // ✅ Ajouté pour les enfants liés
  lastName?: string; // ✅ Ajouté pour les enfants liés
  healthCenter?: string; // ✅ type string
};

type Props = {
  child: ChildWithAppointments;
  onClose: () => void;
  BASE: string;
  onUpdate: (child: ChildWithAppointments) => void;
  healthCenterId?: string; // facultatif, chaîne
};

type AppointmentBody = {
  child: string;
  vaccine: string;
  date: string;
  notes?: string;
  healthCenter?: string;
};

export default function ChildDetailsModal({
  child,
  onClose,
  BASE,
  onUpdate,
  healthCenterId: propHealthCenterId,
}: Props) {
  const [completeProfile, setCompleteProfile] = useState<CompleteChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "vaccinations" | "medical">("profile");
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVaccinationRecord, setShowVaccinationRecord] = useState(false);

  // Formulaires
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
  });

  const [vaccinationForm, setVaccinationForm] = useState({
    vaccineName: "",
    date: "",
    status: "done" as "done" | "scheduled" | "overdue" | "planned",
    notes: "",
  });

  const [medicalForm, setMedicalForm] = useState({
    weight: "",
    height: "",
    bloodType: "",
    allergies: [] as string[],
    medicalNotes: "",
  });

  // Variables pour l'ancien code (compatibilité)
  const [vaccines, setVaccines] = useState<string[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationDoc[]>([]);
  const [ageInWeeks, setAgeInWeeks] = useState<number>(0);
  const [showScheduled, setShowScheduled] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [showMissed, setShowMissed] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [doseNumber, setDoseNumber] = useState<number | "">("");

  // ✅ Modal de confirmation après programmation
  const [showProgramConfirm, setShowProgramConfirm] = useState(false);
  const [programSummary, setProgramSummary] = useState<
    { vaccine: string; date: string; time: string; doseNumber?: number }
  | null>(null);

  // ✅ Modal de reprogrammation
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    vaccinationId: string;
    vaccineName: string;
    newDate: string;
    newTime: string;
  } | null>(null);

  const getChildId = (c: ChildWithAppointments) => c.id ?? c._id ?? "";

  // Charger le profil complet depuis l'API
  useEffect(() => {
    const fetchCompleteProfile = async () => {
      try {
        setLoading(true);
        const childId = getChildId(child);
        console.log("🔄 Chargement profil complet:", childId);
        
        const response = await fetch(`${API_BASE_URL}/api/children/${childId}/profile`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            const mappedProfile: CompleteChildProfile = {
              id: data._id || data.id,
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              birthDate: data.birthDate,
              gender: data.gender,
              parentAccessCode: data.parentAccessCode, // ✅ Code d'accès parent
              parentInfo: data.parentInfo,
              address: data.address || "",
              healthCenter: data.healthCenter || "",
              agent: data.createdBy?.firstName && data.createdBy?.lastName 
                ? `${data.createdBy.firstName} ${data.createdBy.lastName}` 
                : "Agent non défini",
              registrationDate: data.registrationDate || data.createdAt,
              lastVisit: data.medicalInfo?.lastVisit,
              nextAppointment: data.nextAppointment,
              vaccinationRecords: data.vaccinationRecords || [],
              medicalInfo: data.medicalInfo,
              status: data.status || child.status,
              vaccinationProgress: data.vaccinationProgress,
            };
            
            setCompleteProfile(mappedProfile);
            
            // Pré-remplir les formulaires
            setProfileForm({
              firstName: mappedProfile.firstName,
              lastName: mappedProfile.lastName,
              address: mappedProfile.address || "",
              parentName: mappedProfile.parentInfo?.parentName || "",
              parentPhone: mappedProfile.parentInfo?.parentPhone || "",
              parentEmail: mappedProfile.parentInfo?.parentEmail || "",
            });
            
            setMedicalForm({
              weight: mappedProfile.medicalInfo?.weight?.toString() || "",
              height: mappedProfile.medicalInfo?.height?.toString() || "",
              bloodType: mappedProfile.medicalInfo?.bloodType || "",
              allergies: mappedProfile.medicalInfo?.allergies || [],
              medicalNotes: mappedProfile.medicalInfo?.medicalNotes || "",
            });
          }
        }
      } catch (error) {
        console.error("❌ Erreur chargement profil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompleteProfile();
  }, [child]);

  /** ✅ Simplifiée : accepte les noms de centre */
  async function resolveHealthCenterId(): Promise<string | undefined> {
    console.debug("[resolveHealthCenterId] start", {
      propHealthCenterId,
      childHealthCenter: child.healthCenter,
    });

    // 1️⃣ Si prop passé par le parent
    if (propHealthCenterId && propHealthCenterId.trim() !== "") {
      console.debug("[resolveHealthCenterId] using propHealthCenterId");
      return propHealthCenterId.trim();
    }

    // 2️⃣ Si l'enfant a déjà un nom de centre
    if (
      typeof child.healthCenter === "string" &&
      child.healthCenter.trim() !== ""
    ) {
      console.debug("[resolveHealthCenterId] using child.healthCenter string");
      return child.healthCenter.trim();
    }

    // 3️⃣ Aucun token lisible côté client — s'appuyer sur les champs existants
    // Si introuvable, laisser undefined pour que le backend gère/valide.

    console.warn(
      "[resolveHealthCenterId] impossible de résoudre un nom de centre"
    );
    return undefined;
  }

  // Récupération des vaccins et vaccinations
  useEffect(() => {
    const id = getChildId(child);
    if (!id) return;

    // Normalisation de nom (accents, espaces, ponctuation, casse)
    const normalize = (s: string) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "") // supprime espaces et ponctuation
        .trim();

    // Alias courants vers une clé canonique
    const alias = (s: string) => {
      // Normalise, puis supprime les chiffres finaux (ex: penta1 -> penta)
      let n = normalize(s).replace(/\d+$/g, "");
      const map: Record<string, string> = {
        // BCG
        bcg: "bcg",

        // Polio (VPO/OPV/IPV → on rapproche vers "polio")
        vpo: "polio",
        opv: "polio",
        polio: "polio",
        vpi: "polio", // IPV

        // Hépatite B naissance
        hepb0: "hepatiteb",
        hepb: "hepatiteb",
        hepatitisb0: "hepatiteb",
        hepatitisb: "hepatiteb",
        hepbnaissance: "hepatiteb",
        hepatiteb: "hepatiteb",

        // Rougeole (RR)
        rr: "rougeole",
        rrnaissance: "rougeole",

        // Fièvre jaune (VAA)
        vaa: "fievrejaune",

        // Penta/Pneumo/Rota/HPV — nécessitent que ces vaccins existent côté /api/vaccine
        penta: "penta",
        pneumo: "pneumo",
        rota: "rota",
        hpv: "hpv",
      };
      return map[n] || n;
    };

    (async () => {
      try {
        const [vaccRes, calendarRes] = await Promise.all([
          fetch(`${BASE}/api/vaccinations/child/${id}`, {
            credentials: "include",
          }),
          fetch(`${BASE}/api/vaccine-calendar`, {
            credentials: "include",
          }),
        ]);
        const vaccsRaw = vaccRes.ok ? await vaccRes.json() : [];
        const calendarsRaw: VaccineCalendar[] = calendarRes.ok
          ? await calendarRes.json()
          : [];

        if (Array.isArray(vaccsRaw)) setVaccinations(vaccsRaw);

        // Âge de l'enfant dans différentes unités
        const birthDate = new Date(child.birthDate);
        const today = new Date();
        const diffTime = today.getTime() - birthDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        const weeks = Math.floor(diffDays / 7);
        const months = Math.floor(diffDays / 30.4375); // moyenne
        const years = Math.floor(months / 12);

        console.debug("[Age] weeks/months/years:", { weeks, months, years });

        // Détermine les entrées applicables du calendrier national
        let applicableCalendars = calendarsRaw.filter((c) => {
          const age = c.ageUnit === "weeks" ? weeks : c.ageUnit === "months" ? months : years;
          if (c.specificAge !== null && c.specificAge !== undefined) {
            return age === c.specificAge;
          }
          const min = c.minAge ?? 0;
          const max = c.maxAge ?? Number.POSITIVE_INFINITY;
          return age >= min && age <= max;
        });

        // Fallback: si aucune entrée exacte (ex: 4 semaines) et que des specificAge existent,
        // on prend la tranche au specificAge le plus proche en dessous ou égal (même unité)
        if (applicableCalendars.length === 0) {
          const tryFallback = (
            unit: "weeks" | "months" | "years",
            currentAge: number
          ) => {
            const candidates = calendarsRaw
              .filter((c) => c.ageUnit === unit && c.specificAge !== null && c.specificAge !== undefined)
              .filter((c) => (c.specificAge as number) <= currentAge)
              .sort((a, b) => (b.specificAge as number) - (a.specificAge as number));
            return candidates[0] ? [candidates[0]] : [];
          };

          // Essaye sur l'unité la plus fine d'abord
          applicableCalendars =
            tryFallback("weeks", weeks).length > 0
              ? tryFallback("weeks", weeks)
              : tryFallback("months", months).length > 0
              ? tryFallback("months", months)
              : tryFallback("years", years);
        }

        console.debug("[Calendrier] applicables:", applicableCalendars);

        // Construire la liste unique de noms de vaccins à proposer (directement depuis le calendrier)
        const names = Array.from(
          new Set(
            applicableCalendars.flatMap((c) => c.vaccine.map((n) => n.trim()))
          )
        );

        if (names.length === 0 && applicableCalendars.length > 0) {
          console.warn("[Vaccins] Liste vide alors que des entrées calendrier existent");
        }

        setVaccines(names);
      } catch (err) {
        console.error("Erreur fetch vaccins/vaccinations", err);
      }
    })();
  }, [BASE, child]);

  // Calcul de l'âge en semaines (si nécessaire pour l'ancien code)
  useEffect(() => {
    if (!child.birthDate) return;
    const birthDate = new Date(child.birthDate);
    const today = new Date();
    const diffTime = today.getTime() - birthDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24); // Calcul en jours
    const ageInWeeks = Math.floor(diffDays / 7); // Conversion en semaines
    setAgeInWeeks(ageInWeeks); // Enregistrer l'âge en semaines
  }, [child.birthDate]); // Ajoute cette dépendance pour recalculer l'âge quand la date de naissance change

  const done = vaccinations.filter((v) => v.status === "done");
  const scheduled = vaccinations.filter((v) => v.status === "scheduled");

  const progress =
    vaccines.length === 0
      ? 0
      : Math.round((done.length / vaccines.length) * 100);

  const lastDone = done
    .slice()
    .sort(
      (a, b) =>
        new Date(b.doneDate || "").getTime() -
        new Date(a.doneDate || "").getTime()
    )[0];

  /** Programmer un vaccin */
  async function handleProgram() {
    if (!selectedVaccine || !date || !time) {
      alert("Veuillez choisir un vaccin, une date et une heure");
      return;
    }
    if (doseNumber === "" || typeof doseNumber !== "number") {
      alert("Veuillez sélectionner la dose");
      return;
    }

    const selectedDate = new Date(date);
    const [hours, minutes] = time.split(":");
    selectedDate.setHours(Number(hours), Number(minutes));
    if (isNaN(selectedDate.getTime())) {
      alert("Veuillez choisir une date et une heure valides");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/vaccinations/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          child: getChildId(child),
          vaccine: selectedVaccine, // on envoie le NOM; le backend résoudra le vaccin par nom
          scheduledDate: selectedDate.toISOString(),
          doseNumber,
        }),
      });
      if (!res.ok) throw new Error("Échec programmation vaccination");
      const data = await res.json();
      const created = (data && (data.vaccination ?? data)) as VaccinationDoc | undefined;
      if (created) setVaccinations((prev) => [...prev, created]);
      // 🔵 Mise à jour du statut "À jour" + date du prochain RDV côté enfant
      await fetch(`${BASE}/api/children/${getChildId(child)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: child.status === "Pas à jour" ? "Pas à jour" : "À jour", // ✅ NE CHANGE PAS SI RATÉ
          nextAppointment: selectedDate.toISOString(),
        }),
      });

      // ✅ PAS DE CRÉATION D'APPOINTMENT SÉPARÉ
      // La Vaccination suffit pour créer un rendez-vous
      // L'API /api/appointments combine automatiquement Vaccinations + Appointments
      
      onUpdate(child);

      // 🧾 Récapitulatif pour la modal
      setProgramSummary({
        vaccine: selectedVaccine,
        date: selectedDate.toLocaleDateString(),
        time: selectedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        doseNumber: typeof doseNumber === "number" ? doseNumber : undefined,
      });
      setShowProgramConfirm(true);

      // Reset des champs après avoir préparé le récap
      setSelectedVaccine("");
      setDoseNumber("");
    } catch (err) {
      console.error("❌ Erreur createAppointment:", err);
      alert("Erreur lors de la programmation");
    } finally {
      setLoading(false);
    }
  }

  /** Supprimer un vaccin programmé */
  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce vaccin programmé ?")) return;
    try {
      const res = await fetch(`${BASE}/api/vaccinations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setVaccinations((prev) => prev.filter((v) => v._id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    }
  }

  /** Marquer comme fait */
  async function handleMarkDone(id: string) {
    try {
      const res = await fetch(`${BASE}/api/vaccinations/${id}/complete`, {
        method: "PUT",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        
        // 🚨 Gestion des erreurs de stock
        if (errorData.error === "Stock non disponible" || errorData.error === "Stock épuisé") {
          alert(`⚠️ ${errorData.message || "Stock non disponible"}`);
          return;
        }
        
        throw new Error(errorData.message || "Erreur lors de la validation");
      }

      const data = await res.json();
      setVaccinations((prev) =>
        prev.map((v) =>
          v._id === id ? (data.vaccination as VaccinationDoc) : v
        )
      );

      // ✅ Mise à jour du statut enfant : À jour (après succès)
      // ✅ Mise à jour du statut enfant : vérifie s'il reste des vaccins ratés avant de passer "À jour"
      const stillMissed = vaccinations.some((v) => v.status === "missed");
      await fetch(`${BASE}/api/children/${getChildId(child)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: stillMissed ? "Pas à jour" : "À jour",
        }),
      });
      child.status = "À jour";
      onUpdate(child);
      
      alert("✅ Vaccin marqué comme fait et stock mis à jour");
    } catch (error: any) {
      alert(error.message || "Erreur lors de la validation");
    }
  }
  /** 🔁 Convertir un vaccin raté en "fait maintenant" */
  async function handleMarkMissedDone(id: string) {
    try {
      const res = await fetch(`${BASE}/api/vaccinations/${id}/complete`, {
        method: "PUT",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        
        // 🚨 Gestion des erreurs de stock
        if (errorData.error === "Stock non disponible" || errorData.error === "Stock épuisé") {
          alert(`⚠️ ${errorData.message || "Stock non disponible"}`);
          return;
        }
        
        throw new Error(errorData.message || "Erreur mise à jour vaccin raté");
      }

      const data = await res.json();
      setVaccinations((prev) =>
        prev.map((v) =>
          v._id === id ? (data.vaccination as VaccinationDoc) : v
        )
      );

      // ✅ Met à jour le statut de l’enfant
      // ✅ Met à jour le statut de l’enfant : recontrôle s’il reste des vaccins ratés
      const stillMissed = vaccinations.some((v) => v.status === "missed");
      await fetch(`${BASE}/api/children/${getChildId(child)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: stillMissed ? "Pas à jour" : "À jour",
        }),
      });

      child.status = "À jour";
      onUpdate(child);
      setShowMissed(false);
      alert("Vaccin raté validé ✅ et statut mis à jour !");
    } catch (err: any) {
      console.error("Erreur handleMarkMissedDone", err);
      alert(err.message || "Erreur lors de la mise à jour du vaccin raté");
    }
  }
  /** Marquer comme raté */
  async function handleMarkMissed(id: string) {
    if (!confirm("Confirmer que ce vaccin est raté ?")) return;
    try {
      const vaccinationRes = await fetch(`${BASE}/api/vaccinations/${id}/missed`, {
        method: "PUT",
        credentials: "include",
      });

      if (!vaccinationRes.ok) throw new Error();

      const result = await vaccinationRes.json();
      console.log("✅ Vaccin marqué comme raté:", result);

      // ✅ MISE À JOUR DE LA LISTE DES VACCINATIONS
      setVaccinations((prev) =>
        prev.map((v) =>
          v._id === id ? (result.vaccination as VaccinationDoc) : v
        )
      );

      // Met à jour l'enfant côté backend (statut et prochain RDV)
      const childRes = await fetch(
        `${BASE}/api/children/${getChildId(child)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: "Pas à jour",
            nextAppointment: null, // pour afficher "Pas encore programmé"
          }),
        }
      );

      if (!childRes.ok) throw new Error();

      alert("Vaccin marqué comme raté ❌ - Notification envoyée aux parents");
      child.status = "Pas à jour";
      child.nextAppointment = null;
      onUpdate(child);
    } catch (e) {
      console.error("Erreur markMissed", e);
      alert("Erreur lors de la mise à jour");
    }
  }

  /** 🔄 Reprogrammer un vaccin raté */
  async function handleRescheduleVaccine() {
    if (!rescheduleData) return;

    try {
      const { vaccinationId, newDate, newTime } = rescheduleData;
      
      // Combiner date et heure
      const scheduledDateTime = `${newDate}T${newTime}:00.000Z`;
      
      const response = await fetch(`${BASE}/api/vaccinations/${vaccinationId}/reschedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scheduledDate: scheduledDateTime,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Vaccin reprogrammé:", result);

      // Mettre à jour la liste des vaccinations
      setVaccinations((prev) =>
        prev.map((v) =>
          v._id === vaccinationId 
            ? { ...v, status: "scheduled", scheduledDate: scheduledDateTime }
            : v
        )
      );

      // Fermer le modal
      setShowRescheduleModal(false);
      setRescheduleData(null);
      
      alert(`✅ Vaccin ${rescheduleData.vaccineName} reprogrammé pour le ${new Date(scheduledDateTime).toLocaleDateString('fr-FR')} à ${newTime}. Notification envoyée au parent.`);
      
    } catch (err) {
      console.error("Erreur reprogrammation:", err);
      alert("Erreur lors de la reprogrammation du vaccin");
    }
  }

  /** 🔄 Ouvrir le modal de reprogrammation */
  function openRescheduleModal(vaccination: VaccinationDoc) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setRescheduleData({
      vaccinationId: vaccination._id,
      vaccineName: vaccination.vaccine?.name || vaccination.vaccineName || "Vaccin non spécifié",
      newDate: tomorrow.toISOString().split('T')[0],
      newTime: "10:00"
    });
    setShowRescheduleModal(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      {/* Bouton invisible pour déclencher la modal "ratés" depuis l’extérieur */}
      <button
        id="missedModalTrigger"
        onClick={() => setShowMissed(true)}
        className="hidden"
      />
      <div className="bg-white rounded-xl shadow-lg p-5 w-full max-w-3xl relative flex flex-col md:flex-row gap-6">
        {/* ❌ Fermer */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
        >
          ✖
        </button>

        {/* 🧒 Gauche : infos + progression */}
        <div className="flex-1 border-r pr-4 flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold mb-1 text-gray-800">
            {child.name || (completeProfile ? `${completeProfile.firstName} ${completeProfile.lastName}`.trim() : `${child.firstName || ""} ${child.lastName || ""}`.trim() || "Enfant")}
          </h3>
          <p className="text-sm text-gray-600 mb-2 text-center">
            Né(e) le{" "}
            {isNaN(new Date(child.birthDate ?? "").getTime())
              ? "Date invalide"
              : new Date(child.birthDate ?? "").toLocaleDateString()}
            <br />
            👩‍🦰 {completeProfile?.parentInfo?.parentName || child.parentName || "—"} | 📞 {completeProfile?.parentInfo?.parentPhone || child.parentPhone || "—"}
          </p>
          
          {/* 🔐 Code d'accès parent */}
          {completeProfile?.parentAccessCode && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-2 mb-4 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">🔐 Code d'accès parent</p>
              <p className="text-2xl font-bold text-blue-700 tracking-widest">
                {completeProfile.parentAccessCode}
              </p>
              <p className="text-xs text-blue-500 mt-1">À communiquer au parent pour l'app mobile</p>
            </div>
          )}

          {/* Progress */}
          <div className="w-32 h-32 mb-3">
            <CircularProgressbar
              value={progress}
              text={`${progress}%`}
              styles={buildStyles({
                pathColor: "#2563eb",
                textColor: "#111827",
                trailColor: "#e5e7eb",
              })}
            />
          </div>
          <p className="text-sm text-gray-600">Progression vaccinale</p>

          {lastDone && (lastDone.vaccine?.name || lastDone.vaccineName) && (
            <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-4 w-full text-center text-sm">
              <p className="text-green-700">
                Dernier vaccin : <strong>{lastDone.vaccine?.name || lastDone.vaccineName}</strong>
                {typeof lastDone.doseNumber === "number" && lastDone.doseNumber > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Dose {lastDone.doseNumber}</span>
                )} ✅
                <br />
                Le {new Date(lastDone.doneDate || "").toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-600 flex gap-3">
            <button
              onClick={() => setShowDone(true)}
              className="text-green-700 hover:underline"
            >
              ✅ {done.length} faits
            </button>
            |
            <button
              onClick={() => setShowScheduled(true)}
              className="text-yellow-700 hover:underline"
            >
              ⏳ {scheduled.length} programmés
            </button>
          </div>
          
          {/* Bouton Voir le carnet complet */}
          <div className="mt-4">
            <button
              onClick={() => setShowVaccinationRecord(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <Syringe className="h-4 w-4" />
              <span>Voir le carnet complet</span>
            </button>
          </div>
        </div>

        {/* 💉 Droite : programmation */}
        <div id="program-section" className="flex-1 pl-4">
          <h4 className="font-semibold mb-3 text-gray-800 text-lg">
            Programmer un vaccin
          </h4>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Choisir le vaccin :
            </label>
            <select
              value={selectedVaccine}
              onChange={(e) => setSelectedVaccine(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="">— Sélectionner un vaccin —</option>
              {vaccines.length > 0 ? (
                vaccines.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              ) : (
                <option>Aucun vaccin disponible</option>
              )}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date prévue :
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure du rendez-vous :
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dose prévue :
            </label>
            <select
              value={doseNumber === "" ? "" : String(doseNumber)}
              onChange={(e) => setDoseNumber(e.target.value ? Number(e.target.value) : "")}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="">— Sélectionner la dose —</option>
              <option value="1">1ère dose</option>
              <option value="2">2ème dose</option>
              <option value="3">3ème dose</option>
            </select>
          </div>

          <button
            onClick={handleProgram}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 font-medium"
          >
            {loading ? "Enregistrement..." : "Programmer le vaccin"}
          </button>
        </div>
      </div>

      {/* 🟨 Liste programmés */}
      {showScheduled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[10000]">
          <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md relative">
            <button
              onClick={() => setShowScheduled(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-900"
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-3">Vaccins programmés</h3>
            {scheduled.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun vaccin programmé.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {scheduled.map((v) => (
                  <li
                    key={v._id}
                    className="border rounded-md p-2 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {v.vaccine?.name || v.vaccineName}
                        {typeof v.doseNumber === "number" && v.doseNumber > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Dose {v.doseNumber}</span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {v.scheduledDate
                          ? new Date(v.scheduledDate).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkDone(v._id)}
                        className="text-green-600 hover:underline text-xs"
                      >
                        ✅ Fait
                      </button>
                      <button
                        onClick={() => handleMarkMissed(v._id)}
                        className="text-orange-600 hover:underline text-xs"
                      >
                        ❌ Raté
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        🗑 Supprimer
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 🟦 Confirmation programmation */}
      {showProgramConfirm && programSummary && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[10000]">
          <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md relative">
            <button
              onClick={() => setShowProgramConfirm(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-900"
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>✅ Vaccin programmé avec succès</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Vaccin</span>
                <span className="font-medium">{programSummary.vaccine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dose</span>
                <span className="font-medium">
                  {programSummary.doseNumber ? `Dose ${programSummary.doseNumber}` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{programSummary.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heure</span>
                <span className="font-medium">{programSummary.time}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowProgramConfirm(false);
                  setShowScheduled(true);
                }}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Voir programmés
              </button>
              <button
                onClick={() => setShowProgramConfirm(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟩 Liste faits */}
      {showDone && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[10000]">
          <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md relative">
            <button
              onClick={() => setShowDone(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-900"
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-3">Vaccins faits ✅</h3>
            {done.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun vaccin fait.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {done.map((v) => (
                  <li
                    key={v._id}
                    className="border rounded-md p-2 flex justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {v.vaccine?.name || v.vaccineName}
                      {typeof v.doseNumber === "number" && v.doseNumber > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Dose {v.doseNumber}</span>
                      )}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {v.doneDate
                        ? new Date(v.doneDate).toLocaleDateString()
                        : ""}
                    </span>
                  </li>
                ))}
                {/* 🔴 Liste vaccins ratés */}
                {/* 🚨 SECTION VACCINS RATÉS - VISIBLE EN PERMANENCE */}
                {vaccinations.filter((v) => v.status === "missed").length > 0 && (
                  <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h3 className="text-lg font-bold text-red-700">
                        ⚠️ Vaccins Ratés - Contacter pour Reprogrammer
                      </h3>
                      <span className="ml-auto bg-red-600 text-white rounded-full px-3 py-1 text-xs font-bold">
                        {vaccinations.filter((v) => v.status === "missed").length}
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mb-3">
                      Ces vaccins n'ont pas été administrés à la date prévue. Veuillez contacter les parents pour les reprogrammer.
                    </p>
                    <ul className="space-y-3">
                      {vaccinations
                        .filter((v) => v.status === "missed")
                        .map((v) => (
                          <li
                            key={v._id}
                            className="bg-white border-2 border-red-300 rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <p className="font-bold text-red-700 text-base">
                                    {v.vaccine?.name || v.vaccineName}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  📅 Date prévue: {" "}
                                  <span className="font-semibold">
                                    {v.scheduledDate
                                      ? new Date(v.scheduledDate).toLocaleDateString("fr-FR", {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })
                                      : "Non spécifiée"}
                                  </span>
                                </p>
                                <p className="text-xs text-red-600 font-medium">
                                  ⏰ Raté depuis:{" "}
                                  {v.scheduledDate
                                    ? Math.floor(
                                        (new Date().getTime() -
                                          new Date(v.scheduledDate).getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      )
                                    : "?"}{" "}
                                  jour(s)
                                </p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => openRescheduleModal(v)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                                >
                                  <Clock className="h-4 w-4" />
                                  Reprogrammer
                                </button>
                                <button
                                  onClick={() => handleMarkMissedDone(v._id)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Fait maintenant
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Modal pour affichage ancien (optionnel) */}
                {showMissed && vaccinations.filter((v) => v.status === "missed").length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[10000]">
                    <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md relative">
                      <button
                        onClick={() => setShowMissed(false)}
                        className="absolute top-2 right-3 text-gray-500 hover:text-gray-900"
                      >
                        ✖
                      </button>
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">
                        Vaccins ratés
                      </h3>
                      <p className="text-gray-500 text-sm">
                        ✅ Aucun vaccin marqué comme raté.
                      </p>
                    </div>
                  </div>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de carnet de vaccination */}
      {completeProfile && (
        <VaccinationRecordModal
          isOpen={showVaccinationRecord}
          onClose={() => setShowVaccinationRecord(false)}
          child={{
            id: completeProfile.id,
            name: `${completeProfile.firstName} ${completeProfile.lastName}`,
            birthDate: completeProfile.birthDate,
            gender: completeProfile.gender,
            parentName: completeProfile.parentInfo?.parentName
          }}
        />
      )}

      {/* 🔄 Modal de reprogrammation */}
      {showRescheduleModal && rescheduleData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Reprogrammer le vaccin
              </h3>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Vaccin : <span className="font-semibold text-blue-600">{rescheduleData.vaccineName}</span>
              </p>
              <p className="text-sm text-gray-600">
                Enfant : <span className="font-semibold">{completeProfile?.firstName} {completeProfile?.lastName}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouvelle date
                </label>
                <input
                  type="date"
                  value={rescheduleData.newDate}
                  onChange={(e) => setRescheduleData(prev => prev ? {...prev, newDate: e.target.value} : null)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure
                </label>
                <input
                  type="time"
                  value={rescheduleData.newTime}
                  onChange={(e) => setRescheduleData(prev => prev ? {...prev, newTime: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleData(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRescheduleVaccine}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Reprogrammer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
