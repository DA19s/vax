"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

/* -------------------------------------------------------------------------- */
/* 🧩 Typage du rendez-vous                                                  */
/* -------------------------------------------------------------------------- */
type Appointment = {
  _id: string;
  child?: { name?: string; parentName?: string; parentPhone?: string } | null;
  vaccine?: { name?: string } | null;
  date: string;
  status: "planned" | "done" | "missed" | "pending" | "confirmed" | "refused";
  notes?: string;
  time?: string; // Ajout pour l'heure
};

/* -------------------------------------------------------------------------- */
/* 🧭 Page principale                                                        */
/* -------------------------------------------------------------------------- */
export default function RendezVousAgentPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  /* -------------------------------------------------------------------------- */
  /* 🔁 Charger la liste des rendez-vous                                        */
  /* -------------------------------------------------------------------------- */
  async function fetchAppointments() {
    if (authLoading || !user || user.role !== "agent") return;
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/appointments/my`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const safeData = Array.isArray(data)
        ? data.map((a) => ({
            ...a,
            child: a.child || { name: "Inconnu" },
            vaccine: a.vaccine || { name: "—" },
            time: a.date ? new Date(a.date).toLocaleTimeString() : "",
          }))
        : [];
      setAppointments(safeData);
    } catch (err) {
      console.error("❌ Erreur chargement rendez-vous :", err);
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* ✅ Marquer un rendez-vous comme fait                                      */
  /* -------------------------------------------------------------------------- */
  async function markDone(id: string) {
    try {
      const res = await fetch(`${BASE}/api/appointments/${id}/complete`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        // 🔄 Mise à jour immédiate de la liste
        setAppointments((prev) => prev.filter((a) => a._id !== id));
      }
    } catch {
      alert("Erreur lors de la validation ✅");
    }
  }

  /* -------------------------------------------------------------------------- */
  /* ❌ Supprimer un rendez-vous                                               */
  /* -------------------------------------------------------------------------- */
  async function deleteAppointment(id: string) {
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    try {
      const res = await fetch(`${BASE}/api/appointments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setAppointments((prev) => prev.filter((a) => a._id !== id));
      }
    } catch {
      alert("Erreur lors de la suppression 🗑️");
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 🧭 Charger les données à l’ouverture                                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    fetchAppointments();
  }, [user?.role, authLoading]);

  /* -------------------------------------------------------------------------- */
  /* 🔍 Filtrage sécurisé (sans crash null.name)                               */
  /* -------------------------------------------------------------------------- */
  const filtered = appointments
    .filter((a) => a && a.status !== "done")
    .filter((a) =>
      (a.child?.name ?? "").toLowerCase().includes(search.toLowerCase())
    );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          📅 Rendez-vous — {user?.healthCenter || user?.region || "Agent"}
        </h2>
        <button
          onClick={fetchAppointments}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          🔄 Rafraîchir
        </button>
      </div>

      {/* 🔍 Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un enfant..."
          className="border rounded px-3 py-2 w-full sm:w-1/2 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 🧾 Liste des rendez-vous */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Chargement des rendez-vous…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-gray-400 italic">
            Aucun rendez-vous trouvé.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((rdv) => (
              <div
                key={rdv._id}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-all bg-white"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {rdv.child?.name ?? "Enfant inconnu"}
                  </h3>
                  <StatusBadge status={rdv.status} />
                </div>

                {/* Affichage de l'heure */}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    💉 <strong>{rdv.vaccine?.name ?? "—"}</strong>
                  </p>
                  <p
                    className={`text-sm ${
                      rdv.status === "done" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    🕑 {rdv.time}
                  </p>
                </div>

                <p className="text-sm text-gray-600">
                  📅{" "}
                  {new Date(rdv.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>

                {rdv.child?.parentName && (
                  <p className="text-xs text-gray-500 mt-1">
                    👩‍🦰 {rdv.child.parentName} | 📞{" "}
                    {rdv.child.parentPhone || "—"}
                  </p>
                )}

                {rdv.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    🗒️ {rdv.notes}
                  </p>
                )}

                <div className="mt-3 flex justify-end gap-2">
                  {rdv.status !== "done" && (
                    <button
                      onClick={() => markDone(rdv._id)}
                      className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600"
                    >
                      ✅ Fait
                    </button>
                  )}
                  <button
                    onClick={() => deleteAppointment(rdv._id)}
                    className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600"
                  >
                    🗑 Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const colors: Record<string, string> = {
    planned: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    missed: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    refused: "bg-gray-200 text-gray-600",
  };

  const labels: Record<string, string> = {
    planned: "Planifié",
    done: "Fait",
    missed: "Manqué",
    pending: "En attente",
    confirmed: "Confirmé",
    refused: "Refusé",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[status] || "—"}
    </span>
  );
}