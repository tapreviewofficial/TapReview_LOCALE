import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Email inviata",
          description: data.message,
        });
      } else {
        toast({
          title: "Errore",
          description: data.error || "Si è verificato un errore",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore di connessione. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Recupera Password</CardTitle>
          <CardDescription className="text-white/70">
            Inserisci la tua email per ricevere le istruzioni per reimpostare la password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="la-tua-email@esempio.com"
                  required
                  disabled={isLoading}
                  data-testid="input-reset-email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#CC9900] hover:bg-[#CC9900]/80 text-black font-medium"
                disabled={isLoading || !email.trim()}
                data-testid="button-send-reset"
              >
                {isLoading ? "Invio in corso..." : "Invia Email di Reset"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-green-500 text-4xl mb-4">
                <i className="fas fa-check-circle"></i>
              </div>
              <p className="text-white">
                Se l'email inserita è registrata, riceverai le istruzioni per reimpostare la password.
              </p>
              <p className="text-white/70 text-sm">
                Controlla anche la cartella spam se non vedi l'email.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/accedi">
              <Button variant="link" className="text-[#CC9900] hover:text-[#CC9900]/80" data-testid="link-back-login">
                <i className="fas fa-arrow-left mr-2"></i>
                Torna al Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}