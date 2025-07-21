import { AWSConfig } from '@/types/aws';

type Environment = 'DEV' | 'DEVSORT';

// Get current environment from environment variable
export const getEnvironment = (): Environment => {
  const env = import.meta.env.VITE_AWS_ENVIRONMENT as Environment;
  return env === 'DEVSORT' ? 'DEVSORT' : 'DEV'; // Default to DEV (production)
};

// Environment configurations
const environmentConfigs: Record<Environment, AWSConfig> = {
  DEV: {
    region: import.meta.env.VITE_AWS_REGION || 'us-east-2',
    userPoolId: import.meta.env.VITE_USER_POOL_ID_DEV || 'us-east-2_2sxvJnReu',
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID_DEV || '',
    s3Bucket: import.meta.env.VITE_S3_BUCKET_DEV || 'scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-dev',
    appsyncApiKey: import.meta.env.VITE_APPSYNC_API_KEY || '',
    graphqlEndpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT_DEV || 'https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql',
    lambdaEndpoint: import.meta.env.VITE_LAMBDA_ENDPOINT || 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
  },
  DEVSORT: {
    region: import.meta.env.VITE_AWS_REGION || 'us-east-2',
    userPoolId: import.meta.env.VITE_USER_POOL_ID_DEVSORT || 'us-east-2_N5trdtp4e',
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID_DEVSORT || 'kpk9rjugfg5997ann3v40s7hs',
    s3Bucket: import.meta.env.VITE_S3_BUCKET_DEVSORT || 'scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort',
    appsyncApiKey: import.meta.env.VITE_APPSYNC_API_KEY || '',
    graphqlEndpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT_DEVSORT || 'https://bbypecanqjgyblz7ikrrk46rbe.appsync-api.us-east-2.amazonaws.com/graphql',
    lambdaEndpoint: import.meta.env.VITE_LAMBDA_ENDPOINT || 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
  },
};

export const getAwsConfig = (): AWSConfig => {
  const currentEnv = getEnvironment();
  return environmentConfigs[currentEnv];
};

export const awsConfig = getAwsConfig();

// Debug: Print current configuration
const currentEnv = getEnvironment();
console.log(`🔧 AWS Configuration (${currentEnv}):`, {
  environment: currentEnv,
  region: awsConfig.region,
  userPoolId: awsConfig.userPoolId,
  userPoolClientId: awsConfig.userPoolClientId ? `${awsConfig.userPoolClientId.substring(0, 8)}...` : 'NOT SET',
  hasAppsyncKey: !!awsConfig.appsyncApiKey,
  graphqlEndpoint: awsConfig.graphqlEndpoint,
  s3Bucket: awsConfig.s3Bucket
});

if (!awsConfig.userPoolClientId) {
  console.warn(`VITE_USER_POOL_CLIENT_ID_${currentEnv} environment variable is not set`);
}

if (!awsConfig.appsyncApiKey) {
  console.warn('VITE_APPSYNC_API_KEY environment variable is not set');
}
