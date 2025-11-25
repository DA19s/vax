"use client";

import { useState } from "react";
import { 
  Save, 
  X, 
  Shield, 
  Calendar, 
  MapPin, 
  User, 
  FileText,
  Syringe,
  Clock
} from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api";

interface VaccinationFormProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  onUpdate: () => void;
}

export default function VaccinationForm({ 
  isOpen, 
  onClose, 
  childId, 
  onUpdate 
}: VaccinationFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vaccineName: "",
    date: "",
    status: "done" as "done" | "scheduled" | "overdue" | "planned",
    nextDue: "",
    batchNumber: "",
    notes: "",
  });

  const vaccines = [
    "BCG",
    "DTC-HepB-Hib (1ère dose)",
    "DTC-HepB-Hib (2ème dose)", 
    "DTC-HepB-Hib (3ème dose)",
    "Polio (1ère dose)",
    "Polio (2ème dose)",
    "Polio (3ème dose)",
    "Pneumocoque (1ère dose)",
    "Pneumocoque (2ème dose)",
    "Pneumocoque (3ème dose)",
    "Rotavirus (1ère dose)",
    "Rotavirus (2ème dose)",
    "Rougeole (1ère dose)",
    "Rougeole (2ème dose)",
    "Fièvre Jaune",
    "Méningite A+C",
    "Autre"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.vaccineName || !form.date) {
      alert("Veuillez remplir au moins le nom du vaccin et la date");
      return;
    }
    
    try {
      setSaving(true);
      
      const vaccinationData = {
        vaccineName: form.vaccineName,
        date: new Date(form.date).toISOString(),
        status: form.status,
        nextDue: form.nextDue ? new Date(form.nextDue).toISOString() : undefined,
        batchNumber: form.batchNumber || undefined,
        notes: form.notes || undefined,
      };

      console.log("📤 Envoi vaccination:", vaccinationData);

      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/vaccinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(vaccinationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de l\'ajout de la vaccination');
      }

      console.log("✅ Vaccination ajoutée:", result);
      
      // Réinitialiser le formulaire
      setForm({
        vaccineName: "",
        date: "",
        status: "done",
        nextDue: "",
        batchNumber: "",
        notes: "",
      });
      
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("❌ Erreur ajout vaccination:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "text-green-600 bg-green-50";
      case "scheduled": return "text-blue-600 bg-blue-50";
      case "overdue": return "text-red-600 bg-red-50";
      case "planned": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done": return "Fait";
      case "scheduled": return "Programmé";
      case "overdue": return "En retard";
      case "planned": return "À planifier";
      default: return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ajouter une Vaccination</h2>
              <p className="text-blue-100">Enregistrer un nouveau vaccin</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vaccin */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Syringe className="h-4 w-4 mr-2 text-blue-600" />
              Nom du vaccin *
            </label>
            <select
              value={form.vaccineName}
              onChange={(e) => setForm({ ...form, vaccineName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un vaccin</option>
              {vaccines.map((vaccine) => (
                <option key={vaccine} value={vaccine}>{vaccine}</option>
              ))}
            </select>
            {form.vaccineName === "Autre" && (
              <input
                type="text"
                placeholder="Préciser le nom du vaccin"
                className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setForm({ ...form, vaccineName: e.target.value })}
              />
            )}
          </div>

          {/* Date et Statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-2 text-green-600" />
                Date de vaccination *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Shield className="h-4 w-4 mr-2 text-purple-600" />
                Statut
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="done">Fait</option>
                <option value="scheduled">Programmé</option>
                <option value="overdue">En retard</option>
                <option value="planned">À planifier</option>
              </select>
            </div>
          </div>

          {/* Prochaine dose (si programmé) */}
          {(form.status === "scheduled" || form.status === "planned") && (
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 mr-2 text-orange-600" />
                Prochaine dose prévue
              </label>
              <input
                type="date"
                value={form.nextDue}
                onChange={(e) => setForm({ ...form, nextDue: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* Numéro de lot */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 mr-2 text-gray-600" />
              Numéro de lot
            </label>
            <input
              type="text"
              value={form.batchNumber}
              onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Ex: LOT2024001"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 mr-2 text-gray-600" />
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
              placeholder="Observations, réactions, commentaires..."
            />
          </div>

          {/* Aperçu du statut */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu:</h4>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}>
                {getStatusLabel(form.status)}
              </span>
              <span className="text-sm text-gray-600">
                {form.vaccineName || "Vaccin non sélectionné"} 
                {form.date && ` - ${new Date(form.date).toLocaleDateString('fr-FR')}`}
              </span>
            </div>
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
              disabled={saving || !form.vaccineName || !form.date}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
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
