/* -------------------------------------------------------------------------- */
/* 🧩 Types de base ---------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// ✅ Tous les statuts possibles (même qu’au backend)
export type ChildStatus =
  | "À jour"
  | "En retard"
  | "Non programmé"
  | "Pas à jour"
  | "À faire";

// ✅ Vaccination déjà faite
export type VaccineDone = {
  name: string;
  date: string; // format ISO (ex: "2025-10-26T12:00:00Z")
};

// ✅ Prochain calendrier théorique
export type NextSchedule = {
  age: number; // âge en mois
  vaccines: string[];
  dueDate: string; // format ISO
};

// ✅ Rendez-vous simplifié (pour les prochains vaccins planifiés)
export type AppointmentShort = {
  date?: string;
  status?: "scheduled" | "done" | "cancelled" | "planned";
};

/* -------------------------------------------------------------------------- */
/* 🧒 Structure utilisée côté interface (frontend) --------------------------- */
/* -------------------------------------------------------------------------- */
export type ChildUI = {
  id: string;
  name: string;
  gender: "F" | "M";
  birthDate: string;
  region?: string;
  healthCenter?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  status: ChildStatus; // ✅ à jour avec le backend
  nextAppointment?: string | null; // ✅ vrai prochain rendez-vous
  vaccinesDue?: string[];
  vaccinesDone?: VaccineDone[];
  nextSchedule?: NextSchedule;
  createdBy?: string;
  createdAt?: string;
};

/* -------------------------------------------------------------------------- */
/* 🌍 Structure reçue depuis l’API (backend) -------------------------------- */
/* -------------------------------------------------------------------------- */
export type ChildAPI = {
  _id?: string;
  id?: string;
  name?: string;
  gender?: "F" | "M" | string;
  birthDate?: string;
  region?: string;
  healthCenter?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string | null;
  status?: ChildStatus | string; // ✅ accepte le type strict + fallback string
  nextAppointment?: string | null;
  vaccinesDue?: string[] | null;
  vaccinesDone?: VaccineDone[] | null;
  nextSchedule?: NextSchedule | null;
  createdBy?: string;
  createdAt?: string;

  // ✅ Ajouté pour supporter la récupération du prochain vaccin programmé
  vaccinations?: {
    status: "scheduled" | "done" | "cancelled" | "planned";
    scheduledDate?: string;
    doneDate?: string;
    vaccine?: { name: string };
  }[];
};
