import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertTriangle, Gift } from "lucide-react";

interface TicketData {
  status: "valid" | "used" | "expired" | "not_found";
  usedAt?: string;
  expiresAt?: string;
  promo?: {
    title: string;
    description: string;
    type: string;
  };
}

export default function TicketPage() {
  const params = useParams() as { code: string };
  const [, setLocation] = useLocation();

  const { data: ticket, isLoading, error } = useQuery<TicketData>({
    queryKey: ["/api/tickets", params.code, "status"],
    enabled: !!params.code,
    refetchInterval: 5000, // Aggiorna ogni 5 secondi per vedere cambi di stato
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-muted rounded w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-64 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket || ticket.status === "not_found") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Biglietto non trovato</CardTitle>
            <CardDescription>Il codice inserito non è valido o il biglietto non esiste.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Torna alla Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (ticket.status) {
      case "valid":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "used":
        return <CheckCircle className="h-12 w-12 text-blue-500" />;
      case "expired":
        return <Clock className="h-12 w-12 text-orange-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-destructive" />;
    }
  };

  const getStatusText = () => {
    switch (ticket.status) {
      case "valid":
        return "Biglietto Valido";
      case "used":
        return "Biglietto Utilizzato";
      case "expired":
        return "Biglietto Scaduto";
      default:
        return "Stato Sconosciuto";
    }
  };

  const getStatusDescription = () => {
    switch (ticket.status) {
      case "valid":
        return "Questo biglietto è valido e può essere utilizzato.";
      case "used":
        return `Biglietto utilizzato il ${ticket.usedAt ? new Date(ticket.usedAt).toLocaleDateString("it-IT") : "data sconosciuta"}.`;
      case "expired":
        return "Questo biglietto è scaduto e non può più essere utilizzato.";
      default:
        return "Stato del biglietto non riconosciuto.";
    }
  };

  const getStatusBadge = () => {
    switch (ticket.status) {
      case "valid":
        return <Badge className="bg-green-500">Valido</Badge>;
      case "used":
        return <Badge className="bg-blue-500">Utilizzato</Badge>;
      case "expired":
        return <Badge className="bg-orange-500">Scaduto</Badge>;
      default:
        return <Badge variant="destructive">Errore</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {getStatusIcon()}
          <CardTitle className="mt-4">{getStatusText()}</CardTitle>
          <CardDescription>{getStatusDescription()}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold tracking-wider bg-muted rounded-lg py-2 px-4">
              {params.code}
            </div>
            {getStatusBadge()}
          </div>

          {ticket.promo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Gift className="h-4 w-4" />
                Dettagli Promozione
              </div>
              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-2">{ticket.promo.title}</h3>
                  {ticket.promo.description && (
                    <p className="text-sm text-muted-foreground mb-2">{ticket.promo.description}</p>
                  )}
                  <Badge variant="outline">{ticket.promo.type}</Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {ticket.expiresAt && ticket.status === "valid" && (
            <div className="text-sm text-muted-foreground text-center">
              <Clock className="h-4 w-4 inline mr-1" />
              Scade il {new Date(ticket.expiresAt).toLocaleDateString("it-IT")}
            </div>
          )}

          {ticket.usedAt && (
            <div className="text-sm text-muted-foreground text-center">
              Utilizzato il {new Date(ticket.usedAt).toLocaleDateString("it-IT")} alle{" "}
              {new Date(ticket.usedAt).toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={() => setLocation("/")} className="w-full" variant="outline">
              Torna alla Home
            </Button>
            
            {ticket.status === "valid" && (
              <Button onClick={() => setLocation("/scan")} className="w-full bg-[#CC9900] hover:bg-[#CC9900]/80">
                Scansiona per Utilizzare
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}