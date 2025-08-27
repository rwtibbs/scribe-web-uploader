import { useAuth } from "@/contexts/auth-context";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useCampaignSessionCounts } from "@/hooks/use-campaign-sessions";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CalendarIcon, FolderIcon, LogOutIcon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import scribeLogoPath from "@assets/scribeLogo_1753313610468.png";
import { useEffect, useState } from "react";

export default function CampaignCollectionPage() {
  const { isAuthenticated, user, isLoading: authLoading, signOut } = useAuth();
  const { data: campaigns, isLoading: campaignsLoading, error, isFetching, refetch } = useCampaigns(user?.username);
  
  // Get session counts for all campaigns
  const campaignIds = campaigns?.map(c => c.id) || [];
  const { data: sessionCounts, isLoading: sessionCountsLoading } = useCampaignSessionCounts(campaignIds);

  // Mobile loading state management
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Connecting to your account...");

  // More comprehensive loading state for mobile - wait for complete auth state
  const isLoadingCampaigns = authLoading || 
    campaignsLoading || 
    (isAuthenticated && (!user?.accessToken || !user?.username)) || 
    isFetching ||
    // Wait for auth to stabilize on mobile
    (isAuthenticated && user && !campaigns && !error);

  // Track loading duration and auto-refresh
  useEffect(() => {
    if (isLoadingCampaigns && !loadingStartTime) {
      setLoadingStartTime(Date.now());
      setLoadingMessage("Connecting to your account...");
    } else if (!isLoadingCampaigns) {
      setLoadingStartTime(null);
      setHasTriedRefresh(false);
    }
  }, [isLoadingCampaigns, loadingStartTime]);

  // Auto-refresh logic for mobile
  useEffect(() => {
    if (loadingStartTime && isAuthenticated && user?.accessToken) {
      const timer = setTimeout(() => {
        const elapsed = Date.now() - loadingStartTime;
        
        if (elapsed > 3000 && !hasTriedRefresh) {
          // After 3 seconds, try refreshing campaigns
          console.log('📱 Mobile auto-refresh: Attempting to refresh campaigns after 3s delay');
          setLoadingMessage("Refreshing campaigns...");
          setHasTriedRefresh(true);
          refetch();
        } else if (elapsed > 2000) {
          setLoadingMessage("Loading your campaigns...");
        } else if (elapsed > 1000) {
          setLoadingMessage("Authenticating...");
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loadingStartTime, isAuthenticated, user?.accessToken, hasTriedRefresh, refetch]);

  // Force refresh after 6 seconds if still loading
  useEffect(() => {
    if (loadingStartTime && isAuthenticated && user?.accessToken) {
      const forceRefreshTimer = setTimeout(() => {
        const elapsed = Date.now() - loadingStartTime;
        if (elapsed > 6000 && !campaigns) {
          console.log('📱 Mobile force refresh: Reloading page after 6s');
          window.location.reload();
        }
      }, 6000);

      return () => clearTimeout(forceRefreshTimer);
    }
  }, [loadingStartTime, isAuthenticated, user?.accessToken, campaigns]);

  const handleLogout = async () => {
    try {
      // Use the signOut method from auth context
      signOut();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.reload();
    }
  };

  // Debug logging
  console.log('🎯 CampaignCollectionPage state:', {
    authLoading,
    isAuthenticated,
    user: user?.username,
    hasAccessToken: !!user?.accessToken,
    campaignsLoading,
    isFetching,
    isLoadingCampaigns,
    campaignsCount: campaigns?.length,
    campaignIds,
    sessionCounts,
    sessionCountsLoading,
    error: error?.message
  });
  
  // Additional debug for session counts
  if (campaigns && campaigns.length > 0) {
    campaigns.forEach(campaign => {
      console.log(`📊 Campaign "${campaign.name}" (${campaign.id}): ${sessionCounts?.[campaign.id] || '?'} sessions`);
    });
  }

  // Show loading state while checking authentication or loading campaigns
  if (isLoadingCampaigns) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-white mx-auto mb-4 animate-spin" />
          <div className="text-white mb-2 font-medium">{loadingMessage}</div>
          <div className="text-white/50 text-sm">Please wait while we load your data</div>
          {loadingStartTime && (
            <div className="text-white/30 text-xs mt-2">
              {Math.round((Date.now() - loadingStartTime) / 1000)}s elapsed
            </div>
          )}
          {loadingStartTime && (Date.now() - loadingStartTime) > 4000 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-4 text-white border-white/30 hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101]">
      <div className="container mx-auto px-4 py-8">
        {/* Header Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          {/* Left: Scribe Logo */}
          <div>
            <img 
              src={scribeLogoPath} 
              alt="Scribe" 
              className="h-8"
            />
          </div>
          
          {/* Right: Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-white border-white/30 hover:bg-white/10"
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Page Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white mb-4">Audio Uploader</h1>
          <p className="text-white/70">Select a campaign to upload session audio</p>
          {user && (
            <p className="text-white/50 text-sm mt-2">Welcome back, {user.username}</p>
          )}
        </div>

        {/* Loading State - removed as we now handle it at the top level */}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">Failed to load campaigns</div>
            <p className="text-white/60 text-sm">{error.message}</p>
          </div>
        )}

        {/* No Campaigns */}
        {!isLoadingCampaigns && !error && (!campaigns || campaigns.length === 0) && (
          <div className="text-center py-12">
            <FolderIcon className="mx-auto h-16 w-16 text-white/30 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No campaigns found</h2>
            <p className="text-white/60 mb-4">If you believe this is an error, please try refreshing the page</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mb-4 text-white border-white/30 hover:bg-white/10"
            >
              Refresh Page
            </Button>
            <p className="text-white/60">Otherwise, create a campaign in the Scribe app to get started.</p>
          </div>
        )}

        {/* Campaign Grid */}
        {!isLoadingCampaigns && !error && campaigns && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaign/${campaign.id}/upload`}>
                <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-white group-hover:text-white/90">
                      {campaign.name}
                    </CardTitle>
                    {campaign.description && (
                      <CardDescription className="text-white/60 line-clamp-2">
                        {campaign.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Campaign Stats */}
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        {/* Session count */}
                        <div>
                          <span>
                            {sessionCountsLoading ? '...' : `${sessionCounts?.[campaign.id] || 0} sessions`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>



                      {/* Upload Button */}
                      <div className="pt-2">
                        <div className="text-sm text-blue-300 group-hover:text-blue-200">
                          Click to upload sessions →
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}