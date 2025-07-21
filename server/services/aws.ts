// Environment-aware server configuration
const getCurrentEnvironment = () => {
  const env = process.env.VITE_AWS_ENVIRONMENT;
  return env === 'DEVSORT' ? 'DEVSORT' : 'DEV'; // Default to DEV (production)
};

const getEnvironmentConfig = () => {
  const currentEnv = getCurrentEnvironment();
  
  if (currentEnv === 'DEVSORT') {
    return {
      s3Bucket: process.env.VITE_S3_BUCKET_DEVSORT || 'scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort',
      graphqlEndpoint: process.env.VITE_GRAPHQL_ENDPOINT_DEVSORT || 'https://bbypecanqjgyblz7ikrrk46rbe.appsync-api.us-east-2.amazonaws.com/graphql',
    };
  } else {
    return {
      s3Bucket: process.env.VITE_S3_BUCKET_DEV || 'scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-dev',
      graphqlEndpoint: process.env.VITE_GRAPHQL_ENDPOINT_DEV || 'https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql',
    };
  }
};

const envConfig = getEnvironmentConfig();

export const awsConfig = {
  region: process.env.VITE_AWS_REGION || 'us-east-2',
  s3Bucket: envConfig.s3Bucket,
  lambdaEndpoint: process.env.VITE_LAMBDA_ENDPOINT || 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
  graphqlEndpoint: envConfig.graphqlEndpoint,
  appsyncApiKey: process.env.VITE_APPSYNC_API_KEY || process.env.AWS_APPSYNC_APIKEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

// Debug logging
console.log(`🔧 Server AWS Configuration (${getCurrentEnvironment()}):`, {
  environment: getCurrentEnvironment(),
  region: awsConfig.region,
  s3Bucket: awsConfig.s3Bucket,
  graphqlEndpoint: awsConfig.graphqlEndpoint,
  hasAppsyncKey: !!awsConfig.appsyncApiKey,
  hasAccessKey: !!awsConfig.accessKeyId
});
