"use client";

import { apiFetch } from "@/app/lib/api";
import {
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Video,
  X,
  Calendar,
  MapPin,
  Filter,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Media {
  url: string;
  type: "video" | "pdf";
}

interface Campaign {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  region: string;
  medias: Media[];
}

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    region: "",
  });
  const [mediaForm, setMediaForm] = useState({
    url: "",
    type: "video" as "video" | "pdf",
  });

  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await apiFetch<any>("/api/campaigns");
      const list = Array.isArray(data?.campaigns) ? data.campaigns : [];
      setCampaigns(list);
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setCampaigns([]);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const saveCampaign = async () => {
    if (!form.title || !form.startDate || !form.endDate || !form.region) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const method = editCampaign ? "PUT" : "POST";
    const url = editCampaign
      ? `/api/campaigns/${editCampaign._id}`
      : "/api/campaigns";

    try {
      const res = await apiFetch<any>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res || res.error) {
        alert(res.error || res.message || "Erreur lors de l'enregistrement");
        return;
      }

      await fetchCampaigns();
      setShowModal(false);
      setEditCampaign(null);
      setForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        region: "",
      });
    } catch (err) {
      console.error("Erreur réseau:", err);
    }
  };

  const deleteCampaign = async () => {
    if (!deleteId) return;
    try {
      const res = await apiFetch<any>(`/api/campaigns/${deleteId}`, {
        method: "DELETE",
      });
      if (!res || res.error) {
        alert(res?.error || "Erreur lors de la suppression");
      }
      await fetchCampaigns();
      setDeleteId(null);
    } catch (err) {
      console.error("Erreur réseau:", err);
    }
  };

  const addMedia = async (campaignId: string) => {
    if (!mediaForm.url) {
      alert("Veuillez entrer une URL");
      return;
    }

    try {
      const res = await apiFetch<any>(`/api/campaigns/${campaignId}/medias`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaForm),
      });

      if (!res || res.error) {
        alert(res.error || "Erreur lors de l'ajout du média");
        return;
      }

      await fetchCampaigns();
      setShowMediaModal(null);
      setMediaForm({ url: "", type: "video" });
    } catch (err) {
      console.error("Erreur réseau:", err);
    }
  };

  const removeMedia = async (campaignId: string, url: string) => {
    try {
      const res = await apiFetch<any>(`/api/campaigns/${campaignId}/medias`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res || res.error) {
        alert(res.error || "Erreur lors de la suppression du média");
        return;
      }

      await fetchCampaigns();
      setPreviewMedia((prev) => (prev && prev.url === url ? null : prev));
    } catch (err) {
      console.error("Erreur réseau:", err);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilter === "all" || c.region === regionFilter;
    return matchSearch && matchRegion;
  });

  const activeCampaigns = campaigns.filter(
    (c) => new Date(c.endDate) >= new Date()
  ).length;
  const completedCampaigns = campaigns.filter(
    (c) => new Date(c.endDate) < new Date()
  ).length;
  const upcomingCampaigns = campaigns.filter(
    (c) => new Date(c.startDate) > new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actives</p>
              <p className="text-2xl font-bold text-green-600">{activeCampaigns}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">À venir</p>
              <p className="text-2xl font-bold text-blue-600">{upcomingCampaigns}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-gray-600">{completedCampaigns}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-center">
        <button
          onClick={() => {
            setShowModal(true);
            setEditCampaign(null);
            setForm({
              title: "",
              description: "",
              startDate: "",
              endDate: "",
              region: "",
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </button>

        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
          </div>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">Toutes les régions</option>
            <option value="Dakar">Dakar</option>
            <option value="Thiès">Thiès</option>
            <option value="Saint-Louis">Saint-Louis</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((c) => {
            const isActive =
              new Date(c.endDate) >= new Date() &&
              new Date(c.startDate) <= new Date();
            const isUpcoming = new Date(c.startDate) > new Date();

            return (
              <div
                key={c._id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{c.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          isActive
                            ? "bg-green-100 text-green-700"
                            : isUpcoming
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {isActive ? "✅ Active" : isUpcoming ? "🕒 À venir" : "✔️ Terminée"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{c.description}</p>

                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(c.startDate).toLocaleDateString()} -{" "}
                          {new Date(c.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{c.region}</span>
                      </div>
                    </div>

                    {c.medias && c.medias.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-1">Médias ({c.medias.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {c.medias.map((m, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <button
                                onClick={() => setPreviewMedia(m)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100"
                              >
                                {m.type === "video" ? (
                                  <Video size={12} />
                                ) : (
                                  <FileText size={12} />
                                )}
                                {m.type === "video" ? `Vidéo ${i + 1}` : `PDF ${i + 1}`}
                              </button>
                              <button
                                onClick={() => removeMedia(c._id, m.url)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button
                    onClick={() => {
                      setEditCampaign(c);
                      setForm({
                        title: c.title,
                        description: c.description,
                        startDate: c.startDate.split("T")[0],
                        endDate: c.endDate.split("T")[0],
                        region: c.region,
                      });
                      setShowModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded flex items-center justify-center gap-2 hover:bg-blue-100"
                  >
                    <Pencil size={16} />
                    Modifier
                  </button>
                  <button
                    onClick={() => setShowMediaModal(c._id)}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded flex items-center justify-center gap-2 hover:bg-green-100"
                  >
                    <Plus size={16} />
                    Média
                  </button>
                  <button
                    onClick={() => setDeleteId(c._id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded flex items-center justify-center hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border-2 border-dashed">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune campagne trouvée</p>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editCampaign ? "Modifier la Campagne" : "Nouvelle Campagne"}
            </h2>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Titre"
              className="border w-full p-2 rounded mb-3"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className="border w-full p-2 rounded mb-3"
              rows={3}
            />
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="border w-full p-2 rounded mb-3"
            />
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="border w-full p-2 rounded mb-3"
            />
            <input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="Région"
              className="border w-full p-2 rounded mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={saveCampaign}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editCampaign ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Confirmer la suppression ?</h2>
            <p className="mb-4 text-gray-600">Voulez-vous vraiment supprimer cette campagne ?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={deleteCampaign}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Media */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Ajouter un média</h2>
            <input
              value={mediaForm.url}
              onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
              placeholder="Lien (YouTube, PDF...)"
              className="border w-full p-2 rounded mb-3"
            />
            <select
              value={mediaForm.type}
              onChange={(e) =>
                setMediaForm({
                  ...mediaForm,
                  type: e.target.value as "video" | "pdf",
                })
              }
              className="border w-full p-2 rounded mb-3"
            >
              <option value="video">Vidéo</option>
              <option value="pdf">PDF</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMediaModal(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={() => addMedia(showMediaModal!)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Media */}
      {previewMedia && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[80%] h-[80%] relative">
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-2 right-2 text-gray-600 bg-white rounded-full p-2 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            {previewMedia.type === "video" ? (
              <iframe
                src={previewMedia.url.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <embed
                src={previewMedia.url}
                type="application/pdf"
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
