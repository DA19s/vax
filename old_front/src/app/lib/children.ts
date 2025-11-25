import { API_BASE_URL } from "@/app/lib/api";

export type ChildUI = {
  id: string;
  name: string;
  gender: "F" | "M";
  birthDate: string; // ISO
  region?: string;
  center?: string; // mapped from healthCenter
  parentName?: string;
  parentPhone?: string;
  address?: string;
  status?: "À jour" | "En retard";
  nextAppointment?: string;
  vaccinesDue?: string[];
};

export async function fetchChildren(): Promise<ChildUI[]> {
  const res = await fetch(`${API_BASE_URL}/api/children`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch children failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((d: any) => ({
    id: d.id || d._id || "",
    name: d.name,
    gender: d.gender,
    birthDate: d.birthDate ? new Date(d.birthDate).toISOString() : "",
    region: d.region,
    center: d.healthCenter || d.center, // normalize
    parentName: d.parentName,
    parentPhone: d.parentPhone,
    // Optional fields not present in backend will be undefined
    address: d.address,
    status: d.status,
    nextAppointment: d.nextAppointment,
    vaccinesDue: d.vaccinesDue,
  }));
}
