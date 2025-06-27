import { AWSConfig } from '@/types/aws';

export const awsConfig: AWSConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-2',
  userPoolId: import.meta.env.VITE_USER_POOL_ID || 'us-east-2_2sxvJnReu',
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
  s3Bucket: import.meta.env.VITE_S3_BUCKET || 'scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-devsort',
  appsyncApiKey: import.meta.env.VITE_APPSYNC_API_KEY || '',
  graphqlEndpoint: 'https://aye26gtfp5am3ogkvd3qb46xbm.appsync-api.us-east-2.amazonaws.com/graphql',
  lambdaEndpoint: 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
};

// Debug: Print current configuration
console.log('🔧 Cognito Configuration:', {
  region: awsConfig.region,
  userPoolId: awsConfig.userPoolId,
  userPoolClientId: awsConfig.userPoolClientId ? `${awsConfig.userPoolClientId.substring(0, 8)}...` : 'NOT SET',
  hasAppsyncKey: !!awsConfig.appsyncApiKey
});

if (!awsConfig.userPoolClientId) {
  console.warn('VITE_USER_POOL_CLIENT_ID environment variable is not set');
}

if (!awsConfig.appsyncApiKey) {
  console.warn('VITE_APPSYNC_API_KEY environment variable is not set');
}
