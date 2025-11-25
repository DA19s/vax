"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { ChildAPI, ChildUI } from "@/app/agent/enfants/types";
import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { Baby, Users } from "lucide-react";
import ChildrenTab from "./ChildrenTab";
import ParentsTab from "./ParentsTab";
import { useSearchParams } from "next/navigation";

function mapApiToUI(d: ChildAPI): ChildUI {
  const gender: "F" | "M" = d.gender === "M" ? "M" : "F";
  const status =
    d.status === "En retard"
      ? "En retard"
      : d.status === "Non programmé"
      ? "Non programmé"
      : d.status === "Pas à jour"
      ? "Pas à jour"
      : d.status === "À faire"
      ? "À faire"
      : "À jour";

  const birthDate =
    d.birthDate && !isNaN(new Date(d.birthDate).getTime())
      ? new Date(d.birthDate).toISOString()
      : "";

  let nextAppointment = "";
  if (d.nextAppointment) {
    nextAppointment = new Date(d.nextAppointment).toISOString();
  } else if (Array.isArray(d.vaccinations) && d.vaccinations.length > 0) {
    const next = d.vaccinations
      .filter(
        (
          v
        ): v is {
          status: "scheduled" | "done" | "cancelled" | "planned";
          scheduledDate: string;
        } => v.status === "scheduled" && typeof v.scheduledDate === "string"
      )
      .map((v) => new Date(v.scheduledDate))
      .filter((date) => date.getTime() >= Date.now())
      .sort((a, b) => a.getTime() - b.getTime())[0];

    if (next) nextAppointment = next.toISOString();
  }

  return {
    id: d.id || d._id || "",
    name: d.name || "",
    gender,
    birthDate,
    region: d.region || "",
    healthCenter: d.healthCenter || "",
    parentName: d.parentName || "",
    parentPhone: d.parentPhone || "",
    address: typeof d.address === "string" ? d.address : "",
    status,
    nextAppointment,
    vaccinesDue: Array.isArray(d.vaccinesDue) ? d.vaccinesDue : [],
    vaccinesDone: Array.isArray(d.vaccinesDone) ? d.vaccinesDone : [],
    createdBy: d.createdBy || "",
    createdAt: (d as any)?.createdAt
      ? new Date((d as any).createdAt as string).toISOString()
      : "",
  };
}

export default function EnfantsAgentPage() {
  const searchParams = useSearchParams();
  const district = searchParams.get("district");

  const [activeTab, setActiveTab] = useState<"children" | "parents">("children");
  const [children, setChildren] = useState<ChildUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const url = district
      ? `/api/children?district=${encodeURIComponent(district)}`
      : `/api/children`;

    apiFetch<any>(url, { cache: "no-store" })
      .then((raw) => {
        if (Array.isArray(raw)) {
          return raw.map(mapApiToUI);
        } else if (raw?.children && Array.isArray(raw.children)) {
          return raw.children.map(mapApiToUI);
        } else {
          return [];
        }
      })
      .then(setChildren)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Erreur de chargement")
      )
      .finally(() => setLoading(false));
  }, [district]);

  return (
    <DashboardLayout>
      <div className="px-0 space-y-4 sm:space-y-6 -ml-1">
        {district && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
            Vue district : enfants de tous les acteurs de santé du district
            {" "}
            <span className="font-semibold">{district}</span>.
          </div>
        )}
        {/* Tabs personnalisés */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <div className="flex flex-1 min-w-max">
              <button
                onClick={() => setActiveTab("children")}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === "children"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Baby className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Enfants</span>
              </button>
              <button
                onClick={() => setActiveTab("parents")}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === "parents"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Parents</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-0 overflow-x-auto">
            {activeTab === "children" && (
              <ChildrenTab
                children={children}
                loading={loading}
                error={error}
              />
            )}
            {activeTab === "parents" && <ParentsTab />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
