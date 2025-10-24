import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { AuthService } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';

export function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');
        
        const tokens = AuthService.parseOAuthResponse();
        
        if (!tokens) {
          console.error('❌ No tokens found in OAuth response');
          setLocation('/');
          return;
        }

        const authUser = await AuthService.getUserFromToken(tokens.accessToken, tokens.idToken);
        
        localStorage.setItem('cognito_tokens', JSON.stringify({
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          user: authUser,
        }));

        console.log('✅ OAuth authentication complete, redirecting...');
        
        window.location.href = '/';
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        setLocation('/');
      }
    };

    if (window.location.hash) {
      handleOAuthCallback();
    } else if (user) {
      setLocation('/');
    }
  }, [setLocation, user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-game-accent"></div>
        <p className="mt-4 text-game-primary">Completing sign in...</p>
      </div>
    </div>
  );
}
