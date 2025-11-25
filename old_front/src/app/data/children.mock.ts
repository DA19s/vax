export type ChildStatus = "À jour" | "En retard";

export type Child = {
  id: string;
  name: string;
  gender: "F" | "M";
  birthDate: string;           // ISO (YYYY-MM-DD)
  region: string;
  center: string;
  parentName: string;
  parentPhone: string;
  address: string;
  status: ChildStatus;
  nextAppointment?: string;    // ISO date
  vaccinesDue?: string[];      // vaccins à faire / manquants
};

// — petit util —
export function ageFromBirthDate(birthDate: string): string {
  const b = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
  if (years <= 0) {
    // montrer en mois si < 1 an
    const months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
    return `${Math.max(0, months)} mois`;
  }
  return `${years} ans`;
}

export const CHILDREN_MOCK: Child[] = [
  {
    id: "c1",
    name: "Awa Diop",
    gender: "F",
    birthDate: "2021-06-15",
    region: "Dakar",
    center: "Centre de santé HLM Dakar",
    parentName: "Mamadou Diop",
    parentPhone: "+221771112233",
    address: "Parcelles Assainies, Dakar",
    status: "À jour",
    nextAppointment: "2025-10-05T09:00:00Z",
    vaccinesDue: [],
  },
  {
    id: "c2",
    name: "Moussa Ndiaye",
    gender: "M",
    birthDate: "2023-03-10",
    region: "Thiès",
    center: "Centre de santé Thiès Nord",
    parentName: "Mariama Ndiaye",
    parentPhone: "+221764445566",
    address: "Thiès Nord",
    status: "En retard",
    nextAppointment: "2025-10-02T10:00:00Z",
    vaccinesDue: ["Rougeole 1", "Polio 2"],
  },
  {
    id: "c3",
    name: "Fatou Fall",
    gender: "F",
    birthDate: "2022-01-21",
    region: "Saint-Louis",
    center: "Poste de santé Sor",
    parentName: "Ibrahima Fall",
    parentPhone: "+221771234567",
    address: "Sor, Saint-Louis",
    status: "À jour",
    vaccinesDue: [],
  },
  {
    id: "c4",
    name: "Oumar Sow",
    gender: "M",
    birthDate: "2024-07-02",
    region: "Dakar",
    center: "Poste de santé Ouakam",
    parentName: "Ndèye Sow",
    parentPhone: "+221771111111",
    address: "Ouakam, Dakar",
    status: "En retard",
    nextAppointment: "2025-10-01T08:30:00Z",
    vaccinesDue: ["BCG", "Polio 1"],
  },
  {
    id: "c5",
    name: "Astou Mbaye",
    gender: "F",
    birthDate: "2020-11-05",
    region: "Thiès",
    center: "Centre de santé Thiès Est",
    parentName: "Cheikh Mbaye",
    parentPhone: "+221770000000",
    address: "Thiès Est",
    status: "À jour",
    vaccinesDue: [],
  },
  {
    id: "c6",
    name: "Ibrahima Diallo",
    gender: "M",
    birthDate: "2023-12-30",
    region: "Saint-Louis",
    center: "Centre de santé Guet Ndar",
    parentName: "Sokhna Diallo",
    parentPhone: "+221788888888",
    address: "Guet Ndar, Saint-Louis",
    status: "En retard",
    nextAppointment: "2025-10-07T11:30:00Z",
    vaccinesDue: ["Fièvre Jaune", "Rougeole 1"],
  },
  {
    id: "c7",
    name: "Khadija Ba",
    gender: "F",
    birthDate: "2022-08-18",
    region: "Dakar",
    center: "Centre de santé HLM Dakar",
    parentName: "Amadou Ba",
    parentPhone: "+221775550000",
    address: "Grand Yoff, Dakar",
    status: "À jour",
    vaccinesDue: [],
  },
  {
    id: "c8",
    name: "Amadou Kane",
    gender: "M",
    birthDate: "2021-02-09",
    region: "Thiès",
    center: "Centre de santé Thiès Nord",
    parentName: "Aminata Kane",
    parentPhone: "+221701234567",
    address: "Thiès Ouest",
    status: "En retard",
    vaccinesDue: ["Polio 3"],
  },
  {
    id: "c9",
    name: "Mame Diarra Ndiaye",
    gender: "F",
    birthDate: "2024-01-15",
    region: "Dakar",
    center: "Poste de santé Ouakam",
    parentName: "M. Ndiaye",
    parentPhone: "+221766666666",
    address: "Mamelles, Dakar",
    status: "À jour",
    vaccinesDue: [],
  },
  {
    id: "c10",
    name: "Serigne Faye",
    gender: "M",
    birthDate: "2022-09-30",
    region: "Saint-Louis",
    center: "Poste de santé Sor",
    parentName: "Coumba Faye",
    parentPhone: "+221701112223",
    address: "Sor, Saint-Louis",
    status: "En retard",
    nextAppointment: "2025-10-03T14:00:00Z",
    vaccinesDue: ["Rougeole 2"],
  },
];