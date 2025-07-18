// Configuration for both environments
export const awsConfig = {
  region: process.env.VITE_AWS_REGION || 'us-east-2',
  s3Bucket: process.env.VITE_S3_BUCKET || 'scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort', // DEVSORT bucket (development)
  lambdaEndpoint: 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
  // Support both development and production API keys
  graphqlEndpoint: process.env.VITE_GRAPHQL_ENDPOINT || 'https://bbypecanqjgyblz7ikrrk46rbe.appsync-api.us-east-2.amazonaws.com/graphql',
  appsyncApiKey: process.env.AWS_APPSYNC_GRAPHQL_KEY || process.env.VITE_APPSYNC_API_KEY || process.env.AWS_APPSYNC_APIKEY || 'da2-32m4jru4offxtee4hgyb3fx3qq',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
