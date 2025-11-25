"use client";

import { apiFetch } from "@/app/lib/api";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Upload,
  X,
  FileText,
  Video,
  Image as ImageIcon,
  Filter,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface HealthTipMedia {
  type: "image" | "video" | "pdf";
  url: string;
  filename: string;
}

interface HealthTip {
  _id: string;
  title: string;
  description: string;
  category: "vaccination" | "nutrition" | "hygiene" | "development" | "safety" | "general";
  targetAgeGroup: string;
  priority: "high" | "medium" | "low";
  media?: HealthTipMedia;
  isActive: boolean;
  views: number;
  createdAt: string;
}

const CATEGORIES = [
  { value: "vaccination", label: "Vaccination", icon: "💉", color: "bg-blue-100 text-blue-800" },
  { value: "nutrition", label: "Nutrition", icon: "🥗", color: "bg-green-100 text-green-800" },
  { value: "hygiene", label: "Hygiène", icon: "🧼", color: "bg-purple-100 text-purple-800" },
  { value: "development", label: "Développement", icon: "👶", color: "bg-yellow-100 text-yellow-800" },
  { value: "safety", label: "Sécurité", icon: "🛡️", color: "bg-red-100 text-red-800" },
  { value: "general", label: "Général", icon: "ℹ️", color: "bg-gray-100 text-gray-800" },
];

const AGE_GROUPS = ["Tous", "0-6 mois", "6-12 mois", "1-2 ans", "2-5 ans", "5+ ans"];

