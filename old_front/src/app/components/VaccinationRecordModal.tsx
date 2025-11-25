"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Syringe, CheckCircle, Clock, AlertTriangle, User, Baby, Shield, Activity, TrendingUp } from "lucide-react";

interface Vaccination {
  id: string;
  vaccineName: string;
  scheduledDate: string;
  doneDate?: string;
  status: 'done' | 'scheduled' | 'missed' | 'cancelled';
  ageAtVaccination?: string;
  notes?: string;
}

interface Child {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  parentName?: string;
}

interface VaccinationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child;
}

// Calendrier vaccinal de référence (âges recommandés)
const VACCINATION_SCHEDULE = [
  { name: "BCG", recommendedAge: "À la naissance", category: "Naissance" },
  { name: "Hépatite B", recommendedAge: "À la naissance", category: "Naissance" },
  { name: "DTC-HepB-Hib (1ère dose)", recommendedAge: "2 mois", category: "Nourrisson" },
  { name: "Polio (1ère dose)", recommendedAge: "2 mois", category: "Nourrisson" },
  { name: "Pneumocoque (1ère dose)", recommendedAge: "2 mois", category: "Nourrisson" },
  { name: "DTC-HepB-Hib (2ème dose)", recommendedAge: "4 mois", category: "Nourrisson" },
  { name: "Polio (2ème dose)", recommendedAge: "4 mois", category: "Nourrisson" },
  { name: "Pneumocoque (2ème dose)", recommendedAge: "4 mois", category: "Nourrisson" },
  { name: "DTC-HepB-Hib (3ème dose)", recommendedAge: "6 mois", category: "Nourrisson" },
  { name: "Polio (3ème dose)", recommendedAge: "6 mois", category: "Nourrisson" },
  { name: "Pneumocoque (3ème dose)", recommendedAge: "6 mois", category: "Nourrisson" },
  { name: "Rougeole-Rubéole-Oreillons (1ère dose)", recommendedAge: "9 mois", category: "Enfant" },
  { name: "Fièvre Jaune", recommendedAge: "9 mois", category: "Enfant" },
  { name: "Méningite A+C", recommendedAge: "12 mois", category: "Enfant" },
  { name: "Rougeole-Rubéole-Oreillons (2ème dose)", recommendedAge: "15 mois", category: "Enfant" },
  { name: "DTC (Rappel)", recommendedAge: "18 mois", category: "Enfant" },
];

export default function VaccinationRecordModal({ isOpen, onClose, child }: VaccinationRecordModalProps) {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'schedule'>('timeline');

  // Calculer l'âge de l'enfant
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} mois`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years} an${years > 1 ? 's' : ''} et ${months} mois` : `${years} an${years > 1 ? 's' : ''}`;
    }
  };

  // Charger les vraies données de vaccination depuis le backend
  useEffect(() => {
    if (isOpen && child.id) {
      fetchVaccinationRecord();
    }
  }, [isOpen, child.id]);

  const fetchVaccinationRecord = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vaccinations/record/${child.id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVaccinations(data.vaccinations || []);
        } else {
          console.error('Erreur lors du chargement du carnet:', data.message);
          // En cas d'erreur, utiliser des données par défaut
          setVaccinations([]);
        }
      } else {
        console.error('Erreur HTTP:', response.status);
        setVaccinations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du carnet:', error);
      setVaccinations([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const stats = {
    total: vaccinations.length,
    completed: vaccinations.filter(v => v.status === 'done').length,
    scheduled: vaccinations.filter(v => v.status === 'scheduled').length,
    missed: vaccinations.filter(v => v.status === 'missed').length
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Fonction pour obtenir l'icône et la couleur selon le statut
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'done':
        return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'scheduled':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'missed':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-100">
          
          {/* Header avec gradient */}
          <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 px-6 py-6 text-white">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Baby className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Carnet de vaccination</h3>
                  <p className="text-lg font-medium text-white/90 mt-1">{child.name}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-white/80">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {calculateAge(child.birthDate)}
                    </span>
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {child.gender === 'M' ? 'Garçon' : 'Fille'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white/90">Progression vaccinale</span>
                <span className="text-lg font-bold text-white">{completionRate}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-3 text-xs text-white/80">
                <span>{stats.completed} vaccins effectués</span>
                <span>{stats.scheduled} à venir</span>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-xl mb-2">
                  <Syringe className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-emerald-100 rounded-xl mb-2">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
                <div className="text-xs text-gray-500">Effectués</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-xl mb-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
                <div className="text-xs text-gray-500">Programmés</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-xl mb-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.missed}</div>
                <div className="text-xs text-gray-500">Ratés</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'timeline'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className="h-4 w-4 inline mr-2" />
                Historique
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'schedule'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className="h-4 w-4 inline mr-2" />
                Calendrier
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Chargement du carnet...</span>
              </div>
            ) : (
              <>
                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    {vaccinations.map((vaccination, index) => {
                      const config = getStatusConfig(vaccination.status);
                      const StatusIcon = config.icon;
                      
                      return (
                        <div key={vaccination.id} className={`relative flex items-start space-x-4 p-4 rounded-xl border-2 ${config.border} ${config.bg} transition-all hover:shadow-md`}>
                          {/* Timeline line */}
                          {index < vaccinations.length - 1 && (
                            <div className="absolute left-8 top-16 w-0.5 h-8 bg-gray-200"></div>
                          )}
                          
                          {/* Status icon */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.bg} border-2 ${config.border} flex items-center justify-center`}>
                            <StatusIcon className={`h-6 w-6 ${config.color}`} />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{vaccination.vaccineName}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {vaccination.ageAtVaccination && `Âge recommandé: ${vaccination.ageAtVaccination}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  vaccination.status === 'done' ? 'bg-emerald-100 text-emerald-800' :
                                  vaccination.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {vaccination.status === 'done' ? 'Effectué' :
                                   vaccination.status === 'scheduled' ? 'Programmé' : 'Raté'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>
                                  {vaccination.status === 'done' && vaccination.doneDate
                                    ? `Effectué le ${new Date(vaccination.doneDate).toLocaleDateString('fr-FR')}`
                                    : `Prévu le ${new Date(vaccination.scheduledDate).toLocaleDateString('fr-FR')}`
                                  }
                                </span>
                              </div>
                              
                              {vaccination.notes && (
                                <p className="text-sm text-gray-600 bg-white/50 rounded-lg p-2 border border-gray-200">
                                  {vaccination.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    {['Naissance', 'Nourrisson', 'Enfant'].map(category => (
                      <div key={category}>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                          {category}
                        </h4>
                        <div className="grid gap-3">
                          {VACCINATION_SCHEDULE
                            .filter(vaccine => vaccine.category === category)
                            .map((vaccine, index) => {
                              const isCompleted = vaccinations.some(v => 
                                v.vaccineName.includes(vaccine.name.split(' ')[0]) && v.status === 'done'
                              );
                              
                              return (
                                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                                  isCompleted 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      isCompleted ? 'bg-emerald-100' : 'bg-gray-100'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                      ) : (
                                        <Clock className="h-5 w-5 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{vaccine.name}</p>
                                      <p className="text-sm text-gray-600">{vaccine.recommendedAge}</p>
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isCompleted 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {isCompleted ? 'Fait' : 'À faire'}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Fermer
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Imprimer le carnet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
