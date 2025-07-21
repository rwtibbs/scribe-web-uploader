import { getAwsConfig, getEnvironment } from './aws-config';
import { GraphQLResponse, Campaign } from '@/types/aws';

class GraphQLClient {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    // Force production config to prevent any environment mixing
    const config = getAwsConfig();
    this.endpoint = config.graphqlEndpoint;
    this.apiKey = config.appsyncApiKey;
    
    // Validate we're using production endpoints
    if (!this.endpoint.includes('lm5nq7s75raxnd24y67v3civhm')) {
      console.error('❌ GraphQL Client misconfigured - not using production endpoint');
      console.log('Expected: https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql');
      console.log('Actual:', this.endpoint);
    }
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
    console.log(`🔍 Searching campaigns for owner: "${owner}"`);
    
    let allCampaigns: Campaign[] = [];
    let nextToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 10; // Safety limit to prevent infinite loops
    
    do {
      pageCount++;
      console.log(`📄 Fetching campaigns page ${pageCount}${nextToken ? ` (token: ${nextToken.substring(0, 10)}...)` : ''}`);
      
      // Query with pagination support - try both exact match and contains for better compatibility
      const query = `
        query GetCampaignsByOwner($owner: String!, $nextToken: String) {
          listCampaigns(
            filter: { 
              or: [
                { owner: { eq: $owner } },
                { owner: { contains: $owner } }
              ]
            }
            limit: 100
            nextToken: $nextToken
          ) {
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
            nextToken
          }
        }
      `;

      const variables: any = { owner };
      if (nextToken) {
        variables.nextToken = nextToken;
      }

      const result = await this.query<{ listCampaigns: { items: Campaign[]; nextToken?: string } }>(
        query, 
        variables, 
        accessToken
      );
      
      const pageCampaigns = result.listCampaigns.items.filter(campaign => !campaign._deleted);
      allCampaigns = allCampaigns.concat(pageCampaigns);
      nextToken = result.listCampaigns.nextToken;
      
      console.log(`📋 Page ${pageCount}: Found ${pageCampaigns.length} campaigns (total so far: ${allCampaigns.length})`);
      
    } while (nextToken && pageCount < maxPages);
    
    if (nextToken && pageCount >= maxPages) {
      console.warn(`⚠️ Reached maximum page limit (${maxPages}). There may be more campaigns.`);
    }
    
    // Sort campaigns by creation date (newest first) for consistent ordering
    allCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`📋 Final result: Found ${allCampaigns.length} total campaigns for owner "${owner}"`);
    allCampaigns.forEach(campaign => {
      console.log(`   - Campaign "${campaign.name}" (ID: ${campaign.id}) owned by "${campaign.owner}"`);
    });
    
    // If no campaigns found, try a broader search to see what campaigns exist
    if (allCampaigns.length === 0) {
      console.log(`🔍 No campaigns found for "${owner}". Checking all campaigns for debugging...`);
      
      const debugQuery = `
        query ListAllCampaigns {
          listCampaigns(limit: 20) {
            items {
              id
              name
              owner
              _deleted
            }
          }
        }
      `;
      
      try {
        const debugResult = await this.query<{ listCampaigns: { items: any[] } }>(debugQuery, {}, accessToken);
        const debugCampaigns = debugResult.listCampaigns.items.filter(c => !c._deleted);
        console.log(`📊 Sample campaigns in system: ${debugCampaigns.length}`);
        debugCampaigns.forEach(campaign => {
          console.log(`   - "${campaign.name}" owned by "${campaign.owner}" (${campaign.owner === owner ? 'EXACT MATCH' : 'different'})`);
        });
      } catch (debugError) {
        console.log(`⚠️ Debug query failed:`, debugError);
      }
    }
    
    return allCampaigns;
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
    // Force production environment only
    const isDevelopment = false;
    
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

    const result = await this.query<{ 
      createSession: { 
        id: string; 
        name: string;
        duration: number;
        audioFile: string;
        transcriptionFile: string;
        transcriptionStatus: string;
        campaignSessionsId: string;
        date: string;
        _version: number;
        purchaseStatus?: string;
      } 
    }>(mutation, {
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

  async getSessionsByOwner(owner: string, accessToken?: string): Promise<any[]> {
    // First get user's campaigns, then get sessions for those campaigns
    const campaigns = await this.getCampaignsByOwner(owner, accessToken);
    const campaignIds = campaigns.map(campaign => campaign.id);
    
    if (campaignIds.length === 0) {
      console.log('📋 No campaigns found for owner, returning empty sessions list');
      return [];
    }

    const query = `
      query ListSessions($filter: ModelSessionFilterInput!) {
        listSessions(filter: $filter) {
          items {
            id
            name
            date
            duration
            audioFile
            transcriptionFile
            transcriptionStatus
            campaignSessionsId
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
            primaryImage
          }
        }
      }
    `;

    console.log('🔍 Fetching sessions for campaigns:', campaignIds);
    
    const result = await this.query<{ 
      listSessions: { 
        items: any[] 
      } 
    }>(query, {
      filter: {
        or: campaignIds.map(campaignId => ({
          campaignSessionsId: { eq: campaignId }
        }))
      }
    }, accessToken);

    const sessions = result.listSessions?.items?.filter(session => !session._deleted) || [];
    
    // Add campaign info to each session
    const sessionsWithCampaigns = sessions.map(session => {
      const campaign = campaigns.find(c => c.id === session.campaignSessionsId);
      return {
        ...session,
        campaign: campaign ? { id: campaign.id, name: campaign.name, owner: campaign.owner } : null
      };
    });
    
    console.log(`📋 Found ${sessionsWithCampaigns.length} sessions for owner "${owner}"`);
    sessionsWithCampaigns.forEach(session => {
      console.log(`   - Session "${session.name}" (ID: ${session.id}) from campaign ${session.campaign?.name || 'Unknown'}`);
    });
    
    return sessionsWithCampaigns;
  }

  async getSession(sessionId: string, accessToken?: string): Promise<any> {
    const query = `
      query GetSession($id: ID!) {
        getSession(id: $id) {
          id
          name
          date
          duration
          audioFile
          transcriptionFile
          transcriptionStatus
          campaignSessionsId
          createdAt
          updatedAt
          _version
          campaign {
            id
            name
            owner
          }
          segments {
            items {
              id
              title
              description
              image
              createdAt
              updatedAt
            }
          }
          primaryImage
          tldr
        }
      }
    `;

    console.log('🔍 Fetching session:', sessionId);
    
    const result = await this.query<{ 
      getSession: any 
    }>(query, { id: sessionId }, accessToken);

    if (!result.getSession) {
      throw new Error('Session not found');
    }
    
    console.log(`📋 Found session "${result.getSession.name}"`);
    
    return result.getSession;
  }
}

export const graphqlClient = new GraphQLClient();
