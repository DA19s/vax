"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { ArrowRightLeft, Eye, Pencil, Plus, Trash2, Package, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import TransferModal from "./TransferModal";

interface Stock {
  _id: string;
  vaccine: string; // ✅ juste le nom du vaccin
  batchNumber: string;
  quantity: number;
  expirationDate: string;
  level?: string;
  region?: string;
  healthCenter?: string;
  lowStock?: boolean;
  expiringSoon?: boolean;
}

// ✅ Formulaire
type StockForm = Partial<Stock>;

interface VaccineSchedule {
  _id: string;
  minAge: number;
  maxAge?: number;
  unit: "weeks" | "months" | "years";
  vaccines: string[];
  description?: string;
}

export default function StocksPage() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [vaccines, setVaccines] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<StockForm | null>(null);
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStock, setTransferStock] = useState<Stock | null>(null);
  
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [viewStock, setViewStock] = useState<Stock | null>(null);
  const [distribution, setDistribution] = useState<Stock[]>([]);
  const [updateQuantity, setUpdateQuantity] = useState<number>(0);
  const [selectedDistribution, setSelectedDistribution] = useState<Stock | null>(null);

  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  // Statistiques
  const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
  const lowStockCount = stocks.filter(s => s.quantity < 30).length;
  const expiringSoonCount = stocks.filter(s => {
    const expirationDate = new Date(s.expirationDate);
    const daysUntilExpiry = Math.floor((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }).length;

  // 🔄 Charger stocks
  const fetchStocks = useCallback(async () => {
    if (!user || user.role !== "national") return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/stocks`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStocks(data.data || []);
    } catch (e) {
      setError("Erreur lors du chargement des stocks");
    } finally {
      setLoading(false);
    }
  }, [user?.role, BASE]);

  // 🔄 Charger vaccins depuis calendrier
  const fetchVaccines = useCallback(async () => {
    if (!user || user.role !== "national") return;
    try {
      const res = await fetch(`${BASE}/api/vaccine-schedule`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: VaccineSchedule[] = await res.json();
      const allVaccines = Array.from(new Set(data.flatMap((s) => s.vaccines)));
      setVaccines(allVaccines);
    } catch (e) {
      console.error("Erreur chargement vaccins calendrier:", e);
    }
  }, [user?.role, BASE]);

  // 🌍 Charger régions
  const fetchRegions = useCallback(async () => {
    if (!user || user.role !== "national") return;
    try {
      const res = await fetch(`${BASE}/api/regions`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const response = await res.json();
      const regionsList = response.data || [];
      setRegions(regionsList.map((r: any) => r.name));
    } catch (e) {
      console.error("❌ Erreur chargement régions:", e);
    }
  }, [user?.role, BASE]);

  useEffect(() => {
    fetchStocks();
    fetchVaccines();
    fetchRegions();
  }, [fetchStocks, fetchVaccines, fetchRegions]);

  // ➕ Sauvegarder
  const saveStock = async () => {
    if (!editStock) return;
    const method = editStock._id ? "PUT" : "POST";
    const url = editStock._id
      ? `${BASE}/api/stocks/${editStock._id}`
      : `${BASE}/api/stocks`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(editStock),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Erreur lors de l’enregistrement");
      return;
    }

    setShowModal(false);
    setEditStock(null);
    fetchStocks();
  };

  // ❌ Supprimer
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
        targetRegion: selectedDistribution.region,
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

  // 🔄 Callback après succès du transfert
  const handleTransferSuccess = () => {
    setShowTransferModal(false);
    setTransferStock(null);
    fetchStocks(); // Recharger la liste
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
                Gestion des Stocks
              </h1>
              <p className="text-gray-600">Suivi et gestion des stocks de vaccins</p>
            </div>
            <button
              onClick={() => {
                setEditStock({
                  vaccine: "",
                  batchNumber: "",
                  quantity: 0,
                  expirationDate: "",
                });
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              Nouveau lot
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total doses</h3>
            <p className="text-3xl font-bold text-blue-600">{totalStock.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Stocks faibles</h3>
            <p className="text-3xl font-bold text-red-600">{lowStockCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Expirent bientôt</h3>
            <p className="text-3xl font-bold text-orange-600">{expiringSoonCount}</p>
          </div>
        </div>

        {/* Tableau */}
        {loading ? (
          <p className="text-center text-gray-500">Chargement…</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : stocks.length > 0 ? (
          <table className="w-full border bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Vaccin</th>
                <th className="p-2">Lot</th>
                <th className="p-2">Quantité</th>
                <th className="p-2">Expiration</th>
                <th className="p-2">Région</th>
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
                  <td className="p-2">{s.region || "—"}</td>
                  <td className="p-2">
                    {s.lowStock
                      ? "Stock bas"
                      : s.expiringSoon
                      ? "Expire bientôt"
                      : "OK"}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => viewDistribution(s)}
                      className="text-purple-600 hover:bg-purple-50 p-1 rounded"
                      title="Voir la distribution"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setTransferStock(s);
                        setShowTransferModal(true);
                      }}
                      className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                      title="Transférer"
                    >
                      <ArrowRightLeft size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditStock(s);
                        setShowModal(true);
                      }}
                      className="text-green-600 hover:bg-green-50 p-1 rounded"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
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

        {/* Modal Ajout/Edition */}
        {showModal && editStock && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96">
              <h2 className="font-bold mb-4">
                {editStock._id ? "Modifier le lot" : "Nouveau lot"}
              </h2>

              {/* ✅ Select vaccins depuis calendrier */}
              <select
                value={editStock.vaccine || ""}
                onChange={(e) =>
                  setEditStock({ ...editStock, vaccine: e.target.value })
                }
                className="border w-full p-2 rounded mb-3"
              >
                <option value="">-- Sélectionner un vaccin --</option>
                {vaccines.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              <input
                value={editStock.batchNumber || ""}
                onChange={(e) =>
                  setEditStock({ ...editStock, batchNumber: e.target.value })
                }
                placeholder="Numéro de lot"
                className="border w-full p-2 rounded mb-3"
              />

              <input
                type="number"
                value={editStock.quantity || 0}
                onChange={(e) =>
                  setEditStock({ ...editStock, quantity: +e.target.value })
                }
                placeholder="Quantité"
                className="border w-full p-2 rounded mb-3"
              />

              <input
                type="date"
                value={editStock.expirationDate?.split("T")[0] || ""}
                onChange={(e) =>
                  setEditStock({
                    ...editStock,
                    expirationDate: e.target.value,
                  })
                }
                className="border w-full p-2 rounded mb-3"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Annuler
                </button>
                <button
                  onClick={saveStock}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {editStock._id ? "Mettre à jour" : "Enregistrer"}
                </button>
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
                <p className="text-gray-600 mb-4">Ce lot n'a pas encore été transféré vers des régions.</p>
              ) : (
                <table className="w-full border mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Région</th>
                      <th className="p-2 text-left">Centre</th>
                      <th className="p-2 text-left">Quantité</th>
                      <th className="p-2 text-left">Expiration</th>
                      <th className="p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distribution.map((d) => (
                      <tr key={d._id} className="border-t">
                        <td className="p-2">{d.region || "—"}</td>
                        <td className="p-2">{d.healthCenter || "—"}</td>
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
                    Ajouter du stock à : {selectedDistribution.region || selectedDistribution.healthCenter}
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

        {/* Modal Transfert - Nouveau composant avec logs */}
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setTransferStock(null);
          }}
          stock={transferStock}
          onSuccess={handleTransferSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
