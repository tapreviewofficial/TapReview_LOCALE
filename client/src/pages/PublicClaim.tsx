import React, { useEffect, useState } from "react";
import { useParams } from "wouter";

export default function PublicClaimPage() {
  const { username } = useParams();
  const [promo, setPromo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => { (async () => {
    // Fetch both promo and profile data
    const [promoResponse, profileResponse] = await Promise.all([
      fetch(`/api/public/${username}/active-promo`),
      fetch(`/api/public/${username}`)
    ]);
    
    const promoData = await promoResponse.json();
    const profileData = await profileResponse.json();
    
    setPromo(promoData);
    setProfile(profileData);
  })(); }, [username]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = { 
      name: fd.get("name")?.toString(), 
      surname: fd.get("surname")?.toString(), 
      email: fd.get("email")?.toString() 
    };
    const r = await fetch(`/api/public/${username}/claim`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(body) 
    });
    if (r.ok) setSent(true); else alert("Errore invio");
  }

  if (!promo || !profile) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white">Caricamento…</div>
    </div>
  );
  
  if (!promo.active) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white">Nessuna promozione attiva.</div>
    </div>
  );

  // Get display name or fallback to username
  const displayName = profile.displayName || username || 'Business';
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-white text-xl font-medium">
            Pagina Promozioni (/p/{username})
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-[#1a2332] rounded-xl p-8 shadow-2xl border border-white/10">
          {/* Avatar Circle */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#CC9900] rounded-full flex items-center justify-center">
              <span className="text-black text-2xl font-bold">{firstLetter}</span>
            </div>
          </div>

          {/* Business Name */}
          <div className="text-center mb-2">
            <h2 className="text-[#CC9900] text-2xl font-bold">{displayName}</h2>
          </div>

          {/* Subtitle */}
          <div className="text-center mb-8">
            <p className="text-white/70 text-sm">Partecipa alle nostre promozioni!</p>
          </div>

          {!sent ? (
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Nome</label>
                <input 
                  name="name" 
                  placeholder="Il tuo nome..."
                  className="w-full bg-[#2a3441] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#CC9900] focus:outline-none focus:ring-1 focus:ring-[#CC9900]/50 transition-colors" 
                  required 
                />
              </div>

              {/* Cognome */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Cognome</label>
                <input 
                  name="surname" 
                  placeholder="Il tuo cognome..."
                  className="w-full bg-[#2a3441] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#CC9900] focus:outline-none focus:ring-1 focus:ring-[#CC9900]/50 transition-colors" 
                  required 
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="la.tua@email.com"
                  className="w-full bg-[#2a3441] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#CC9900] focus:outline-none focus:ring-1 focus:ring-[#CC9900]/50 transition-colors" 
                  required 
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                className="w-full bg-[#CC9900] hover:bg-[#CC9900]/90 text-black font-semibold py-4 rounded-lg transition-colors mt-6"
              >
                Partecipa alla Promozione
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 text-2xl">📩</span>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Email Inviata!</h3>
              <p className="text-white/70">Controlla la tua email per ricevere il QR code della promozione.</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-white/10">
            <p className="text-white/40 text-xs">
              Powered by <span className="text-[#CC9900]">TapReview</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}