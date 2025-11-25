export type AgeUnit = "WEEKS" | "MONTHS" | "YEARS";

export type VaccineWindow = {
  unit: AgeUnit;
  specificAge: number | null;
  min: number | null;
  max: number | null;
};

export type VaccineDue = {
  name: string;
  scheduledFor: string | null;
  ageWindow: VaccineWindow;
};

export type VaccineScheduled = {
  name: string;
  scheduledFor: string | null;
  plannerId?: string | null;
  plannerName?: string | null;
};

export type VaccineLate = {
  name: string;
  dueDate: string | null;
};

export type VaccineCompleted = {
  name: string;
  administeredAt: string | null;
  administeredById?: string | null;
  administeredByName?: string | null;
};

export type Child = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  gender: "M" | "F";
  birthDate: string;
  region: string;
  district: string;
  healthCenter: string;
  parentName: string;
  parentPhone: string;
  address: string;
  status: "A_JOUR" | "PAS_A_JOUR" | string;
  nextAppointment: string | null;
  vaccinesDue: VaccineDue[];
  vaccinesScheduled: VaccineScheduled[];
  vaccinesLate: VaccineLate[];
  vaccinesOverdue: VaccineLate[];
  vaccinesCompleted: VaccineCompleted[];
  createdAt: string;
  updatedAt: string;
};

export type VaccinationDetail = {
  child: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    gender: "M" | "F";
    birthDate: string;
    status: string;
    parentName: string;
    parentPhone: string;
    address: string | null;
    region: string;
    district: string;
    healthCenter: string;
  };
  vaccinations: {
    due: Array<{
      id: string;
      vaccineId: string;
      vaccineName: string;
      scheduledFor: string | null;
      calendarId: string;
      calendarDescription?: string | null;
      ageUnit: AgeUnit;
      specificAge: number | null;
      minAge: number | null;
      maxAge: number | null;
    }>;
    scheduled: Array<{
      id: string;
      vaccineId: string;
      vaccineName: string;
      scheduledFor: string | null;
      plannerId?: string | null;
      plannerName?: string | null;
      calendarId: string;
    }>;
    late: Array<{
      id: string;
      vaccineId: string;
      vaccineName: string;
      dueDate: string | null;
      calendarId: string;
      calendarDescription?: string | null;
    }>;
    overdue: Array<{
      id: string;
      vaccineId: string;
      vaccineName: string;
      dueDate: string | null;
      calendarId: string;
      calendarDescription?: string | null;
    }>;
    completed: Array<{
      id: string;
      vaccineId: string;
      vaccineName: string;
      administeredAt: string | null;
      administeredById?: string | null;
      administeredByName?: string | null;
      calendarId: string;
    }>;
  };
};

export type ParentChild = {
  id: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  status: string;
  region: string;
  healthCenter: string;
  nextAppointment: string | null;
  birthDate: string;
};

export type ParentOverview = {
  parentPhone: string;
  parentName: string;
  parentEmail?: string | null;
  childrenCount: number;
  children: ParentChild[];
  regions: string[];
  healthCenters: string[];
};

