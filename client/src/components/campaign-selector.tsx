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
  const { data: campaigns, isLoading } = useCampaigns(user?.username);

  // Auto-select most recent campaign when campaigns are loaded
  useEffect(() => {
    if (campaigns?.length && !selectedCampaign) {
      autoSelectMostRecent(campaigns);
    }
  }, [campaigns, selectedCampaign, autoSelectMostRecent]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm border border-game-primary/20 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-game-secondary">Campaign:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-[250px] justify-between bg-slate-800/50 border-slate-600/30 hover:border-game-accent/50 text-sm",
                !selectedCampaign && "text-game-secondary"
              )}
            >
              {selectedCampaign ? (
                <span className="font-medium text-white">{selectedCampaign.name}</span>
              ) : (
                <span className="text-game-secondary">Select campaign...</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0 bg-slate-800 border-slate-600/30">
            <Command className="bg-slate-800">
              <CommandList>
                <CommandEmpty className="text-game-secondary p-4 text-center">
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
                      className="hover:bg-slate-700/50 cursor-pointer text-game-primary data-[selected=true]:bg-slate-700/50"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCampaign?.id === campaign.id ? "opacity-100 text-game-accent" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{campaign.name}</span>
                        {campaign.description && (
                          <span className="text-xs text-game-secondary truncate">
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
    </div>
  );
}