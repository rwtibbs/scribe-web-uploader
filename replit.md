# TabletopScribe Audio Uploader

## Overview
TabletopScribe is a web application designed for tabletop gamers to upload and process audio files from their gaming sessions. Its primary purpose is to provide a seamless interface for users to authenticate, manage campaigns, upload audio files, and trigger automated processing workflows (like transcription) via AWS Lambda. The project aims to streamline the organization and transcription of gaming session audio, enhancing the tabletop gaming experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
-   **Framework**: React 18 with TypeScript.
-   **Styling**: Tailwind CSS with a custom dark theme optimized for gaming aesthetics, utilizing Radix UI components styled with shadcn/ui.
-   **Design Patterns**: Consistent Scribe branding with a unified navigation bar (logo on left, logout on right), global campaign selector, and a focus on mobile-optimized layouts and accessible UI components.
-   **Workflow**: A 3-step upload process (create session, upload audio to S3, update session metadata) with drag-and-drop functionality and real-time progress tracking.

### Technical Implementations
-   **Frontend**: Vite for development and optimized builds, TanStack Query for server state management, React Hook Form with Zod for form handling and validation.
-   **Backend**: Node.js with Express.js server, TypeScript, ES modules. Serves static files in production and uses Vite middleware for HMR in development.
-   **Authentication**: AWS Cognito for user authentication, implemented with `amazon-cognito-identity-js` for persistent sessions and token refresh. Custom React hooks manage authentication state and user context.
-   **Data Management**: Drizzle ORM for PostgreSQL database interactions, with shared schema definitions. AWS AppSync GraphQL API for managing campaign and session data, integrated with a custom GraphQL client.
-   **File Storage & Processing**: AWS S3 for audio file storage, supporting direct client-to-S3 uploads (presigned URLs) for large files. AWS Lambda functions are triggered via an Express.js endpoint for audio processing and transcription, with session status tracking through the pipeline.
-   **Data Flow**: User authenticates via Cognito, selects a campaign, creates a session (initially `NOTSTARTED`/`NOTPURCHASED`), uploads audio to S3, and the session status is updated through `pending-upload`, `uploading`, `processing`, `completed`, or `error` states.

### Feature Specifications
-   **Authentication System**: Secure JWT authentication with signature verification, expiration checks, and `token_use === 'access'` enforcement.
-   **File Upload System**: Drag-and-drop interface, real-time progress tracking, support for audio file types only, direct upload to S3 using presigned URLs.
-   **Campaign Management**: Campaigns fetched from AWS AppSync, filtered by user ownership, with a global selector impacting all displayed content. Includes session count display on campaign tiles.
-   **Environment Control**: Utilizes `VITE_AWS_ENVIRONMENT` for switching between production (DEV) and development (DEVSORT) AWS environments, centralizing all AWS configurations.

## External Dependencies

### AWS Services
-   **Cognito**: User authentication and management.
-   **S3**: Audio file storage (e.g., `scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-dev`).
-   **AppSync**: GraphQL API for campaign and session data.
-   **Lambda**: Audio processing and transcription service.

### Development & UI Libraries
-   **Replit**: Development environment.
-   **shadcn/ui**: Pre-built accessible UI components.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **TanStack Query**: Server state synchronization.
```