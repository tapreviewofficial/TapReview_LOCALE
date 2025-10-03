import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

type FormData = {
  title: string;
  description: string;
  type: "coupon" | "invito" | "omaggio";
  valueKind?: "percent" | "amount";
  value?: number;
  notCumulative: boolean;
  onePerCustomer: boolean;
  startAt: string; // datetime-local
  endAt: string;   // datetime-local
  maxCodes: number;
  usesPerCode: number;
  codeFormat: "short" | "uuid";
  qrMode: "url" | "jwt";
};

async function createPromoApi(payload: any) {
  const res = await fetch("/api/promos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Include cookies for authentication
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Errore creazione promozione");
  }
  return res.json();
}

export default function NewPromoLite() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      type: "coupon",
      valueKind: "percent",
      notCumulative: false,
      onePerCustomer: true,
      startAt: new Date().toISOString().slice(0, 16),
      endAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      maxCodes: 100,
      usesPerCode: 1,
      codeFormat: "short",
      qrMode: "url",
    },
    mode: "onChange",
  });

  const type = watch("type");
  const valueKind = watch("valueKind");

  async function onSubmit(d: FormData) {
    if (!d.title.trim()) return alert("Titolo obbligatorio");
    if (!d.description.trim()) return alert("Descrizione obbligatoria");
    if (d.description.length > 200) return alert("Descrizione max 200 caratteri");

    const start = new Date(d.startAt);
    const end = new Date(d.endAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return alert("Date non valide");
    if (end < start) return alert("La fine deve essere >= inizio");

    if (type === "coupon") {
      if (!d.valueKind) return alert("Seleziona il tipo di valore (%, €)");
      if (!d.value || d.value <= 0) return alert("Inserisci un valore > 0");
      if (d.valueKind === "percent" && d.value > 100) return alert("Percentuale max 100");
    }

    if (d.maxCodes <= 0) return alert("Max codici deve essere > 0");
    if (d.usesPerCode <= 0) return alert("Utilizzi per codice almeno 1");

    // Payload compatibile con API esistente /api/promos
    const payload = {
      title: d.title.trim(),
      description: d.description.trim(),
      type: d.type,
      startAt: d.startAt,
      endAt: d.endAt,
    };

    try {
      await createPromoApi(payload);
      // Invalidate and refetch promos list
      queryClient.invalidateQueries({ queryKey: ["api", "promos"] });
      alert("Promozione creata ✅");
      setOpen(false);
    } catch (e: any) {
      alert(e?.message || "Errore");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold"
      >
        + Nuova Promozione
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-auto">
          <div className="bg-zinc-900 text-white w-full max-w-2xl rounded-lg shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nuova promozione</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Titolo *</label>
                <input className="w-full bg-zinc-800 rounded px-3 py-2" {...register("title", { required: true })} placeholder='es. "-10% primo acquisto"' />
              </div>

              <div>
                <label className="block text-sm mb-1">Descrizione (max 200) *</label>
                <textarea className="w-full bg-zinc-800 rounded px-3 py-2" rows={3} {...register("description", { required: true, maxLength: 200 })} />
                {errors.description?.type === "maxLength" && <p className="text-xs text-red-400 mt-1">Max 200 caratteri</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1">Tipologia *</label>
                  <select className="w-full bg-zinc-800 rounded px-3 py-2" {...register("type", { required: true })}>
                    <option value="coupon">Coupon sconto</option>
                    <option value="invito">Invito evento</option>
                    <option value="omaggio">Omaggio</option>
                  </select>
                </div>

                {watch("type") === "coupon" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm mb-1">Valore</label>
                      <select className="w-full bg-zinc-800 rounded px-3 py-2" {...register("valueKind")}>
                        <option value="percent">% Percentuale</option>
                        <option value="amount">€ Importo fisso</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Importo</label>
                      <input type="number" step="0.01" className="w-full bg-zinc-800 rounded px-3 py-2" {...register("value", { valueAsNumber: true })} placeholder={valueKind === "percent" ? "es. 10" : "es. 5.00"} />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1">Inizio *</label>
                  <input type="datetime-local" className="w-full bg-zinc-800 rounded px-3 py-2" {...register("startAt", { required: true })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Fine *</label>
                  <input type="datetime-local" className="w-full bg-zinc-800 rounded px-3 py-2" {...register("endAt", { required: true })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1">Max codici *</label>
                  <input type="number" className="w-full bg-zinc-800 rounded px-3 py-2" {...register("maxCodes", { required: true, valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Utilizzi per codice *</label>
                  <input type="number" className="w-full bg-zinc-800 rounded px-3 py-2" {...register("usesPerCode", { required: true, valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2"><input type="checkbox" {...register("notCumulative")} /> Non cumulabile</label>
                <label className="flex items-center gap-2"><input type="checkbox" {...register("onePerCustomer")} /> 1 per cliente</label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1">Formato codice</label>
                  <select className="w-full bg-zinc-800 rounded px-3 py-2" {...register("codeFormat")}>
                    <option value="short">Alfanumerico (8–10)</option>
                    <option value="uuid">UUID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">QR payload</label>
                  <select className="w-full bg-zinc-800 rounded px-3 py-2" {...register("qrMode")}>
                    <option value="url">URL</option>
                    <option value="jwt">JWT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700">Annulla</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50">
                  {isSubmitting ? "Salvo…" : "Crea promozione"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}