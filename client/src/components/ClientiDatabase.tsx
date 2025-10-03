import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Search, Download, Mail, Calendar, TrendingUp } from "lucide-react";

interface PromotionalContact {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  lastPromoRequested?: string;
  totalPromoRequests: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: PromotionalContact[];
  total: number;
}

export function ClientiDatabase() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contactsData, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["/api/promotional-contacts"],
  });

  const contacts = contactsData?.data || [];
  const total = contactsData?.total || 0;

  // Filtra i contatti in base al termine di ricerca
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    return (
      contact.email.toLowerCase().includes(searchLower) ||
      fullName.toLowerCase().includes(searchLower) ||
      (contact.lastPromoRequested || '').toLowerCase().includes(searchLower)
    );
  });

  const exportContacts = () => {
    if (contacts.length === 0) return;
    
    const csvContent = [
      ['Email', 'Nome', 'Cognome', 'Ultima Promozione', 'Totale Richieste', 'Prima Richiesta', 'Ultimo Aggiornamento'].join(','),
      ...contacts.map(contact => [
        contact.email,
        contact.firstName || '',
        contact.lastName || '',
        contact.lastPromoRequested || '',
        contact.totalPromoRequests,
        new Date(contact.createdAt).toLocaleDateString('it-IT'),
        new Date(contact.updatedAt).toLocaleDateString('it-IT')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `database-clienti-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Caricamento database clienti...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-400">Errore nel caricamento dei contatti: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contatti Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white" data-testid="text-total-contacts">
              {total}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Richieste Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC9900]" data-testid="text-total-requests">
              {contacts.reduce((sum, contact) => sum + contact.totalPromoRequests, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Nuovi Oggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC9900]" data-testid="text-new-today">
              {contacts.filter(contact => {
                const today = new Date().toDateString();
                const contactDate = new Date(contact.createdAt).toDateString();
                return today === contactDate;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra di ricerca e azioni */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
          <Input
            placeholder="Cerca per email, nome o promozione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            data-testid="input-search-contacts"
          />
        </div>
        <Button
          onClick={exportContacts}
          disabled={contacts.length === 0}
          className="bg-[#CC9900] hover:bg-[#CC9900]/80 text-black"
          data-testid="button-export-contacts"
        >
          <Download className="h-4 w-4 mr-2" />
          Esporta CSV
        </Button>
      </div>

      {/* Lista contatti */}
      {filteredContacts.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-8 text-center">
            <div className="text-white/60">
              {contacts.length === 0 
                ? "Nessun contatto ancora. I clienti che richiedono le tue promozioni appariranno qui."
                : "Nessun contatto trovato per la ricerca corrente."
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-white" data-testid={`text-contact-name-${contact.id}`}>
                        {contact.firstName && contact.lastName 
                          ? `${contact.firstName} ${contact.lastName}`
                          : contact.email.split('@')[0]
                        }
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className="bg-[#CC9900]/20 text-[#CC9900] border-[#CC9900]/30"
                        data-testid={`badge-requests-${contact.id}`}
                      >
                        {contact.totalPromoRequests} richieste
                      </Badge>
                    </div>
                    <div className="text-sm text-white/60 space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span data-testid={`text-email-${contact.id}`}>{contact.email}</span>
                      </div>
                      {contact.lastPromoRequested && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" />
                          <span>Ultima: {contact.lastPromoRequested}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Prima richiesta: {new Date(contact.createdAt).toLocaleDateString('it-IT')}
                          {contact.createdAt !== contact.updatedAt && (
                            <span className="text-white/40">
                              {" "}• Ultimo aggiornamento: {new Date(contact.updatedAt).toLocaleDateString('it-IT')}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white/80 hover:bg-white/10"
                      onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                      data-testid={`button-email-${contact.id}`}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mostra totale filtrato se diverso dal totale */}
      {searchTerm && filteredContacts.length !== contacts.length && (
        <div className="text-center text-sm text-white/60">
          Mostrando {filteredContacts.length} di {contacts.length} contatti
        </div>
      )}
    </div>
  );
}