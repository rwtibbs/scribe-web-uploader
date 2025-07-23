import { useAuth } from "@/contexts/auth-context";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useCampaignSessionCounts } from "@/hooks/use-campaign-sessions";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CalendarIcon, FolderIcon, LogOutIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import scribeLogoPath from "@assets/Scribe-icon-1_1752518449942.png";

export default function CampaignCollectionPage() {
  const { isAuthenticated, user, isLoading: authLoading, signOut } = useAuth();
  const campaignsQuery = useCampaigns(user?.username);
  const { data: campaigns, isLoading: campaignsLoading, error, isFetching } = campaignsQuery || {};
  
  // Get session counts for all campaigns
  const campaignIds = campaigns?.map(c => c.id) || [];
  const { data: sessionCounts, isLoading: sessionCountsLoading } = useCampaignSessionCounts(campaignIds);

  // More comprehensive loading state for mobile
  const isLoadingCampaigns = authLoading || campaignsLoading || (isAuthenticated && !user?.accessToken) || isFetching;

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
        <div className="text-white">Loading...</div>
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
        {/* Header with Logo and Logout */}
        <div className="flex items-center justify-between mb-8">
          {/* Left spacer */}
          <div className="w-24"></div>
          
          {/* Center Logo and Title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img 
                src={scribeLogoPath} 
                alt="Scribe" 
                className="h-12 w-12"
              />
              <h1 className="text-4xl font-bold text-white">Your Campaigns</h1>
            </div>
            <p className="text-white/70">Select a campaign to upload session audio</p>
            {user && (
              <p className="text-white/50 text-sm mt-2">Welcome back, {user.username}</p>
            )}
          </div>
          
          {/* Right Logout Button */}
          <div className="w-24 flex justify-end">
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
            <p className="text-white/60">Create a campaign in TabletopScribe to get started</p>
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