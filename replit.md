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
3. **Session Creation**: User fills form with session metadata (name, date, duration)
4. **File Upload**: Audio file uploaded to S3 with progress tracking
5. **Processing Trigger**: Backend triggers Lambda function with session metadata
6. **Status Updates**: Session status tracked through transcription pipeline states

### Session Status States
- `pending-upload`: Initial state, waiting for file
- `uploading`: File upload in progress
- `processing`: Lambda function processing audio
- `completed`: Transcription finished successfully
- `error`: Processing failed

## External Dependencies

### AWS Services
- **Cognito**: User authentication and management
- **S3**: Audio file storage with public/audioUploads prefix
- **AppSync**: GraphQL API for campaign and session data
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
- June 27, 2025. Fixed campaign query to use 'contains' filter instead of 'eq' for owner field matching
- June 27, 2025. Updated GraphQL endpoint to https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql
- June 27, 2025. Updated Cognito User Pool ID to us-east-2_2sxvJnReu for correct authentication
- June 24, 2025. Initial setup