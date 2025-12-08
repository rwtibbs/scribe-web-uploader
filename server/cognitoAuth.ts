import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const COGNITO_REGION = 'us-east-2';
const COGNITO_USER_POOL_ID = 'us-east-2_2sxvJnReu';
const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
const JWKS_URI = `${COGNITO_ISSUER}/.well-known/jwks.json`;

const client = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000,
});

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!header.kid) {
      return reject(new Error('No kid in token header'));
    }
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        return reject(err);
      }
      if (!key) {
        return reject(new Error('Signing key not found'));
      }
      const signingKey = key.getPublicKey();
      resolve(signingKey);
    });
  });
}

export interface CognitoUser {
  sub: string;
  email: string | null;
  tokenUse: string;
  authTime: number;
  exp: number;
  iat: number;
}

export async function verifyAccessToken(token: string): Promise<CognitoUser | null> {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      console.error('JWT decode failed: invalid token structure');
      return null;
    }

    const signingKey = await getSigningKey(decoded.header);
    
    const verified = jwt.verify(token, signingKey, {
      issuer: COGNITO_ISSUER,
      algorithms: ['RS256'],
    }) as jwt.JwtPayload;

    if (verified.token_use !== 'access') {
      console.error('JWT verify failed: not an access token');
      return null;
    }

    return {
      sub: verified.sub!,
      email: verified.email || null,
      tokenUse: verified.token_use,
      authTime: verified.auth_time,
      exp: verified.exp!,
      iat: verified.iat!,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT verify failed: token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT verify failed:', error.message);
    } else {
      console.error('JWT verify failed: unknown error', error);
    }
    return null;
  }
}

export async function extractVerifiedUser(authHeader: string | undefined): Promise<{ sub: string; email: string | null } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const user = await verifyAccessToken(token);
  
  if (!user) {
    return null;
  }

  return {
    sub: user.sub,
    email: user.email,
  };
}
