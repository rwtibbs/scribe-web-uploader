import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect, useCallback } from "react";
import { useCampaignSessionCounts } from "@/hooks/use-campaign-sessions";
import { graphqlClient } from "@/lib/graphql";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CalendarIcon, FolderIcon, LogOutIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import scribeLogoPath from "@assets/scribeLogo_1753313610468.png";

export default function CampaignCollectionPage() {
  const { isAuthenticated, user, isLoading: authLoading, signOut } = useAuth();
  
  // New robust campaign loading logic
  const [campaignLoadState, setCampaignLoadState] = useState<'initial' | 'loading' | 'ready' | 'retry'>('initial');
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  
  // Get session counts for loaded campaigns
  const campaignIds = campaignData?.map(c => c.id) || [];
  const { data: sessionCounts, isLoading: sessionCountsLoading } = useCampaignSessionCounts(campaignIds);

  // Determine if we should attempt to load campaigns
  const shouldLoadCampaigns = isAuthenticated && 
    user?.username && 
    user?.accessToken && 
    !authLoading && 
    (campaignLoadState === 'initial' || campaignLoadState === 'retry');

  // Robust campaign loading function - memoized to prevent unnecessary re-renders
  const loadCampaignsRobustly = useCallback(async () => {
    if (!user?.username || !user?.accessToken) {
      console.log('⏸️ Campaign loading skipped: Missing auth data');
      return;
    }

    console.log('🚀 Starting robust campaign loading for user:', user.username);
    setCampaignLoadState('loading');
    setCampaignError(null);

    try {
      // Add a small delay for mobile stability
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const campaigns = await graphqlClient.getCampaignsByOwner(user.username, user.accessToken);
      
      console.log('✅ Campaigns loaded successfully:', campaigns.length);
      setCampaignData(campaigns);
      setCampaignLoadState('ready');
      setCampaignError(null);
      setRetryAttempts(0);
      
    } catch (error) {
      console.error('❌ Campaign loading failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load campaigns';
      setCampaignError(errorMessage);
      
      // Retry logic for mobile - use setRetryAttempts callback to avoid stale closure
      setRetryAttempts(prev => {
        const currentAttempts = prev;
        if (currentAttempts < 3) {
          console.log(`🔄 Retrying campaign load (attempt ${currentAttempts + 1}/3)`);
          setCampaignLoadState('retry');
          
          // Progressive retry delays
          const delay = 1000 * Math.pow(2, currentAttempts);
          setTimeout(() => {
            loadCampaignsRobustly();
          }, delay);
          
          return currentAttempts + 1;
        } else {
          console.error('💥 Campaign loading failed after all retries');
          setCampaignLoadState('ready'); // Stop loading state
          return currentAttempts;
        }
      });
    }
  }, [user?.username, user?.accessToken]);

  // Load campaigns when authentication is complete
  // Watch individual auth state variables to ensure we don't miss the access token on mobile
  useEffect(() => {
    if (shouldLoadCampaigns) {
      console.log('✅ All conditions met, loading campaigns...', {
        isAuthenticated,
        username: user?.username,
        hasAccessToken: !!user?.accessToken,
        authLoading,
        campaignLoadState
      });
      loadCampaignsRobustly();
    }
  }, [isAuthenticated, user?.username, user?.accessToken, authLoading, campaignLoadState, loadCampaignsRobustly]);

  const handleLogout = async () => {
    try {
      // Use the signOut method from auth context
      signOut();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.reload();
    }
  };

  // Debug logging for new system
  console.log('🎯 CampaignCollectionPage state:', {
    authLoading,
    isAuthenticated,
    user: user?.username,
    hasAccessToken: !!user?.accessToken,
    campaignLoadState,
    campaignsCount: campaignData?.length,
    campaignIds,
    sessionCounts,
    sessionCountsLoading,
    retryAttempts,
    shouldLoadCampaigns,
    error: campaignError
  });
  
  // Additional debug for session counts
  if (campaignData && campaignData.length > 0) {
    campaignData.forEach(campaign => {
      console.log(`📊 Campaign "${campaign.name}" (${campaign.id}): ${sessionCounts?.[campaign.id] || '?'} sessions`);
    });
  }

  // New loading state logic
  const isShowingLoadingScreen = authLoading || 
    (isAuthenticated && user?.accessToken && campaignLoadState === 'loading') ||
    (isAuthenticated && user?.accessToken && campaignLoadState === 'initial');

  // Show loading state while checking authentication or loading campaigns  
  if (isShowingLoadingScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white mb-2">Loading campaigns...</div>
          <div className="text-white/50 text-sm">
            {authLoading ? 'Authenticating...' : 'Fetching your campaigns'}
          </div>
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
        {campaignError && campaignLoadState === 'ready' && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">Failed to load campaigns</div>
            <p className="text-white/60 text-sm mb-4">{campaignError}</p>
            <Button
              onClick={() => {
                setCampaignLoadState('retry');
                setRetryAttempts(0);
              }}
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State - Only show when we're sure there are no campaigns and not loading */}
        {campaignLoadState === 'ready' && (!campaignData || campaignData.length === 0) && !campaignError && (
          <div className="text-center py-12">
            <FolderIcon className="mx-auto h-16 w-16 text-white/30 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No campaigns found!</h2>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mb-4 text-white border-white/30 hover:bg-white/10"
            >
              Refresh list
            </Button>
            <p className="text-white/60">Create a campaign in the Scribe app to get started with audio uploads</p>
          </div>
        )}

        {/* Campaign Grid - Always show when we have campaigns, regardless of loading state */}
        {campaignData && campaignData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaignData.map((campaign) => (
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