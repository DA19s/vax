"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, Save, Trash2, Check } from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api";

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
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  existingData?: VaccinationDaysData | null;
}

const daysOfWeek = [
  { key: 'monday', label: 'Lundi', color: 'bg-blue-100 text-blue-800' },
  { key: 'tuesday', label: 'Mardi', color: 'bg-green-100 text-green-800' },
  { key: 'wednesday', label: 'Mercredi', color: 'bg-purple-100 text-purple-800' },
  { key: 'thursday', label: 'Jeudi', color: 'bg-orange-100 text-orange-800' },
  { key: 'friday', label: 'Vendredi', color: 'bg-red-100 text-red-800' },
  { key: 'saturday', label: 'Samedi', color: 'bg-indigo-100 text-indigo-800' },
  { key: 'sunday', label: 'Dimanche', color: 'bg-pink-100 text-pink-800' }
];

export default function VaccinationDaysModal({ isOpen, onClose, onSave, existingData }: Props) {
  const [vaccinationDays, setVaccinationDays] = useState<VaccinationDays>({
    monday: false,
    tuesday: false,
    wednesday: true, // Par défaut mercredi
    thursday: false,
    friday: true,    // Par défaut vendredi
    saturday: false,
    sunday: false
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlots>({
    morning: {
      enabled: true,
      startTime: '08:00',
      endTime: '12:00'
    },
    afternoon: {
      enabled: true,
      startTime: '14:00',
      endTime: '17:00'
    }
  });

  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'view'>('create');

  // Charger les données existantes
  useEffect(() => {
    if (existingData) {
      setVaccinationDays(existingData.vaccinationDays);
      setTimeSlots(existingData.timeSlots);
      setNotes(existingData.notes || '');
      setIsActive(existingData.isActive);
      setMode('view'); // Mode lecture par défaut
    } else {
      // Réinitialiser pour un nouveau planning
      setVaccinationDays({
        monday: false,
        tuesday: false,
        wednesday: true,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false
      });
      setTimeSlots({
        morning: {
          enabled: true,
          startTime: '08:00',
          endTime: '12:00'
        },
        afternoon: {
          enabled: true,
          startTime: '14:00',
          endTime: '17:00'
        }
      });
      setNotes('');
      setIsActive(true);
      setMode('create');
    }
  }, [existingData, isOpen]);

  const handleDayToggle = (day: keyof VaccinationDays) => {
    if (mode === 'view') return;
    setVaccinationDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const handleTimeSlotChange = (
    slot: 'morning' | 'afternoon',
    field: 'enabled' | 'startTime' | 'endTime',
    value: boolean | string
  ) => {
    if (mode === 'view') return;
    setTimeSlots(prev => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Vérifier qu'au moins un jour est sélectionné
      const selectedDays = Object.values(vaccinationDays).filter(Boolean);
      if (selectedDays.length === 0) {
        alert('Veuillez sélectionner au moins un jour de vaccination');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/vaccination-days`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          vaccinationDays,
          timeSlots,
          notes,
          isActive
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Planning vaccination sauvegardé:', result);
        alert('Planning de vaccination enregistré avec succès !');
        onSave(); // Rafraîchir les données parent
        onClose();
      } else {
        const error = await response.json();
        console.error('❌ Erreur sauvegarde:', error);
        alert(error.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingData) return;
    
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer votre planning de vaccination ?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      
      const response = await fetch(`${API_BASE_URL}/api/vaccination-days`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Planning de vaccination supprimé avec succès');
        onSave(); // Rafraîchir les données parent
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur de connexion');
    } finally {
      setDeleting(false);
    }
  };

  const getSelectedDaysCount = () => {
    return Object.values(vaccinationDays).filter(Boolean).length;
  };

  const getSelectedDaysNames = () => {
    return daysOfWeek
      .filter(day => vaccinationDays[day.key as keyof VaccinationDays])
      .map(day => day.label)
      .join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="sticky top-0 bg-[#0A1A33] text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === 'create' ? 'Configurer mes jours de vaccination' : 'Mon planning de vaccination'}
                </h2>
                <p className="text-gray-200 text-sm">
                  {mode === 'create' 
                    ? 'Définissez vos jours et horaires de vaccination'
                    : `${getSelectedDaysCount()} jour(s) configuré(s) : ${getSelectedDaysNames()}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {existingData && mode === 'view' && (
                <button
                  onClick={() => setMode('edit')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                >
                  Modifier
                </button>
              )}
              {mode === 'edit' && (
                <button
                  onClick={() => setMode('view')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                >
                  Annuler
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-8">
          {/* Sélection des jours */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Jours de vaccination
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {daysOfWeek.map((day) => (
                <button
                  key={day.key}
                  onClick={() => handleDayToggle(day.key as keyof VaccinationDays)}
                  disabled={mode === 'view'}
                  className={`p-4 rounded-xl text-center font-medium transition-all transform hover:scale-105 ${
                    vaccinationDays[day.key as keyof VaccinationDays]
                      ? `${day.color} ring-2 ring-blue-500 shadow-md`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${mode === 'view' ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="text-sm mb-1">{day.label}</div>
                  {vaccinationDays[day.key as keyof VaccinationDays] && (
                    <Check className="h-4 w-4 mx-auto" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-3">
              {getSelectedDaysCount() === 0 
                ? 'Sélectionnez au moins un jour de vaccination'
                : `${getSelectedDaysCount()} jour(s) sélectionné(s)`
              }
            </p>
          </div>

          {/* Horaires */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Horaires de vaccination
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matin */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">🌅 Matin</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={timeSlots.morning.enabled}
                      onChange={(e) => handleTimeSlotChange('morning', 'enabled', e.target.checked)}
                      disabled={mode === 'view'}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Activé</span>
                  </label>
                </div>
                {timeSlots.morning.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                      <input
                        type="time"
                        value={timeSlots.morning.startTime}
                        onChange={(e) => handleTimeSlotChange('morning', 'startTime', e.target.value)}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                      <input
                        type="time"
                        value={timeSlots.morning.endTime}
                        onChange={(e) => handleTimeSlotChange('morning', 'endTime', e.target.value)}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Après-midi */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">🌇 Après-midi</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={timeSlots.afternoon.enabled}
                      onChange={(e) => handleTimeSlotChange('afternoon', 'enabled', e.target.checked)}
                      disabled={mode === 'view'}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Activé</span>
                  </label>
                </div>
                {timeSlots.afternoon.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                      <input
                        type="time"
                        value={timeSlots.afternoon.startTime}
                        onChange={(e) => handleTimeSlotChange('afternoon', 'startTime', e.target.value)}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                      <input
                        type="time"
                        value={timeSlots.afternoon.endTime}
                        onChange={(e) => handleTimeSlotChange('afternoon', 'endTime', e.target.value)}
                        disabled={mode === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Notes (optionnel)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={mode === 'view'}
              placeholder="Ex: Apporter votre carnet de vaccination, prévoir du temps d'attente..."
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">{notes.length}/500 caractères</p>
          </div>

          {/* Statut actif */}
          {(mode === 'edit' || mode === 'create') && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="font-medium text-gray-900">
                Planning actif
              </label>
              <p className="text-sm text-gray-600">
                Les parents pourront voir vos jours de vaccination
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {existingData && mode === 'view' && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Suppression...' : 'Supprimer le planning'}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                {mode === 'view' ? 'Fermer' : 'Annuler'}
              </button>
              {(mode === 'create' || mode === 'edit') && (
                <button
                  onClick={handleSave}
                  disabled={loading || getSelectedDaysCount() === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
