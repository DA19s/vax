"use client";

import { Users, Phone, Mail, MapPin, Baby } from "lucide-react";

interface ParentCardProps {
  parent: {
    parentPhone: string;
    parentName: string;
    parentEmail?: string;
    childrenCount: number;
    regions?: string[];
    healthCenters?: string[];
  };
  onClick?: () => void;
}

export default function ParentCard({ parent, onClick }: ParentCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
    >
      {/* Header avec icône */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {parent.parentName || "Parent"}
            </h3>
            <p className="text-sm text-gray-500">Parent</p>
          </div>
        </div>
        
        {/* Badge nombre d'enfants */}
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
          <Baby className="h-4 w-4" />
          <span className="font-semibold">{parent.childrenCount}</span>
          <span className="text-sm">
            {parent.childrenCount > 1 ? "enfants" : "enfant"}
          </span>
        </div>
      </div>

      {/* Informations de contact */}
      <div className="space-y-2">
        {/* Téléphone */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{parent.parentPhone}</span>
        </div>

        {/* Email */}
        {parent.parentEmail && parent.parentEmail !== "N/A" && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span>{parent.parentEmail}</span>
          </div>
        )}

        {/* Régions */}
        {parent.regions && parent.regions.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{parent.regions.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
          Voir les enfants
          <span className="text-lg">→</span>
        </button>
      </div>
    </div>
  );
}
