import { AWSConfig } from '@/types/aws';

export const awsConfig: AWSConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-2',
  userPoolId: import.meta.env.VITE_USER_POOL_ID || 'us-east-2_N5trdtp4e',
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || 'rsdjci5janmb8h30acoa441r8',
  s3Bucket: import.meta.env.VITE_S3_BUCKET || 'scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort',
  appsyncApiKey: import.meta.env.VITE_APPSYNC_API_KEY || '',
  graphqlEndpoint: 'https://bbypecanqjgyblz7ikrrk46rbe.appsync-api.us-east-2.amazonaws.com/graphql',
  lambdaEndpoint: 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
};

if (!awsConfig.userPoolClientId) {
  console.warn('VITE_USER_POOL_CLIENT_ID environment variable is not set');
}

if (!awsConfig.appsyncApiKey) {
  console.warn('VITE_APPSYNC_API_KEY environment variable is not set');
}
