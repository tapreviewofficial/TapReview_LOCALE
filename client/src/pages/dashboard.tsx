import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { logout } from "@/lib/auth";
import { StatsPanel } from "@/components/StatsPanel";
import { DraggableLinkList } from "@/components/DraggableLinkList";
import { LivePreview } from "@/components/LivePreview";
import NewPromoLite from "@/components/NewPromoLite";
import EditPromoForm from "@/components/EditPromoForm";
import { ClientiDatabase } from "@/components/ClientiDatabase";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import AdminPanel from "@/pages/admin";
import type { Link, Profile } from "@shared/schema";

const profileSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().optional(),
  accentColor: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

const linkSchema = z.object({
  title: z.string().min(1, "Titolo richiesto"),
  url: z.string().url("URL non valido"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Password attuale richiesta"),
  newPassword: z.string().min(6, "La nuova password deve essere di almeno 6 caratteri"),
  confirmPassword: z.string().min(1, "Conferma password richiesta"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type LinkForm = z.infer<typeof linkSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPromo, setEditingPromo] = useState<any>(null);

  // Check authentication
  const { data: authData, isLoading: authLoading } = useQuery<{ user: { id: number; email: string; username: string; role?: string } }>({
    queryKey: ["api", "auth", "me"],
  });

  useEffect(() => {
    if (!authLoading && !authData?.user) {
      setLocation("/login");
    }
  }, [authData, authLoading, setLocation]);

  // Fetch profile and links
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["api", "profile"],
  });

  const { data: links = [] } = useQuery<Link[]>({
    queryKey: ["api", "links"],
  });

  const { data: promos = [] } = useQuery<any[]>({
    queryKey: ["api", "promos"],
  });

  // Funzione per toggle attiva/disattiva promozione (max 1 attiva)
  async function setActive(id: number, active: boolean) {
    try {
      const r = await fetch(`/api/promos/${id}/active`, {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        credentials: "include",
        body: JSON.stringify({ active })
      });
      if (r.ok) {
        queryClient.invalidateQueries({ queryKey: ["api", "promos"] });
        toast({ title: active ? "Promozione attivata" : "Promozione disattivata" });
      } else {
        toast({ title: "Errore cambio stato", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore di rete", variant: "destructive" });
    }
  }

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      accentColor: "#CC9900",
      avatarUrl: "",
    },
  });

  // Update profile form when data loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        accentColor: profile.accentColor || "#CC9900",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  }, [profile, profileForm]);

  // Link form
  const linkForm = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      toast({ title: "Profilo aggiornato", description: "Le modifiche sono state salvate con successo" });
      queryClient.invalidateQueries({ queryKey: ["api", "profile"] });
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const addLinkMutation = useMutation({
    mutationFn: async (data: LinkForm) => {
      return await apiRequest("POST", "/api/links", data);
    },
    onSuccess: () => {
      toast({ title: "Link aggiunto", description: "Il nuovo link è stato creato con successo" });
      linkForm.reset();
      queryClient.invalidateQueries({ queryKey: ["api", "links"] });
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      return await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({ title: "Password aggiornata", description: "La tua password è stata cambiata con successo" });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });


  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onLinkSubmit = (data: LinkForm) => {
    addLinkMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate(data);
  };


  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;
  }

  if (!authData?.user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Dashboard Header */}
      <div className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
              <p className="text-muted-foreground">Gestisci i tuoi link e profilo</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={logout} variant="ghost" data-testid="button-logout">
                <i className="fas fa-sign-out-alt mr-2"></i>
                Esci
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="gestione" className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-white/5 border-white/10 gap-1 scrollbar-hide px-2 snap-x snap-mandatory">
            <TabsTrigger value="gestione" data-testid="tab-manage" className="shrink-0 whitespace-nowrap snap-start">Gestione</TabsTrigger>
            <TabsTrigger value="promo" data-testid="tab-promo" className="shrink-0 whitespace-nowrap snap-start">Promozioni</TabsTrigger>
            <TabsTrigger value="clienti" data-testid="tab-clienti" className="shrink-0 whitespace-nowrap snap-start">Database Clienti</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics" className="shrink-0 whitespace-nowrap snap-start">Analytics</TabsTrigger>
            <TabsTrigger value="anteprima" data-testid="tab-preview" className="shrink-0 whitespace-nowrap snap-start">Anteprima</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings" className="shrink-0 whitespace-nowrap snap-start">Impostazioni</TabsTrigger>
            {authData?.user?.role === "ADMIN" && (
              <TabsTrigger value="admin" data-testid="tab-admin" className="shrink-0 whitespace-nowrap snap-start text-red-400">Admin</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="gestione" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Section */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Profilo Pubblico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="displayName">Nome visualizzato</Label>
                        <Input
                          id="displayName"
                          placeholder="Il tuo nome o nome del business"
                          {...profileForm.register("displayName")}
                          data-testid="input-display-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Descrivi brevemente la tua attività..."
                          className="min-h-[80px]"
                          {...profileForm.register("bio")}
                          data-testid="textarea-bio"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accentColor">Colore tema</Label>
                        <Input
                          id="accentColor"
                          type="color"
                          className="h-12"
                          {...profileForm.register("accentColor")}
                          data-testid="input-accent-color"
                        />
                      </div>
                      <div>
                        <Label htmlFor="avatarUrl">URL Avatar (opzionale)</Label>
                        <Input
                          id="avatarUrl"
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          {...profileForm.register("avatarUrl")}
                          data-testid="input-avatar-url"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="btn-gold w-full"
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Salvando..." : "Salva Profilo"}
                      </Button>
                    </form>
                    
                    <div className="mt-6 p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground mb-2">Il tuo URL pubblico:</p>
                      <button
                        onClick={() => setLocation(`/u/${authData.user.username}`)}
                        className="text-gold hover:underline text-sm font-medium"
                        data-testid="link-public-profile"
                      >
                        tapreview.it/u/{authData.user.username}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Links Management */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>I tuoi Link</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Add Link Form */}
                    <form onSubmit={linkForm.handleSubmit(onLinkSubmit)} className="mb-8 p-4 bg-muted rounded-md">
                      <h3 className="font-medium mb-4">Aggiungi nuovo link</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Titolo</Label>
                          <Input
                            id="title"
                            placeholder="es. Recensione Google"
                            {...linkForm.register("title")}
                            data-testid="input-link-title"
                          />
                          {linkForm.formState.errors.title && (
                            <p className="text-sm text-destructive mt-1">{linkForm.formState.errors.title.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="url">URL</Label>
                          <Input
                            id="url"
                            placeholder="https://..."
                            {...linkForm.register("url")}
                            data-testid="input-link-url"
                          />
                          {linkForm.formState.errors.url && (
                            <p className="text-sm text-destructive mt-1">{linkForm.formState.errors.url.message}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="btn-gold mt-4"
                        disabled={addLinkMutation.isPending}
                        data-testid="button-add-link"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        {addLinkMutation.isPending ? "Aggiungendo..." : "Aggiungi Link"}
                      </Button>
                    </form>

                    {/* Links List */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-white">Link esistenti ({links.length})</h3>
                      {links.length === 0 ? (
                        <p className="text-white/60 text-center py-8" data-testid="text-no-links">
                          Nessun link presente. Aggiungi il tuo primo link!
                        </p>
                      ) : (
                        <DraggableLinkList links={links} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsChart />
          </TabsContent>

          <TabsContent value="promo" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Gestione Promozioni</h2>
                  <p className="text-muted-foreground">Crea e gestisci i tuoi inviti e biglietti digitali</p>
                </div>
                <NewPromoLite />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <i className="fas fa-gift"></i>
                      Promozioni Attive
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {promos.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <i className="fas fa-gift text-4xl mb-4 opacity-50"></i>
                          <p>Nessuna promozione attiva</p>
                          <p className="text-sm">Crea la tua prima promozione per iniziare</p>
                        </div>
                      ) : (
                        promos.map((promo: any) => (
                          <div key={promo.id} className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold">{promo.title}</h4>
                                <p className="text-sm text-muted-foreground">{promo.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="inline-block px-2 py-1 bg-[#CC9900] text-black text-xs rounded">
                                    {promo.type.toUpperCase()}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      id={`promo-active-${promo.id}`}
                                      checked={promo.active}
                                      onCheckedChange={(checked) => setActive(promo.id, checked)}
                                      data-testid={`switch-promo-active-${promo.id}`}
                                    />
                                    <label 
                                      htmlFor={`promo-active-${promo.id}`} 
                                      className={`text-sm cursor-pointer select-none ${promo.active ? "text-[#CC9900] font-semibold" : "text-muted-foreground"}`}
                                    >
                                      {promo.active ? "ATTIVA" : "Inattiva"}
                                    </label>
                                    <button
                                      onClick={() => setEditingPromo(promo)}
                                      className="ml-2 px-2 py-1 text-xs bg-[#CC9900] hover:bg-[#CC9900]/90 text-black rounded font-medium"
                                      data-testid={`button-edit-promo-${promo.id}`}
                                    >
                                      Modifica
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                <div>Inizio: {new Date(promo.startAt).toLocaleDateString('it-IT')}</div>
                                <div>Fine: {new Date(promo.endAt).toLocaleDateString('it-IT')}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <i className="fas fa-qrcode"></i>
                      Statistiche Biglietti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-[#CC9900]">{promos.length}</div>
                        <div className="text-sm text-muted-foreground">Promozioni create</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-green-500">{promos.filter((p: any) => p.active).length}</div>
                        <div className="text-sm text-muted-foreground">Promozioni attive</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-mobile-alt"></i>
                    Scanner QR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Scanner per validare biglietti</p>
                      <p className="text-sm text-muted-foreground">Usa il tuo smartphone per scansionare e validare i codici QR dei clienti</p>
                    </div>
                    <Button onClick={() => window.open('/scan', '_blank')} variant="outline">
                      <i className="fas fa-qrcode mr-2"></i>
                      Apri Scanner
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="anteprima" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-6">
                <LivePreview username={authData.user.username} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni Profilo</CardTitle>
                </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="displayName">Nome visualizzato</Label>
                        <Input
                          id="displayName"
                          placeholder="Il tuo nome o nome del business"
                          {...profileForm.register("displayName")}
                          data-testid="input-display-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Descrivi brevemente la tua attività..."
                          className="min-h-[80px]"
                          {...profileForm.register("bio")}
                          data-testid="textarea-bio"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accentColor">Colore tema</Label>
                        <Input
                          id="accentColor"
                          type="color"
                          className="h-12"
                          {...profileForm.register("accentColor")}
                          data-testid="input-accent-color"
                        />
                      </div>
                      <div>
                        <Label htmlFor="avatarUrl">URL Avatar (opzionale)</Label>
                        <Input
                          id="avatarUrl"
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          {...profileForm.register("avatarUrl")}
                          data-testid="input-avatar-url"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="btn-gold w-full"
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Salvando..." : "Salva Profilo"}
                      </Button>
                    </form>
                    
                    <div className="mt-6 p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground mb-2">Il tuo URL pubblico:</p>
                      <button
                        onClick={() => setLocation(`/u/${authData.user.username}`)}
                        className="text-gold hover:underline text-sm font-medium"
                        data-testid="link-public-profile"
                      >
                        tapreview.it/u/{authData.user.username}
                      </button>
                    </div>
                  </CardContent>
                </Card>

              {/* Password Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Cambia Password</CardTitle>
                  <p className="text-sm text-muted-foreground">Aggiorna la tua password per la sicurezza dell'account</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Password Attuale</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Inserisci la password attuale"
                        {...passwordForm.register("currentPassword")}
                        data-testid="input-current-password"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="newPassword">Nuova Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Inserisci la nuova password"
                        {...passwordForm.register("newPassword")}
                        data-testid="input-new-password"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Conferma Nuova Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Conferma la nuova password"
                        {...passwordForm.register("confirmPassword")}
                        data-testid="input-confirm-password"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="bg-[#CC9900] hover:bg-[#CC9900]/80 text-black w-full"
                      disabled={changePasswordMutation.isPending}
                      data-testid="button-change-password"
                    >
                      {changePasswordMutation.isPending ? "Cambiando..." : "Cambia Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clienti" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-address-book text-[#CC9900]"></i>
                  Database Clienti
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tutti i clienti che hanno richiesto le tue promozioni
                </p>
              </CardHeader>
              <CardContent>
                <ClientiDatabase />
              </CardContent>
            </Card>
          </TabsContent>

          {authData?.user?.role === "ADMIN" && (
            <TabsContent value="admin" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <i className="fas fa-cog"></i>
                    Pannello Amministrazione
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Accesso completo alla gestione del sistema
                  </p>
                </CardHeader>
                <CardContent>
                  <AdminPanel />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Edit Promo Modal */}
      {editingPromo && (
        <EditPromoForm
          promo={editingPromo}
          open={!!editingPromo}
          onClose={() => setEditingPromo(null)}
        />
      )}
    </div>
  );
}

