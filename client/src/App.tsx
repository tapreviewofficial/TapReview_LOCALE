import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminBar from "./components/AdminBar";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import PublicProfile from "@/pages/public-profile";
import InvitePage from "@/pages/invite-page";
import TicketPage from "@/pages/ticket";
import ScanPage from "@/pages/scan";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import ForceChangePassword from "@/pages/force-change-password";
import PublicClaimPage from "@/pages/PublicClaim";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/force-change-password" component={ForceChangePassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={Admin} />
      <Route path="/u/:username" component={PublicProfile} />
      <Route path="/invite/:slug" component={InvitePage} />
      <Route path="/ticket/:code" component={TicketPage} />
      <Route path="/q/:code" component={TicketPage} />
      <Route path="/scan" component={ScanPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/p/:username" component={PublicClaimPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminBar />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
