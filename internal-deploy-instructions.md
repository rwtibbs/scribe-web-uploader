# Internal Image Viewer - Deployment Instructions

## Overview
This document describes how to deploy the internal image viewer tool as a separate application, isolated from the main audio uploader.

## Access Control
The internal image viewer is protected by multiple layers of security:

1. **Frontend Admin Guard**: Only users listed in `ADMIN_USERS` array can access the interface
2. **Backend API Protection**: Server-side verification ensures only authorized users can fetch data
3. **Separate URL**: Accessible only via direct URL `/internal/images`

## Admin User Configuration

### Frontend (client/src/components/admin-guard.tsx)
```typescript
const ADMIN_USERS = [
  'rwtibbitts', // Your username
  // Add other admin usernames as needed
];
```

### Backend (server/routes.ts)
```typescript
const ADMIN_USERS = ['rwtibbitts']; // Add your admin usernames here
```

## Deployment Options

### Option 1: Same Deployment, Hidden Access
- Deploy with the main application
- Access via direct URL: `https://your-app.replit.app/internal/images`
- Protected by authentication - unauthorized users get access denied
- No navigation link in main app interface

### Option 2: Separate Deployment (Recommended for Maximum Security)
1. Create a new Replit project for internal tools
2. Copy the following files:
   - `client/src/pages/internal-images.tsx`
   - `client/src/components/admin-guard.tsx`
   - `client/src/components/authenticated-image.tsx`
   - Server route: `/api/internal/all-images`
   - Authentication context and related dependencies

3. Create a minimal app with only:
   - Login page
   - Internal images page
   - Admin authentication

### Option 3: Environment-Based Access
Add environment variable `ENABLE_INTERNAL_TOOLS=true` to control feature availability:

```typescript
// In admin-guard.tsx
const isInternalToolsEnabled = import.meta.env.VITE_ENABLE_INTERNAL_TOOLS === 'true';

if (!isInternalToolsEnabled) {
  return <div>Internal tools are disabled in this environment</div>;
}
```

## Current Implementation
- ✅ Frontend authentication guard implemented
- ✅ Backend API protection implemented  
- ✅ Admin user lists configured
- ✅ No navigation links in main app
- ✅ Direct URL access only

## Security Features
1. **User whitelist**: Only specific usernames can access
2. **Token verification**: Valid AWS Cognito tokens required
3. **Server-side validation**: Backend verifies user permissions
4. **Hidden from main UI**: No discovery through normal app navigation
5. **Separate from main functionality**: Isolated codebase

## Access Instructions
1. Log into the main application first (to get authenticated)
2. Navigate directly to: `/internal/images`
3. System will verify your admin permissions
4. If authorized, you'll see all generated images from all users

## Maintenance
- Update `ADMIN_USERS` arrays when adding/removing admin access
- Monitor server logs for unauthorized access attempts
- Consider implementing audit logging for admin actions

## Future Enhancements
- Add audit logging for who accessed when
- Implement session timeout for admin tools
- Add image filtering and search capabilities
- Export functionality for batch image operations