import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [username, setUsername] = useState("");
  const { toast } = useToast();

  // Estrai token dall'URL
  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }

    // Verifica validità del token
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset/${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
          setUsername(data.username);
        } else {
          toast({
            title: "Token non valido",
            description: data.error || "Il link di reset non è valido o è scaduto",
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
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve essere almeno di 6 caratteri",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password reimpostata",
          description: "La tua password è stata cambiata con successo",
        });
        setTimeout(() => {
          setLocation('/accedi');
        }, 2000);
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

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="text-[#CC9900] text-4xl mb-4 animate-spin">
                <i className="fas fa-spinner"></i>
              </div>
              <p className="text-white">Verifica del link in corso...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-500">Link Non Valido</CardTitle>
            <CardDescription className="text-white/70">
              Il link di reset password non è valido o è scaduto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-red-500 text-4xl mb-4">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <Button
                onClick={() => setLocation('/forgot-password')}
                className="bg-[#CC9900] hover:bg-[#CC9900]/80 text-black font-medium"
                data-testid="button-request-new-reset"
              >
                Richiedi Nuovo Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Nuova Password</CardTitle>
          <CardDescription className="text-white/70">
            Ciao <strong>{username}</strong>, inserisci la tua nuova password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-white">Nuova Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Almeno 6 caratteri"
                required
                disabled={isLoading}
                data-testid="input-new-password"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-white">Conferma Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la password"
                required
                disabled={isLoading}
                data-testid="input-confirm-password"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm">Le password non corrispondono</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#CC9900] hover:bg-[#CC9900]/80 text-black font-medium"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
              data-testid="button-reset-password"
            >
              {isLoading ? "Salvando..." : "Reimposta Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}