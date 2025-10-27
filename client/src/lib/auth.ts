import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';
import { getAwsConfig } from './aws-config';
import { AuthUser } from '@shared/schema';

const getUserPool = () => {
  const config = getAwsConfig();
  return new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.userPoolClientId,
  });
};

const getRedirectUri = () => {
  return `${window.location.origin}/oauth-callback`;
};

export class AuthService {
  static async signIn(username: string, password: string): Promise<AuthUser> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: getUserPool(),
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const accessToken = result.getAccessToken().getJwtToken();
          const payload = result.getAccessToken().payload;
          
          console.log('✅ Authentication successful');
          resolve({
            username,
            sub: payload.sub,
            accessToken,
          });
        },
        onFailure: (err) => {
          console.error('❌ Authentication failed:', err);
          reject(new Error(err.message || 'Authentication failed'));
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          console.log('🔐 New password required for user');
          reject(new Error('Password change required. Please contact administrator.'));
        },
        mfaRequired: (challengeName, challengeParameters) => {
          console.log('🔐 MFA required');
          reject(new Error('Multi-factor authentication required.'));
        },
        customChallenge: (challengeParameters) => {
          console.log('🔐 Custom challenge required');
          reject(new Error('Custom authentication challenge required.'));
        }
      });
    });
  }

  static getCurrentUser(): CognitoUser | null {
    return getUserPool().getCurrentUser();
  }

  static async getCurrentSession(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      const cognitoUser = this.getCurrentUser();
      
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: any, session: any) => {
        if (err) {
          console.log('🔐 Session error:', err.message);
          resolve(null);
          return;
        }
        
        if (!session || !session.isValid()) {
          console.log('🔐 Session invalid or expired');
          resolve(null);
          return;
        }

        const accessToken = session.getAccessToken().getJwtToken();
        const payload = session.getAccessToken().payload;

        resolve({
          username: cognitoUser.getUsername(),
          sub: payload.sub,
          accessToken,
        });
      });
    });
  }

  static signOut(): void {
    const cognitoUser = this.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  }

  static signInWithGoogle(): void {
    const config = getAwsConfig();
    const redirectUri = getRedirectUri();
    
    const oauthUrl = `${config.cognitoDomain}/oauth2/authorize?` +
      `identity_provider=Google&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=TOKEN&` +
      `client_id=${config.userPoolClientId}&` +
      `scope=openid email profile`;
    
    console.log('🔐 Redirecting to Google OAuth:', oauthUrl);
    
    if (window.top) {
      window.top.location.href = oauthUrl;
    } else {
      window.location.href = oauthUrl;
    }
  }

  static parseOAuthResponse(): { accessToken: string; idToken: string } | null {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const idToken = params.get('id_token');
    
    if (accessToken && idToken) {
      return { accessToken, idToken };
    }
    
    return null;
  }

  static async getUserFromToken(accessToken: string, idToken: string): Promise<AuthUser> {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      
      const username = payload['cognito:username'] || payload.email || 'google_user';
      const sub = payload.sub;
      
      console.log('✅ Google authentication successful');
      return {
        username,
        sub,
        accessToken,
      };
    } catch (error) {
      console.error('❌ Failed to parse token:', error);
      throw new Error('Failed to parse authentication token');
    }
  }
}
