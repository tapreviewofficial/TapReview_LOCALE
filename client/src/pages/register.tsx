import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Shield, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-[#CC9900] to-[#FFD700] rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <CardTitle className="text-2xl">
            Account su Invito
          </CardTitle>
          <p className="text-muted-foreground">
            Gli account TapReview vengono creati su invito per garantire la qualità del servizio
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Messaggio principale */}
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <Mail className="mx-auto mb-2 w-8 h-8 text-[#CC9900]" />
            <h3 className="font-semibold mb-2">Richiedi il tuo Account</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Per attivare il tuo account TapReview, contattaci via email:
            </p>
            <a 
              href="mailto:tapreviewofficial@gmail.com?subject=Richiesta Account TapReview"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#CC9900] hover:bg-[#B8860B] text-black font-medium rounded-lg transition-colors"
              data-testid="button-contact-email"
            >
              tapreviewofficial@gmail.com
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Vantaggi */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-[#CC9900]" />
              Perché su Invito?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#CC9900] rounded-full mt-2 flex-shrink-0"></div>
                <span>Controllo qualità per business affidabili</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#CC9900] rounded-full mt-2 flex-shrink-0"></div>
                <span>Supporto personalizzato durante l'attivazione</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#CC9900] rounded-full mt-2 flex-shrink-0"></div>
                <span>Configurazione ottimizzata per il tuo business</span>
              </li>
            </ul>
          </div>

          {/* Link al login */}
          <div className="pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Hai già un account?
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full" data-testid="link-login">
                Accedi al tuo Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
