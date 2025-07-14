export const awsConfig = {
  region: process.env.VITE_AWS_REGION || 'us-east-2',
  s3Bucket: process.env.VITE_S3_BUCKET || 'scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort',
  lambdaEndpoint: 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
  graphqlEndpoint: process.env.VITE_GRAPHQL_ENDPOINT || 'https://bbypecanqjgyblz7ikrrk46rbe.appsync-api.us-east-2.amazonaws.com/graphql',
  appsyncApiKey: process.env.VITE_APPSYNC_API_KEY || 'da2-vayaaiemhfe5rjawfgtwwt7d7a',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
