import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AudioUploader } from "@/components/audio-uploader";
import { AuthProvider } from "@/contexts/auth-context";
import { Route, Switch } from "wouter";
import SessionsPage from "@/pages/sessions";
import SessionDetailPage from "@/pages/session-detail";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/sessions/:sessionId" component={SessionDetailPage} />
            <Route path="/sessions" component={SessionsPage} />
            <Route path="/upload" component={AudioUploader} />
            <Route path="/" component={AudioUploader} />
          </Switch>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
