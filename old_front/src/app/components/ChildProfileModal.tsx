"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Baby,
  Heart,
  Stethoscope,
  FileText,
  Award,
  TrendingUp,
  Target
} from "lucide-react";
import { API_BASE_URL } from "@/app/lib/api";

interface ChildProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
}

interface VaccinationRecord {
  id: string;
  vaccineName: string;
  date: string;
  status: "done" | "scheduled" | "overdue" | "planned";
  nextDue?: string;
  ageAtVaccination?: string;
  healthCenter?: string;
  agent?: string;
  notes?: string;
}

interface ChildProfile {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "M" | "F";
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  healthCenter: string;
  agent: string;
  registrationDate: string;
  lastVisit?: string;
  nextAppointment?: string;
  vaccinations: VaccinationRecord[];
  medicalNotes?: string;
  allergies?: string[];
  weight?: number;
  height?: number;
  bloodType?: string;
}

export default function ChildProfileModal({ isOpen, onClose, childId }: ChildProfileModalProps) {
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "vaccinations" | "medical">("profile");

  useEffect(() => {
    if (isOpen && childId) {
      fetchChildProfile();
    }
  }, [isOpen, childId]);

  const fetchChildProfile = async () => {
    try {
      setLoading(true);
      console.log("🔄 Chargement profil enfant:", childId);
      
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/profile`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Profil enfant reçu:", result);
        
        if (result.success && result.data) {
          const data = result.data;
          
          // Mapper les données du backend vers le format attendu par le frontend
          const mappedChild: ChildProfile = {
            id: data._id || data.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            birthDate: data.birthDate,
            gender: data.gender,
            parentName: data.parentInfo?.parentName || data.parentName || "",
            parentPhone: data.parentInfo?.parentPhone || data.parentPhone || "",
            parentEmail: data.parentInfo?.parentEmail || "",
            address: data.address || "",
            healthCenter: data.healthCenter || "",
            agent: data.createdBy?.firstName && data.createdBy?.lastName 
              ? `${data.createdBy.firstName} ${data.createdBy.lastName}` 
              : data.createdBy?.email || "Agent non défini",
            registrationDate: data.registrationDate || data.createdAt,
            lastVisit: data.medicalInfo?.lastVisit,
            nextAppointment: data.nextAppointment,
            vaccinations: data.vaccinationRecords || [],
            medicalNotes: data.medicalInfo?.medicalNotes,
            allergies: data.medicalInfo?.allergies || ["Aucune allergie connue"],
            weight: data.medicalInfo?.weight,
            height: data.medicalInfo?.height,
            bloodType: data.medicalInfo?.bloodType || "Inconnu",
          };
          
          setChild(mappedChild);
        } else {
          console.error("Format de réponse inattendu:", result);
          throw new Error("Format de données invalide");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Erreur API:", response.status, errorData);
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
    } catch (error: any) {
      console.error("❌ Erreur chargement profil enfant:", error);
      // En cas d'erreur, on peut afficher un message ou des données par défaut
      setChild(null);
    } finally {
      setLoading(false);
    }
  };

  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} mois`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years} an${years > 1 ? 's' : ''} ${months} mois` : `${years} an${years > 1 ? 's' : ''}`;
    }
  };

  const getVaccinationProgress = () => {
    if (!child?.vaccinations) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = child.vaccinations.filter(v => v.status === "done").length;
    const total = child.vaccinations.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done": return <CheckCircle className="h-4 w-4" />;
      case "scheduled": return <Clock className="h-4 w-4" />;
      case "overdue": return <AlertTriangle className="h-4 w-4" />;
      case "planned": return <Calendar className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const progress = getVaccinationProgress();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          {loading ? (
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white/20 rounded-full animate-pulse"></div>
              <div>
                <div className="h-6 bg-white/20 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Baby className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">{child?.firstName} {child?.lastName}</h2>
                <p className="text-blue-100 text-lg">
                  {child?.gender === "M" ? "Garçon" : "Fille"} • {child?.birthDate ? getAge(child.birthDate) : "Âge inconnu"}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Progression: {progress.percentage}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">{progress.completed}/{progress.total} vaccins</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!loading && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progression vaccinale</span>
              <span className="text-sm text-gray-600">{progress.completed}/{progress.total} vaccins</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {[
            { id: "profile", label: "Profil", icon: User },
            { id: "vaccinations", label: "Vaccinations", icon: Shield },
            { id: "medical", label: "Médical", icon: Stethoscope },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement du profil...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Informations personnelles
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Date de naissance:</span>
                          <span className="font-medium">{child?.birthDate ? new Date(child.birthDate).toLocaleDateString('fr-FR') : "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Baby className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Genre:</span>
                          <span className="font-medium">{child?.gender === "M" ? "Masculin" : "Féminin"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Adresse:</span>
                          <span className="font-medium">{child?.address || "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Inscrit le:</span>
                          <span className="font-medium">{child?.registrationDate ? new Date(child.registrationDate).toLocaleDateString('fr-FR') : "Non renseigné"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        Informations médicales
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Activity className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Poids:</span>
                          <span className="font-medium">{child?.weight ? `${child.weight} kg` : "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Taille:</span>
                          <span className="font-medium">{child?.height ? `${child.height} cm` : "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Shield className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Groupe sanguin:</span>
                          <span className="font-medium">{child?.bloodType || "Non renseigné"}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-4 w-4 text-gray-500 mt-0.5" />
                          <span className="text-sm text-gray-600">Allergies:</span>
                          <div className="font-medium">
                            {child?.allergies && child.allergies.length > 0 ? (
                              <ul className="list-disc list-inside">
                                {child.allergies.map((allergy, index) => (
                                  <li key={index}>{allergy}</li>
                                ))}
                              </ul>
                            ) : "Aucune allergie connue"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Phone className="h-5 w-5 text-green-600" />
                        Contact parents
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Nom du parent:</span>
                          <span className="font-medium">{child?.parentName || "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Téléphone:</span>
                          <span className="font-medium">{child?.parentPhone || "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="font-medium">{child?.parentEmail || "Non renseigné"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-purple-600" />
                        Suivi médical
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Centre de santé:</span>
                          <span className="font-medium">{child?.healthCenter || "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Agent responsable:</span>
                          <span className="font-medium">{child?.agent || "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Dernière visite:</span>
                          <span className="font-medium">{child?.lastVisit ? new Date(child.lastVisit).toLocaleDateString('fr-FR') : "Aucune visite"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Prochain RDV:</span>
                          <span className="font-medium">{child?.nextAppointment ? new Date(child.nextAppointment).toLocaleDateString('fr-FR') : "Aucun RDV programmé"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vaccinations Tab */}
              {activeTab === "vaccinations" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Calendrier vaccinal
                      </h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{progress.percentage}%</div>
                        <div className="text-sm text-gray-600">Complété</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{progress.completed}</div>
                        <div className="text-sm text-gray-600">Vaccins reçus</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{child?.vaccinations?.filter(v => v.status === "scheduled").length || 0}</div>
                        <div className="text-sm text-gray-600">Programmés</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{child?.vaccinations?.filter(v => v.status === "planned").length || 0}</div>
                        <div className="text-sm text-gray-600">À planifier</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {child?.vaccinations?.map((vaccination, index) => (
                      <div key={vaccination.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${getStatusColor(vaccination.status)}`}>
                              {getStatusIcon(vaccination.status)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{vaccination.vaccineName}</h4>
                              <p className="text-sm text-gray-600 mt-1">{vaccination.ageAtVaccination}</p>
                              {vaccination.status === "done" && (
                                <p className="text-sm text-green-600 mt-1">
                                  Administré le {new Date(vaccination.date).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                              {vaccination.status === "scheduled" && vaccination.nextDue && (
                                <p className="text-sm text-blue-600 mt-1">
                                  Programmé le {new Date(vaccination.nextDue).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                              {vaccination.healthCenter && (
                                <p className="text-xs text-gray-500 mt-1">📍 {vaccination.healthCenter}</p>
                              )}
                              {vaccination.agent && (
                                <p className="text-xs text-gray-500">👨‍⚕️ {vaccination.agent}</p>
                              )}
                              {vaccination.notes && (
                                <p className="text-xs text-gray-600 mt-2 italic">💬 {vaccination.notes}</p>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vaccination.status)}`}>
                            {vaccination.status === "done" ? "Fait" : 
                             vaccination.status === "scheduled" ? "Programmé" :
                             vaccination.status === "overdue" ? "En retard" : "À planifier"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical Tab */}
              {activeTab === "medical" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Dossier médical
                    </h3>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-gray-600">
                        {child?.medicalNotes || "Aucune note médicale disponible pour le moment."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Croissance
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Poids actuel:</span>
                          <span className="font-medium">{child?.weight ? `${child.weight} kg` : "Non renseigné"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taille actuelle:</span>
                          <span className="font-medium">{child?.height ? `${child.height} cm` : "Non renseigné"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">IMC:</span>
                          <span className="font-medium">
                            {child?.weight && child?.height ? 
                              ((child.weight / ((child.height/100) ** 2)).toFixed(1)) : "Non calculable"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        Allergies & Précautions
                      </h4>
                      <div className="space-y-2">
                        {child?.allergies && child.allergies.length > 0 ? (
                          child.allergies.map((allergy, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">{allergy}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Aucune allergie connue</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
