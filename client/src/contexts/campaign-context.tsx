import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Campaign } from '@/types/aws';
import { getEnvironment } from '@/lib/aws-config';

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
    // Load from localStorage on initial load, but validate environment context
    const currentEnvironment = getEnvironment();
    const saved = localStorage.getItem(`selectedCampaign_${currentEnvironment}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.warn('Invalid cached campaign data:', e);
      }
    }
    return null;
  });

  // Save selected campaign to localStorage with environment-specific key
  useEffect(() => {
    const currentEnvironment = getEnvironment();
    if (selectedCampaign) {
      localStorage.setItem(`selectedCampaign_${currentEnvironment}`, JSON.stringify(selectedCampaign));
    } else {
      localStorage.removeItem(`selectedCampaign_${currentEnvironment}`);
    }
  }, [selectedCampaign]);

  const autoSelectMostRecent = (campaigns: Campaign[]) => {
    console.log('🎯 autoSelectMostRecent called with:', campaigns.length, 'campaigns, current selected:', selectedCampaign?.name);
    
    if (!campaigns || campaigns.length === 0) {
      console.log('🎯 No campaigns provided, cannot auto-select');
      return;
    }
    
    // Filter out deleted campaigns and sort by creation date
    const activeCampaigns = campaigns.filter(campaign => !campaign._deleted);
    console.log('🎯 Active campaigns after filtering:', activeCampaigns.length);
    
    if (activeCampaigns.length > 0) {
      const mostRecentCampaign = activeCampaigns.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      console.log('🎯 Most recent campaign:', mostRecentCampaign.name);
      
      // Always auto-select if no campaign is selected, or if the saved campaign doesn't exist in current campaigns
      if (!selectedCampaign || !activeCampaigns.find(c => c.id === selectedCampaign.id)) {
        console.log('🎯 Setting selected campaign to:', mostRecentCampaign.name);
        
        // Immediate selection for better mobile experience
        setSelectedCampaign(mostRecentCampaign);
        console.log('🎯 Auto-selected most recent campaign:', mostRecentCampaign.name, mostRecentCampaign.id);
      } else {
        console.log('🎯 Campaign already selected, not changing');
      }
    } else {
      console.log('🎯 No active campaigns found after filtering');
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