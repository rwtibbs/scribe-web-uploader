import { useAuth } from "@/contexts/auth-context";
import { useCampaigns } from "@/hooks/use-campaigns";
import { LoginForm } from "@/components/login-form";
import { MultiSessionForm } from "@/components/multi-session-form";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { ArrowLeftIcon, FolderIcon, LogOutIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo } from "react";
import scribeLogoPath from "@assets/Scribe-icon-1_1752518449942.png";

export default function CampaignUploadPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { isAuthenticated, user, isLoading: authLoading, logout } = useAuth();
  const { data: campaigns, isLoading: campaignsLoading, error } = useCampaigns(user?.username);

  const handleLogout = () => {
    logout();
  };

  // Find the specific campaign
  const campaign = useMemo(() => {
    if (!campaigns || !campaignId) return null;
    return campaigns.find(c => c.id === campaignId);
  }, [campaigns, campaignId]);

  // Force fresh data fetch when campaign changes
  useEffect(() => {
    console.log('🎯 CampaignUploadPage mounted for campaign:', campaignId);
    
    // Clear any potential localStorage state to ensure fresh start
    localStorage.removeItem('selectedCampaign');
    
    return () => {
      console.log('🎯 CampaignUploadPage unmounted for campaign:', campaignId);
    };
  }, [campaignId]);

  // Show loading state while checking authentication
  if (authLoading) {
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

  // Show loading state while fetching campaigns
  if (campaignsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex items-center gap-4 mb-8">
              <Skeleton className="h-10 w-10 bg-white/20" />
              <Skeleton className="h-8 w-64 bg-white/20" />
            </div>
            
            {/* Form Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-64 w-full bg-white/10" />
              <Skeleton className="h-32 w-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/">
              <Button variant="outline" className="mb-8">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
            <div className="text-red-400 mb-4">Failed to load campaigns</div>
            <p className="text-white/60 text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show campaign not found
  if (!campaignsLoading && (!campaign || !campaigns)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/">
              <Button variant="outline" className="mb-8">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
            <FolderIcon className="mx-auto h-16 w-16 text-white/30 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Campaign not found</h2>
            <p className="text-white/60">The campaign you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  // Render upload form for valid campaign
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  All Campaigns
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{campaign?.name}</h1>
                <p className="text-white/60 text-sm">Upload session audio files</p>
              </div>
            </div>
            
            {/* Center Logo */}
            <div className="flex items-center gap-2">
              <img 
                src={scribeLogoPath} 
                alt="Scribe" 
                className="h-8 w-8"
              />
            </div>
            
            {/* Right Logout Button */}
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

          {/* Upload Form */}
          <div className="bg-white/5 rounded-lg border border-white/10 p-6">
            <MultiSessionForm 
              campaignId={campaignId!}
              campaignName={campaign?.name || 'Unknown Campaign'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}