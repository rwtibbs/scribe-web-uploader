import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { Route, Switch } from "wouter";
import PublicSessionPage from "@/pages/public-session";
import CampaignCollectionPage from "@/pages/campaign-collection";
import CampaignUploadPage from "@/pages/campaign-upload";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/share/:sessionId" component={PublicSessionPage} />
            <Route path="/campaign/:campaignId/upload" component={CampaignUploadPage} />
            <Route path="/" component={CampaignCollectionPage} />
          </Switch>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
