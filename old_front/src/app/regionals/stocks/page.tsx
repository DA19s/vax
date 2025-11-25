"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { ArrowRightLeft, Eye, Trash2, Package, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import TransferModal from "./TransferModal";

interface Stock {
  _id: string;
  vaccine: string;
  batchNumber: string;
  quantity: number;
  expirationDate: string;
  level: string;
  region?: string;
  healthCenter?: string;
  lowStock?: boolean;
  expiringSoon?: boolean;
}

export default function RegionalStocksPage() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [healthCenters, setHealthCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStock, setTransferStock] = useState<Stock | null>(null);
  const [transferQuantity, setTransferQuantity] = useState<number>(0);
  const [targetHealthCenter, setTargetHealthCenter] = useState<string>("");
  
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [viewStock, setViewStock] = useState<Stock | null>(null);
  const [distribution, setDistribution] = useState<Stock[]>([]);
  const [updateQuantity, setUpdateQuantity] = useState<number>(0);
  const [selectedDistribution, setSelectedDistribution] = useState<Stock | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const fetchStocks = useCallback(async () => {
    if (!user || user.role !== "regional") return;
    setLoading(true);
    console.log("🔍 [REGIONAL] Chargement des stocks...");
    console.log("🔍 [REGIONAL] User:", user.email, "Region:", user.region);
    try {
      const res = await fetch(`${BASE}/api/stocks`, { credentials: "include" });
      console.log("🔍 [REGIONAL] Response status:", res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("🔍 [REGIONAL] Stocks reçus:", data.count, "stocks");
      console.log("🔍 [REGIONAL] Données:", data.data);
      setStocks(data.data || []);
    } catch (e) {
      console.error("❌ [REGIONAL] Erreur:", e);
      setError("Erreur lors du chargement des stocks");
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.email, user?.region, BASE]);

  const fetchHealthCenters = useCallback(async () => {
    if (!user || user.role !== "regional") return;
    try {
      const res = await fetch(`${BASE}/api/healthcenters`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealthCenters(data);
    } catch (e) {
      console.error("❌ Erreur chargement centres:", e);
    }
  }, [user?.role, BASE]);

  useEffect(() => {
    fetchStocks();
    fetchHealthCenters();
  }, [fetchStocks, fetchHealthCenters]);

  // 🔍 Voir la distribution
  const viewDistribution = async (stock: Stock) => {
    setViewStock(stock);
    try {
      const res = await fetch(
        `${BASE}/api/stocks/distribution?vaccine=${stock.vaccine}&batchNumber=${stock.batchNumber}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDistribution(data.data || []);
      setShowDistributionModal(true);
    } catch (e) {
      console.error("❌ Erreur chargement distribution:", e);
      alert("Erreur lors du chargement de la distribution");
    }
  };

  // 🔄 Mettre à jour une distribution existante (transfert)
  const handleUpdateDistribution = async () => {
    if (!selectedDistribution || !updateQuantity || updateQuantity <= 0) {
      alert("⚠️ Veuillez entrer une quantité valide");
      return;
    }

    if (!viewStock) {
      alert("❌ Stock source introuvable");
      return;
    }

    // Vérifier que le stock source a assez de quantité
    if (updateQuantity > viewStock.quantity) {
      alert(`⚠️ Quantité insuffisante dans le stock source (disponible: ${viewStock.quantity})`);
      return;
    }

    // Utiliser l'endpoint de transfert pour décrémenter source et incrémenter destination
    const res = await fetch(`${BASE}/api/stocks/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        stockId: viewStock._id,
        quantity: updateQuantity,
        targetHealthCenter: selectedDistribution.healthCenter,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "❌ Erreur mise à jour");
      return;
    }

    alert("✅ Stock mis à jour avec succès !");
    setSelectedDistribution(null);
    setUpdateQuantity(0);
    if (viewStock) viewDistribution(viewStock);
    fetchStocks();
  };

  const handleTransfer = async () => {
    if (!transferStock || !targetHealthCenter || transferQuantity <= 0) {
      alert("⚠️ Veuillez remplir tous les champs");
      return;
    }

    if (transferQuantity > transferStock.quantity) {
      alert(`⚠️ Quantité insuffisante (disponible: ${transferStock.quantity})`);
      return;
    }

    const res = await fetch(`${BASE}/api/stocks/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        stockId: transferStock._id,
        quantity: transferQuantity,
        targetHealthCenter,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "❌ Erreur transfert");
      return;
    }

    alert("✅ Transfert effectué avec succès !");
    setShowTransferModal(false);
    setTransferStock(null);
    setTransferQuantity(0);
    setTargetHealthCenter("");
    fetchStocks();
  };

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
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                Stocks & Lots
              </h1>
              <p className="text-gray-600">
                Gestion des stocks de vaccins et transferts vers les centres de santé
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des stocks...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Erreur de chargement</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        ) : stocks.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Vaccin</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">N° Lot</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Quantité</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Expiration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Centre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stocks.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.vaccine || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{s.batchNumber}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-semibold ${
                          s.lowStock ? "text-red-600" : "text-gray-900"
                        }`}>
                          {s.quantity} doses
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={s.expiringSoon ? "text-orange-600 font-medium" : "text-gray-600"}>
                          {new Date(s.expirationDate).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.healthCenter || "Entrepôt régional"}</td>
                      <td className="px-6 py-4 text-sm">
                        {s.lowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            Stock bas
                          </span>
                        ) : s.expiringSoon ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            <Clock className="h-3 w-3" />
                            Expire bientôt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewDistribution(s)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Voir la distribution"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setTransferStock(s);
                              setTransferQuantity(0);
                              setTargetHealthCenter("");
                              setShowTransferModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Transférer"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(s._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-medium mb-1">Aucun stock disponible</p>
                <p className="text-sm text-gray-500">Les stocks de vaccins apparaîtront ici une fois ajoutés</p>
              </div>
            </div>
          </div>
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

        {/* Modal Distribution */}
        {showDistributionModal && viewStock && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-[800px] max-h-[90vh] overflow-y-auto">
              <h2 className="font-bold mb-4 text-xl">
                🔍 Distribution du lot {viewStock.vaccine} - {viewStock.batchNumber}
              </h2>

              {distribution.length === 0 ? (
                <p className="text-gray-600 mb-4">Ce lot n'a pas encore été transféré vers des centres de santé.</p>
              ) : (
                <table className="w-full border mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Centre de Santé</th>
                      <th className="p-2 text-left">Région</th>
                      <th className="p-2 text-left">Quantité</th>
                      <th className="p-2 text-left">Expiration</th>
                      <th className="p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distribution.map((d) => (
                      <tr key={d._id} className="border-t">
                        <td className="p-2 font-semibold">{d.healthCenter || "—"}</td>
                        <td className="p-2">{d.region || "—"}</td>
                        <td className="p-2 font-semibold">{d.quantity}</td>
                        <td className="p-2">{new Date(d.expirationDate).toLocaleDateString()}</td>
                        <td className="p-2">
                          <button
                            onClick={() => {
                              setSelectedDistribution(d);
                              setUpdateQuantity(0);
                            }}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            + Ajouter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Formulaire d'ajout de stock */}
              {selectedDistribution && (
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-semibold mb-2">
                    Ajouter du stock à : {selectedDistribution.healthCenter}
                  </h3>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={updateQuantity}
                      onChange={(e) => setUpdateQuantity(+e.target.value)}
                      placeholder="Quantité à ajouter"
                      className="border p-2 rounded flex-1"
                      min="1"
                    />
                    <button
                      onClick={handleUpdateDistribution}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDistribution(null);
                        setUpdateQuantity(0);
                      }}
                      className="px-4 py-2 bg-gray-300 rounded"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDistributionModal(false);
                    setViewStock(null);
                    setDistribution([]);
                    setSelectedDistribution(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Transfert */}
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setTransferStock(null);
          }}
          stock={transferStock}
          onSuccess={() => {
            fetchStocks();
            setShowTransferModal(false);
            setTransferStock(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}