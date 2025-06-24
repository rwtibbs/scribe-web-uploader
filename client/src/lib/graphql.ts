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
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL query');
    }

    return result.data;
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
