import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { CampaignProvider } from "@/contexts/campaign-context";
import { CampaignSelector } from "@/components/campaign-selector";
import { Route, Switch, useLocation } from "wouter";
import PublicSessionPage from "@/pages/public-session";
import MultiUploadPage from "@/pages/multi-upload";

function App() {
  const [location] = useLocation();
  const isPublicRoute = location.startsWith('/share/');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CampaignProvider>
          <TooltipProvider>
            <Toaster />
            <Switch>
              <Route path="/share/:sessionId" component={PublicSessionPage} />
              <Route path="/" component={MultiUploadPage} />
            </Switch>
          </TooltipProvider>
        </CampaignProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
