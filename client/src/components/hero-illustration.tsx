export function HeroIllustration() {
  return (
    <div className="flex justify-center">
      <div className="relative">
        {/* Smartphone illustration */}
        <div className="smartphone w-48 h-96 rounded-3xl p-4 shadow-2xl">
          <div className="bg-coal w-full h-full rounded-2xl relative overflow-hidden">
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-muted rounded-full"></div>
            <div className="mt-12 p-4 text-center">
              <div className="text-gold text-2xl font-bold mb-2">TapReview</div>
              <div className="text-xs text-muted-foreground">Lascia una recensione in 10 secondi</div>
            </div>
          </div>
        </div>
        {/* NFC Card illustration */}
        <div className="nfc-card absolute -right-8 -bottom-8 w-32 h-20 rounded-lg shadow-xl p-3">
          <div className="text-gold text-xs font-bold">TapReview</div>
          <div className="mt-2">
            <div className="w-6 h-6 border-2 border-gold rounded-full opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
