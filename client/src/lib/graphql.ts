import { awsConfig } from './aws-config';
import { GraphQLResponse, Campaign } from '@/types/aws';

class GraphQLClient {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    this.endpoint = awsConfig.graphqlEndpoint;
    this.apiKey = awsConfig.appsyncApiKey;
  }

  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    console.log('🔄 Making GraphQL request to:', this.endpoint);
    console.log('📋 Request details:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
      query: query.replace(/\s+/g, ' ').trim(),
      variables
    });
    
    try {
      const requestBody = JSON.stringify({ query, variables });
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: requestBody,
      });

      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GraphQL HTTP error:', response.status, response.statusText, errorText);
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('📥 Raw response:', responseText);
      
      const result: GraphQLResponse<T> = JSON.parse(responseText);
      console.log('✅ Parsed GraphQL response:', result);

      if (result.errors && result.errors.length > 0) {
        console.error('❌ GraphQL errors:', result.errors);
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
        message: error?.message,
        stack: error?.stack,
        error
      });
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ Network error - check internet connection and endpoint URL');
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      throw error;
    }
  }

  async getCampaignsByOwner(owner: string): Promise<Campaign[]> {
    const query = `
      query GetCampaignsByOwner($owner: String!) {
        listCampaigns(filter: { owner: { eq: $owner } }) {
          items {
            id
            name
            description
            owner
          }
        }
      }
    `;

    const result = await this.query<{ listCampaigns: { items: Campaign[] } }>(query, { owner });
    return result.listCampaigns.items;
  }

  async createSession(sessionData: {
    name: string;
    date: string;
    duration: number;
    campaignSessionsId: string;
    transcriptionStatus: string;
  }): Promise<{ id: string }> {
    const mutation = `
      mutation CreateSession($input: CreateSessionInput!) {
        createSession(input: $input) {
          id
          name
          date
          duration
          transcriptionStatus
          campaignSessionsId
        }
      }
    `;

    const result = await this.query<{ createSession: { id: string } }>(mutation, {
      input: sessionData,
    });

    return result.createSession;
  }

  async updateSessionAudioFile(sessionId: string, audioFile: string, version?: number): Promise<void> {
    const mutation = `
      mutation UpdateSession($input: UpdateSessionInput!) {
        updateSession(input: $input) {
          id
          audioFile
        }
      }
    `;

    const input: any = {
      id: sessionId,
      audioFile,
    };

    if (version !== undefined) {
      input._version = version;
    }

    await this.query(mutation, { input });
  }
}

export const graphqlClient = new GraphQLClient();
