import { X, Phone, MapPin, Calendar, User, Baby, Syringe, Clock, CheckCircle, AlertCircle, XCircle, HeartPulse, Stethoscope, Home, ShieldCheck } from "lucide-react";
import { ChildUI } from "@/app/agent/enfants/types";
import { useState } from "react";
import VaccinationRecordModal from "@/app/components/VaccinationRecordModal";

type Props = {
  child: ChildUI;
  onClose: () => void;
  BASE: string;
  onUpdate: (updatedChild: ChildUI) => void;
  healthCenterId?: string;
};

const statusConfig = {
  'À jour': { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  'En retard': { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  'Pas à jour': { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  default: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' }
};

export default function ChildDetailsModal({
  child,
  onClose,
  BASE,
  onUpdate,
  healthCenterId: propHealthCenterId,
}: Props) {
  const [showVaccinationRecord, setShowVaccinationRecord] = useState(false);
  // Fonction pour calculer l'âge à partir de la date de naissance
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const StatusIcon = statusConfig[child.status as keyof typeof statusConfig]?.icon || statusConfig.default.icon;
  const statusColor = statusConfig[child.status as keyof typeof statusConfig]?.color || statusConfig.default.color;
  const statusBg = statusConfig[child.status as keyof typeof statusConfig]?.bg || statusConfig.default.bg;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
          {/* En-tête avec dégradé */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <HeartPulse className="h-6 w-6 text-white" />
                <h3 className="text-xl font-semibold">
                  Dossier médical
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div className={`px-2 py-1 rounded-full ${statusBg} ${statusColor} text-xs font-medium flex items-center`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {child.status}
              </div>
              <span className="text-sm text-blue-100">
                Dernière mise à jour: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Carte d'identité */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <User className="h-4 w-4 mr-2 text-blue-500" />
                Identité de l'enfant
              </h4>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center border border-blue-50">
                    <Baby className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">
                    {child.name}
                  </h2>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="inline-block w-24 text-gray-500">Genre/Âge</span>
                      <span className="font-medium">
                        {child.gender === 'M' ? 'Garçon' : 'Fille'}, {calculateAge(child.birthDate)} ans
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Calendar className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                      <span className="inline-block w-24 text-gray-500">Naissance</span>
                      <span className="font-medium">
                        {new Date(child.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations des parents */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <Home className="h-4 w-4 mr-2 text-blue-500" />
                Responsable légal
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Parent</p>
                    <p className="font-medium text-gray-900 truncate">{child.parentName || 'Non renseigné'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900">{child.parentPhone || 'Non renseigné'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="text-sm font-medium text-gray-900">{child.address || 'Adresse non renseignée'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Santé */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <Stethoscope className="h-4 w-4 mr-2 text-blue-500" />
                Suivi médical
              </h4>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${statusBg} flex items-center justify-center mr-3`}>
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Statut vaccinal</h4>
                      <p className="text-sm text-gray-600">
                        {child.status === 'À jour' 
                          ? 'À jour des vaccins recommandés' 
                          : child.status === 'En retard' || child.status === 'Pas à jour'
                            ? 'Vaccins en retard ou manquants'
                            : 'Statut inconnu'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center mr-3">
                        <Clock className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Prochain RDV</h4>
                        <p className="text-sm text-gray-600">
                          {child.nextAppointment 
                            ? new Date(child.nextAppointment).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                day: '2-digit', 
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Aucun rendez-vous prévu'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
                        <Syringe className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Vaccins à venir</h4>
                        <p className="text-sm text-gray-600">
                          {child.vaccinesDue && child.vaccinesDue.length > 0 
                            ? `${child.vaccinesDue.length} vaccin(s) en attente`
                            : 'Aucun vaccin prévu'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {child.vaccinesDue && child.vaccinesDue.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Vaccins à administrer :</p>
                    <div className="flex flex-wrap gap-2">
                      {child.vaccinesDue.map((vaccine, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {vaccine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => setShowVaccinationRecord(true)}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
            >
              <Syringe className="h-4 w-4" />
              <span>Voir le carnet complet</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal de carnet de vaccination */}
      <VaccinationRecordModal
        isOpen={showVaccinationRecord}
        onClose={() => setShowVaccinationRecord(false)}
        child={{
          id: child.id,
          name: child.name,
          birthDate: child.birthDate,
          gender: child.gender,
          parentName: child.parentName
        }}
      />
    </div>
  );
}
