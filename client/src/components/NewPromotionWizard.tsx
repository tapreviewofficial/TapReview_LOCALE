import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

/**
 * Schema di validazione per il wizard delle promozioni
 */
const promoSchema = z.object({
  // STEP 1) Dati di base
  title: z.string().min(3, "Titolo obbligatorio (min 3 caratteri)"),
  description: z.string().min(10, "Descrizione breve obbligatoria").max(200, "Max 200 caratteri"),
  type: z.enum(["coupon", "invito", "valore_fisso", "omaggio"], {
    errorMap: () => ({ message: "Seleziona una tipologia" }),
  }),
  internalCode: z.string().optional(),

  // STEP 2) Benefit & condizioni
  valueType: z.enum(["percent", "amount", "none"]).default("none"),
  valueAmount: z.number({ invalid_type_error: "Inserisci un numero valido" }).optional(),
  notCumulative: z.boolean().default(false),
  onePerCustomer: z.boolean().default(true),
  minSpend: z.number({ invalid_type_error: "Inserisci un importo valido" }).optional(),

  // STEP 3) Validità
  startAt: z.string().min(1, "Data inizio obbligatoria"),
  endAt: z.string().min(1, "Data fine obbligatoria"),
  maxCodes: z.number({ invalid_type_error: "Numero massimo obbligatorio" }).min(1, "Deve essere > 0"),
  usesPerCode: z.number({ invalid_type_error: "Usi per codice obbligatorio" }).min(1, "Almeno 1"),

  // STEP 4) Codici/QR
  codeFormat: z.enum(["short", "uuid", "custom_prefix"]).default("short"),
  codePrefix: z.string().optional(),
  qrMode: z.enum(["url", "jwt"]).default("url"),

  // STEP 5) Raccolta dati cliente
  askName: z.boolean().default(true),
  askEmail: z.boolean().default(true),
  privacyConsentRequired: z.boolean().default(true),
  landingLang: z.enum(["it", "en"]).default("it"),

  // STEP 6) Pagine e contenuti
  landingTemplate: z.enum(["minimal", "hero", "evento"]).default("minimal"),
  landingHeadline: z.string().optional(),
  landingSubtitle: z.string().optional(),
  showCodeAndQr: z.boolean().default(true),
});

type PromoFormData = z.infer<typeof promoSchema>;

const steps = [
  "Dati base",
  "Benefit & condizioni", 
  "Validità",
  "Codici / QR",
  "Raccolta dati",
  "Pagine & contenuti",
  "Riepilogo"
];

const defaultValues: Partial<PromoFormData> = {
  type: "coupon",
  valueType: "none",
  notCumulative: false,
  onePerCustomer: true,
  usesPerCode: 1,
  maxCodes: 100,
  startAt: new Date().toISOString().slice(0, 16), // Data/ora attuale
  endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // +30 giorni
  codeFormat: "short",
  qrMode: "url",
  askName: true,
  askEmail: true,
  privacyConsentRequired: true,
  landingLang: "it",
  landingTemplate: "minimal",
  showCodeAndQr: true,
};

async function createPromoApi(payload: any) {
  const res = await fetch("/api/promos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Errore creazione promozione");
  }
  return res.json();
}

interface NewPromotionWizardProps {
  onSuccess?: () => void;
}

