"use client";

import React, { useState, useEffect } from "react";

// Configuration du calendrier
const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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

export default function DemandesRdvPage() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
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
      toast.error("Erreur lors du chargement des demandes");
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
      toast.error("Veuillez sélectionner une date de confirmation");
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

      toast.success("Demande acceptée avec succès !");
      setShowAcceptDialog(false);
      setSelectedRequest(null);
      setConfirmedDate("");
      setConfirmedTime("");
      setAcceptMessage("");
      loadRequests(); // Recharger la liste
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'acceptation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refuser une demande
  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectMessage.trim()) {
      toast.error("Veuillez indiquer le motif de refus");
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

      toast.success("Demande refusée");
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectMessage("");
      loadRequests(); // Recharger la liste
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors du refus");
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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Acceptée</Badge>;
      case "rejected":
        return <Badge variant="destructive">Refusée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Obtenir la couleur du badge d'urgence
  const getUrgencyBadge = (urgency: string) => {
    return urgency === "urgent" ? (
      <Badge variant="destructive" className="ml-2">
        <AlertTriangleIcon className="w-3 h-3 mr-1" />
        Urgent
      </Badge>
    ) : null;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCwIcon className="w-8 h-8 animate-spin" />
          <span className="ml-2">Chargement des demandes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Demandes de Rendez-vous</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de rendez-vous des parents
          </p>
        </div>
        <Button onClick={loadRequests} variant="outline">
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === "pending").length}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acceptées</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === "accepted").length}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests.filter(r => r.urgencyLevel === "urgent").length}
                </p>
              </div>
              <AlertTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          onClick={() => setSelectedFilter("all")}
        >
          Toutes ({requests.length})
        </Button>
        <Button
          variant={selectedFilter === "pending" ? "default" : "outline"}
          onClick={() => setSelectedFilter("pending")}
        >
          En attente ({requests.filter(r => r.status === "pending").length})
        </Button>
        <Button
          variant={selectedFilter === "accepted" ? "default" : "outline"}
          onClick={() => setSelectedFilter("accepted")}
        >
          Acceptées ({requests.filter(r => r.status === "accepted").length})
        </Button>
        <Button
          variant={selectedFilter === "rejected" ? "default" : "outline"}
          onClick={() => setSelectedFilter("rejected")}
        >
          Refusées ({requests.filter(r => r.status === "rejected").length})
        </Button>
        <Button
          variant={selectedFilter === "urgent" ? "destructive" : "outline"}
          onClick={() => setSelectedFilter("urgent")}
        >
          Urgentes ({requests.filter(r => r.urgencyLevel === "urgent").length})
        </Button>
      </div>

      {/* Liste des demandes */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune demande</h3>
              <p className="text-muted-foreground">
                {selectedFilter === "all" 
                  ? "Vous n'avez reçu aucune demande de rendez-vous"
                  : `Aucune demande ${selectedFilter === "pending" ? "en attente" : selectedFilter}`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      {request.child.prenom} {request.child.nom}
                      {getUrgencyBadge(request.urgencyLevel)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Vaccination {request.vaccine} • Demandée le {formatShortDate(request.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {request.child.parentInfo?.nom} - {request.child.parentInfo?.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span>Date souhaitée: {formatDate(request.requestedDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{request.healthCenter}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Stock disponible:</span>{" "}
                      <span className={request.availableDoses > 0 ? "text-green-600" : "text-red-600"}>
                        {request.availableDoses} doses
                      </span>
                    </div>
                    {request.responseDate && (
                      <div className="text-sm">
                        <span className="font-medium">Réponse le:</span>{" "}
                        {formatShortDate(request.responseDate)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message de la demande */}
                {request.requestMessage && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Message du parent:</p>
                    <p className="text-sm">{request.requestMessage}</p>
                  </div>
                )}

                {/* Message de réponse */}
                {request.responseMessage && (
                  <div className={`p-3 rounded-lg ${
                    request.status === "accepted" ? "bg-green-50 border border-green-200" : 
                    request.status === "rejected" ? "bg-red-50 border border-red-200" : 
                    "bg-muted"
                  }`}>
                    <p className="text-sm font-medium mb-1">
                      {request.status === "accepted" ? "Message d'acceptation:" : "Motif de refus:"}
                    </p>
                    <p className="text-sm">{request.responseMessage}</p>
                    {request.respondedBy && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Par: {request.respondedBy.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions pour les demandes en attente */}
                {request.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Dialog open={showAcceptDialog && selectedRequest?._id === request._id} onOpenChange={setShowAcceptDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setConfirmedDate(request.requestedDate.split('T')[0]);
                            setConfirmedTime("09:00");
                          }}
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          Accepter
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Accepter la demande de rendez-vous</DialogTitle>
                          <DialogDescription>
                            Confirmer le rendez-vous pour {selectedRequest?.child.prenom} {selectedRequest?.child.nom}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="confirmedDate">Date confirmée</Label>
                            <Input
                              id="confirmedDate"
                              type="date"
                              value={confirmedDate}
                              onChange={(e) => setConfirmedDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmedTime">Heure</Label>
                            <Input
                              id="confirmedTime"
                              type="time"
                              value={confirmedTime}
                              onChange={(e) => setConfirmedTime(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="acceptMessage">Message pour le parent (optionnel)</Label>
                            <Textarea
                              id="acceptMessage"
                              placeholder="Message de confirmation..."
                              value={acceptMessage}
                              onChange={(e) => setAcceptMessage(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
                            Annuler
                          </Button>
                          <Button 
                            onClick={handleAcceptRequest} 
                            disabled={isSubmitting || !confirmedDate}
                          >
                            {isSubmitting ? "Confirmation..." : "Confirmer le RDV"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog open={showRejectDialog && selectedRequest?._id === request._id} onOpenChange={setShowRejectDialog}>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <XCircleIcon className="w-4 h-4 mr-2" />
                          Refuser
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Refuser la demande</AlertDialogTitle>
                          <AlertDialogDescription>
                            Indiquez le motif de refus pour {selectedRequest?.child.prenom} {selectedRequest?.child.nom}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <Textarea
                            placeholder="Motif du refus (obligatoire)..."
                            value={rejectMessage}
                            onChange={(e) => setRejectMessage(e.target.value)}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setShowRejectDialog(false)}>
                            Annuler
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRejectRequest}
                            disabled={isSubmitting || !rejectMessage.trim()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isSubmitting ? "Refus..." : "Refuser la demande"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
