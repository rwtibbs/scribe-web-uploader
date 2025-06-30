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

## Changelog

Changelog:
- June 30, 2025. Updated file size limits to 300MB for all environments (both deployed and development)
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