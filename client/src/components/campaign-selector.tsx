import { useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import scribeLogo from '@assets/Main-logo_1752518475604.png';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useCampaign } from '@/contexts/campaign-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export function CampaignSelector() {
  const { user, isAuthenticated } = useAuth();
  const { selectedCampaign, setSelectedCampaign, autoSelectMostRecent } = useCampaign();
  const { data: campaigns, isLoading, error } = useCampaigns(user?.username);

  // Debug logging
  useEffect(() => {
    console.log('CampaignSelector state:', {
      user: user?.username,
      isAuthenticated,
      campaignsCount: campaigns?.length || 0,
      isLoading,
      hasError: !!error,
      selectedCampaign: selectedCampaign?.name
    });
  }, [user, isAuthenticated, campaigns, isLoading, error, selectedCampaign]);

  // Auto-select most recent campaign when campaigns are loaded - more aggressive for mobile
  useEffect(() => {
    if (campaigns?.length && !selectedCampaign) {
      console.log('Auto-selecting campaign from:', campaigns.map(c => c.name));
      // Use setTimeout to ensure this runs after all other effects
      setTimeout(() => {
        autoSelectMostRecent(campaigns);
      }, 100);
    }
  }, [campaigns, selectedCampaign, autoSelectMostRecent]);

  // Additional effect to ensure auto-selection happens even if the first attempt fails
  useEffect(() => {
    if (campaigns?.length && !selectedCampaign && !isLoading) {
      const retryTimeout = setTimeout(() => {
        console.log('Retry auto-selecting campaign for mobile');
        autoSelectMostRecent(campaigns);
      }, 1000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [campaigns, selectedCampaign, isLoading, autoSelectMostRecent]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-game-secondary">Campaign:</span>
      <Popover>
        <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-[250px] justify-between bg-white border-gray-300 hover:border-blue-500 text-sm",
                !selectedCampaign && "text-gray-500"
              )}
            >
              {selectedCampaign ? (
                <span className="font-medium text-gray-900">{selectedCampaign.name}</span>
              ) : isLoading ? (
                <span className="text-gray-500">Loading campaigns...</span>
              ) : (
                <span className="text-gray-500">Select campaign...</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0 bg-white border-gray-200">
            <Command className="bg-white">
              <CommandList>
                <CommandEmpty className="text-gray-500 p-4 text-center">
                  {isLoading ? 'Loading campaigns...' : 'No campaigns found.'}
                </CommandEmpty>
                <CommandGroup>
                  {campaigns?.map((campaign) => (
                    <CommandItem
                      key={campaign.id}
                      value={campaign.name}
                      onSelect={() => {
                        setSelectedCampaign(
                          selectedCampaign?.id === campaign.id ? null : campaign
                        );
                      }}
                      className="hover:bg-gray-100 cursor-pointer text-gray-900 data-[selected=true]:bg-gray-100"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCampaign?.id === campaign.id ? "opacity-100 text-blue-600" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{campaign.name}</span>
                        {campaign.description && (
                          <span className="text-xs text-gray-500 truncate">
                            {campaign.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}