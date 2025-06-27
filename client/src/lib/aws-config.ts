import { AWSConfig } from '@/types/aws';

// Environment configurations
const productionConfig = {
  region: 'us-east-2',
  userPoolId: 'us-east-2_2sxvJnReu',
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
  s3Bucket: 'scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-devsort',
  appsyncApiKey: import.meta.env.VITE_APPSYNC_API_KEY || '',
  graphqlEndpoint: 'https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql',
  lambdaEndpoint: 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
};

const developmentConfig = {
  region: 'us-east-2',
  userPoolId: 'us-east-2_DEV_POOL_ID', // Replace with actual dev pool ID
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
  s3Bucket: 'scribe-dev-bucket', // Replace with actual dev bucket
  appsyncApiKey: import.meta.env.VITE_APPSYNC_API_KEY || '',
  graphqlEndpoint: 'https://dev-graphql-endpoint.appsync-api.us-east-2.amazonaws.com/graphql', // Replace with actual dev endpoint
  lambdaEndpoint: 'https://dev-lambda-endpoint.execute-api.us-east-2.amazonaws.com/dev/start-summary',
};

// Get environment from localStorage, defaults to production
export const getEnvironment = (): 'production' | 'development' => {
  return (localStorage.getItem('tabletopscribe-environment') as 'production' | 'development') || 'production';
};

export const setEnvironment = (env: 'production' | 'development') => {
  localStorage.setItem('tabletopscribe-environment', env);
  // Force page reload to apply new configuration
  window.location.reload();
};

export const getAwsConfig = (): AWSConfig => {
  const env = getEnvironment();
  return env === 'development' ? developmentConfig : productionConfig;
};

export const awsConfig = getAwsConfig();

// Debug: Print current configuration
console.log('🔧 AWS Configuration:', {
  region: awsConfig.region,
  userPoolId: awsConfig.userPoolId,
  userPoolClientId: awsConfig.userPoolClientId ? `${awsConfig.userPoolClientId.substring(0, 8)}...` : 'NOT SET',
  hasAppsyncKey: !!awsConfig.appsyncApiKey,
  graphqlEndpoint: awsConfig.graphqlEndpoint,
  s3Bucket: awsConfig.s3Bucket
});

if (!awsConfig.userPoolClientId) {
  console.warn('VITE_USER_POOL_CLIENT_ID environment variable is not set');
}

if (!awsConfig.appsyncApiKey) {
  console.warn('VITE_APPSYNC_API_KEY environment variable is not set');
}
