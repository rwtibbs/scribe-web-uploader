import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getEnvironment, setEnvironment } from '@/lib/aws-config';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentEnvironment, setCurrentEnvironment] = useState(getEnvironment());
  const { signIn, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(username, password);
    } catch (err) {
      // Error is handled in the hook
    }
  };

  const handleEnvironmentToggle = (checked: boolean) => {
    const newEnv = checked ? 'development' : 'production';
    setEnvironment(newEnv);
  };

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-game-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-game-primary">
          Sign In
        </CardTitle>
        <CardDescription className="text-game-secondary">
          Access your TabletopScribe account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-game-primary">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input bg-game-primary/5 border-game-primary/20 text-game-primary placeholder:text-game-secondary/50"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-game-primary">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input bg-game-primary/5 border-game-primary/20 text-game-primary placeholder:text-game-secondary/50"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Environment Toggle */}
          <div className="space-y-2 pt-2 border-t border-game-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-game-secondary" />
                <Label htmlFor="environment" className="text-sm font-medium text-game-secondary">
                  Environment
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${currentEnvironment === 'production' ? 'text-game-primary' : 'text-game-secondary/50'}`}>
                  Production
                </span>
                <Switch
                  id="environment"
                  checked={currentEnvironment === 'development'}
                  onCheckedChange={handleEnvironmentToggle}
                />
                <span className={`text-xs ${currentEnvironment === 'development' ? 'text-game-primary' : 'text-game-secondary/50'}`}>
                  Development
                </span>
              </div>
            </div>
            <p className="text-xs text-game-secondary/70">
              Current: {currentEnvironment === 'production' ? 'Production' : 'Development'} environment
            </p>
          </div>

          {error && (
            <div className="bg-game-error/10 border border-game-error/20 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-game-error mr-2" />
                <span className="text-game-error text-sm">{error}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 bg-game-accent hover:bg-game-hover text-white font-medium"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
