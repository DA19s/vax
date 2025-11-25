"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Shield, 
  Calendar,
  Edit3,
  Save
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/app/lib/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchUserProfile();
    }
  }, [isOpen, user]);

  // ✅ Mettre à jour le formulaire quand les données utilisateur arrivent
  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        setUserProfile(userData);
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log("🔄 Mise à jour du profil:", form);
      
      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      console.log("📡 Réponse serveur:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Erreur serveur:", errorData);
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      const updatedUser = await response.json();
      console.log("✅ Profil mis à jour:", updatedUser);
      setUserProfile(updatedUser.user || updatedUser);
      setEditing(false);
    } catch (error: any) {
      console.error("❌ Erreur mise à jour:", error);
      alert(`Erreur: ${error.message}`); // Affichage temporaire pour debug
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "national": return "Administrateur National";
      case "regional": return "Responsable Régional";
      case "agent": return "Agent de Santé";
      default: return "Utilisateur";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "national": return "bg-purple-100 text-purple-800";
      case "regional": return "bg-blue-100 text-blue-800";
      case "agent": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
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
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Mon Profil</h2>
              <p className="text-blue-100">Informations personnelles</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Role Badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userProfile?.role)}`}>
                  <Shield className="h-4 w-4 mr-2" />
                  {getRoleLabel(userProfile?.role)}
                </span>
                
                <button
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {editing ? (
                    <>
                      <Save className="h-4 w-4" />
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      Modifier
                    </>
                  )}
                </button>
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 mr-2" />
                      Prénom
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Votre prénom"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {userProfile?.firstName || "Non renseigné"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 mr-2" />
                      Nom
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Votre nom"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {userProfile?.lastName || "Non renseigné"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {userProfile?.email || "Non renseigné"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 mr-2" />
                      Téléphone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+221 XX XXX XX XX"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {userProfile?.phone || "Non renseigné"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                {userProfile?.region && (
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      Région
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {userProfile.region}
                    </div>
                  </div>
                )}

                {userProfile?.healthCenter && (
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="h-4 w-4 mr-2" />
                      Centre de santé
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {userProfile.healthCenter}
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    Membre depuis
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('fr-FR') : "Non disponible"}
                  </div>
                </div>
              </div>

              {/* Cancel button when editing */}
              {editing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        firstName: userProfile?.firstName || "",
                        lastName: userProfile?.lastName || "",
                        email: userProfile?.email || "",
                        phone: userProfile?.phone || "",
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