export default function HealthTipsTab() {
  const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTip, setEditTip] = useState<HealthTip | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewTip, setPreviewTip] = useState<HealthTip | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general" as HealthTip["category"],
    targetAgeGroup: "Tous",
    priority: "medium" as HealthTip["priority"],
    media: null as HealthTipMedia | null,
  });
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");

  // Fetch health tips
  const fetchHealthTips = useCallback(async () => {
    try {
      const data = await apiFetch<any>("/api/health-tips");
      const list = Array.isArray(data?.healthTips) ? data.healthTips : [];
      setHealthTips(list);
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setHealthTips([]);
    }
  }, []);

  useEffect(() => {
    fetchHealthTips();
  }, [fetchHealthTips]);

  // Upload media
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 50MB)");
      return;
    }

    setUploadingMedia(true);
    const formData = new FormData();
    formData.append("media", file);

    try {
      const res = await fetch("/api/health-tips/upload-media", {
        method: "POST",
        credentials: "include", // ✅ Envoie automatiquement le cookie HttpOnly
        // NE PAS inclure Content-Type pour FormData (défini automatiquement avec boundary)
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur serveur:", errorText);
        alert(`Erreur ${res.status}: ${errorText}`);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setForm({ ...form, media: data.media });
        alert("Média uploadé avec succès !");
      } else {
        alert(data.message || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'upload du média");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleMediaUrl = () => {
    if (!mediaUrl) {
      alert("Veuillez entrer une URL");
      return;
    }

    // Détecter le type de média
    let type: "image" | "video" | "pdf" = "image";
    if (mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be") || mediaUrl.match(/\.(mp4|mov|avi|webm)$/i)) {
      type = "video";
    } else if (mediaUrl.match(/\.pdf$/i)) {
      type = "pdf";
    }

    setForm({
      ...form,
      media: {
        type,
        url: mediaUrl,
        filename: "Lien externe",
      },
    });
    setMediaUrl("");
    alert("Lien ajouté avec succès !");
  };

  // Save health tip
  const saveHealthTip = async () => {
    if (!form.title || !form.description) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const method = editTip ? "PUT" : "POST";
    const url = editTip ? `/api/health-tips/${editTip._id}` : "/api/health-tips";

    try {
      await apiFetch<any>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      alert(`Conseil ${editTip ? "modifié" : "créé"} avec succès !`);
      setShowModal(false);
      resetForm();
      fetchHealthTips();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  // Delete health tip
  const deleteHealthTip = async (id: string) => {
    try {
      await apiFetch<any>(`/api/health-tips/${id}`, { method: "DELETE" });
      alert("Conseil supprimé avec succès !");
      setDeleteId(null);
      fetchHealthTips();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      category: "general",
      targetAgeGroup: "Tous",
      priority: "medium",
      media: null,
    });
    setEditTip(null);
  };

  const openEditModal = (tip: HealthTip) => {
    setEditTip(tip);
    setForm({
      title: tip.title,
      description: tip.description,
      category: tip.category,
      targetAgeGroup: tip.targetAgeGroup,
      priority: tip.priority,
      media: tip.media || null,
    });
    setShowModal(true);
  };

  // Filtrage
  const filteredTips = healthTips.filter((tip) => {
    const matchSearch =
      tip.title.toLowerCase().includes(search.toLowerCase()) ||
      tip.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || tip.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find((c) => c.value === category) || CATEGORIES[5];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMediaIcon = (type?: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{healthTips.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {healthTips.filter((t) => t.isActive).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vues totales</p>
              <p className="text-2xl font-bold text-purple-600">
                {healthTips.reduce((sum, t) => sum + t.views, 0)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avec média</p>
              <p className="text-2xl font-bold text-orange-600">
                {healthTips.filter((t) => t.media).length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <ImageIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau conseil
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">Toutes les catégories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTips.map((tip) => {
          const categoryInfo = getCategoryInfo(tip.category);
          return (
            <div key={tip._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {/* Media preview */}
              {tip.media && (
                <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                  {tip.media.type === "image" ? (
                    <img
                      src={tip.media.url}
                      alt={tip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : tip.media.type === "video" ? (
                    <video src={tip.media.url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    {getMediaIcon(tip.media.type)}
                    {tip.media.type.toUpperCase()}
                  </div>
                </div>
              )}

              <div className="p-4 space-y-3">
                {/* Category & Priority */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full ${categoryInfo.color}`}>
                    {categoryInfo.icon} {categoryInfo.label}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(tip.priority)}`}>
                    {tip.priority === "high" ? "🔥 Haute" : tip.priority === "medium" ? "⚡ Moyenne" : "✅ Basse"}
                  </span>
                  {!tip.isActive && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                      Inactif
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 line-clamp-2">{tip.title}</h3>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-3">{tip.description}</p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {tip.views} vues
                  </span>
                  <span>👶 {tip.targetAgeGroup}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => setPreviewTip(tip)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-100"
                  >
                    <Eye className="h-4 w-4" />
                    Voir
                  </button>
                  <button
                    onClick={() => openEditModal(tip)}
                    className="flex-1 bg-yellow-50 text-yellow-600 px-3 py-2 rounded flex items-center justify-center gap-2 hover:bg-yellow-100"
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => setDeleteId(tip._id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded flex items-center justify-center hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTips.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Aucun conseil de santé trouvé</p>
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editTip ? "Modifier le conseil" : "Nouveau conseil de santé"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Ex: L'importance de la vaccination"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Décrivez le conseil de santé en détail..."
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priorité</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="high">🔥 Haute</option>
                    <option value="medium">⚡ Moyenne</option>
                    <option value="low">✅ Basse</option>
                  </select>
                </div>
              </div>

              {/* Age Group */}
              <div>
                <label className="block text-sm font-medium mb-1">Tranche d'âge</label>
                <select
                  value={form.targetAgeGroup}
                  onChange={(e) => setForm({ ...form, targetAgeGroup: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  {AGE_GROUPS.map((age) => (
                    <option key={age} value={age}>
                      👶 {age}
                    </option>
                  ))}
                </select>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Média (Image, Vidéo ou PDF)
                </label>

                {/* Tabs pour choisir fichier ou URL */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMethod("file")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      uploadMethod === "file"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    📁 Uploader un fichier
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod("url")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      uploadMethod === "url"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🔗 Coller un lien
                  </button>
                </div>
                
                {form.media ? (
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMediaIcon(form.media.type)}
                        <span className="text-sm font-medium">{form.media.filename}</span>
                        <span className="text-xs text-gray-500">({form.media.type})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, media: null })}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {form.media.type === "image" && (
                      <img
                        src={form.media.url}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded"
                      />
                    )}
                  </div>
                ) : (
                  <>
                    {uploadMethod === "file" ? (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            {uploadingMedia ? "Upload en cours..." : "Cliquez pour uploader"}
                          </span>
                          <input
                            type="file"
                            accept="image/*,video/*,.pdf"
                            onChange={handleMediaUpload}
                            className="hidden"
                            disabled={uploadingMedia}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG, GIF, WEBP, MP4, MOV, AVI, PDF (Max 50MB)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg ou https://youtube.com/watch?v=..."
                          className="w-full border rounded-lg px-4 py-2"
                        />
                        <button
                          type="button"
                          onClick={handleMediaUrl}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Ajouter le lien
                        </button>
                        <p className="text-xs text-gray-500">
                          📌 Supporte : Images (JPG, PNG...), Vidéos (YouTube, MP4...), PDF
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={saveHealthTip}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editTip ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {previewTip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">{previewTip.title}</h2>
              <button onClick={() => setPreviewTip(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Media */}
              {previewTip.media && (
                <div className="rounded-lg overflow-hidden bg-gray-100">
                  {previewTip.media.type === "image" ? (
                    <img src={previewTip.media.url} alt={previewTip.title} className="w-full" />
                  ) : previewTip.media.type === "video" ? (
                    <video src={previewTip.media.url} controls className="w-full" />
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <a
                        href={previewTip.media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Télécharger le PDF
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-sm px-3 py-1 rounded-full ${getCategoryInfo(previewTip.category).color}`}>
                  {getCategoryInfo(previewTip.category).icon} {getCategoryInfo(previewTip.category).label}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${getPriorityColor(previewTip.priority)}`}>
                  Priorité: {previewTip.priority}
                </span>
                <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  👶 {previewTip.targetAgeGroup}
                </span>
                <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                  👁️ {previewTip.views} vues
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{previewTip.description}</p>
              </div>

              {/* Date */}
              <div className="text-sm text-gray-500 border-t pt-4">
                Créé le {new Date(previewTip.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce conseil de santé ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteHealthTip(deleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
