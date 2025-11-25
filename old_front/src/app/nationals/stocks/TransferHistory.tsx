"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";

interface Transfer {
  _id: string;
  vaccine: string;
  batchNumber: string;
  quantity: number;
  fromLevel: string;
  toLevel: string;
  toRegion?: string;
  toHealthCenter?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  transferDate: string;
  acceptedDate?: string;
  rejectedDate?: string;
  notes?: string;
}

export default function TransferHistory() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/stocks/transfers/outgoing`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTransfers(data.data || []);
    } catch (err) {
      console.error("Erreur chargement transferts:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <CheckCircle className="h-3 w-3" />
            Accepté
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            <XCircle className="h-3 w-3" />
            Rejeté
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            <AlertCircle className="h-3 w-3" />
            {status}
          </span>
        );
    }
  };

  const filteredTransfers = transfers.filter((t) => 
    filter === "all" ? true : t.status === filter
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tous ({transfers.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "pending"
              ? "bg-yellow-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          En attente ({transfers.filter(t => t.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("accepted")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "accepted"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Acceptés ({transfers.filter(t => t.status === "accepted").length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "rejected"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Rejetés ({transfers.filter(t => t.status === "rejected").length})
        </button>
      </div>

      {/* Liste des transferts */}
      {filteredTransfers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Aucun transfert trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map((transfer) => (
            <div
              key={transfer._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {transfer.vaccine}
                    </h4>
                    {getStatusBadge(transfer.status)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span className="font-medium">Lot {transfer.batchNumber}</span>
                    <span className="text-gray-400">•</span>
                    <span>{transfer.quantity} doses</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium">
                      National
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-medium">
                      {transfer.toRegion || transfer.toHealthCenter}
                    </span>
                  </div>

                  {transfer.notes && (
                    <p className="text-sm text-red-600 mt-2 italic">
                      {transfer.notes}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-gray-500">
                  <p>{new Date(transfer.transferDate).toLocaleDateString("fr-FR")}</p>
                  <p>{new Date(transfer.transferDate).toLocaleTimeString("fr-FR")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
