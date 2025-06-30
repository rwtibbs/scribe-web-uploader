import { getAwsConfig, getEnvironment } from './aws-config';
import { GraphQLResponse, Campaign } from '@/types/aws';

class GraphQLClient {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    const config = getAwsConfig();
    this.endpoint = config.graphqlEndpoint;
    this.apiKey = config.appsyncApiKey;
  }

  async query<T = any>(query: string, variables?: Record<string, any>, accessToken?: string): Promise<T> {
    console.log('🔄 Making GraphQL request to:', this.endpoint);
    console.log('📋 Request details:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
      hasAccessToken: !!accessToken,
      query: query.replace(/\s+/g, ' ').trim(),
      variables
    });
    
    try {
      const requestBody = JSON.stringify({ query, variables });
      console.log('📤 Request body:', requestBody);
      
      // Try Cognito authentication first if access token is available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('🔐 Using Cognito authentication');
      } else {
        headers['x-api-key'] = this.apiKey;
        console.log('🔑 Using API key authentication');
      }
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GraphQL HTTP error:', response.status, response.statusText, errorText);
        
        // Handle specific authentication errors
        if (response.status === 401) {
          throw new Error('GraphQL authentication failed. Please verify your API key.');
        }
        
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('📥 Raw response:', responseText);
      
      const result: GraphQLResponse<T> = JSON.parse(responseText);
      console.log('✅ Parsed GraphQL response:', result);

      if (result.errors && result.errors.length > 0) {
        console.error('❌ GraphQL errors:', result.errors);
        
        // Handle specific GraphQL authentication errors
        if (result.errors[0].errorType === 'UnauthorizedException') {
          throw new Error('GraphQL authorization failed. API key may be invalid or expired.');
        }
        
        throw new Error(result.errors[0].message);
      }

      if (!result.data) {
        console.error('❌ No data in GraphQL response');
        throw new Error('No data returned from GraphQL query');
      }

      return result.data;
    } catch (error) {
      console.error('❌ GraphQL request error details:', {
        name: error?.constructor?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        error
      });
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ Network error - check internet connection and endpoint URL');
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      throw error;
    }
  }

  async getCampaignsByOwner(owner: string, accessToken?: string): Promise<Campaign[]> {
    const query = `
      query GetCampaignsByOwner($owner: String!) {
        listCampaigns(filter: { owner: { contains: $owner } }) {
          items {
            id
            name
            description
            brief
            duration
            numPlayers
            owner
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
        }
      }
    `;

    const result = await this.query<{ listCampaigns: { items: Campaign[] } }>(query, { owner }, accessToken);
    return result.listCampaigns.items.filter(campaign => !campaign._deleted);
  }

  async createSession(sessionData: {
    name: string;
    duration: number;
    audioFile: string;
    transcriptionFile: string;
    transcriptionStatus: string;
    campaignSessionsId: string;
    date: string;
  }, accessToken?: string): Promise<{ id: string; _version: number }> {
    const isDevelopment = getEnvironment() === 'development';
    
    // DEVSORT (development) supports purchaseStatus, DEV (production) does not
    const mutation = isDevelopment ? `
      mutation CreateSession($input: CreateSessionInput!) {
        createSession(input: $input) {
          id
          name
          duration
          audioFile
          transcriptionFile
          transcriptionStatus
          purchaseStatus
          campaignSessionsId
          date
          _version
        }
      }
    ` : `
      mutation CreateSession($input: CreateSessionInput!) {
        createSession(input: $input) {
          id
          name
          duration
          audioFile
          transcriptionFile
          transcriptionStatus
          campaignSessionsId
          date
          _version
        }
      }
    `;

    const input = isDevelopment ? {
      ...sessionData,
      purchaseStatus: 'NOTPURCHASED'
    } : sessionData;

    console.log('🔄 Creating session with data:', input);
    console.log('🌍 Environment:', isDevelopment ? 'DEVSORT (development)' : 'DEV (production)');

    const result = await this.query<{ createSession: { id: string; _version: number } }>(mutation, {
      input,
    }, accessToken);

    return result.createSession;
  }

  async updateSessionAudioFile(sessionId: string, audioFile: string, transcriptionFile: string, version?: number, accessToken?: string): Promise<void> {
    const mutation = `
      mutation UpdateSession($input: UpdateSessionInput!) {
        updateSession(input: $input) {
          id
          audioFile
          transcriptionFile
          transcriptionStatus
        }
      }
    `;

    const input: any = {
      id: sessionId,
      audioFile: audioFile,
      transcriptionFile: transcriptionFile,
      transcriptionStatus: "UPLOADED",
    };

    if (version !== undefined) {
      input._version = version;
    }

    await this.query(mutation, { input }, accessToken);
  }
}

export const graphqlClient = new GraphQLClient();
