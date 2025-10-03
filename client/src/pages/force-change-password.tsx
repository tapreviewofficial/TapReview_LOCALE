import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password corrente richiesta"),
  newPassword: z.string().min(6, "La nuova password deve essere almeno 6 caratteri"),
  confirmPassword: z.string().min(1, "Conferma password richiesta")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"]
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ForceChangePassword() {
  const [, setLocation] = useLocation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Check if user must change password
  const { data: authData, isLoading } = useQuery<{ user: { id: number; email: string; username: string; mustChangePassword?: boolean } }>({
    queryKey: ["api", "auth", "me"],
  });

  // If user doesn't need to change password, redirect to dashboard
  if (!isLoading && authData?.user && !authData.user.mustChangePassword) {
    setLocation("/dashboard");
    return null;
  }

  // If not authenticated, redirect to login
  if (!isLoading && !authData?.user) {
    setLocation("/login");
    return null;
  }

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      return await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
    },
    onSuccess: () => {
      toast({
        title: "Password cambiata",
        description: "La tua password è stata aggiornata con successo. Ora puoi accedere a tutte le funzionalità.",
      });
      queryClient.invalidateQueries({ queryKey: ["api", "auth", "me"] });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a]">
      <Card className="w-full max-w-md border-[#CC9900]/20 bg-black/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">
            Cambio Password Obbligatorio
          </CardTitle>
          <p className="text-white/60">
            Per motivi di sicurezza, devi cambiare la tua password temporanea prima di continuare
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-6">
            {/* Current Password */}
            <div>
              <Label htmlFor="currentPassword" className="text-white/80">Password Corrente</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="La tua password temporanea"
                  {...form.register("currentPassword")}
                  className="bg-black/50 border-white/20 text-white focus:border-[#CC9900] pr-10"
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  data-testid="button-toggle-current-password"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.currentPassword && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword" className="text-white/80">Nuova Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Minimo 6 caratteri"
                  {...form.register("newPassword")}
                  className="bg-black/50 border-white/20 text-white focus:border-[#CC9900] pr-10"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  data-testid="button-toggle-new-password"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.newPassword && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-white/80">Conferma Nuova Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ripeti la nuova password"
                  {...form.register("confirmPassword")}
                  className="bg-black/50 border-white/20 text-white focus:border-[#CC9900] pr-10"
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-[#CC9900]/10 border border-[#CC9900]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#CC9900] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/80">
                  <p className="font-medium text-[#CC9900] mb-1">Nota sulla Sicurezza</p>
                  <p>
                    La tua password temporanea è stata generata per garantire la sicurezza del tuo account. 
                    Scegli una password sicura che conosci solo tu.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={changePasswordMutation.isPending}
              className="w-full bg-[#CC9900] hover:bg-[#CC9900]/80 text-black font-medium text-lg py-3"
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? "Aggiornamento..." : "Cambia Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}