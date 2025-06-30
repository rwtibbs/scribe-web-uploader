import { Dice6 } from 'lucide-react';
import logoPath from '@assets/Main-logo_1751318189156.png';
import { LoginForm } from './login-form';
import { UserInfo } from './user-info';
import { SessionForm } from './session-form';
import { useAuth } from '@/hooks/use-auth';

export function AudioUploader() {
  const { isAuthenticated, isLoading } = useAuth();

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
          <div className="flex items-center justify-center mb-4">
            <img 
              src={logoPath} 
              alt="TabletopScribe Logo" 
              className="h-16 w-auto"
            />
          </div>
          <p className="text-game-secondary text-lg mb-4">Audio Session Uploader</p>
          <p className="text-game-secondary text-sm max-w-lg mx-auto">
            Upload your audio file here to save it to your campaign. Once uploaded, you can access it on the New Session page in the app to customize your session details and submit for processing.
          </p>
        </div>

        {/* Authentication Container */}
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
  );
}
