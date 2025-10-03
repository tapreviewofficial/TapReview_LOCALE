import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { HeroIllustration } from "@/components/hero-illustration";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6 text-center lg:text-left">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight" data-testid="text-hero-title">
                  <span className="text-gold">TapReview</span>
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
                  Le recensioni sono il tuo{" "}
                  <span className="text-gold">biglietto da visita</span>
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground" data-testid="text-hero-subtitle">
                  Noi le trasformiamo nel tuo strumento di crescita.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button className="btn-gold text-lg px-8 py-4 w-full sm:w-auto" data-testid="button-activate">
                    Attiva TapReview Oggi Stesso
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" className="text-lg px-8 py-4 w-full sm:w-auto" data-testid="button-login">
                    Ho già un account
                  </Button>
                </Link>
              </div>
            </div>
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* Cosa uccide i Tuoi Profitti Section */}
      <section className="px-4 py-16 bg-secondary">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4" data-testid="text-problems-title">
            Cosa uccide i Tuoi Profitti:
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <Card className="p-8 border-l-4 border-l-gold">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="text-gold text-3xl">📊</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Il 90% dei clienti sceglie un locale basandosi sulle recensioni online</h3>
                    <p className="text-muted-foreground">Ma la maggior parte dei proprietari non lo sa e perde clienti ogni giorno</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-8 border-l-4 border-l-gold">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="text-gold text-3xl">🔍</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Le recensioni sono frammentate su mille piattaforme diverse</h3>
                    <p className="text-muted-foreground">Google, TripAdvisor, TheFork: i clienti devono cercare ovunque</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-l-4 border-l-gold">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="text-gold text-3xl">⭐</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Molti locali raccolgono pochissime recensioni</h3>
                    <p className="text-muted-foreground">Risultato: perdono clienti senza nemmeno rendersene conto</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-l-4 border-l-gold">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="text-gold text-3xl">⏰</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Cercare recensioni online richiede tempo</h3>
                    <p className="text-muted-foreground">I passanti rinunciano e vanno dai concorrenti più visibili</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TapReview: La Soluzione Section */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4" data-testid="text-solution-title">
              TapReview: La Soluzione che <span className="text-gold">Cambia Tutto</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Un sistema semplice, elegante e potente che rivoluziona il modo in cui raccogli recensioni:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-bold mb-4 text-gold">Trasforma ogni cliente in possibile recensore</h3>
                <p className="text-lg">Card NFC premium: 10 secondi per lasciare una recensione</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-xl font-bold mb-4 text-gold">Crescita esponenziale</h3>
                <p className="text-lg">Più recensioni su Google e TripAdvisor automaticamente</p>
              </CardContent>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="text-6xl mb-4">🔗</div>
                <h3 className="text-xl font-bold mb-4 text-gold">Pagina multilink elegante</h3>
                <p className="text-lg">Tutte le tue recensioni in un posto solo</p>
              </CardContent>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-4 text-gold">Promozioni personalizzate</h3>
                <p className="text-lg">Per fidelizzare i clienti e creare un database</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Come Funziona Section */}
      <section className="px-4 py-16 bg-secondary">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4" data-testid="text-how-it-works-title">
            Come Funziona: <span className="text-gold">Semplicità Rivoluzionaria</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="bg-gold text-coal w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">01</div>
                <h3 className="text-lg font-bold mb-2">Il cliente riceve la card TapReview</h3>
                <p className="text-muted-foreground">Al tavolo o alla cassa, un gesto elegante che fa la differenza</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="bg-gold text-coal w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">02</div>
                <h3 className="text-lg font-bold mb-2">Scansione NFC istantanea</h3>
                <p className="text-muted-foreground">In 10 secondi può lasciare la sua recensione</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="bg-gold text-coal w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">03</div>
                <h3 className="text-lg font-bold mb-2">Pubblicazione automatica</h3>
                <p className="text-muted-foreground">La recensione appare su Google, TripAdvisor e tutte le piattaforme</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="bg-gold text-coal w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">04</div>
                <h3 className="text-lg font-bold mb-2">Crescita esponenziale</h3>
                <p className="text-muted-foreground">Ogni recensione aumenta visibilità, fiducia e nuovi clienti</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="bg-gold text-coal w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">05</div>
                <h3 className="text-lg font-bold mb-2">Database clienti</h3>
                <p className="text-muted-foreground">Genera un database clienti per ricontattarli e farli tornare</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <div className="bg-gold text-coal w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">06</div>
                <h3 className="text-lg font-bold mb-2">Effetto moltiplicatore</h3>
                <p className="text-muted-foreground">I passanti vedono la targhetta TapReview → fiducia immediata</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefici Concreti Section */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4" data-testid="text-benefits-title">
            I Benefici Concreti per il <span className="text-gold">Tuo Locale</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="text-gold text-4xl">💰</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gold">Più Recensioni = Più Fatturato</h3>
                    <p className="text-lg">Ogni recensione in più porta clienti nuovi. È matematica: più visibilità = più incassi.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="text-gold text-4xl">⚡</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gold">Zero Complicazioni</h3>
                    <p className="text-lg">Pronto in 24 ore. Nessuna gestione tecnica, nessun mal di testa.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="text-gold text-4xl">👑</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gold">Immagine Premium Istantanea</h3>
                    <p className="text-lg">Card eleganti e targhetta certificata comunicano professionalità e innovazione ai tuoi clienti.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="text-gold text-4xl">🚀</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gold">Differenziazione Immediata</h3>
                    <p className="text-lg">Chi non ha TapReview appare meno affidabile. Tu sarai sempre un passo avanti.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Perché Aspettare Section */}
      <section className="px-4 py-16 bg-secondary">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12" data-testid="text-why-wait-title">
            Perché <span className="text-gold">Aspettare?</span>
          </h2>
          
          <div className="space-y-6">
            <Card className="p-8 border-l-4 border-l-gold">
              <CardContent className="p-0">
                <div className="flex items-center gap-4">
                  <div className="text-gold text-3xl">👥</div>
                  <p className="text-xl font-semibold">I tuoi clienti già guardano le recensioni</p>
                </div>
                <p className="text-lg text-muted-foreground mt-2 ml-16">TapReview ti rende più visibile di tutti i concorrenti</p>
              </CardContent>
            </Card>

            <Card className="p-8 border-l-4 border-l-gold">
              <CardContent className="p-0">
                <div className="flex items-center gap-4">
                  <div className="text-gold text-3xl">⚡</div>
                  <p className="text-xl font-semibold">Investimento minimo, ritorno immediato</p>
                </div>
                <p className="text-lg text-muted-foreground mt-2 ml-16">I primi risultati si vedono dalla prima settimana</p>
              </CardContent>
            </Card>

            <Card className="p-8 border-l-4 border-l-gold">
              <CardContent className="p-0">
                <div className="flex items-center gap-4">
                  <div className="text-gold text-3xl">⭐</div>
                  <p className="text-xl font-semibold">Effetto "status symbol"</p>
                </div>
                <p className="text-lg text-muted-foreground mt-2 ml-16">Se non hai TapReview, sembri indietro rispetto ai concorrenti</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-16 bg-gradient-to-r from-coal to-gray-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6" data-testid="text-final-cta-title">
            Porta il Tuo Locale al <span className="text-gold">Livello Successivo</span>
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-gold">
            Attiva TapReview Oggi Stesso
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8 text-left">
            <Card className="p-6 bg-background/10 border-gold/20">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gold text-coal w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                  <h4 className="text-lg font-semibold text-white">Non perdere nemmeno un giorno di recensioni in più</h4>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 bg-background/10 border-gold/20">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gold text-coal w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                  <h4 className="text-lg font-semibold text-white">Ricevi Tutto Subito</h4>
                </div>
                <p className="text-muted-foreground ml-11">Card personalizzate + pagina multilink premium + targhetta certificata</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="btn-gold text-xl px-12 py-6 w-full sm:w-auto font-bold" data-testid="button-final-cta">
                Attiva TapReview Ora
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="text-xl px-8 py-6 w-full sm:w-auto border-gold text-gold hover:bg-gold hover:text-coal" data-testid="button-final-login">
                Accedi al tuo account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-gold to-yellow-600"></div>
              <span className="text-xl font-bold text-gold">TapReview</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>📧</span>
                <span>tapreviewofficial@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🌐</span>
                <span>www.tapreview.it</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 TapReview. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}