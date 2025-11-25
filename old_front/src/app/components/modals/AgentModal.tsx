"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Shield, Trash2, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AgentRolesModal from "./AgentRolesModal";

interface Agent {
  id: string;
  fullName?: string;
  email: string;
  region?: string;
  active: boolean;
  role?: string;
}

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function AgentModal({ isOpen, onClose, token }: AgentModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // 🔄 Charger la liste des agents
  useEffect(() => {
    if (!isOpen) return;
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/users", {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) {
            alert("Session expirée ou non authentifié. Veuillez vous reconnecter.");
            onClose();
            router.push("/login");
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        // Ne lister ici que les utilisateurs ayant le rôle 'regional'
        const onlyRegional: Agent[] = (data.data || []).filter((u: Agent) => u.role === "regional");
        setAgents(onlyRegional);
      } catch (err) {
        console.error("❌ Erreur chargement agents:", err);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, [isOpen, router, onClose]);

  // 🔘 Changer statut actif/inactif
  const toggleActive = async (agentId: string, current: boolean) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${agentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ active: !current }),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.error) msg += ` – ${errJson.error}`;
          if (errJson?.details) msg += ` (${errJson.details})`;
        } catch {}
        throw new Error(msg);
      }

      // Success: update UI
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, active: !current } : a))
      );
    } catch (err) {
      console.error("❌ Erreur changement statut:", err);
      alert(
        `Erreur lors de l’activation/désactivation de l’agent: ${
          (err as Error).message || "Inconnue"
        }`
      );
    }
  };

  // ❌ Supprimer un agent
  const deleteAgent = async (agentId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet agent ?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${agentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Échec suppression");
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch (err) {
      console.error("❌ Erreur suppression agent:", err);
      alert("Erreur lors de la suppression de l’agent");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 relative">
        {/* 🔘 Fermer */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" /> Gestion des agents régionaux
        </h2>

        {loading ? (
          <p className="text-gray-600">⏳ Chargement des agents...</p>
        ) : agents.length === 0 ? (
          <p className="text-gray-600 text-center py-10">
            Aucun agent trouvé pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="text-left p-3">Nom complet</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-center p-3">Région</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-gray-50 transition">
                    <td className="p-3">{a.fullName || "—"}</td>
                    <td className="p-3">{a.email}</td>
                    <td className="p-3 text-center">{a.region || "—"}</td>

                    {/* ✅ Switch activation */}
                    <td className="p-3 text-center">
                      <div
                        onClick={() => toggleActive(a.id, a.active)}
                        className={`w-10 h-5 rounded-full transition-all duration-300 flex items-center cursor-pointer ${
                          a.active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
                            a.active ? "translate-x-5" : "translate-x-1"
                          }`}
                        ></div>
                      </div>
                    </td>

                    {/* ✅ Actions */}
                    <td className="p-3 flex justify-center gap-3">
                      {/* Bouton rôles visible seulement pour le national */}
                      {user?.role === "national" && (
                        <button
                          onClick={() => setSelectedAgentId(a.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Settings size={16} /> Rôles
                        </button>
                      )}
                      <button
                        onClick={() => deleteAgent(a.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selectedAgentId && (
          <AgentRolesModal
            agentId={selectedAgentId}
            token={token}
            onClose={() => setSelectedAgentId(null)}
          />
        )}
      </div>
    </div>
  );
}