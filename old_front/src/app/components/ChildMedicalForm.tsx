"use client";

import { useState } from "react";
import { 
  Save, 
  X, 
  Weight, 
  Ruler, 
  Droplet, 
  AlertTriangle, 
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api";

interface MedicalFormProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  currentData?: {
    weight?: number;
    height?: number;
    bloodType?: string;
    allergies?: string[];
    medicalNotes?: string;
  };
  onUpdate: () => void;
}

export default function ChildMedicalForm({ 
  isOpen, 
  onClose, 
  childId, 
  currentData = {},
  onUpdate 
}: MedicalFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    weight: currentData.weight || "",
    height: currentData.height || "",
    bloodType: currentData.bloodType || "",
    allergies: currentData.allergies || [],
    medicalNotes: currentData.medicalNotes || "",
  });

  const [newAllergy, setNewAllergy] = useState("");

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Inconnu"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const medicalData = {
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        bloodType: form.bloodType || undefined,
        allergies: form.allergies.length > 0 ? form.allergies : ["Aucune allergie connue"],
        medicalNotes: form.medicalNotes || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/medical`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(medicalData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }

      console.log("✅ Informations médicales mises à jour:", result);
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("❌ Erreur mise à jour médicale:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !form.allergies.includes(newAllergy.trim())) {
      setForm({
        ...form,
        allergies: [...form.allergies, newAllergy.trim()]
      });
      setNewAllergy("");
    }
  };

  const removeAllergy = (index: number) => {
    setForm({
      ...form,
      allergies: form.allergies.filter((_, i) => i !== index)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Informations Médicales</h2>
              <p className="text-green-100">Mettre à jour le dossier médical</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mesures physiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Weight className="h-4 w-4 mr-2 text-green-600" />
                Poids (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="200"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 6.5"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Ruler className="h-4 w-4 mr-2 text-blue-600" />
                Taille (cm)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 65"
              />
            </div>
          </div>

          {/* Groupe sanguin */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Droplet className="h-4 w-4 mr-2 text-red-600" />
              Groupe sanguin
            </label>
            <select
              value={form.bloodType}
              onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Sélectionner un groupe sanguin</option>
              {bloodTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Allergies */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Allergies
            </label>
            
            {/* Liste des allergies */}
            <div className="space-y-2 mb-3">
              {form.allergies.map((allergy, index) => (
                <div key={index} className="flex items-center justify-between bg-orange-50 p-3 rounded-lg">
                  <span className="text-sm">{allergy}</span>
                  <button
                    type="button"
                    onClick={() => removeAllergy(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {form.allergies.length === 0 && (
                <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
                  Aucune allergie renseignée
                </div>
              )}
            </div>

            {/* Ajouter une allergie */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ajouter une allergie..."
              />
              <button
                type="button"
                onClick={addAllergy}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>
          </div>

          {/* Notes médicales */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 mr-2 text-gray-600" />
              Notes médicales
            </label>
            <textarea
              value={form.medicalNotes}
              onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
              placeholder="Notes, observations, antécédents médicaux..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
