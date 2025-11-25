"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { ChildAPI, ChildUI } from "@/app/agent/enfants/types";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/app/lib/api";
import { Baby, Users } from "lucide-react";
import ChildrenTab from "./ChildrenTab";
import ParentsTab from "./ParentsTab";

function objectIdToISO(id?: string): string {
  if (!id || id.length < 8) return "";
  const tsHex = id.substring(0, 8);
  const seconds = parseInt(tsHex, 16);
  if (Number.isNaN(seconds)) return "";
  return new Date(seconds * 1000).toISOString();
}

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

  const id = d.id || d._id || "";
  const createdAt = (d as any)?.createdAt
    ? new Date((d as any).createdAt as string).toISOString()
    : objectIdToISO(id);

  return {
    id,
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
    createdAt,
  };
}

export default function EnfantsNationalPage() {
  const [activeTab, setActiveTab] = useState<"children" | "parents">("children");
  const [children, setChildren] = useState<ChildUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = useCallback(() => {
    setLoading(true);
    setError(null);

    apiFetch<any>(`/api/children`, { cache: "no-store" })
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
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <DashboardLayout>
      <div className="px-0 space-y-6 -ml-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Gestion des Enfants & Parents</h1>
          <p className="text-blue-100">
            Vue d'ensemble nationale - Consultez les enfants et leurs parents
          </p>
        </div>

        {/* Tabs personnalisés */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("children")}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "children"
                  ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Baby className="h-5 w-5" />
              Enfants
            </button>
            <button
              onClick={() => setActiveTab("parents")}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "parents"
                  ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Users className="h-5 w-5" />
              Parents
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-0">
            {activeTab === "children" && (
              <ChildrenTab
                children={children}
                loading={loading}
                error={error}
                onRefresh={loadChildren}
              />
            )}
            {activeTab === "parents" && <ParentsTab />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
