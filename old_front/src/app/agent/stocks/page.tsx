"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/app/components/DashboardLayout";
import { API_BASE_URL } from "@/app/lib/api";
import {
  Package,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  User,
  BarChart3,
  ArrowRightLeft,
} from "lucide-react";

interface VaccineStock {
  _id: string;
  vaccineName: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  manufacturer?: string;
  healthCenter?: string;
  agent?: string;
  status: "available" | "low" | "expired" | "out";
  createdAt?: string;
  updatedAt?: string;
}

export default function StocksPage() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<VaccineStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "low" | "expired" | "out">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<VaccineStock | null>(null);
  const [saving, setSaving] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringStock, setTransferringStock] = useState<VaccineStock | null>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  const [formData, setFormData] = useState({
    vaccineName: "",
    batchNumber: "",
    quantity: "",
    expiryDate: "",
    manufacturer: "",
  });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/stocks`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Stocks chargés:", result);
        
        // Le backend renvoie { message, count, data }
        const stocksData = result.data || result;
        
        // Mapper les données du backend vers le format frontend
        const mappedStocks = Array.isArray(stocksData) ? stocksData.map((stock: any) => ({
          _id: stock._id || stock.id,
          vaccineName: stock.vaccine || stock.vaccineName,
          batchNumber: stock.batchNumber,
          quantity: stock.quantity,
          expiryDate: stock.expirationDate || stock.expiryDate,
          manufacturer: stock.manufacturer || "Non spécifié",
          healthCenter: stock.healthCenter,
          status: getStockStatus({
            _id: stock._id,
            vaccineName: stock.vaccine,
            batchNumber: stock.batchNumber,
            quantity: stock.quantity,
            expiryDate: stock.expirationDate || stock.expiryDate,
            status: "available",
          }),
        })) : [];
        
        setStocks(mappedStocks);
      } else {
        console.warn("Erreur API stocks, code:", response.status);
        setStocks([]);
      }
    } catch (error) {
      console.error("❌ Erreur chargement stocks:", error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Le backend attend "vaccine" et "expirationDate" (pas "vaccineName" et "expiryDate")
      const stockData = {
        vaccine: formData.vaccineName,
        batchNumber: formData.batchNumber,
        quantity: Number(formData.quantity),
        expirationDate: formData.expiryDate,
        manufacturer: formData.manufacturer || undefined,
        healthCenter: user?.healthCenter,
        region: user?.region,
      };

      console.log("📤 Envoi stock:", stockData);

      const response = await fetch(`${API_BASE_URL}/api/stocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(stockData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Stock ajouté:", result);
        // Recharger la liste complète
        await fetchStocks();
        setShowAddModal(false);
        resetForm();
        alert("Stock ajouté avec succès !");
      } else {
        console.error("❌ Erreur backend:", result);
        alert(result.error || "Erreur lors de l'ajout du stock");
      }
    } catch (error: any) {
      console.error("❌ Erreur ajout stock:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;

    try {
      setSaving(true);
      
      const updateData = {
        quantity: Number(formData.quantity),
        expirationDate: formData.expiryDate,
      };

      console.log("📤 Mise à jour stock:", updateData);

      const response = await fetch(`${API_BASE_URL}/api/stocks/${editingStock._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Stock mis à jour:", result);
        // Recharger la liste
        await fetchStocks();
        setEditingStock(null);
        resetForm();
        alert("Stock mis à jour avec succès !");
      } else {
        console.error("❌ Erreur backend:", result);
        alert(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error: any) {
      console.error("❌ Erreur mise à jour stock:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStock = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce stock ?")) return;

    try {
      console.log("🗑️ Suppression stock:", id);

      const response = await fetch(`${API_BASE_URL}/api/stocks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Stock supprimé");
        setStocks(stocks.filter(s => s._id !== id));
        alert("Stock supprimé avec succès !");
      } else {
        console.error("❌ Erreur backend:", result);
        alert(result.error || "Erreur lors de la suppression");
      }
    } catch (error: any) {
      console.error("❌ Erreur suppression stock:", error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      vaccineName: "",
      batchNumber: "",
      quantity: "",
      expiryDate: "",
      manufacturer: "",
    });
  };

  const fetchDestinations = async () => {
    try {
      setLoadingDestinations(true);
      const response = await fetch(`${API_BASE_URL}/api/stocks/transfers/destinations`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Destinations chargées:", result);
        setDestinations(result.data || []);
      } else {
        console.warn("Erreur API destinations, code:", response.status);
        setDestinations([]);
      }
    } catch (error) {
      console.error("❌ Erreur chargement destinations:", error);
      setDestinations([]);
    } finally {
      setLoadingDestinations(false);
    }
  };

  const handleOpenTransferModal = (stock: VaccineStock) => {
    setTransferringStock(stock);
    setShowTransferModal(true);
    fetchDestinations();
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStock) return;

    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    const quantity = Number(formData.get('quantity'));
    const destination = formData.get('destination') as string;

    if (!destination || quantity <= 0) {
      alert("Veuillez sélectionner une destination et une quantité valide");
      return;
    }

    if (quantity > transferringStock.quantity) {
      alert(`Quantité insuffisante (disponible: ${transferringStock.quantity})`);
      return;
    }

    try {
      setSaving(true);

      // Déterminer le type de destination
      const selectedDest = destinations.find(d => 
        d.type === "teamMember" ? d.userId === destination : d.name === destination
      );

      const transferData: any = {
        stockId: transferringStock._id,
        quantity,
      };

      // Ajouter les champs selon le type de destination
      if (selectedDest?.type === "region") {
        transferData.toRegion = destination;
      } else if (selectedDest?.type === "district" || selectedDest?.type === "healthCenter") {
        transferData.toHealthCenter = destination;
      } else if (selectedDest?.type === "teamMember") {
        transferData.toUserId = destination;
      }

      console.log("📤 Envoi transfert:", transferData);

      const response = await fetch(`${API_BASE_URL}/api/stocks/transfers/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(transferData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Transfert effectué:", result);
        await fetchStocks();
        setShowTransferModal(false);
        setTransferringStock(null);
        alert("Transfert effectué avec succès !");
      } else {
        console.error("❌ Erreur backend:", result);
        alert(result.error || "Erreur lors du transfert");
      }
    } catch (error: any) {
      console.error("❌ Erreur transfert:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (stock: VaccineStock): VaccineStock['status'] => {
    const expiryDate = new Date(stock.expiryDate);
    const today = new Date();
    
    if (stock.quantity === 0) return "out";
    if (expiryDate < today) return "expired";
    if (stock.quantity < 50) return "low";
    return "available";
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.vaccineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const actualStatus = getStockStatus(stock);
    const matchesStatus = statusFilter === "all" || actualStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: stocks.reduce((sum, s) => sum + s.quantity, 0),
    available: stocks.filter(s => getStockStatus(s) === "available").length,
    low: stocks.filter(s => getStockStatus(s) === "low").length,
    expired: stocks.filter(s => getStockStatus(s) === "expired").length,
  };

  const getStatusBadge = (stock: VaccineStock) => {
    const status = getStockStatus(stock);
    switch (status) {
      case "available":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Disponible</span>;
      case "low":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Stock faible</span>;
      case "expired":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Expiré</span>;
      case "out":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Rupture</span>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des stocks...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fadeIn max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                Gestion des Stocks
              </h1>
              <p className="text-gray-600">Gérez vos stocks de vaccins et lots</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Ajouter un stock
            </button>
          </div>
        </div>

        {/* Statistiques en haut */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total doses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter("available")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Disponibles</p>
                <p className="text-3xl font-bold text-green-600">{stats.available}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter("low")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Stock faible</p>
                <p className="text-3xl font-bold text-orange-600">{stats.low}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-orange-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStatusFilter("expired")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Expirés</p>
                <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par vaccin ou numéro de lot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setStatusFilter("available")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "available"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Disponibles
              </button>
              <button
                onClick={() => setStatusFilter("low")}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "low"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Faibles
              </button>
            </div>
          </div>
        </div>

        {/* Liste des stocks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredStocks.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun stock</h3>
              <p className="text-gray-600 mb-6">Commencez par ajouter des stocks de vaccins</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Ajouter un stock
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccin</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro de lot</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'expiration</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fabricant</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStocks.map((stock) => (
                    <tr key={stock._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{stock.vaccineName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{stock.batchNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          stock.quantity === 0 ? 'text-red-600' :
                          stock.quantity < 50 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {stock.quantity} doses
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(stock.expiryDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{stock.manufacturer || "—"}</td>
                      <td className="px-6 py-4">{getStatusBadge(stock)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {/* Bouton Transférer (district et agent uniquement) */}
                          {(user?.role === "district" || user?.role === "agent") && stock.quantity > 0 && (
                            <button
                              onClick={() => handleOpenTransferModal(stock)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title={user?.role === "district" ? "Transférer aux acteurs de santé" : "Transférer à un membre de l'équipe"}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingStock(stock);
                              setFormData({
                                vaccineName: stock.vaccineName,
                                batchNumber: stock.batchNumber,
                                quantity: stock.quantity.toString(),
                                expiryDate: stock.expiryDate.split('T')[0],
                                manufacturer: stock.manufacturer || "",
                              });
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStock(stock._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          )}
        </div>

        {/* Modal Transférer */}
        {showTransferModal && transferringStock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                Transférer un stock
              </h3>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{transferringStock.vaccineName}</span> - Lot {transferringStock.batchNumber}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Disponible : <span className="font-semibold text-green-600">{transferringStock.quantity} doses</span>
                </p>
              </div>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {user?.role === "district" && "Transférer vers (acteur de santé)"}
                    {user?.role === "agent" && "Transférer vers (membre de l'équipe)"}
                  </label>
                  {loadingDestinations ? (
                    <div className="text-sm text-gray-500 py-2">Chargement...</div>
                  ) : destinations.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">
                      {user?.role === "district" && "Aucun acteur de santé disponible"}
                      {user?.role === "agent" && "Aucun membre d'équipe disponible"}
                    </div>
                  ) : (
                    <select
                      name="destination"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">-- Sélectionner --</option>
                      {destinations.map((dest, idx) => (
                        <option 
                          key={idx} 
                          value={dest.type === "teamMember" ? dest.userId : dest.name}
                        >
                          {dest.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantité à transférer (doses)</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max={transferringStock.quantity}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum : {transferringStock.quantity} doses</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferringStock(null);
                    }}
                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving || destinations.length === 0}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? "..." : (
                      <>
                        <ArrowRightLeft className="h-4 w-4" />
                        Transférer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ajouter/Modifier */}
        {(showAddModal || editingStock) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                {editingStock ? "Modifier le stock" : "Ajouter un stock"}
              </h3>
              <form onSubmit={editingStock ? handleUpdateStock : handleAddStock} className="space-y-4">
                {!editingStock && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom du vaccin</label>
                      <input
                        type="text"
                        value={formData.vaccineName}
                        onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Numéro de lot</label>
                      <input
                        type="text"
                        value={formData.batchNumber}
                        onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Quantité (doses)</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'expiration</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                {!editingStock && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Fabricant</label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingStock(null);
                      resetForm();
                    }}
                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "..." : editingStock ? "Modifier" : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
