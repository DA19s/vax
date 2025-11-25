"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Stock {
  _id: string;
  vaccine: string;
  batchNumber: string;
  quantity: number;
  expirationDate: string;
  region?: string;
  healthCenter?: string;
  lowStock?: boolean;
  expiringSoon?: boolean;
}

export default function AgentStocksPage() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const fetchStocks = useCallback(async () => {
    if (!user || user.role !== "agent") return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/stocks`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStocks(data.data || []);
    } catch (e) {
      setError("Erreur lors du chargement des stocks");
    } finally {
      setLoading(false);
    }
  }, [user?.role, BASE]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const deleteStock = async () => {
    if (!deleteId) return;
    const res = await fetch(`${BASE}/api/stocks/${deleteId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Erreur suppression");
      return;
    }

    setDeleteId(null);
    fetchStocks();
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Gestion des Stocks du Centre</h1>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Chargement…</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : stocks.length > 0 ? (
          <table className="w-full border bg-white shadow-sm rounded-md">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Vaccin</th>
                <th className="p-2">Lot</th>
                <th className="p-2">Quantité</th>
                <th className="p-2">Expiration</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-2">{s.vaccine || "—"}</td>
                  <td className="p-2">{s.batchNumber}</td>
                  <td
                    className={`p-2 ${
                      s.lowStock ? "text-red-600 font-bold" : ""
                    }`}
                  >
                    {s.quantity}
                  </td>
                  <td
                    className={`p-2 ${
                      s.expiringSoon ? "text-orange-600 font-semibold" : ""
                    }`}
                  >
                    {new Date(s.expirationDate).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    {s.lowStock
                      ? "Stock bas"
                      : s.expiringSoon
                      ? "Expire bientôt"
                      : "OK"}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => setDeleteId(s._id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucun lot trouvé</p>
        )}

        {/* Modal Suppression */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
              <h2 className="font-bold mb-4">Supprimer le lot ?</h2>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Annuler
                </button>
                <button
                  onClick={deleteStock}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}