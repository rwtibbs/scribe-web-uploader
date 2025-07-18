import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { EnvironmentSwitcher } from './environment-switcher';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(username, password);
    } catch (err) {
      // Error is handled in the hook
    }
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input bg-game-primary/5 border-game-primary/20 text-game-primary placeholder:text-game-secondary/50 pr-10"
                placeholder="Enter your password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-game-secondary hover:text-game-primary" />
                ) : (
                  <Eye className="h-4 w-4 text-game-secondary hover:text-game-primary" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
          </div>

          {/* Environment Switcher */}
          <div className="pt-2 border-t border-game-primary/20">
            <EnvironmentSwitcher />
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
