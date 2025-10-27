import { useAuth } from "@/contexts/auth-context";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useCampaignSessionCounts } from "@/hooks/use-campaign-sessions";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CalendarIcon, FolderIcon, LogOutIcon } from "lucide-react";
import scribeLogoPath from "@assets/scribeLogo_1753313610468.png";
import { queryClient } from "@/lib/queryClient";

export default function CampaignCollectionPage() {
  const { isAuthenticated, user, isLoading: authLoading, signOut } = useAuth();
  
  // Use React Query's useCampaigns hook - it handles all retry logic and timing
  const { 
    data: campaigns, 
    isLoading: campaignsLoading, 
    error: campaignsError,
    isFetching: campaignsFetching
  } = useCampaigns(user?.username);
  
  // Get session counts for loaded campaigns
  const campaignIds = campaigns?.map(c => c.id) || [];
  const { data: sessionCounts, isLoading: sessionCountsLoading } = useCampaignSessionCounts(campaignIds);

  const handleLogout = async () => {
    try {
      signOut();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.reload();
    }
  };

  const handleRefresh = () => {
    // Invalidate and refetch campaigns
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  };

  // Debug logging
  console.log('🎯 CampaignCollectionPage state:', {
    authLoading,
    isAuthenticated,
    user: user?.username,
    hasAccessToken: !!user?.accessToken,
    campaignsLoading,
    campaignsFetching,
    campaignsCount: campaigns?.length || 0,
    hasError: !!campaignsError,
    errorMessage: campaignsError?.message
  });

  // Show loading screen while auth is loading OR campaigns are loading for the first time
  // Use both isLoading (no data yet) and isFetching to ensure we show loading on initial load
  const isInitialLoad = authLoading || (isAuthenticated && campaignsLoading);
  
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101] flex items-center justify-center">
        <div className="text-center" data-testid="loading-campaigns">
          <div className="text-white mb-2" data-testid="text-loading-title">Loading campaigns...</div>
          <div className="text-white/50 text-sm" data-testid="text-loading-status">
            {authLoading ? 'Authenticating...' : 'Fetching your campaigns...'}
          </div>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated (only after loading is complete)
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
            data-testid="button-logout"
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

        {/* Error State */}
        {campaignsError && (
          <div className="text-center py-12" data-testid="error-state-campaigns">
            <div className="text-red-400 mb-4">Failed to load campaigns</div>
            <p className="text-white/60 text-sm mb-4">{campaignsError.message}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10"
              data-testid="button-retry"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State - Only show when we have successfully loaded but found no campaigns */}
        {!campaignsError && campaigns && campaigns.length === 0 && (
          <div className="text-center py-12" data-testid="empty-state-campaigns">
            <FolderIcon className="mx-auto h-16 w-16 text-white/30 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2" data-testid="text-no-campaigns">No campaigns found!</h2>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="mb-4 text-white border-white/30 hover:bg-white/10"
              data-testid="button-refresh-list"
            >
              Refresh list
            </Button>
            <p className="text-white/60" data-testid="text-empty-hint">Create a campaign in the Scribe app to get started with audio uploads</p>
          </div>
        )}

        {/* Campaign Grid - Show when we have campaigns */}
        {campaigns && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="campaigns-grid">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaign/${campaign.id}/upload`}>
                <Card 
                  className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer group"
                  data-testid={`card-campaign-${campaign.id}`}
                >
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
