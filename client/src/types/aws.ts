export interface AWSConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  s3Bucket: string;
  appsyncApiKey: string;
  graphqlEndpoint: string;
  lambdaEndpoint: string;
}

export interface CognitoUser {
  username: string;
  sub: string;
  accessToken: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    errorType?: string;
  }>;
}

export interface S3UploadParams {
  key: string;
  file: File;
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
}
