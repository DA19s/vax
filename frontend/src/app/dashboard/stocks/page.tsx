"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  PackageOpen,
  PenSquare,
  Plus,
  Syringe,
  Trash2,
} from "lucide-react";
import DashboardShell from "@/app/dashboard/components/DashboardShell";
import StatCard from "@/app/dashboard/components/StatCard";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

const LOW_STOCK_THRESHOLD = 50;

type StockStats = {
  totalLots: number;
  totalQuantity: number;
  lowStockCount: number;
  threshold: number;
};

const emptyStats: StockStats = {
  totalLots: 0,
  totalQuantity: 0,
  lowStockCount: 0,
  threshold: LOW_STOCK_THRESHOLD,
};

type VaccineInfo = {
  id: string;
  name: string;
  description: string;
  dosesRequired: string;
};

type VaccineResponse =
  | {
      vaccines?: VaccineInfo[];
    }
  | VaccineInfo[];

type NationalStock = {
  id: string;
  vaccineId: string;
  quantity: number | null;
  vaccine: VaccineInfo;
};

type NationalStockResponse = {
  national?: NationalStock[];
};

type Region = {
  id: string;
  name: string;
};

type RegionsResponse =
  | {
      regions?: Region[];
    }
  | Region[];

function NationalStocksPage() {
  const { accessToken } = useAuth();

  const [stocks, setStocks] = useState<NationalStock[]>([]);
  const [vaccines, setVaccines] = useState<VaccineInfo[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createVaccineId, setCreateVaccineId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateContext, setUpdateContext] = useState<{ vaccineId: string; vaccineName: string; currentQuantity: number } | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState<string>("");
  const [updateMode, setUpdateMode] = useState<"set" | "add">("set");
  const [addQuantity, setAddQuantity] = useState<string>("");
  const [addQuantityError, setAddQuantityError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferContext, setTransferContext] = useState<{ vaccineId: string; vaccineName: string } | null>(null);
  const [transferRegionId, setTransferRegionId] = useState<string>("");
  const [transferQuantity, setTransferQuantity] = useState<string>("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [pendingRegionalCreation, setPendingRegionalCreation] = useState(false);

const [stats, setStats] = useState<StockStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchNationalStats = useCallback(async () => {
    if (!accessToken) {
      setStats(emptyStats);
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);

      const response = await fetch(`${API_URL}/api/stock/stats/national`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      const payload = (await response.json()) as StockStats;
      setStats(payload);
    } catch (error) {
      console.error("Erreur récupération stats nationales:", error);
      setStats(emptyStats);
      setStatsError(
        error instanceof Error
          ? error.message
          : "Impossible de charger les statistiques nationales"
      );
    } finally {
      setStatsLoading(false);
    }
  }, [accessToken]);

  const fetchNationalStocks = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [stockRes, vaccineRes, regionsRes] = await Promise.all([
        fetch(`${API_URL}/api/stock/national`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        fetch(`${API_URL}/api/vaccine`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        fetch(`${API_URL}/api/region`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ]);

      if (!stockRes.ok || !vaccineRes.ok || !regionsRes.ok) {
        throw new Error("status non valide");
      }

      const stockData: NationalStockResponse = await stockRes.json();
      const vaccineData: VaccineResponse = await vaccineRes.json();
      const regionsData: RegionsResponse = await regionsRes.json();

      setStocks(Array.isArray(stockData?.national) ? stockData.national : []);
      setVaccines(
        Array.isArray(vaccineData)
          ? vaccineData
          : Array.isArray(vaccineData?.vaccines)
          ? vaccineData.vaccines
          : []
      );
      setRegions(
        Array.isArray(regionsData)
          ? regionsData
          : Array.isArray(regionsData?.regions)
          ? regionsData.regions
          : []
      );
    } catch (err) {
      console.error("Erreur chargement stocks:", err);
      setError("Impossible de charger les stocks nationaux");
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchNationalStocks();
    fetchNationalStats();
  }, [fetchNationalStocks, fetchNationalStats]);

  const availableVaccinesForCreation = useMemo(() => {
    const withStock = new Set(stocks.map((stock) => stock.vaccineId));
    return vaccines.filter((vaccine) => !withStock.has(vaccine.id));
  }, [stocks, vaccines]);

  const resetUpdateModal = () => {
    setUpdateModalOpen(false);
    setUpdateContext(null);
    setUpdateQuantity("");
    setAddQuantity("");
    setAddQuantityError(null);
    setUpdating(false);
  };

  const handleCreateStock = async (event: FormEvent) => {
    event.preventDefault();
    if (!createVaccineId || !accessToken) return;

    try {
      setCreating(true);
      const response = await fetch(`${API_URL}/api/stock/national`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ vaccineId: createVaccineId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      setCreateModalOpen(false);
      setCreateVaccineId("");
      await fetchNationalStocks();
      await fetchNationalStats();
    } catch (err) {
      console.error("Erreur création stock national:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer le stock national"
      );
    } finally {
      setCreating(false);
    }
  };

  const openUpdateModal = (stock: NationalStock) => {
    setUpdateContext({
      vaccineId: stock.vaccineId,
      vaccineName: stock.vaccine.name,
      currentQuantity: stock.quantity ?? 0,
    });
    setUpdateQuantity(String(stock.quantity ?? 0));
    setUpdateMode("set");
    setAddQuantity("");
    setAddQuantityError(null);
    setUpdateModalOpen(true);
  };

  const handleSetQuantitySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!updateContext || !accessToken) return;

    const quantityValue = Number(updateQuantity);
    if (!Number.isFinite(quantityValue) || quantityValue < 0) {
      setAddQuantityError("Veuillez saisir une quantité valide.");
      return;
    }

    try {
      setAddQuantityError(null);
      setUpdating(true);
      const response = await fetch(`${API_URL}/api/stock/national`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vaccineId: updateContext.vaccineId,
          quantity: quantityValue,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      resetUpdateModal();
      await Promise.all([fetchNationalStocks(), fetchNationalStats()]);
    } catch (err) {
      console.error("Erreur mise à jour stock national:", err);
      setAddQuantityError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le stock national"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleAddQuantitySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!updateContext || !accessToken) return;

    const quantityValue = Number(addQuantity);
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setAddQuantityError("Veuillez saisir une quantité valide.");
      return;
    }

    try {
      setAddQuantityError(null);
      setUpdating(true);
      const response = await fetch(`${API_URL}/api/stock/add-national`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vaccineId: updateContext.vaccineId,
          quantity: quantityValue,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      resetUpdateModal();
      await Promise.all([fetchNationalStocks(), fetchNationalStats()]);
    } catch (err) {
      console.error("Erreur ajout stock national:", err);
      setAddQuantityError(
        err instanceof Error
          ? err.message
          : "Impossible d'ajouter au stock national"
      );
    } finally {
      setUpdating(false);
    }
  };

  const openTransferModal = (stock: NationalStock) => {
    setTransferContext({ vaccineId: stock.vaccineId, vaccineName: stock.vaccine.name });
    setTransferRegionId("");
    setTransferQuantity("");
    setTransferError(null);
    setPendingRegionalCreation(false);
    setTransferModalOpen(true);
  };

  const handleTransferSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !transferContext) return;

    const quantityValue = Number(transferQuantity);
    if (!transferRegionId || !Number.isFinite(quantityValue) || quantityValue <= 0) {
      setTransferError("Sélectionnez une région et saisissez une quantité valide.");
      return;
    }

    try {
      setTransferLoading(true);
      setTransferError(null);
      setPendingRegionalCreation(false);

      const response = await fetch(`${API_URL}/api/stock/add-regional`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vaccineId: transferContext.vaccineId,
          regionId: transferRegionId,
          quantity: quantityValue,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setTransferError(
            "Cette région n'a pas encore de stock pour ce vaccin. Créez-le puis recommencez."
          );
          setPendingRegionalCreation(true);
        } else {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? `status ${response.status}`);
        }
        return;
      }

      setTransferModalOpen(false);
      setTransferContext(null);
      setTransferRegionId("");
      setTransferQuantity("");
      await Promise.all([fetchNationalStocks(), fetchNationalStats()]);
    } catch (err) {
      console.error("Erreur transfert régional:", err);
      setTransferError(
        err instanceof Error ? err.message : "Impossible de transférer le stock"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  const handleCreateRegionalStock = async () => {
    if (!transferContext || !transferRegionId || !accessToken) return;

    try {
      setTransferLoading(true);
      setTransferError(null);

      const response = await fetch(`${API_URL}/api/stock/regional`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vaccineId: transferContext.vaccineId,
          regionId: transferRegionId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      setTransferError(
        "Stock régional créé. Vous pouvez maintenant effectuer le transfert."
      );
      setPendingRegionalCreation(false);
      await Promise.all([fetchNationalStocks(), fetchNationalStats()]);
    } catch (err) {
      console.error("Erreur création stock régional:", err);
      setTransferError(
        err instanceof Error
          ? err.message
          : "Impossible de créer le stock régional"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDeleteStock = (stock: NationalStock) => {
    console.warn("Suppression de stock non implémentée côté API", stock.vaccineId);
    setError(
      "La suppression d'un stock national nécessite un endpoint backend (ex: DELETE /api/stock/national)."
    );
  };

  return (
    <DashboardShell active="/dashboard/stocks">
      <div className="space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Stocks & lots</h2>
            <p className="text-sm text-slate-500">
              Suivi des stocks nationaux et distribution vers les régions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau lot
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total de doses"
            value={stats.totalQuantity.toLocaleString("fr-FR")}
            icon={Syringe}
            accent="emerald"
            loading={statsLoading}
          />
          <StatCard
            title="Stocks faibles"
            value={stats.lowStockCount}
            icon={AlertTriangle}
            accent="red"
            loading={statsLoading}
          />
          <StatCard
            title="Total de lots"
            value={stats.totalLots}
            icon={PackageOpen}
            accent="orange"
            loading={statsLoading}
          />
        </div>

        {statsError && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-700">
            {statsError}
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vaccin
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Quantité (national)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Expiration
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    Chargement des stocks…
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    Aucun stock national enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {stock.vaccine.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {stock.vaccine.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {(stock.quantity ?? 0).toLocaleString("fr-FR")}
                      </div>
                      <div className="text-xs text-slate-500">
                        {stock.vaccine.dosesRequired} doses requises
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">—</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openUpdateModal(stock)}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100"
                        >
                          Ajuster
                        </button>
                        <button
                          type="button"
                          onClick={() => openTransferModal(stock)}
                          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Envoyer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStock(stock)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <form onSubmit={handleCreateStock} className="space-y-4 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Créer un stock national</h3>
              <p className="text-sm text-slate-500">
                Sélectionnez un vaccin qui n'a pas encore de stock national.
              </p>

              <select
                value={createVaccineId}
                onChange={(event) => setCreateVaccineId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
              >
                <option value="">— Sélectionner un vaccin —</option>
                {availableVaccinesForCreation.map((vaccine) => (
                  <option key={vaccine.id} value={vaccine.id}>
                    {vaccine.name}
                  </option>
                ))}
              </select>

              {availableVaccinesForCreation.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  Tous les vaccins possèdent déjà un stock national.
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setCreateVaccineId("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || availableVaccinesForCreation.length === 0}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {creating ? "Création…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {updateModalOpen && updateContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Ajuster le stock — {updateContext.vaccineName}
              </h3>

              <div className="mt-6 flex flex-col gap-4 md:flex-row">
                <button
                  type="button"
                  onClick={() => setUpdateMode("set")}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-center text-sm font-medium transition ${
                    updateMode === "set"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Remplacer la quantité
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateMode("add")}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-center text-sm font-medium transition ${
                    updateMode === "add"
                      ? "border-blue-300 bg-blue-50 text-blue-700 shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Ajouter au stock
                </button>
              </div>

              {updateMode === "set" ? (
                <form onSubmit={handleSetQuantitySubmit} className="mt-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">
                      Nouvelle quantité nationale
                    </label>
                    <input
                      value={updateQuantity}
                      onChange={(event) => setUpdateQuantity(event.target.value)}
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      Quantité actuelle : {(updateContext.currentQuantity ?? 0).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetUpdateModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {updating ? "Enregistrement…" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddQuantitySubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-600">
                        Quantité actuelle
                      </label>
                      <input
                        value={(updateContext.currentQuantity ?? 0).toLocaleString("fr-FR")}
                        disabled
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-600">
                        Quantité à ajouter
                      </label>
                      <input
                        value={addQuantity}
                        onChange={(event) => setAddQuantity(event.target.value)}
                        type="number"
                        min="1"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        required
                      />
                    </div>
                  </div>

                  {addQuantityError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {addQuantityError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetUpdateModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {updating ? "Ajout…" : "Ajouter"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {transferModalOpen && transferContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <form onSubmit={handleTransferSubmit} className="space-y-4 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Envoyer du stock — {transferContext.vaccineName}
              </h3>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600">Région</label>
                <select
                  value={transferRegionId}
                  onChange={(event) => {
                    setTransferRegionId(event.target.value);
                    setTransferError(null);
                    setPendingRegionalCreation(false);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                >
                  <option value="">— Sélectionner une région —</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600">
                  Quantité à envoyer
                </label>
                <input
                  value={transferQuantity}
                  onChange={(event) => setTransferQuantity(event.target.value)}
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              {transferError && (
                <div
                  className={`rounded-xl border p-3 text-sm ${
                    pendingRegionalCreation
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {transferError}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                {pendingRegionalCreation && (
                  <button
                    type="button"
                    onClick={handleCreateRegionalStock}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                  >
                    Créer le stock régional
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTransferModalOpen(false);
                    setTransferContext(null);
                    setTransferRegionId("");
                    setTransferQuantity("");
                    setTransferError(null);
                    setPendingRegionalCreation(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {transferLoading ? "Transfert…" : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

type RegionalStock = {
  id: string;
  vaccineId: string;
  regionId: string;
  quantity: number | null;
  vaccine: VaccineInfo;
  region?: {
    id: string;
    name: string;
  } | null;
};

type DistrictOption = {
  id: string;
  name: string;
};

function RegionalStocksPage() {
  const { accessToken } = useAuth();

  const [stocks, setStocks] = useState<RegionalStock[]>([]);
  const [vaccines, setVaccines] = useState<VaccineInfo[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<StockStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createVaccineId, setCreateVaccineId] = useState("");
  const [creating, setCreating] = useState(false);

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateContext, setUpdateContext] = useState<{
    vaccineId: string;
    vaccineName: string;
    currentQuantity: number;
  } | null>(null);
  const [updateMode, setUpdateMode] = useState<"set" | "add">("set");
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [addQuantity, setAddQuantity] = useState("");
  const [addQuantityError, setAddQuantityError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferContext, setTransferContext] = useState<RegionalStock | null>(null);
  const [transferDistrictId, setTransferDistrictId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [pendingDistrictCreation, setPendingDistrictCreation] = useState(false);

  const fetchRegionalStats = useCallback(async () => {
    if (!accessToken) {
      setStats(emptyStats);
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);

      const response = await fetch(`${API_URL}/api/stock/stats/regional`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      const payload = (await response.json()) as StockStats;
      setStats(payload);
    } catch (err) {
      console.error("Erreur récupération stats régionales:", err);
      setStats(emptyStats);
      setStatsError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les statistiques régionales"
      );
    } finally {
      setStatsLoading(false);
    }
  }, [accessToken]);

  const fetchRegionalStocks = useCallback(async () => {
    if (!accessToken) {
      setStocks([]);
      setVaccines([]);
      setDistricts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [stockRes, vaccineRes, districtRes] = await Promise.all([
        fetch(`${API_URL}/api/stock/regional`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        fetch(`${API_URL}/api/vaccine`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        fetch(`${API_URL}/api/district`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ]);

      if (!stockRes.ok || !vaccineRes.ok || !districtRes.ok) {
        const payload =
          (!stockRes.ok ? await stockRes.json().catch(() => null) : null) ??
          (!vaccineRes.ok ? await vaccineRes.json().catch(() => null) : null) ??
          (!districtRes.ok ? await districtRes.json().catch(() => null) : null);
        throw new Error(payload?.message ?? "status non valide");
      }

      const stockPayload = (await stockRes.json()) as { regional?: RegionalStock[] };
      const vaccinePayload: VaccineResponse = await vaccineRes.json();
      const districtPayload = await districtRes.json();

      setStocks(Array.isArray(stockPayload?.regional) ? stockPayload.regional : []);
      setVaccines(
        Array.isArray(vaccinePayload)
          ? vaccinePayload
          : Array.isArray(vaccinePayload?.vaccines)
          ? vaccinePayload.vaccines
          : []
      );

      const districtItems = Array.isArray(districtPayload?.items)
        ? districtPayload.items
        : Array.isArray(districtPayload)
        ? districtPayload
        : [];

      setDistricts(
        districtItems.map((district: any) => ({
          id: district.id,
          name: district.name,
        }))
      );
    } catch (err) {
      console.error("Erreur chargement stocks régionaux:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les stocks régionaux"
      );
      setStocks([]);
      setVaccines([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchRegionalStocks();
    fetchRegionalStats();
  }, [fetchRegionalStocks, fetchRegionalStats]);

  const availableVaccinesForCreation = useMemo(() => {
    const existing = new Set(stocks.map((stock) => stock.vaccineId));
    return vaccines.filter((vaccine) => !existing.has(vaccine.id));
  }, [stocks, vaccines]);

  const resetUpdateModal = () => {
    setUpdateModalOpen(false);
    setUpdateContext(null);
    setUpdateQuantity("");
    setAddQuantity("");
    setAddQuantityError(null);
    setUpdating(false);
  };

  const handleCreateStock = async (event: FormEvent) => {
    event.preventDefault();
    if (!createVaccineId || !accessToken) return;

    try {
      setCreating(true);
      const response = await fetch(`${API_URL}/api/stock/regional`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ vaccineId: createVaccineId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      setCreateModalOpen(false);
      setCreateVaccineId("");
      await Promise.all([fetchRegionalStocks(), fetchRegionalStats()]);
    } catch (err) {
      console.error("Erreur création stock régional:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer le stock régional"
      );
    } finally {
      setCreating(false);
    }
  };

  const openUpdateModal = (stock: RegionalStock) => {
    setUpdateContext({
      vaccineId: stock.vaccineId,
      vaccineName: stock.vaccine.name,
      currentQuantity: stock.quantity ?? 0,
    });
    setUpdateQuantity(String(stock.quantity ?? 0));
    setUpdateMode("set");
    setAddQuantity("");
    setAddQuantityError(null);
    setUpdateModalOpen(true);
  };

  const handleSetQuantitySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!updateContext || !accessToken) return;

    const quantityValue = Number(updateQuantity);
    if (!Number.isFinite(quantityValue) || quantityValue < 0) {
      setAddQuantityError("Veuillez saisir une quantité valide.");
      return;
    }

    try {
      setAddQuantityError(null);
      setUpdating(true);
      const response = await fetch(`${API_URL}/api/stock/regional`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vaccineId: updateContext.vaccineId,
          quantity: quantityValue,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      resetUpdateModal();
      await Promise.all([fetchRegionalStocks(), fetchRegionalStats()]);
    } catch (err) {
      console.error("Erreur mise à jour stock régional:", err);
      setAddQuantityError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le stock"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleAddQuantitySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!updateContext || !accessToken) return;

    const quantityValue = Number(addQuantity);
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setAddQuantityError("Veuillez saisir une quantité valide.");
      return;
    }

    try {
      setAddQuantityError(null);
      setUpdating(true);
      const response = await fetch(`${API_URL}/api/stock/add-regional`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vaccineId: updateContext.vaccineId,
          quantity: quantityValue,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      resetUpdateModal();
      await Promise.all([fetchRegionalStocks(), fetchRegionalStats()]);
    } catch (err) {
      console.error("Erreur ajout stock régional:", err);
      setAddQuantityError(
        err instanceof Error
          ? err.message
          : "Impossible d'ajouter au stock régional"
      );
    } finally {
      setUpdating(false);
    }
  };

  const openTransferModal = (stock: RegionalStock) => {
    setTransferContext(stock);
    setTransferDistrictId("");
    setTransferQuantity("");
    setTransferError(null);
    setPendingDistrictCreation(false);
    setTransferModalOpen(true);
  };

  const handleTransferSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !transferContext) return;

    const quantityValue = Number(transferQuantity);
    if (!transferDistrictId || !Number.isFinite(quantityValue) || quantityValue <= 0) {
      setTransferError("Sélectionnez un district et saisissez une quantité valide.");
      return;
    }

    try {
      setTransferLoading(true);
      setTransferError(null);
      setPendingDistrictCreation(false);

      const response = await fetch(`${API_URL}/api/stock/add-regional`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vaccineId: transferContext.vaccineId,
          regionId: transferDistrictId,
          quantity: quantityValue,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setTransferError(
            "Ce district n'a pas encore de stock pour ce vaccin. Créez-le puis recommencez."
          );
          setPendingDistrictCreation(true);
        } else {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? `status ${response.status}`);
        }
        return;
      }

      setTransferModalOpen(false);
      setTransferContext(null);
      setTransferDistrictId("");
      setTransferQuantity("");
      await Promise.all([fetchRegionalStocks(), fetchRegionalStats()]);
    } catch (err) {
      console.error("Erreur transfert district:", err);
      setTransferError(
        err instanceof Error ? err.message : "Impossible de transférer le stock"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  const handleCreateDistrictStock = async () => {
    if (!accessToken || !transferContext || !transferDistrictId) return;

    try {
      setTransferLoading(true);
      setTransferError(null);

      const response = await fetch(`${API_URL}/api/stock/district`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vaccineId: transferContext.vaccineId,
          districtId: transferDistrictId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? `status ${response.status}`);
      }

      setTransferError(
        "Stock district créé. Vous pouvez maintenant effectuer le transfert."
      );
      setPendingDistrictCreation(false);
    } catch (err) {
      console.error("Erreur création stock district:", err);
      setTransferError(
        err instanceof Error
          ? err.message
          : "Impossible de créer le stock district"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <DashboardShell active="/dashboard/stocks">
      <div className="space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Stocks & lots</h2>
            <p className="text-sm text-slate-500">
              Suivi des stocks régionaux et distribution vers les districts.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              disabled={availableVaccinesForCreation.length === 0}
            >
              <Plus className="h-4 w-4" />
              Nouveau lot
            </button>
            <button
              type="button"
              onClick={fetchRegionalStocks}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total de doses"
            value={
              statsLoading ? "…" : stats.totalQuantity.toLocaleString("fr-FR")
            }
            icon={Syringe}
            accent="emerald"
            loading={statsLoading}
          />
          <StatCard
            title="Stocks faibles"
            value={statsLoading ? "…" : stats.lowStockCount}
            icon={AlertTriangle}
            accent="red"
            loading={statsLoading}
          />
          <StatCard
            title="Total de lots"
            value={statsLoading ? "…" : stats.totalLots}
            icon={PackageOpen}
            accent="orange"
            loading={statsLoading}
          />
        </div>

        {statsError && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-700">
            {statsError}
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vaccin
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Quantité (région)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Expiration
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    Chargement des stocks régionaux…
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    Aucun stock régional enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {stock.vaccine.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {stock.vaccine.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {(stock.quantity ?? 0).toLocaleString("fr-FR")}
                      </div>
                      <div className="text-xs text-slate-500">
                        {stock.region?.name ?? "Votre région"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">—</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openUpdateModal(stock)}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100"
                        >
                          Ajuster
                        </button>
                        <button
                          type="button"
                          onClick={() => openTransferModal(stock)}
                          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Envoyer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <form onSubmit={handleCreateStock} className="space-y-4 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Créer un stock régional
              </h3>
              <p className="text-sm text-slate-500">
                Sélectionnez un vaccin qui n'a pas encore de stock pour votre région.
              </p>

              <select
                value={createVaccineId}
                onChange={(event) => setCreateVaccineId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
              >
                <option value="">— Sélectionner un vaccin —</option>
                {availableVaccinesForCreation.map((vaccine) => (
                  <option key={vaccine.id} value={vaccine.id}>
                    {vaccine.name}
                  </option>
                ))}
              </select>

              {availableVaccinesForCreation.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  Tous les vaccins possèdent déjà un stock régional.
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setCreateVaccineId("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || availableVaccinesForCreation.length === 0}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {creating ? "Création…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {updateModalOpen && updateContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Ajuster le stock — {updateContext.vaccineName}
              </h3>

              <div className="mt-6 flex flex-col gap-4 md:flex-row">
                <button
                  type="button"
                  onClick={() => setUpdateMode("set")}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-center text-sm font-medium transition ${
                    updateMode === "set"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Remplacer la quantité
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateMode("add")}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-center text-sm font-medium transition ${
                    updateMode === "add"
                      ? "border-blue-300 bg-blue-50 text-blue-700 shadow"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Ajouter au stock
                </button>
              </div>

              {updateMode === "set" ? (
                <form onSubmit={handleSetQuantitySubmit} className="mt-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">
                      Nouvelle quantité régionale
                    </label>
                    <input
                      value={updateQuantity}
                      onChange={(event) => setUpdateQuantity(event.target.value)}
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      Quantité actuelle : {(updateContext.currentQuantity ?? 0).toLocaleString("fr-FR")}
                    </p>
                  </div>

                  {addQuantityError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {addQuantityError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetUpdateModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {updating ? "Enregistrement…" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddQuantitySubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-600">
                        Quantité actuelle
                      </label>
                      <input
                        value={(updateContext.currentQuantity ?? 0).toLocaleString("fr-FR")}
                        disabled
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-600">
                        Quantité à ajouter
                      </label>
                      <input
                        value={addQuantity}
                        onChange={(event) => setAddQuantity(event.target.value)}
                        type="number"
                        min="1"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        required
                      />
                    </div>
                  </div>

                  {addQuantityError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {addQuantityError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetUpdateModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {updating ? "Ajout…" : "Ajouter"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {transferModalOpen && transferContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <form onSubmit={handleTransferSubmit} className="space-y-4 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Envoyer du stock — {transferContext.vaccine.name}
              </h3>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600">
                  District
                </label>
                <select
                  value={transferDistrictId}
                  onChange={(event) => {
                    setTransferDistrictId(event.target.value);
                    setTransferError(null);
                    setPendingDistrictCreation(false);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                >
                  <option value="">— Sélectionner un district —</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600">
                  Quantité à envoyer
                </label>
                <input
                  value={transferQuantity}
                  onChange={(event) => setTransferQuantity(event.target.value)}
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              {transferError && (
                <div
                  className={`rounded-xl border p-3 text-sm ${
                    pendingDistrictCreation
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {transferError}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                {pendingDistrictCreation && (
                  <button
                    type="button"
                    onClick={handleCreateDistrictStock}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                  >
                    Créer le stock district
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTransferModalOpen(false);
                    setTransferContext(null);
                    setTransferDistrictId("");
                    setTransferQuantity("");
                    setTransferError(null);
                    setPendingDistrictCreation(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {transferLoading ? "Transfert…" : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function StocksAccessFallback() {
  return (
    <DashboardShell active="/dashboard/stocks">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        <p className="text-lg font-semibold text-slate-900">
          Accès au module de stocks restreint
        </p>
        <p className="mt-2 text-sm">
          Votre rôle ne permet pas encore de consulter ou de modifier les stocks.
        </p>
      </div>
    </DashboardShell>
  );
}

export default function StocksPage() {
  const { user } = useAuth();

  if (user?.role === "REGIONAL") {
    return <RegionalStocksPage />;
  }

  if (!user || user.role === "NATIONAL") {
    return <NationalStocksPage />;
  }

  return <StocksAccessFallback />;
}
