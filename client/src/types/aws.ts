export interface AWSConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  cognitoDomain: string;
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

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  brief?: string;
  duration?: number;
  numPlayers?: number;
  owner?: string;
  createdAt: string;
  updatedAt?: string;
  _version: number;
  _deleted?: boolean;
  _lastChangedAt: number;
  sessions?: {
    items: Array<{
      id: string;
      name: string;
    }>;
  };
}
