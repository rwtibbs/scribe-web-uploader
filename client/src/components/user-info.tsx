import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function UserInfo() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-game-primary/20">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-game-accent rounded-full flex items-center justify-center mr-3">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-game-primary">{user.username}</p>
              <p className="text-sm text-game-secondary">Authenticated</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-game-secondary hover:text-game-primary transition-colors"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
