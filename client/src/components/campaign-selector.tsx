import { useEffect, useState } from 'react';
import { Check, ChevronDown, Dice6, Upload, Plus } from 'lucide-react';
import scribeLogo from '@assets/Main-logo_1752518475604.png';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useCampaign } from '@/contexts/campaign-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
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
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);

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
    <div className="w-full bg-slate-900/95 border-b border-slate-700/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={scribeLogo} 
              alt="Scribe" 
              className="h-8 w-auto"
            />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-game-secondary">Campaign:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-[300px] justify-between bg-slate-800/50 border-slate-600/30 hover:border-game-accent/50",
                      !selectedCampaign && "text-game-secondary"
                    )}
                  >
                    {selectedCampaign ? (
                      <span className="font-medium text-[010101]">{selectedCampaign.name}</span>
                    ) : (
                      <span className="text-game-secondary">Select campaign...</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-slate-800 border-slate-600/30">
                  <Command className="bg-slate-800">
                    <CommandInput 
                      placeholder="Search campaigns..." 
                      className="bg-slate-800 text-game-primary placeholder:text-game-secondary border-0"
                    />
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
          
          <div className="flex items-center gap-2">
            <Popover open={showUploadDropdown} onOpenChange={setShowUploadDropdown}>
              <PopoverTrigger asChild>
                <Button className="bg-game-accent hover:bg-game-hover text-white flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Sessions
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 bg-slate-800 border-slate-600/30" align="end">
                <div className="space-y-1">
                  <Link href="/upload">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-game-primary hover:bg-slate-700/50"
                      onClick={() => setShowUploadDropdown(false)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Single Session
                    </Button>
                  </Link>
                  <Link href="/multi-upload">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-game-primary hover:bg-slate-700/50"
                      onClick={() => setShowUploadDropdown(false)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Multiple Sessions
                    </Button>
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}