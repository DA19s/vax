"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // états UI
  const [showModal, setShowModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  // formulaires
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

  // recherche + filtre
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");

  // 🔄 fetch campagnes (corrigé)
  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await apiFetch<any>("/api/campaigns");
      // ✅ Le backend renvoie { success: true, campaigns: [...] }
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

  // ➕ Créer / Modifier
  const saveCampaign = async () => {
    if (!form.title || !form.startDate || !form.endDate || !form.region) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const method = editCampaign ? "PUT" : "POST";
    const url = editCampaign
      ? `http://localhost:5000/api/campaigns/${editCampaign._id}`
      : "http://localhost:5000/api/campaigns";

    try {
      const res = await apiFetch<any>(url.replace("http://localhost:5000", ""), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = res;
      if (!data || data.error) {
        alert(data.error || data.message || "Erreur lors de l’enregistrement");
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

  // ❌ Supprimer
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

  // ➕ Ajouter un média
  const addMedia = async (campaignId: string) => {
    if (!mediaForm.url) {
      alert("Veuillez entrer une URL");
      return;
    }

    try {
      const res = await apiFetch<any>(
        `/api/campaigns/${campaignId}/medias`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mediaForm),
        }
      );

      const data = res;
      if (!data || data.error) {
        alert(data.error || "Erreur lors de l’ajout du média");
        return;
      }

      await fetchCampaigns();
      setShowMediaModal(null);
      setMediaForm({ url: "", type: "video" });
    } catch (err) {
      console.error("Erreur réseau:", err);
    }
  };

  // ❌ Supprimer un média
  const removeMedia = async (campaignId: string, url: string) => {
    try {
      const res = await apiFetch<any>(
        `/api/campaigns/${campaignId}/medias`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );

      const data = res;
      if (!data || data.error) {
        alert(data.error || "Erreur lors de la suppression du média");
        return;
      }

      await fetchCampaigns();
      setPreviewMedia((prev) => (prev && prev.url === url ? null : prev));
    } catch (err) {
      console.error("Erreur réseau:", err);
    }
  };

  // 🎯 Filtrage
  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilter === "all" || c.region === regionFilter;
    return matchSearch && matchRegion;
  });

  // Statistiques
  const activeCampaigns = campaigns.filter(c => new Date(c.endDate) >= new Date()).length;
  const completedCampaigns = campaigns.filter(c => new Date(c.endDate) < new Date()).length;
  const upcomingCampaigns = campaigns.filter(c => new Date(c.startDate) > new Date()).length;

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                Gestion des Campagnes
              </h1>
              <p className="text-gray-600">Planification et suivi des campagnes de vaccination</p>
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              Nouvelle campagne
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Campagnes actives</h3>
            <p className="text-3xl font-bold text-green-600">{activeCampaigns}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">À venir</h3>
            <p className="text-3xl font-bold text-blue-600">{upcomingCampaigns}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-slideUp" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Terminées</h3>
            <p className="text-3xl font-bold text-gray-600">{completedCampaigns}</p>
          </div>
        </div>

        {/* Filtres modernes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtres de recherche</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une campagne..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all"
              >
                <option value="all">Toutes les régions</option>
                <option value="Dakar">Dakar</option>
                <option value="Thiès">Thiès</option>
                <option value="Saint-Louis">Saint-Louis</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grille de cartes campagnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCampaigns.length > 0 ? (
            filteredCampaigns.map((c, idx) => {
              const isActive = new Date(c.endDate) >= new Date() && new Date(c.startDate) <= new Date();
              const isUpcoming = new Date(c.startDate) > new Date();
              
              return (
                <div
                  key={c._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-slideUp"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{c.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-green-100 text-green-700' : 
                          isUpcoming ? 'bg-blue-100 text-blue-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {isActive ? '✅ Active' : isUpcoming ? '🕒 À venir' : '✔️ Terminée'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{c.description}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{c.region}</span>
                        </div>
                      </div>

                      {c.medias && c.medias.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Médias ({c.medias.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {c.medias.map((m, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <button
                                  onClick={() => setPreviewMedia(m)}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-xs font-medium"
                                >
                                  {m.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                                  {m.type === 'video' ? `Vidéo ${i + 1}` : `PDF ${i + 1}`}
                                </button>
                                <button
                                  onClick={() => removeMedia(c._id, m.url)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditCampaign(c);
                        setForm({
                          title: c.title,
                          description: c.description,
                          startDate: c.startDate.split('T')[0],
                          endDate: c.endDate.split('T')[0],
                          region: c.region,
                        });
                        setShowModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                    >
                      <Pencil size={16} />
                      Modifier
                    </button>
                    <button
                      onClick={() => setShowMediaModal(c._id)}
                      className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                    >
                      <Plus size={16} />
                      Média
                    </button>
                    <button
                      onClick={() => setDeleteId(c._id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                    >
