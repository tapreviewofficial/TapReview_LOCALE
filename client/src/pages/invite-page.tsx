import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Gift, Calendar, ExternalLink } from "lucide-react";

interface PublicPageData {
  id: number;
  slug: string;
  title: string;
  theme: string;
  user: {
    username: string;
  };
  promos: Array<{
    id: number;
    title: string;
    description: string;
    type: string;
    startAt: string;
    endAt: string;
  }>;
}

interface TicketResponse {
  ticketId: number;
  code: string;
  qrUrl: string;
  qrDataUrl: string;
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams() as { slug: string };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedPromo, setSelectedPromo] = useState<number | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<TicketResponse | null>(null);

  const { data: publicPage, isLoading } = useQuery<PublicPageData>({
    queryKey: ["/api/public-pages", params.slug],
    enabled: !!params.slug,
  });

  const generateTicketMutation = useMutation({
    mutationFn: async (data: { promoId: number; customerName: string; customerEmail: string }) => {
      const response = await fetch(`/api/promos/${data.promoId}/tickets/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: data.customerName,
          customerEmail: data.customerEmail,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Errore generazione biglietto");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedTicket(data);
      toast({
        title: "Biglietto generato!",
        description: "Il tuo biglietto è stato creato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateTicket = () => {
    if (!selectedPromo) {
      toast({
        title: "Seleziona promozione",
        description: "Devi selezionare una promozione prima di generare il biglietto.",
        variant: "destructive",
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Nome richiesto",
        description: "Inserisci il tuo nome per generare il biglietto.",
        variant: "destructive",
      });
      return;
    }

    generateTicketMutation.mutate({
      promoId: selectedPromo,
      customerName: customerName,
      customerEmail: customerEmail,
    });
  };

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

  if (!publicPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pagina non trovata</h1>
          <p className="text-muted-foreground mb-8">La pagina che stai cercando non esiste.</p>
          <Button onClick={() => window.location.href = "/"}>Torna alla Home</Button>
        </div>
      </div>
    );
  }

  // Parse theme se presente
  let theme = { backgroundColor: "#0a0a0a", accentColor: "#CC9900", textColor: "#ffffff" };
  if (publicPage.theme) {
    try {
      theme = { ...theme, ...JSON.parse(publicPage.theme) };
    } catch (e) {
      console.warn("Errore parsing theme:", e);
    }
  }

  if (generatedTicket) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-6 w-6" />
              Biglietto Generato
            </CardTitle>
            <CardDescription>Il tuo biglietto è pronto!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <img 
                src={generatedTicket.qrDataUrl} 
                alt="QR Code"
                className="mx-auto mb-4 border rounded-lg"
              />
              <p className="text-sm text-muted-foreground mb-2">Codice: {generatedTicket.code}</p>
              {generatedTicket.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Scade: {new Date(generatedTicket.expiresAt).toLocaleDateString("it-IT")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => window.open(generatedTicket.qrUrl, "_blank")}
                className="w-full"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Apri Biglietto
              </Button>
              <Button 
                onClick={() => window.print()}
                className="w-full"
                style={{ backgroundColor: theme.accentColor }}
              >
                Stampa Biglietto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4"
      style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
    >
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{publicPage.title || "Inviti Speciali"}</h1>
          <p className="text-lg opacity-90">@{publicPage.user.username}</p>
        </div>

        {publicPage.promos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nessuna promozione attiva al momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Promozioni Disponibili</CardTitle>
                <CardDescription>Seleziona una promozione per generare il tuo biglietto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {publicPage.promos.map((promo) => (
                  <div
                    key={promo.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPromo === promo.id 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedPromo(promo.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{promo.title}</h3>
                        {promo.description && (
                          <p className="text-sm text-muted-foreground mb-2">{promo.description}</p>
                        )}
                        <div className="flex gap-2">
                          <Badge variant="secondary">{promo.type}</Badge>
                          {promo.endAt && (
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              Fino al {new Date(promo.endAt).toLocaleDateString("it-IT")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Genera il tuo Biglietto</CardTitle>
                <CardDescription>Inserisci i tuoi dati per ricevere il biglietto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nome *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Il tuo nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email (opzionale)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="La tua email"
                  />
                </div>
                <Button
                  onClick={handleGenerateTicket}
                  disabled={generateTicketMutation.isPending || !selectedPromo || !customerName.trim()}
                  className="w-full"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  {generateTicketMutation.isPending ? "Generando..." : "Genera Biglietto"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}