import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Campaign } from '@/types/aws';

interface CampaignContextValue {
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign | null) => void;
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
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Save selected campaign to localStorage
  useEffect(() => {
    if (selectedCampaign) {
      localStorage.setItem('selectedCampaign', JSON.stringify(selectedCampaign));
    } else {
      localStorage.removeItem('selectedCampaign');
    }
  }, [selectedCampaign]);

  // Load selected campaign from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedCampaign');
    if (saved) {
      try {
        setSelectedCampaign(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse saved campaign:', error);
        localStorage.removeItem('selectedCampaign');
      }
    }
  }, []);

  const value: CampaignContextValue = {
    selectedCampaign,
    setSelectedCampaign,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}