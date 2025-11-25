"use client";

import { useAuth } from "@/context/AuthContext";
import DashboardShell from "../components/DashboardShell";
import { useCallback, useEffect, useMemo, useState } from "react";
import ChildrenTab from "./ChildrenTab";
import ParentsTab from "./ParentsTab";
import { Child } from "./types";
import { Baby, Users } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

type ApiChildrenResponse = {
  total?: number;
  items?: Child[];
};

type TabKey = "children" | "parents";

const statusLabel = (child: Child): string => {
  if (child.status === "A_JOUR") {
    return "À jour";
  }
  if (child.vaccinesLate.length > 0 || child.vaccinesOverdue.length > 0) {
    return "En retard";
  }
  if (child.vaccinesDue.length > 0) {
    return "À faire";
  }
  return "Pas à jour";
};

export default function EnfantsPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("children");
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/children`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `Erreur ${response.status}`);
      }

      const data: ApiChildrenResponse = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setChildren(items);
    } catch (err) {
      console.error("Erreur chargement enfants:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadChildren();
    }
  }, [accessToken, loadChildren]);

  const stats = useMemo(() => {
    const total = children.length;
    const upToDate = children.filter((c) => statusLabel(c) === "À jour").length;
    const late = children.filter((c) => statusLabel(c) === "En retard").length;
    const scheduled = children.filter((c) => c.vaccinesScheduled.length > 0 || c.nextAppointment).length;
    return { total, upToDate, late, scheduled };
  }, [children]);

  return (
    <DashboardShell active="/dashboard/enfants">
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold">Gestion des Enfants & Parents</h1>
          <p className="mt-2 text-blue-100">
            Vue d'ensemble nationale – suivez les enfants, leurs statuts vaccinaux et les informations familles.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("children")}
              className={`flex flex-1 items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition ${
                activeTab === "children"
                  ? "border-b-2 border-blue-600 bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Baby className="h-5 w-5" />
              Enfants
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("parents")}
              className={`flex flex-1 items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition ${
                activeTab === "parents"
                  ? "border-b-2 border-blue-600 bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="h-5 w-5" />
              Parents
            </button>
          </div>

          <div className="p-0">
            {activeTab === "children" && (
              <ChildrenTab
                apiBase={API_URL}
                token={accessToken}
                children={children}
                loading={loading}
                error={error}
                onRefresh={loadChildren}
              />
            )}
            {activeTab === "parents" && (
              <ParentsTab apiBase={API_URL} token={accessToken} />
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
