import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { getEnvironment, setEnvironment } from '@/lib/aws-config';
import { useState } from 'react';

export function EnvironmentSwitcher() {
  const [currentEnv, setCurrentEnv] = useState<'production' | 'development'>(getEnvironment());

  const handleEnvironmentSwitch = (env: 'production' | 'development') => {
    setCurrentEnv(env);
    setEnvironment(env);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Settings className="h-4 w-4 text-game-secondary" />
      <span className="text-game-secondary">Environment:</span>
      <div className="flex gap-1">
        <Button
          variant={currentEnv === 'production' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleEnvironmentSwitch('production')}
          className={
            currentEnv === 'production' 
              ? 'bg-game-accent hover:bg-game-hover text-white text-xs px-2 py-1 h-7' 
              : 'border-game-primary/30 hover:border-game-primary/50 text-game-primary text-xs px-2 py-1 h-7'
          }
        >
          Production
        </Button>
        <Button
          variant={currentEnv === 'development' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleEnvironmentSwitch('development')}
          className={
            currentEnv === 'development' 
              ? 'bg-game-accent hover:bg-game-hover text-white text-xs px-2 py-1 h-7' 
              : 'border-game-primary/30 hover:border-game-primary/50 text-game-primary text-xs px-2 py-1 h-7'
          }
        >
          Development
        </Button>
      </div>
    </div>
  );
}