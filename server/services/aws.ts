// Match the frontend production environment configuration
export const awsConfig = {
  region: process.env.VITE_AWS_REGION || 'us-east-2',
  s3Bucket: process.env.VITE_S3_BUCKET || 'scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-dev', // Production bucket
  lambdaEndpoint: 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
  // Use production GraphQL endpoint that matches frontend configuration
  graphqlEndpoint: process.env.VITE_GRAPHQL_ENDPOINT || 'https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql',
  appsyncApiKey: process.env.AWS_APPSYNC_APIKEY || process.env.VITE_APPSYNC_API_KEY || 'da2-oec76qki7zdwtnarji2kzxmmsu',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
