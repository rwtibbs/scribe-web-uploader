# TabletopScribe Audio Uploader

## Overview
TabletopScribe is a web application designed for users to upload and process tabletop gaming session audio files. Its primary purpose is to provide an intuitive interface for authentication, campaign selection, audio file uploads, and triggering automated audio processing (transcription) via AWS Lambda functions. The project aims to streamline the initial step of transforming raw audio into structured data, facilitating further integration into a campaign wiki or other tabletop gaming resources.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with a custom dark theme
- **State Management**: TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Development**: Vite middleware for HMR
- **Production**: Serves static files from the built client

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via environment variables)
- **Schema**: Shared definitions in `/shared/schema.ts`

### Key Features & Components
- **Authentication**: AWS Cognito for user authentication using `amazon-cognito-identity-js` for persistent sessions and token refresh.
- **File Upload**: AWS S3 for audio file storage, with a drag-and-drop interface and real-time progress tracking for audio files only.
- **Campaign Management**: Data sourced from AWS AppSync GraphQL API, allowing users to select and filter content by campaign.
- **Audio Processing Pipeline**: Triggers AWS Lambda functions via an Express.js endpoint for audio transcription, with session status tracking.
- **Internal Tools**: An admin-only image viewer (`/internal/images`) with multi-layer authentication (AdminGuard component and backend validation).

### Data Flow
1. User authenticates via AWS Cognito.
2. Frontend fetches user's campaigns from GraphQL API.
3. User creates a session with metadata.
4. **3-Step Upload Process**:
    - Create session (NOTSTARTED/NOTPURCHASED status).
    - Upload audio file to S3 with progress tracking.
    - Update session with file details and UPLOADED status.
5. Session status is tracked through `pending-upload`, `uploading`, `processing`, `completed`, or `error` states.

## External Dependencies

### AWS Services
- **Cognito**: User authentication and management.
- **S3**: Audio file storage.
- **AppSync**: GraphQL API for campaign and session data.
- **Lambda**: Audio processing and transcription service.

### Development Dependencies
- **Replit**: Development environment.
- **shadcn/ui**: Accessible UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **TanStack Query**: Server state synchronization.