export default function NewPromotionWizard({ onSuccess }: NewPromotionWizardProps) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
    reset,
    trigger,
  } = useForm<PromoFormData>({
    defaultValues: defaultValues as any,
    resolver: zodResolver(promoSchema),
    mode: "onChange",
  });

  const type = watch("type");
  const valueType = watch("valueType");

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const closeWizard = () => {
    setOpen(false);
    setActiveStep(0);
    reset();
  };

  async function onSubmit(data: PromoFormData) {
    // Validazioni logiche
    const start = new Date(data.startAt);
    const end = new Date(data.endAt);
    if (end < start) {
      toast({
        title: "Errore",
        description: "La data di fine deve essere >= data inizio",
        variant: "destructive",
      });
      return;
    }

    if (data.type === "coupon" && data.valueType === "none") {
      toast({
        title: "Errore", 
        description: "Per i coupon devi impostare percentuale o importo fisso",
        variant: "destructive",
      });
      return;
    }

    // Normalizza payload per API (versione semplificata per compatibilità attuale)
    const payload = {
      title: data.title,
      description: data.description,
      type: data.type,
      startAt: data.startAt,
      endAt: data.endAt,
      // Aggiungiamo i dati avanzati come JSON nella descrizione per ora
      metadata: {
        internalCode: data.internalCode || null,
        value: data.valueType === "percent" ? { kind: "percent", amount: data.valueAmount } :
               data.valueType === "amount"  ? { kind: "amount", amount: data.valueAmount } :
               { kind: "none" },
        notCumulative: data.notCumulative,
        onePerCustomer: data.onePerCustomer,
        minSpend: data.minSpend || null,
        maxCodes: data.maxCodes,
        usesPerCode: data.usesPerCode,
        codeFormat: data.codeFormat,
        codePrefix: data.codePrefix || null,
        qrMode: data.qrMode,
        fields: {
          name: data.askName,
          email: data.askEmail,
        },
        privacy: {
          required: data.privacyConsentRequired,
        },
        landing: {
          lang: data.landingLang,
          template: data.landingTemplate,
          headline: data.landingHeadline || "",
          subtitle: data.landingSubtitle || "",
          showCodeAndQr: data.showCodeAndQr,
        },
      }
    };

    try {
      const created = await createPromoApi(payload);
      toast({
        title: "Successo",
        description: "Promozione creata con successo!",
      });
      closeWizard();
      onSuccess?.();
    } catch (e: any) {
      toast({
        title: "Errore",
        description: e?.message || "Errore creazione promozione",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      {/* Tasto Nuova Promozione */}
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#CC9900] hover:bg-[#CC9900]/80 text-black font-medium"
        data-testid="button-new-promotion"
      >
        <i className="fas fa-plus mr-2"></i>
        Nuova Promozione
      </Button>

      {/* Modal Wizard */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-auto">
          <div className="bg-[#0a0a0a] border border-white/10 text-white w-full max-w-4xl rounded-lg shadow-xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#CC9900]">Crea Nuova Promozione</h2>
              <button 
                onClick={closeWizard} 
                className="text-white/60 hover:text-white text-2xl"
                data-testid="button-close-wizard"
              >
                ✕
              </button>
            </div>

            {/* Stepper */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
              {steps.map((stepName, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                    i === activeStep 
                      ? "bg-[#CC9900] text-black font-medium" 
                      : i < activeStep 
                        ? "bg-[#CC9900]/30 text-[#CC9900]" 
                        : "bg-white/10 text-white/60"
                  }`}
                >
                  {i + 1}. {stepName}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* STEP 1: Dati di base */}
              {activeStep === 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#CC9900]">1. Dati di base</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-white">Titolo promozione</Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder='es. "Sconto 10% primo acquisto"'
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-title"
                      />
                      {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-white">Descrizione breve</Label>
                      <Textarea
                        id="description"
                        {...register("description")}
                        rows={3}
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="textarea-description"
                      />
                      {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="type" className="text-white">Tipologia</Label>
                      <select 
                        {...register("type")} 
                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                        data-testid="select-type"
                      >
                        <option value="coupon">Coupon sconto</option>
                        <option value="invito">Invito evento</option>
                        <option value="valore_fisso">Promo a valore fisso</option>
                        <option value="omaggio">Omaggio</option>
                      </select>
                      {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="internalCode" className="text-white">Codice interno (opzionale)</Label>
                      <Input
                        id="internalCode"
                        {...register("internalCode")}
                        placeholder="SKU/Tag interno"
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-internal-code"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 2: Benefit & condizioni */}
              {activeStep === 1 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#CC9900]">2. Benefit e condizioni</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Valore promo (se coupon)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          {...register("valueType")} 
                          className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                          data-testid="select-value-type"
                        >
                          <option value="none">— Nessuno —</option>
                          <option value="percent">Percentuale %</option>
                          <option value="amount">Importo fisso €</option>
                        </select>
                        {(valueType === "percent" || valueType === "amount") && (
                          <Input
                            type="number"
                            step="0.01"
                            {...register("valueAmount", { valueAsNumber: true })}
                            placeholder={valueType === "percent" ? "es. 10 (%)" : "es. 5.00 (€)"}
                            className="bg-white/5 border-white/10 text-white"
                            data-testid="input-value-amount"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-white">
                        <input type="checkbox" {...register("notCumulative")} data-testid="checkbox-not-cumulative" />
                        Non cumulabile
                      </label>
                      <label className="flex items-center gap-2 text-white">
                        <input type="checkbox" {...register("onePerCustomer")} data-testid="checkbox-one-per-customer" />
                        1 per cliente
                      </label>
                    </div>

                    <div>
                      <Label htmlFor="minSpend" className="text-white">Soglia minima di spesa (€)</Label>
                      <Input
                        id="minSpend"
                        type="number"
                        step="0.01"
                        {...register("minSpend", { valueAsNumber: true })}
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-min-spend"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 3: Validità */}
              {activeStep === 2 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#CC9900]">3. Validità</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startAt" className="text-white">Data inizio</Label>
                        <Input
                          id="startAt"
                          type="datetime-local"
                          {...register("startAt")}
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-start-at"
                        />
                        {errors.startAt && <p className="text-red-400 text-sm mt-1">{errors.startAt.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="endAt" className="text-white">Data fine</Label>
                        <Input
                          id="endAt"
                          type="datetime-local"
                          {...register("endAt")}
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-end-at"
                        />
                        {errors.endAt && <p className="text-red-400 text-sm mt-1">{errors.endAt.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxCodes" className="text-white">Numero massimo codici</Label>
                        <Input
                          id="maxCodes"
                          type="number"
                          {...register("maxCodes", { valueAsNumber: true })}
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-max-codes"
                        />
                        {errors.maxCodes && <p className="text-red-400 text-sm mt-1">{errors.maxCodes.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="usesPerCode" className="text-white">Utilizzi per codice</Label>
                        <Input
                          id="usesPerCode"
                          type="number"
                          {...register("usesPerCode", { valueAsNumber: true })}
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-uses-per-code"
                        />
                        {errors.usesPerCode && <p className="text-red-400 text-sm mt-1">{errors.usesPerCode.message}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 4: Codici / QR */}
              {activeStep === 3 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#CC9900]">4. Generazione codici / QR</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Formato codice</Label>
                        <select 
                          {...register("codeFormat")} 
                          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                          data-testid="select-code-format"
                        >
                          <option value="short">Alfanumerico breve (8–10)</option>
                          <option value="uuid">UUID</option>
                          <option value="custom_prefix">Custom prefix</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="codePrefix" className="text-white">Prefix (se custom)</Label>
                        <Input
                          id="codePrefix"
                          {...register("codePrefix")}
                          placeholder="es. VIP-"
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-code-prefix"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Modalità QR</Label>
                      <select 
                        {...register("qrMode")} 
                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                        data-testid="select-qr-mode"
                      >
                        <option value="url">URL con querystring</option>
                        <option value="jwt">Token firmato (JWT)</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 5: Raccolta dati */}
              {activeStep === 4 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#CC9900]">5. Raccolta dati cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 text-white">
                        <input type="checkbox" {...register("askName")} data-testid="checkbox-ask-name" />
                        Richiedi nome
                      </label>
                      <label className="flex items-center gap-2 text-white">
                        <input type="checkbox" {...register("askEmail")} data-testid="checkbox-ask-email" />
                        Richiedi email
                      </label>
                    </div>

                    <label className="flex items-center gap-2 text-white">
                      <input type="checkbox" {...register("privacyConsentRequired")} data-testid="checkbox-privacy-consent" />
                      Consenso privacy obbligatorio
                    </label>

                    <div>
                      <Label className="text-white">Lingua landing</Label>
                      <select 
                        {...register("landingLang")} 
                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                        data-testid="select-landing-lang"
                      >
                        <option value="it">Italiano</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 6: Pagine & contenuti */}
              {activeStep === 5 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#CC9900]">6. Pagine e contenuti</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Template landing</Label>
                      <select 
                        {...register("landingTemplate")} 
                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                        data-testid="select-landing-template"
                      >
                        <option value="minimal">Minimal</option>
                        <option value="hero">Hero con immagine</option>
                        <option value="evento">Evento</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="landingHeadline" className="text-white">Titolo principale</Label>
                      <Input
                        id="landingHeadline"
                        {...register("landingHeadline")}
                        placeholder="Titolo della promozione"
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-landing-headline"
                      />
                    </div>

                    <div>
                      <Label htmlFor="landingSubtitle" className="text-white">Sottotitolo</Label>
                      <Input
                        id="landingSubtitle"
                        {...register("landingSubtitle")}
                        placeholder="Descrizione aggiuntiva"
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-landing-subtitle"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-white">
                      <input type="checkbox" {...register("showCodeAndQr")} data-testid="checkbox-show-code-qr" />
                      Mostra codice e QR nella pagina
                    </label>
                  </CardContent>
                </Card>
              )}

              {/* STEP 7: Riepilogo */}
              {activeStep === 6 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#CC9900]">7. Riepilogo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-white">
                      <p><strong>Titolo:</strong> {watch("title") || "Non specificato"}</p>
                      <p><strong>Tipo:</strong> {watch("type")}</p>
                      <p><strong>Periodo:</strong> {
                        watch("startAt") && watch("endAt") 
                          ? `${new Date(watch("startAt")).toLocaleDateString()} - ${new Date(watch("endAt")).toLocaleDateString()}`
                          : "Non specificato"
                      }</p>
                      <p><strong>Max codici:</strong> {watch("maxCodes")}</p>
                      <p><strong>Formato codice:</strong> {watch("codeFormat")}</p>
                      {watch("valueType") !== "none" && (
                        <p><strong>Valore:</strong> {
                          watch("valueType") === "percent" 
                            ? `${watch("valueAmount")}%` 
                            : `€${watch("valueAmount")}`
                        }</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={activeStep === 0}
                  className="border-white/20 text-white hover:bg-white/10"
                  data-testid="button-prev-step"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Indietro
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeWizard}
                    className="border-white/20 text-white hover:bg-white/10"
                    data-testid="button-cancel"
                  >
                    Annulla
                  </Button>

                  {activeStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-[#CC9900] hover:bg-[#CC9900]/80 text-black"
                      data-testid="button-next-step"
                    >
                      Avanti
                      <i className="fas fa-arrow-right ml-2"></i>
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#CC9900] hover:bg-[#CC9900]/80 text-black"
                      data-testid="button-create-promotion"
                      onClick={() => {
                        console.log("Form errors:", errors);
                        console.log("Form is valid:", isValid);
                      }}
                    >
                      {isSubmitting ? "Creando..." : "Crea Promozione"}
                      <i className="fas fa-check ml-2"></i>
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}