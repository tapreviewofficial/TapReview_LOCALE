import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password richiesta"),
});

const registerSchema = z.object({
  email: z.string().email("Email non valida"),
  username: z.string().min(3, "Username deve essere almeno 3 caratteri").regex(/^[a-zA-Z0-9_]+$/, "Username può contenere solo lettere, numeri e underscore"),
  password: z.string().min(6, "Password deve essere almeno 6 caratteri"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface AuthFormProps {
  type: "login" | "register";
}

export function AuthForm({ type }: AuthFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isLogin = type === "login";
  
  const form = useForm<LoginForm | RegisterForm>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: isLogin ? { email: "", password: "" } : { email: "", username: "", password: "" },
  });

  const authMutation = useMutation({
    mutationFn: async (data: LoginForm | RegisterForm) => {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      return await apiRequest("POST", endpoint, data);
    },
    onSuccess: (response) => {
      toast({
        title: isLogin ? "Accesso effettuato" : "Account creato",
        description: isLogin ? "Benvenuto!" : "Il tuo account è stato creato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["api", "auth", "me"] });
      
      // Check if user must change password (only for login)
      if (isLogin && response?.user?.mustChangePassword) {
        setLocation("/force-change-password");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm | RegisterForm) => {
    authMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isLogin ? "Accedi al tuo account" : "Crea il tuo account"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isLogin ? "Gestisci i tuoi link TapReview" : "Inizia a raccogliere più recensioni oggi"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="la-tua-email@example.com"
                {...form.register("email")}
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            {!isLogin && (
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  {...form.register("username" as keyof (LoginForm | RegisterForm))}
                  data-testid="input-username"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Il tuo username sarà usato per la pagina pubblica: tapreview.it/u/username
                </p>
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.username.message}</p>
                )}
              </div>
            )}
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={isLogin ? "La tua password" : "Scegli una password sicura"}
                {...form.register("password")}
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="btn-gold w-full"
              disabled={authMutation.isPending}
              data-testid="button-submit"
            >
              {authMutation.isPending ? "Attendere..." : (isLogin ? "Accedi" : "Crea account")}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setLocation("/forgot-password")}
                className="text-sm text-muted-foreground hover:text-gold hover:underline"
                data-testid="link-forgot-password"
              >
                Hai dimenticato la password?
              </button>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Non hai un account? " : "Hai già un account? "}
              <button
                onClick={() => setLocation(isLogin ? "/register" : "/login")}
                className="text-gold hover:underline"
                data-testid="link-switch-auth"
              >
                {isLogin ? "Registrati" : "Accedi"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
