# TabletopScribe Audio Uploader

## Overview

TabletopScribe is a web application for uploading and processing tabletop gaming session audio files. It provides an interface for users to authenticate, select campaigns, upload audio files, and trigger AWS Lambda functions for automated audio processing and transcription.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom dark theme optimized for gaming aesthetics
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Development Mode**: Uses Vite middleware for hot module replacement
- **Production Mode**: Serves static files from built client

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Configured for PostgreSQL (via environment variables)
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`

## Key Components

### Authentication System
- **Provider**: AWS Cognito for user authentication
- **Implementation**: amazon-cognito-identity-js library
- **Session Management**: Persistent sessions with automatic token refresh
- **User Context**: Custom React hooks for authentication state

### File Upload System
- **Storage**: AWS S3 for audio file storage
- **Interface**: Drag-and-drop file upload zone with progress tracking
- **File Types**: Audio files only (enforced client-side)
- **Progress Tracking**: Real-time upload progress with percentage and status

### Campaign Management
- **Data Source**: AWS AppSync GraphQL API
- **Schema**: Campaign entities with owner-based filtering
- **Integration**: Custom GraphQL client with API key authentication
- **Campaign Selection**: Global campaign selector at top of application
- **Scoped Content**: All uploads and sessions filtered by selected campaign

### Audio Processing Pipeline
- **Trigger**: Express.js endpoint `/api/trigger-lambda`
- **Processing**: AWS Lambda function invocation for audio transcription
- **Status Tracking**: Session status tracking through transcription pipeline

## Data Flow

1. **User Authentication**: User signs in via AWS Cognito, receives JWT tokens
2. **Campaign Selection**: Frontend queries GraphQL API to fetch user's campaigns
3. **Session Creation**: User fills form with session metadata (name, date)
4. **3-Step Upload Process**:
   - **Step 1**: Create session with NOTSTARTED/NOTPURCHASED status, wait for completion
   - **Step 2**: Upload audio file to S3 with progress tracking, wait for completion
   - **Step 3**: Update session with audioFile, transcriptionFile, and UPLOADED status
5. **Status Updates**: Session status tracked through transcription pipeline states

### Session Status States
- `pending-upload`: Initial state, waiting for file
- `uploading`: File upload in progress
- `processing`: Lambda function processing audio
- `completed`: Transcription finished successfully
- `error`: Processing failed

## External Dependencies

### AWS Services
- **Cognito**: User authentication and management
  - Production (DEV): us-east-2_2sxvJnReu
  - Development (DEVSORT): us-east-2_N5trdtp4e (client: kpk9rjugfg5997ann3v40s7hs)
- **S3**: Audio file storage with public/audioUploads prefix
  - Production: scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-dev
  - Development: scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort
- **AppSync**: GraphQL API for campaign and session data
  - Production (DEV): https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql
  - Development (DEVSORT): https://bbypecanqjgyblz7ikrrk46rbe.appsync-api.us-east-2.amazonaws.com/graphql
- **Lambda**: Audio processing and transcription service

### Development Dependencies
- **Replit**: Development environment with hot reload
- **shadcn/ui**: Pre-built accessible UI components
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Server state synchronization

## Deployment Strategy

### Development
- **Environment**: Replit with Node.js 20, PostgreSQL 16
- **Hot Reload**: Vite dev server with Express middleware
- **Port Configuration**: Local port 5000, external port 80

### Production Build
- **Client Build**: Vite builds React app to `dist/public`
- **Server Build**: esbuild bundles Express server to `dist/index.js`
- **Static Serving**: Express serves built client files in production

### Environment Configuration
- **AWS Credentials**: Configured via environment variables
- **Database**: PostgreSQL connection via DATABASE_URL
- **API Endpoints**: Configurable GraphQL and Lambda endpoints

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- January 27, 2025. Fixed mobile deployment cold-start race condition with optimized auto-reload timing: Implemented authReady state management to prevent campaign queries from executing before authentication context is fully stabilized, added 300ms authentication verification delays for mobile stability, created automatic page reload mechanism that triggers after 1.5 seconds if campaigns fail to load despite successful authentication, extended minimum loading screen to 4 seconds to prevent error message visibility, enhanced loading states with "Refreshing connection" feedback during auto-reload, added comprehensive debugging for mobile deployment troubleshooting
- July 23, 2025. Implemented consistent Scribe branding across all pages: Added full Scribe logo with wordmark to login page header, created unified navigation bar pattern with logo on left and logout on right across campaign collection and upload pages, constrained login form width to max-w-md for better mobile experience and consistency with other app containers

## Changelog

Changelog:
- July 21, 2025. Eliminated environment cross-contamination in legacy code: Removed hardcoded production endpoint validation from GraphQL client, replaced forced production environment context in campaign localStorage with environment-specific storage keys, centralized all environment control through VITE_AWS_ENVIRONMENT secret only
- July 21, 2025. Implemented environment variable control system: Added VITE_AWS_ENVIRONMENT variable to switch between DEV (production) and DEVSORT (development) environments, centralized all AWS configurations with automatic environment detection, created comprehensive environment control documentation for easy switching during debugging
- July 21, 2025. Fixed purchaseStatus inclusion in production: Updated GraphQL createSession mutation to always include purchaseStatus field in production environment, ensuring proper session creation with NOTPURCHASED status for all new sessions
- July 21, 2025. Added session counts to campaign tiles: Created useCampaignSessionCounts hook to fetch session counts for all campaigns in parallel, added session count display with audio file icon on campaign collection tiles, integrated GraphQL getSessionsByCampaign method for efficient session counting, enhanced campaign preview with real-time session statistics
- July 21, 2025. Added Scribe logo and logout functionality: Positioned Scribe logo at top center of campaign collection and upload pages, added logout buttons to both authenticated screens, implemented proper logout functionality with cache clearing and page reload
- July 21, 2025. Fixed campaign dropdown pagination issue: Added comprehensive pagination support to GraphQL campaign queries, ensuring all user campaigns appear in dropdown regardless of total count, added campaign sorting by creation date for consistent ordering, improved error handling for large campaign collections
- July 19, 2025. Fixed S3 bucket configuration and form reset issues: Corrected S3 bucket name to resolve upload failures, enhanced form reset functionality with proper state cleanup, added session detection and auto-reset capabilities, improved file upload component re-rendering
- July 19, 2025. Cleaned up development environment references: Removed all DEVSORT (development) environment configurations, forced all uploads to production (DEV) S3 bucket only, removed development GraphQL endpoints, ensured consistent production-only environment across client and server
- July 18, 2025. Fixed campaign data environment cross-contamination: Added GraphQL endpoint validation, cleared all localStorage caches on session changes, updated query cache keys to include environment context, ensured production-only campaign data
- July 18, 2025. Implemented production-only authentication restriction: Forced production environment for all users, removed environment toggle completely, added specific error handling for development accounts attempting to log in, cleaned up login interface
- July 18, 2025. Enhanced file picker UI and authentication: Added drag-and-drop functionality with visual feedback, compact horizontal layout with 24px icon, removed file format text for cleaner design, temporarily resolved deployment authentication issue by identifying environment mismatch, hidden environment toggle while defaulting to production
- July 17, 2025. Simplified app to focus on multi-session uploads: Made multi-session upload the main and only page (besides login), removed single session upload entirely, removed sessions collection and individual session pages, simplified campaign selector by removing upload dropdown with search functionality
- July 16, 2025. Created backup files for experimental pagination work: Saved pagination improvements to .backup files before reverting to production state for deployed version editing
- July 14, 2025. Removed primary image from session detail pages: Removed lead image display while preserving segment images for cleaner layout
- July 14, 2025. Updated session card styling: Changed background to white with 10% opacity (bg-white/10) and set thumbnail images to auto height for better layout
- July 14, 2025. Fixed gradient background display: Removed conflicting background overrides from sessions and session-detail pages to allow main vertical gradient (#01032d to #010101) to show through
- July 14, 2025. Implemented Cognito authentication for image viewing: Replaced presigned URLs with new `/api/image/:encodedImageUrl` endpoint that requires Cognito Bearer token authentication, updated AuthenticatedImage component to fetch images with proper auth headers
- July 14, 2025. Added Scribe logo to top navigation bar: Logo displays on left side with campaign selector moved to center and upload button remaining on right
- July 14, 2025. Restructured application architecture: Sessions page is now home page, most recent campaign auto-selects on load, upload button moved to header next to campaign selector for improved user experience
- July 14, 2025. Implemented campaign-scoped architecture: Added global campaign selector, all uploads and sessions now filtered by selected campaign, removed campaign selector from upload form
- July 01, 2025. Updated metadata: Title "Scribe App | Turn your sessions into stories", description focuses on campaign wiki features, added social share image
- July 01, 2025. Fixed presigned URL generation by removing ContentLength parameter and ensuring proper S3 configuration
- June 30, 2025. Implemented presigned URL uploads to support 300MB files by bypassing Replit server entirely - files upload directly from client to S3
- June 30, 2025. Added comprehensive debugging and error handling for file upload issues
- June 30, 2025. Fixed authentication state management issue - app now updates automatically on login/logout without page refresh
- June 30, 2025. Created AuthContext to manage authentication state globally across all components
- June 30, 2025. Moved upload-related text to only display when authenticated, cleaned up login page
- June 30, 2025. Fixed DEVSORT S3 bucket name to correct value: scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort
- June 28, 2025. Fixed dropdown contrast issue with white background and dark text on Select component
- June 28, 2025. Fixed input text readability by ensuring dark text on light input backgrounds
- June 28, 2025. Updated DEVSORT to use correct GraphQL endpoint (https://bbypecanqjgyblz7ikrrk46rbe.appsync-api.us-east-2.amazonaws.com/graphql)
- June 28, 2025. Fixed GraphQL endpoint connectivity issue - both environments now use the same working endpoint
- June 27, 2025. Fixed DEVSORT authentication with correct client ID (kpk9rjugfg5997ann3v40s7hs)
- June 27, 2025. Updated GraphQL client to handle schema differences between DEV and DEVSORT environments
- June 27, 2025. Configured environment toggle with correct DEV (production) and DEVSORT (development) settings
- June 27, 2025. Added environment toggle on signin page to switch between production and development environments
- June 27, 2025. Fixed GraphQL schema error by removing purchaseStatus field (not supported in Session type)
- June 27, 2025. Implemented 3-step upload process: create session, upload audio, update session data (removed Lambda trigger)
- June 27, 2025. Updated session creation to match TabletopScribe data structure with NOTSTARTED status
- June 27, 2025. Removed duration field from form - will be automatically detected from audio file
- June 27, 2025. Removed sample campaigns, now displaying only authenticated user's campaigns
- June 27, 2025. Fixed campaign query to use 'contains' filter instead of 'eq' for owner field matching
- June 27, 2025. Updated GraphQL endpoint to https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql
- June 27, 2025. Updated Cognito User Pool ID to us-east-2_2sxvJnReu for correct authentication
- June 24, 2025. Initial setup