"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, AlertCircle, Package } from "lucide-react";

interface Stock {
  _id: string;
  vaccine: string;
  batchNumber: string;
  quantity: number;
  expirationDate: string;
  level?: string;
}

interface Region {
  name: string;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  onSuccess: () => void;
}

export default function TransferModal({ isOpen, onClose, stock, onSuccess }: TransferModalProps) {
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    if (isOpen) {
      loadRegions();
      setQuantity(0);
      setSelectedRegion("");
      setError("");
    }
  }, [isOpen]);

  const loadRegions = async () => {
    try {
      // Récupérer les utilisateurs régionaux pour avoir les régions exactes
      const res = await fetch(`${BASE}/api/users?role=regional`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const users = Array.isArray(data) ? data : data.data || [];
      
      console.log("👥 [TRANSFER MODAL] Utilisateurs régionaux reçus:", users.length);
      
      // Extraire les régions uniques depuis les utilisateurs régionaux
      const regionSet = new Set<string>();
      users.forEach((user: any) => {
        if (user.region) {
          regionSet.add(user.region);
          console.log("📍 [TRANSFER MODAL] Région trouvée:", `"${user.region}"`);
        }
      });
      
      // Fallback : ajouter les régions communes du Sénégal si aucune trouvée
      if (regionSet.size === 0) {
        console.log("⚠️ [TRANSFER MODAL] Aucune région trouvée, utilisation des régions par défaut");
        ["Dakar", "Thiès", "Saint-Louis", "Diourbel", "Louga", "Fatick", "Kaolack", 
         "Kolda", "Matam", "Tambacounda", "Kaffrine", "Kédougou", "Sédhiou", "Ziguinchor"].forEach(r => regionSet.add(r));
      }
      
      const regionsList = Array.from(regionSet).sort();
      console.log("📍 [TRANSFER MODAL] Régions finales:", regionsList);
      setRegions(regionsList);
    } catch (err) {
      console.error("❌ [TRANSFER MODAL] Erreur chargement régions:", err);
      // En cas d'erreur, utiliser les régions par défaut
      setRegions(["Dakar", "Thiès", "Saint-Louis", "Diourbel", "Louga", "Fatick", "Kaolack", 
                  "Kolda", "Matam", "Tambacounda", "Kaffrine", "Kédougou", "Sédhiou", "Ziguinchor"].sort());
    }
  };

  const handleTransfer = async () => {
    if (!stock || !selectedRegion || quantity <= 0) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (quantity > stock.quantity) {
      setError(`Quantité insuffisante (disponible: ${stock.quantity})`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const transferData = {
        stockId: stock._id,
        quantity,
        toRegion: selectedRegion,
      };

      console.log("🚀 [TRANSFER MODAL] Envoi du transfert:");
      console.log("   Stock ID:", transferData.stockId);
      console.log("   Quantité:", transferData.quantity);
      console.log("   toRegion:", `"${transferData.toRegion}"`);
      console.log("   Type de toRegion:", typeof transferData.toRegion);

      const res = await fetch(`${BASE}/api/stocks/transfers/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(transferData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du transfert");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors du transfert");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !stock) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transférer vers une région</h3>
              <p className="text-sm text-gray-500">
                {stock.vaccine} - Lot {stock.batchNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Info stock source */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Stock disponible</p>
                <p className="text-2xl font-bold text-blue-900">{stock.quantity} doses</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600">Niveau actuel</p>
                <p className="text-sm font-semibold text-blue-900">National</p>
              </div>
            </div>
          </div>

          {/* Sélection région */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Région de destination <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une région</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Quantité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantité à transférer <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={stock.quantity}
              value={quantity || ""}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Max: ${stock.quantity}`}
            />
          </div>

          {/* Aperçu du transfert */}
          {selectedRegion && quantity > 0 && quantity <= stock.quantity && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">National</p>
                  <p className="text-xs text-green-600">
                    Reste: {stock.quantity - quantity} doses
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-green-600" />
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium text-green-900">{selectedRegion}</p>
                  <p className="text-xs text-green-600">
                    Reçoit: {quantity} doses
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleTransfer}
            disabled={loading || !selectedRegion || quantity <= 0 || quantity > stock.quantity}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Transfert...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Transférer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
