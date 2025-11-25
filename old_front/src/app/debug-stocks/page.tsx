"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/DashboardLayout";

export default function DebugStocksPage() {
  const [allStocks, setAllStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    loadAllStocks();
  }, []);

  const loadAllStocks = async () => {
    try {
      setLoading(true);
      // Charger TOUS les stocks sans filtre
      const res = await fetch(`${BASE}/api/stocks`, {
        credentials: "include",
      });
      
      console.log("📊 Response status:", res.status);
      
      const data = await res.json();
      console.log("📊 Data reçue:", data);
      
      setAllStocks(data.data || []);
    } catch (err) {
      console.error("❌ Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">🔍 Debug Stocks</h1>
          
          <button
            onClick={loadAllStocks}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Recharger
          </button>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-3">
                Total : {allStocks.length} stocks
              </h2>

              {allStocks.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-yellow-800">
                    ⚠️ Aucun stock trouvé dans la base de données
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allStocks.map((stock, index) => (
                    <div
                      key={stock._id || index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">ID:</span>{" "}
                          {stock._id || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold">Vaccin:</span>{" "}
                          {stock.vaccine || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold">Lot:</span>{" "}
                          {stock.batchNumber || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold">Quantité:</span>{" "}
                          {stock.quantity || 0}
                        </div>
                        <div>
                          <span className="font-semibold">Level:</span>{" "}
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            stock.level === "national" ? "bg-purple-100 text-purple-800" :
                            stock.level === "regional" ? "bg-blue-100 text-blue-800" :
                            stock.level === "district" ? "bg-green-100 text-green-800" :
                            stock.level === "agent" ? "bg-orange-100 text-orange-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {stock.level || "❌ MISSING"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold">Région:</span>{" "}
                          {stock.region || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold">Centre:</span>{" "}
                          {stock.healthCenter || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold">Créé par:</span>{" "}
                          {stock.createdBy || "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Résumé par level */}
              {allStocks.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">📊 Résumé par niveau :</h3>
                  <ul className="space-y-1 text-sm">
                    <li>
                      🏛️ National : {allStocks.filter(s => s.level === "national").length}
                    </li>
                    <li>
                      📍 Regional : {allStocks.filter(s => s.level === "regional").length}
                    </li>
                    <li>
                      🏘️ District : {allStocks.filter(s => s.level === "district").length}
                    </li>
                    <li>
                      🏥 Agent : {allStocks.filter(s => s.level === "agent").length}
                    </li>
                    <li>
                      ❌ Sans level : {allStocks.filter(s => !s.level).length}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
