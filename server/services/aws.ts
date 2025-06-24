export const awsConfig = {
  region: process.env.VITE_AWS_REGION || 'us-east-2',
  s3Bucket: process.env.VITE_S3_BUCKET || 'scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort',
  lambdaEndpoint: 'https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary',
};
