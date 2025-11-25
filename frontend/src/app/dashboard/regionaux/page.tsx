"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
  Pencil,
} from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import StatCard from "../components/StatCard";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

type ScopeOption = {
  id: string;
  name: string;
};

type RawUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  regionId?: string | null;
  districtId?: string | null;
  healthCenterId?: string | null;
  agentLevel?: string | null;
};

type ManagedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  scopeId: string | null;
  agentLevel?: string | null;
};

type ManagedForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  scopeId: string;
};

const EMPTY_FORM: ManagedForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  scopeId: "",
};

export default function ManagedUsersPage() {
  const { accessToken, user } = useAuth();

  const isNational = user?.role === "NATIONAL";
  const isRegional = user?.role === "REGIONAL";
  const isDistrict = user?.role === "DISTRICT";

  const title = isNational
    ? "Gestion des régionaux"
    : isRegional
    ? "Gestion des agents de district"
    : "Gestion des agents";
  const description = isNational
    ? "Administration des utilisateurs responsables des régions."
    : isRegional
    ? "Administration des administrateurs de district pour votre région."
    : "Administration des agents de santé rattachés à vos centres.";
  const createLabel = isNational
    ? "Ajouter un régional"
    : isRegional
    ? "Ajouter un agent de district"
    : "Ajouter un agent";
  const emptyLabel = isNational
    ? "Aucun régional enregistré"
    : isRegional
    ? "Aucun agent de district enregistré"
    : "Aucun agent enregistré";
  const scopeLabel = isNational ? "Région" : isRegional ? "District" : "Centre de santé";
  const scopeApiPath = isNational ? "region" : isRegional ? "district" : "healthCenter";
  const usersApiPath = isNational ? "regional" : isRegional ? "district" : "agent-admin";
  const expectedRole = isNational ? "REGIONAL" : isRegional ? "DISTRICT" : "AGENT";
  const expectedAgentLevel = isDistrict ? "ADMIN" : undefined;
  const activePath = isNational
    ? "/dashboard/regionaux"
    : isRegional
    ? "/dashboard/regionaux"
    : "/dashboard/agents";

  const [scopes, setScopes] = useState<ScopeOption[]>([]);
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [form, setForm] = useState<ManagedForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchScopes = useCallback(async () => {
    if (!accessToken) return;

    try {
      const res = await fetch(`${API_URL}/api/${scopeApiPath}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }

      const payload = await res.json();
      const items: ScopeOption[] = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.regions)
        ? payload.regions
        : Array.isArray(payload)
        ? payload
        : [];

      setScopes(items.map((entry: any) => ({ id: entry.id, name: entry.name })));
    } catch (err) {
      console.error("Erreur chargement", scopeApiPath, err);
      setError((prev) => prev ?? `Impossible de charger les ${scopeLabel.toLowerCase()}s`);
    }
  }, [accessToken, scopeApiPath, scopeLabel]);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/api/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }

      const data: RawUser[] = await res.json();

      const filtered = data.filter((entry) => {
        if (entry.role !== expectedRole) {
          return false;
        }
        if (expectedAgentLevel) {
          return entry.agentLevel === expectedAgentLevel;
        }
        return true;
      });

      const items = filtered.map<ManagedUser>((entry) => ({
        id: entry.id,
        email: entry.email,
        firstName: entry.firstName ?? "",
        lastName: entry.lastName ?? "",
        phone: entry.phone ?? "",
        scopeId: isNational ? entry.regionId ?? null : isRegional ? entry.districtId ?? null : entry.healthCenterId ?? null,
        agentLevel: entry.role === "AGENT" ? entry.agentLevel ?? undefined : undefined,
      }));

      setUsersList(items);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
      setError("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  }, [accessToken, expectedRole, isNational, isRegional, expectedAgentLevel]);

  useEffect(() => {
    fetchScopes();
    fetchUsers();
  }, [fetchScopes, fetchUsers]);

  const openCreateModal = () => {
    setFormMode("create");
    setCurrentId(null);
    setForm({
      ...EMPTY_FORM,
      scopeId: scopes[0]?.id ?? "",
    });
    setShowFormModal(true);
  };

  const openEditModal = (userToEdit: ManagedUser) => {
    setFormMode("edit");
    setCurrentId(userToEdit.id);
    setForm({
      firstName: userToEdit.firstName,
      lastName: userToEdit.lastName,
      email: userToEdit.email,
      phone: userToEdit.phone,
      scopeId: userToEdit.scopeId ?? "",
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setFormMode("create");
    setCurrentId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!accessToken) return;

    const isEdit = formMode === "edit" && currentId;

    if (!form.scopeId.trim()) {
      setError(`Veuillez sélectionner un ${scopeLabel.toLowerCase()}.`);
      return;
    }

    if (!isEdit) {
      if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim()) {
        setError("Veuillez renseigner le prénom, nom et email");
        return;
      }
    }

    const endpoint = isEdit
      ? `${API_URL}/api/users/${usersApiPath}/${currentId}`
      : `${API_URL}/api/users/${usersApiPath}`;
    const method = isEdit ? "PUT" : "POST";

    const payload = isEdit
      ? {
          [isNational ? "regionId" : isRegional ? "districtId" : "healthCenterId"]: form.scopeId.trim(),
        }
      : {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          [isNational ? "regionId" : isRegional ? "districtId" : "healthCenterId"]: form.scopeId.trim(),
        };

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const message = await res.json().catch(() => null);
        throw new Error(message?.message ?? `status ${res.status}`);
      }

      closeFormModal();
      await fetchUsers();
    } catch (err) {
      console.error("Erreur sauvegarde utilisateur:", err);
      setError("Impossible d'enregistrer l'utilisateur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      const res = await fetch(`${API_URL}/api/users/${usersApiPath}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const message = await res.json().catch(() => null);
        throw new Error(message?.message ?? `status ${res.status}`);
      }

      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      console.error("Erreur suppression utilisateur:", err);
      setError("Impossible de supprimer l'utilisateur");
    } finally {
      setDeleting(false);
    }
  };

  const scopeMap = useMemo(() => {
    return scopes.reduce<Record<string, string>>((acc, scope) => {
      acc[scope.id] = scope.name;
      return acc;
    }, {});
  }, [scopes]);

  const cards = useMemo(() => {
    if (loading) {
      return (
        <div className="col-span-full flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-sm text-slate-600">Chargement...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="col-span-full flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="font-medium text-red-600">{error}</p>
          </div>
        </div>
      );
    }

    if (usersList.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          <Users className="mb-4 h-16 w-16 text-slate-300" />
          <p className="text-lg font-semibold">{emptyLabel}</p>
          <p className="mt-1 text-sm text-slate-400">
            Ajoutez votre premier utilisateur pour commencer.
          </p>
          {(isNational || isRegional || isDistrict) && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {createLabel}
            </button>
          )}
        </div>
      );
    }

    return usersList.map((item, index) => {
      const initials = `${item.firstName.charAt(0) ?? ""}${item.lastName.charAt(0) ?? ""}`.trim() || "U";
      const scopeName = item.scopeId ? scopeMap[item.scopeId] ?? "Non assigné" : "Non assigné";

      return (
        <div
          key={item.id}
          className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-500 text-lg font-bold text-white shadow-sm ring-2 ring-white">
              {initials}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {item.firstName || item.lastName ? `${item.firstName} ${item.lastName}`.trim() : item.email}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {scopeLabel}: {scopeName}
                </span>
              </div>
              {item.agentLevel && (
                <p className="text-xs uppercase text-slate-400">Niveau : {item.agentLevel}</p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="truncate">{item.email}</span>
            </div>
            {item.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{item.phone}</span>
              </div>
            )}
          </div>

          {(isNational || isRegional || isDistrict) && (
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => openEditModal(item)}
                className="flex-1 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
              >
                <span className="flex items-center justify-center gap-2">
                  <Pencil className="h-4 w-4" /> Modifier
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                className="flex-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
              >
                <span className="flex items-center justify-center gap-2">
                  <Trash2 className="h-4 w-4" /> Supprimer
                </span>
              </button>
            </div>
          )}
        </div>
      );
    });
  }, [loading, error, usersList, emptyLabel, createLabel, isNational, isRegional, isDistrict, scopeLabel, scopeMap]);

  return (
    <>
      <DashboardShell active={activePath}>
        <div className="space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={fetchUsers}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
              >
                <RefreshCw className="h-4 w-4" /> Actualiser
              </button>
              {(isNational || isRegional || isDistrict) && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" /> {createLabel}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title={isNational ? "Total régionaux" : isRegional ? "Total agents de district" : "Total agents"}
              value={loading ? "…" : usersList.length}
              icon={Users}
              accent="blue"
              loading={loading}
            />
          </div>

          {error && !loading && (
            <div className="rounded-3xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{cards}</div>
        </div>
      </DashboardShell>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Users className="h-5 w-5 text-blue-600" />
                {formMode === "edit"
                  ? isNational
                    ? "Modifier le régional"
                    : isRegional
                    ? "Modifier l'agent de district"
                    : "Modifier l'agent"
                  : isNational
                  ? "Nouveau régional"
                  : isRegional
                  ? "Nouvel agent de district"
                  : "Nouvel agent"}
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-600">Prénom</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                    disabled={formMode === "edit" && !isNational && !isRegional}
                    className={`mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${formMode === "edit" && !isNational && !isRegional ? "bg-slate-100 text-slate-500" : ""}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Nom</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                    disabled={formMode === "edit" && !isNational && !isRegional}
                    className={`mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${formMode === "edit" && !isNational && !isRegional ? "bg-slate-100 text-slate-500" : ""}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-600">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                    disabled={formMode === "edit" && !isNational && !isRegional}
                    className={`mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${formMode === "edit" && !isNational && !isRegional ? "bg-slate-100 text-slate-500" : ""}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    disabled={formMode === "edit" && !isNational && !isRegional}
                    className={`mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${formMode === "edit" && !isNational && !isRegional ? "bg-slate-100 text-slate-500" : ""}`}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">{scopeLabel}</label>
                <select
                  value={form.scopeId}
                  onChange={(event) => setForm((prev) => ({ ...prev, scopeId: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">— Sélectionner —</option>
                  {scopes.map((scope) => (
                    <option key={scope.id} value={scope.id}>
                      {scope.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Supprimer cet utilisateur ?
              </h3>
              <p className="text-sm text-slate-500">
                Êtes-vous sûr de vouloir supprimer {deleteTarget.firstName || deleteTarget.lastName ? `${deleteTarget.firstName} ${deleteTarget.lastName}`.trim() : deleteTarget.email} ?
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
