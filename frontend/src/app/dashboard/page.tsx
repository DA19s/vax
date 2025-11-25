"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import DashboardShell from "@/app/dashboard/components/DashboardShell";
import StatCard from "@/app/dashboard/components/StatCard";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

type ChildrenResponse =
  | {
      total?: number;
      items?: unknown[];
    }
  | unknown[];

export default function DashboardPage() {
  const { accessToken } = useAuth();
  const [totalChildren, setTotalChildren] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChildrenStats = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/children`, {
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }

        const data: ChildrenResponse = await res.json();
        if (Array.isArray(data)) {
          setTotalChildren(data.length);
        } else {
          setTotalChildren(
            typeof data.total === "number"
              ? data.total
              : Array.isArray(data.items)
                ? data.items.length
                : 0,
          );
        }
      } catch (error) {
        console.error("Erreur récupération enfants:", error);
        setTotalChildren(0);
      } finally {
        setLoading(false);
      }
    };

    loadChildrenStats();
  }, [accessToken]);

  return (
    <DashboardShell active="/dashboard">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">
            Tableau de bord national
          </h2>
          <p className="text-sm text-slate-500">
            Vue d&apos;ensemble de la couverture vaccinale nationale.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Enfants enregistrés"
            value={totalChildren ?? 0}
            icon={Users}
            accent="emerald"
            loading={loading}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
