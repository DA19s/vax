"use client";

import DashboardLayout from "@/app/components/DashboardLayout";
import { apiFetch } from "@/app/lib/api";
import {
  Eye,
  Megaphone,
  Calendar,
  MapPin,
  X,
  Video,
  FileText,
  AlertCircle,
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

export default function RegionalCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<any>("/api/campaigns");
      const list = Array.isArray(data?.campaigns) ? data.campaigns : [];
      setCampaigns(list);
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const isActive = (campaign: Campaign) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    return now >= start && now <= end;
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-blue-600" />
                Campagnes de Vaccination
              </h1>
              <p className="text-gray-600">
                Consultez les campagnes actives et à venir dans votre région
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des campagnes...</p>
            </div>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex-1">
                      {campaign.title}
                    </h3>
                    {isActive(campaign) && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        En cours
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {campaign.description || "Aucune description"}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{campaign.region || "Toutes régions"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {new Date(campaign.startDate).toLocaleDateString("fr-FR")} -{" "}
                        {new Date(campaign.endDate).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>

                  {campaign.medias && campaign.medias.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      {campaign.medias.map((media, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewMedia(media)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          title={`Voir ${media.type === "video" ? "vidéo" : "PDF"}`}
                        >
                          {media.type === "video" ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Voir les détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Megaphone className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-medium mb-1">Aucune campagne disponible</p>
                <p className="text-sm text-gray-500">
                  Les campagnes de vaccination apparaîtront ici une fois créées
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Détails */}
        {selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Megaphone className="h-6 w-6 text-blue-600" />
                  {selectedCampaign.title}
                </h2>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedCampaign.description || "Aucune description"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Date de début
                    </h3>
                    <p className="text-gray-600">
                      {new Date(selectedCampaign.startDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Date de fin
                    </h3>
                    <p className="text-gray-600">
                      {new Date(selectedCampaign.endDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Région
                  </h3>
                  <p className="text-gray-600">{selectedCampaign.region || "Toutes régions"}</p>
                </div>

                {selectedCampaign.medias && selectedCampaign.medias.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Médias</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedCampaign.medias.map((media, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewMedia(media)}
                          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center gap-3"
                        >
                          {media.type === "video" ? (
                            <Video className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-red-600" />
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            {media.type === "video" ? "Vidéo" : "PDF"} {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Aperçu Média */}
        {previewMedia && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {previewMedia.type === "video" ? "Vidéo" : "Document PDF"}
                </h2>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                {previewMedia.type === "video" ? (
                  <video controls className="w-full rounded-lg">
                    <source src={previewMedia.url} type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                ) : (
                  <iframe
                    src={previewMedia.url}
                    className="w-full h-[600px] rounded-lg border border-gray-200"
                    title="PDF Preview"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
