"use client";

import { X, Calendar, MapPin, Activity, Syringe, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface ChildInfoCardProps {
  child: any;
  onClose: () => void;
}

export default function ChildInfoCard({ child, onClose }: ChildInfoCardProps) {
  // Calculer l'âge
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      "À jour": { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
      "En retard": { bg: "bg-red-100", text: "text-red-700", icon: AlertCircle },
      "À faire": { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
      "Non programmé": { bg: "bg-gray-100", text: "text-gray-700", icon: Clock },
    };

    const config = statusConfig[status] || statusConfig["Non programmé"];
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 ${config.bg} ${config.text} px-3 py-1.5 rounded-full`}>
        <Icon className="h-4 w-4" />
        <span className="font-medium text-sm">{status}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
              {child.firstName?.[0]}{child.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {child.firstName} {child.lastName}
              </h2>
              <p className="text-blue-100">
                {calculateAge(child.birthDate)} ans • {child.gender === "M" ? "Garçon" : "Fille"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Statut vaccinal */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Statut vaccinal</h3>
            {getStatusBadge(child.status)}
          </div>

          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date de naissance */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Date de naissance</span>
              </div>
              <p className="text-gray-900 font-semibold">
                {new Date(child.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Région */}
            {child.region && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Région</span>
                </div>
                <p className="text-gray-900 font-semibold">{child.region}</p>
              </div>
            )}

            {/* Centre de santé */}
            {child.healthCenter && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">Centre de santé</span>
                </div>
                <p className="text-gray-900 font-semibold">{child.healthCenter}</p>
              </div>
            )}

            {/* Prochain rendez-vous */}
            {child.nextAppointment && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Prochain rendez-vous</span>
                </div>
                <p className="text-blue-900 font-semibold">
                  {new Date(child.nextAppointment).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Vaccinations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Syringe className="h-5 w-5 text-blue-600" />
              Vaccinations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vaccins complétés */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">Complétés</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {child.vaccinesDone?.length || 0}
                </p>
              </div>

              {/* Vaccins à faire */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-700">À faire</span>
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-900">
                  {child.vaccinesDue?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Informations parent */}
          {child.parentInfo && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Informations parent</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Nom</span>
                  <span className="text-sm font-medium text-blue-900">
                    {child.parentInfo.parentName || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Téléphone</span>
                  <span className="text-sm font-medium text-blue-900">
                    {child.parentInfo.parentPhone || "N/A"}
                  </span>
                </div>
                {child.parentInfo.parentEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Email</span>
                    <span className="text-sm font-medium text-blue-900">
                      {child.parentInfo.parentEmail}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
