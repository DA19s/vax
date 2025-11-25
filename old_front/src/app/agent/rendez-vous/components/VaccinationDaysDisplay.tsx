"use client";

import { Calendar, Clock, MapPin, User, Edit, Eye } from "lucide-react";

interface VaccinationDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

interface TimeSlots {
  morning: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  afternoon: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface VaccinationDaysData {
  _id?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  healthCenter?: string;
  region?: string;
  vaccinationDays: VaccinationDays;
  timeSlots: TimeSlots;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  data: VaccinationDaysData;
  onEdit: () => void;
}

const daysOfWeek = [
  { key: 'monday', label: 'Lun', fullLabel: 'Lundi', color: 'bg-blue-500', lightColor: 'bg-blue-100 text-blue-800' },
  { key: 'tuesday', label: 'Mar', fullLabel: 'Mardi', color: 'bg-green-500', lightColor: 'bg-green-100 text-green-800' },
  { key: 'wednesday', label: 'Mer', fullLabel: 'Mercredi', color: 'bg-purple-500', lightColor: 'bg-purple-100 text-purple-800' },
  { key: 'thursday', label: 'Jeu', fullLabel: 'Jeudi', color: 'bg-orange-500', lightColor: 'bg-orange-100 text-orange-800' },
  { key: 'friday', label: 'Ven', fullLabel: 'Vendredi', color: 'bg-red-500', lightColor: 'bg-red-100 text-red-800' },
  { key: 'saturday', label: 'Sam', fullLabel: 'Samedi', color: 'bg-indigo-500', lightColor: 'bg-indigo-100 text-indigo-800' },
  { key: 'sunday', label: 'Dim', fullLabel: 'Dimanche', color: 'bg-pink-500', lightColor: 'bg-pink-100 text-pink-800' }
];

export default function VaccinationDaysDisplay({ data, onEdit }: Props) {
  const getSelectedDays = () => {
    return daysOfWeek.filter(day => data.vaccinationDays[day.key as keyof VaccinationDays]);
  };

  const getTimeSlotDisplay = () => {
    const slots = [];
    if (data.timeSlots.morning.enabled) {
      slots.push(`🌅 ${data.timeSlots.morning.startTime} - ${data.timeSlots.morning.endTime}`);
    }
    if (data.timeSlots.afternoon.enabled) {
      slots.push(`🌇 ${data.timeSlots.afternoon.startTime} - ${data.timeSlots.afternoon.endTime}`);
    }
    return slots;
  };

  const selectedDays = getSelectedDays();
  const timeSlots = getTimeSlotDisplay();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* En-tête avec gradient */}
      <div className="bg-[#0A1A33] text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Mon Planning de Vaccination</h3>
              <p className="text-gray-200 flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                {data.healthCenter}
              </p>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors group"
            title="Modifier le planning"
          >
            <Edit className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {/* Jours de la semaine */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Jours de vaccination ({selectedDays.length}/7)
          </h4>
          
          {/* Version compacte pour les petits écrans */}
          <div className="grid grid-cols-7 gap-2 md:hidden mb-4">
            {daysOfWeek.map((day) => {
              const isSelected = data.vaccinationDays[day.key as keyof VaccinationDays];
              return (
                <div
                  key={day.key}
                  className={`p-3 rounded-lg text-center text-sm font-medium transition-all ${
                    isSelected 
                      ? `${day.color} text-white shadow-md transform scale-105`
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {day.label}
                </div>
              );
            })}
          </div>

          {/* Version étendue pour les grands écrans */}
          <div className="hidden md:grid grid-cols-7 gap-3 mb-4">
            {daysOfWeek.map((day) => {
              const isSelected = data.vaccinationDays[day.key as keyof VaccinationDays];
              return (
                <div
                  key={day.key}
                  className={`p-4 rounded-xl text-center font-medium transition-all ${
                    isSelected 
                      ? `${day.lightColor} ring-2 ring-blue-500 shadow-md transform scale-105`
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <div className="text-sm mb-1">{day.fullLabel}</div>
                  {isSelected && (
                    <div className={`h-2 w-2 ${day.color} rounded-full mx-auto`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Liste des jours sélectionnés */}
          <div className="flex flex-wrap gap-2">
            {selectedDays.map((day) => (
              <span
                key={day.key}
                className={`px-3 py-1 rounded-full text-sm font-medium ${day.lightColor}`}
              >
                {day.fullLabel}
              </span>
            ))}
          </div>
        </div>

        {/* Horaires */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Horaires de vaccination
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matin */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              data.timeSlots.morning.enabled 
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                : 'bg-gray-50 border-gray-200 opacity-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-900">🌅 Matin</h5>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  data.timeSlots.morning.enabled 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {data.timeSlots.morning.enabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
              {data.timeSlots.morning.enabled && (
                <p className="text-lg font-bold text-gray-800">
                  {data.timeSlots.morning.startTime} - {data.timeSlots.morning.endTime}
                </p>
              )}
            </div>

            {/* Après-midi */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              data.timeSlots.afternoon.enabled 
                ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
                : 'bg-gray-50 border-gray-200 opacity-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-900">🌇 Après-midi</h5>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  data.timeSlots.afternoon.enabled 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {data.timeSlots.afternoon.enabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
              {data.timeSlots.afternoon.enabled && (
                <p className="text-lg font-bold text-gray-800">
                  {data.timeSlots.afternoon.startTime} - {data.timeSlots.afternoon.endTime}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">📝 Notes</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed">{data.notes}</p>
            </div>
          </div>
        )}

        {/* Statut et informations */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${
                data.isActive ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="font-medium text-gray-900">
                Planning {data.isActive ? 'actif' : 'inactif'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {data.updatedAt && (
                <span>
                  Dernière modification : {new Date(data.updatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>
          
          {data.isActive && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>ℹ️ Information :</strong> Votre planning est visible par les parents lors de la prise de rendez-vous.
                Les créneaux disponibles s'afficheront automatiquement selon vos jours et horaires configurés.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
