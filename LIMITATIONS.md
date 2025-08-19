# Internal Image Viewer - Technical Limitations

## Current Issue: Authentication Scope

The internal image viewer tool cannot access images from all users due to authentication limitations in the current AWS setup.

### Problem
- AWS Cognito user tokens are scoped to individual users
- Your authentication token can only access your own campaigns, sessions, and images
- GraphQL API enforces user-level permissions, preventing cross-user data access
- The "listSegments" query with your token only returns segments you own

### Evidence
- API logs show repeated "Found 964 segments with images" but never completes
- These are likely your own segments being returned repeatedly due to pagination issues
- Other users' segments are not accessible with your current token

### Required for Full Functionality

To create a true admin tool that shows images from all users, you would need:

1. **Service-Level API Key**: An AWS AppSync API key with admin permissions
2. **Database Direct Access**: Direct PostgreSQL/DynamoDB access bypassing GraphQL
3. **Admin Role**: A special Cognito user group with cross-user read permissions
4. **IAM Service Role**: Backend service with elevated AWS permissions

### Current Workaround Options

1. **Your Images Only**: Modify the tool to show only your generated images
2. **Mock Interface**: Create the UI structure with placeholder data for demo purposes
3. **Separate Admin Backend**: Build a separate service with elevated permissions

### Recommendation

The safest approach is to modify the current tool to:
- Show only images from your own campaigns and sessions
- Clearly label it as "My Generated Images" instead of "All Generated Images"
- Keep the admin authentication for access control
- Demonstrate the UI/UX concept for future expansion

This would provide a functional tool within the current authentication constraints while preserving the security model.