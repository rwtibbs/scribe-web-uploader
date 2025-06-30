import { Dice6 } from 'lucide-react';
import { LoginForm } from './login-form';
import { UserInfo } from './user-info';
import { SessionForm } from './session-form';
import { useAuth } from '@/hooks/use-auth';

export function AudioUploader() {
  const { isAuthenticated, isLoading, user, renderKey } = useAuth();
  
  // Debug: Track render key changes
  console.log('🔄 AudioUploader render - key:', renderKey, 'authenticated:', isAuthenticated);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-game-accent mx-auto mb-4"></div>
          <p className="text-game-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-game-primary mb-2 flex items-center justify-center">
            <Dice6 className="mr-3 text-game-accent" />
            TabletopScribe
          </h1>
          <p className="text-game-secondary text-lg">Audio Session Uploader</p>
        </div>

        {/* Authentication Container */}
        <div key={`${isAuthenticated ? 'authenticated' : 'unauthenticated'}-${renderKey}`}>
          {!isAuthenticated ? (
            <LoginForm />
          ) : (
            <div className="space-y-6">
              <UserInfo />
              <SessionForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
