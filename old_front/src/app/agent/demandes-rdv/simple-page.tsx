"use client";

import React, { useState, useEffect } from "react";

interface AppointmentRequest {
  _id: string;
  child: {
    prenom: string;
    nom: string;
    parentInfo?: {
      nom: string;
      phone: string;
    };
  };
  vaccine: string;
  healthCenter: string;
  region: string;
  district?: string;
  requestedDate: string;
  requestMessage?: string;
  status: "pending" | "accepted" | "rejected";
  urgencyLevel: "normal" | "urgent";
  stockVerified: boolean;
  availableDoses: number;
  responseDate?: string;
  responseMessage?: string;
  respondedBy?: {
    name: string;
  };
  createdAt: string;
}

export default function DemandesRdvSimplePage() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Formulaire d'acceptation
  const [confirmedDate, setConfirmedDate] = useState("");
  const [confirmedTime, setConfirmedTime] = useState("");
  const [acceptMessage, setAcceptMessage] = useState("");
  
  // Formulaire de refus
  const [rejectMessage, setRejectMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les demandes de rendez-vous
  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/appointment-requests/incoming", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des demandes");
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Filtrer les demandes
  useEffect(() => {
    let filtered = requests;
    
    switch (selectedFilter) {
      case "pending":
        filtered = requests.filter(req => req.status === "pending");
        break;
      case "accepted":
        filtered = requests.filter(req => req.status === "accepted");
        break;
      case "rejected":
        filtered = requests.filter(req => req.status === "rejected");
        break;
      case "urgent":
        filtered = requests.filter(req => req.urgencyLevel === "urgent");
        break;
      default:
        filtered = requests;
    }
    
    setFilteredRequests(filtered);
  }, [requests, selectedFilter]);

  // Accepter une demande
  const handleAcceptRequest = async () => {
    if (!selectedRequest || !confirmedDate) {
      alert("Veuillez sélectionner une date de confirmation");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Combiner date et heure
      const confirmedDateTime = new Date(`${confirmedDate}T${confirmedTime || "09:00"}`);
      
      const response = await fetch(`/api/appointment-requests/${selectedRequest._id}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          confirmedDate: confirmedDateTime.toISOString(),
          responseMessage: acceptMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'acceptation");
      }

      alert("Demande acceptée avec succès !");
      setShowAcceptModal(false);
      setSelectedRequest(null);
      setConfirmedDate("");
      setConfirmedTime("");
      setAcceptMessage("");
      loadRequests(); // Recharger la liste
    } catch (error: any) {
      console.error("Erreur:", error);
      alert(error.message || "Erreur lors de l'acceptation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refuser une demande
  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectMessage.trim()) {
      alert("Veuillez indiquer le motif de refus");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/appointment-requests/${selectedRequest._id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          responseMessage: rejectMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du refus");
      }

      alert("Demande refusée");
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectMessage("");
      loadRequests(); // Recharger la liste
    } catch (error: any) {
      console.error("Erreur:", error);
      alert(error.message || "Erreur lors du refus");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Formater la date courte
  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // Obtenir la couleur du badge selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b"; // yellow
      case "accepted":
        return "#10b981"; // green
      case "rejected":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  // Obtenir le label du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "accepted":
        return "Acceptée";
      case "rejected":
        return "Refusée";
      default:
        return status;
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '1rem',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '4px',
    },
    statLabel: {
      color: '#6b7280',
      fontSize: '0.875rem',
    },
    filterButtons: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      flexWrap: 'wrap' as const,
    },
    filterButton: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
    filterButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6',
    },
    requestCard: {
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    requestHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    requestTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      marginBottom: '4px',
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'white',
    },
    requestInfo: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '16px',
    },
    infoItem: {
      fontSize: '0.875rem',
      marginBottom: '8px',
    },
    messageBox: {
      backgroundColor: '#f3f4f6',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '16px',
    },
    messageTitle: {
      fontWeight: '600',
      fontSize: '0.875rem',
      marginBottom: '4px',
    },
    messageText: {
      fontSize: '0.875rem',
    },
    actions: {
      display: 'flex',
      gap: '8px',
    },
    acceptButton: {
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
    rejectButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    modalTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '16px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      marginBottom: '4px',
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem',
    },
    textarea: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem',
      minHeight: '80px',
      resize: 'vertical' as const,
    },
    modalActions: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
    },
    cancelButton: {
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '64px' }}>
          <div>Chargement des demandes...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <h1 style={styles.title}>Demandes de Rendez-vous</h1>
        <p style={styles.subtitle}>
          Gérez les demandes de rendez-vous des parents
        </p>
      </div>

      {/* Statistiques */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{requests.length}</div>
          <div style={styles.statLabel}>Total demandes</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#f59e0b' }}>
            {requests.filter(r => r.status === "pending").length}
          </div>
          <div style={styles.statLabel}>En attente</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#10b981' }}>
            {requests.filter(r => r.status === "accepted").length}
          </div>
          <div style={styles.statLabel}>Acceptées</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#ef4444' }}>
            {requests.filter(r => r.urgencyLevel === "urgent").length}
          </div>
          <div style={styles.statLabel}>Urgentes</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={styles.filterButtons}>
        {[
          { key: "all", label: `Toutes (${requests.length})` },
          { key: "pending", label: `En attente (${requests.filter(r => r.status === "pending").length})` },
          { key: "accepted", label: `Acceptées (${requests.filter(r => r.status === "accepted").length})` },
          { key: "rejected", label: `Refusées (${requests.filter(r => r.status === "rejected").length})` },
          { key: "urgent", label: `Urgentes (${requests.filter(r => r.urgencyLevel === "urgent").length})` },
        ].map(filter => (
          <button
            key={filter.key}
            style={{
              ...styles.filterButton,
              ...(selectedFilter === filter.key ? styles.filterButtonActive : {})
            }}
            onClick={() => setSelectedFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Liste des demandes */}
      <div>
        {filteredRequests.length === 0 ? (
          <div style={styles.requestCard}>
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <h3>Aucune demande</h3>
              <p style={{ color: '#6b7280' }}>
                {selectedFilter === "all" 
                  ? "Vous n'avez reçu aucune demande de rendez-vous"
                  : `Aucune demande ${selectedFilter === "pending" ? "en attente" : selectedFilter}`
                }
              </p>
            </div>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request._id} style={styles.requestCard}>
              <div style={styles.requestHeader}>
                <div>
                  <div style={styles.requestTitle}>
                    {request.child.prenom} {request.child.nom}
                    {request.urgencyLevel === "urgent" && (
                      <span style={{ 
                        ...styles.statusBadge, 
                        backgroundColor: '#ef4444',
                        marginLeft: '8px'
                      }}>
                        🚨 Urgent
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Vaccination {request.vaccine} • Demandée le {formatShortDate(request.createdAt)}
                  </div>
                </div>
                <div 
                  style={{ 
                    ...styles.statusBadge, 
                    backgroundColor: getStatusColor(request.status) 
                  }}
                >
                  {getStatusLabel(request.status)}
                </div>
              </div>
              
              {/* Informations principales */}
              <div style={styles.requestInfo}>
                <div>
                  <div style={styles.infoItem}>
                    📞 {request.child.parentInfo?.nom} - {request.child.parentInfo?.phone}
                  </div>
                  <div style={styles.infoItem}>
                    📅 Date souhaitée: {formatDate(request.requestedDate)}
                  </div>
                  <div style={styles.infoItem}>
                    📍 {request.healthCenter}
                  </div>
                </div>
                
                <div>
                  <div style={styles.infoItem}>
                    💉 Stock disponible: {" "}
                    <span style={{ 
                      color: request.availableDoses > 0 ? '#10b981' : '#ef4444',
                      fontWeight: '600' 
                    }}>
                      {request.availableDoses} doses
                    </span>
                  </div>
                  {request.responseDate && (
                    <div style={styles.infoItem}>
                      ✅ Réponse le: {formatShortDate(request.responseDate)}
                    </div>
                  )}
                </div>
              </div>

              {/* Message de la demande */}
              {request.requestMessage && (
                <div style={styles.messageBox}>
                  <div style={styles.messageTitle}>Message du parent:</div>
                  <div style={styles.messageText}>{request.requestMessage}</div>
                </div>
              )}

              {/* Message de réponse */}
              {request.responseMessage && (
                <div style={{
                  ...styles.messageBox,
                  backgroundColor: request.status === "accepted" ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${request.status === "accepted" ? '#10b981' : '#ef4444'}`,
                }}>
                  <div style={styles.messageTitle}>
                    {request.status === "accepted" ? "Message d'acceptation:" : "Motif de refus:"}
                  </div>
                  <div style={styles.messageText}>{request.responseMessage}</div>
                  {request.respondedBy && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                      Par: {request.respondedBy.name}
                    </div>
                  )}
                </div>
              )}

              {/* Actions pour les demandes en attente */}
              {request.status === "pending" && (
                <div style={styles.actions}>
                  <button
                    style={styles.acceptButton}
                    onClick={() => {
                      setSelectedRequest(request);
                      setConfirmedDate(request.requestedDate.split('T')[0]);
                      setConfirmedTime("09:00");
                      setShowAcceptModal(true);
                    }}
                  >
                    ✓ Accepter
                  </button>
                  <button
                    style={styles.rejectButton}
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowRejectModal(true);
                    }}
                  >
                    ✗ Refuser
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal d'acceptation */}
      {showAcceptModal && selectedRequest && (
        <div style={styles.modal} onClick={() => setShowAcceptModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>
              Accepter la demande de rendez-vous
            </div>
            <div style={{ marginBottom: '16px', color: '#6b7280' }}>
              Confirmer le rendez-vous pour {selectedRequest.child.prenom} {selectedRequest.child.nom}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Date confirmée</label>
              <input
                type="date"
                style={styles.input}
                value={confirmedDate}
                onChange={(e) => setConfirmedDate(e.target.value)}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Heure</label>
              <input
                type="time"
                style={styles.input}
                value={confirmedTime}
                onChange={(e) => setConfirmedTime(e.target.value)}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Message pour le parent (optionnel)</label>
              <textarea
                style={styles.textarea}
                placeholder="Message de confirmation..."
                value={acceptMessage}
                onChange={(e) => setAcceptMessage(e.target.value)}
              />
            </div>
            
            <div style={styles.modalActions}>
              <button 
                style={styles.cancelButton}
                onClick={() => setShowAcceptModal(false)}
              >
                Annuler
              </button>
              <button 
                style={styles.acceptButton}
                onClick={handleAcceptRequest} 
                disabled={isSubmitting || !confirmedDate}
              >
                {isSubmitting ? "Confirmation..." : "Confirmer le RDV"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de refus */}
      {showRejectModal && selectedRequest && (
        <div style={styles.modal} onClick={() => setShowRejectModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>
              Refuser la demande
            </div>
            <div style={{ marginBottom: '16px', color: '#6b7280' }}>
              Indiquez le motif de refus pour {selectedRequest.child.prenom} {selectedRequest.child.nom}
            </div>
            
            <div style={styles.formGroup}>
              <textarea
                style={styles.textarea}
                placeholder="Motif du refus (obligatoire)..."
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
              />
            </div>
            
            <div style={styles.modalActions}>
              <button 
                style={styles.cancelButton}
                onClick={() => setShowRejectModal(false)}
              >
                Annuler
              </button>
              <button 
                style={styles.rejectButton}
                onClick={handleRejectRequest}
                disabled={isSubmitting || !rejectMessage.trim()}
              >
                {isSubmitting ? "Refus..." : "Refuser la demande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
