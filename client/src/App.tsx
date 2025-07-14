import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AudioUploader } from "@/components/audio-uploader";
import { AuthProvider } from "@/contexts/auth-context";
import { CampaignProvider } from "@/contexts/campaign-context";
import { CampaignSelector } from "@/components/campaign-selector";
import { Route, Switch, useLocation } from "wouter";
import SessionsPage from "@/pages/sessions";
import SessionDetailPage from "@/pages/session-detail";
import PublicSessionPage from "@/pages/public-session";

function App() {
  const [location] = useLocation();
  const isPublicRoute = location.startsWith('/public/');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CampaignProvider>
          <TooltipProvider>
            <Toaster />
            {!isPublicRoute && <CampaignSelector />}
            <Switch>
              <Route path="/public/:sessionId" component={PublicSessionPage} />
              <Route path="/sessions/:sessionId" component={SessionDetailPage} />
              <Route path="/sessions" component={SessionsPage} />
              <Route path="/upload" component={AudioUploader} />
              <Route path="/" component={SessionsPage} />
            </Switch>
          </TooltipProvider>
        </CampaignProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
