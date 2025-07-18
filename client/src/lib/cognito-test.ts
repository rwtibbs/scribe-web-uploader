import { getAwsConfig } from './aws-config';

export async function testCognitoConnection(username: string, password: string) {
  const config = getAwsConfig();
  
  // Test direct API call to Cognito
  const endpoint = `https://cognito-idp.${config.region}.amazonaws.com/`;
  
  const payload = {
    AuthFlow: "USER_SRP_AUTH",
    ClientId: config.userPoolClientId,
    AuthParameters: {
      USERNAME: username,
      SRP_A: "test" // This will fail but should give us connection info
    }
  };

  try {
    console.log('🧪 Testing Cognito connection to:', endpoint);
    console.log('🧪 Using Client ID:', config.userPoolClientId);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log('🧪 Response status:', response.status);
    console.log('🧪 Response:', result);
    
    return { success: response.ok, status: response.status, response: result };
  } catch (error) {
    console.error('🧪 Test failed:', error);
    return { success: false, error: error.message };
  }
}