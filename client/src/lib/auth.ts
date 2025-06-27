import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { getAwsConfig } from './aws-config';
import { AuthUser } from '@shared/schema';

const getUserPool = () => {
  const config = getAwsConfig();
  return new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.userPoolClientId,
  });
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
        if (err || !session.isValid()) {
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
}
