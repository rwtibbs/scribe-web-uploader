import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Campaign } from '@/types/aws';

interface CampaignContextValue {
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign | null) => void;
  autoSelectMostRecent: (campaigns: Campaign[]) => void;
}

const CampaignContext = createContext<CampaignContextValue | undefined>(undefined);

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}

interface CampaignProviderProps {
  children: ReactNode;
}

export function CampaignProvider({ children }: CampaignProviderProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(() => {
    // Clear any cached campaign data when starting fresh - ensures no cross-environment contamination
    localStorage.removeItem('selectedCampaign');
    return null;
  });

  // Save selected campaign to localStorage with environment validation
  useEffect(() => {
    if (selectedCampaign) {
      // Store campaign with environment context to prevent cross-environment issues
      const campaignWithEnv = {
        ...selectedCampaign,
        _environment: 'production' // Force production environment context
      };
      localStorage.setItem('selectedCampaign', JSON.stringify(campaignWithEnv));
    } else {
      localStorage.removeItem('selectedCampaign');
    }
  }, [selectedCampaign]);

  const autoSelectMostRecent = (campaigns: Campaign[]) => {
    if (campaigns.length > 0) {
      // Filter out deleted campaigns and sort by creation date
      const activeCampaigns = campaigns.filter(campaign => !campaign._deleted);
      if (activeCampaigns.length > 0) {
        const mostRecentCampaign = activeCampaigns.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        // Always auto-select if no campaign is selected, or if the saved campaign doesn't exist in current campaigns
        if (!selectedCampaign || !activeCampaigns.find(c => c.id === selectedCampaign.id)) {
          setSelectedCampaign(mostRecentCampaign);
          console.log('🎯 Auto-selected most recent campaign:', mostRecentCampaign.name, mostRecentCampaign.id);
        }
      }
    }
  };

  const value: CampaignContextValue = {
    selectedCampaign,
    setSelectedCampaign,
    autoSelectMostRecent,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}