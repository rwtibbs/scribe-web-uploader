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
    // Load from localStorage on initial load
    const saved = localStorage.getItem('selectedCampaign');
    return saved ? JSON.parse(saved) : null;
  });

  // Save selected campaign to localStorage
  useEffect(() => {
    if (selectedCampaign) {
      localStorage.setItem('selectedCampaign', JSON.stringify(selectedCampaign));
    } else {
      localStorage.removeItem('selectedCampaign');
    }
  }, [selectedCampaign]);

  const autoSelectMostRecent = (campaigns: Campaign[]) => {
    if (!selectedCampaign && campaigns.length > 0) {
      // Filter out deleted campaigns and sort by creation date
      const activeCampaigns = campaigns.filter(campaign => !campaign._deleted);
      const mostRecentCampaign = activeCampaigns.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      setSelectedCampaign(mostRecentCampaign);
      console.log('🎯 Auto-selected most recent campaign:', mostRecentCampaign.name, mostRecentCampaign.id);
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