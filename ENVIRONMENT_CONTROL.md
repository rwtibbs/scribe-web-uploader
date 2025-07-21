# Environment Control Guide

## Overview

The application now supports switching between Production (DEV) and Development (DEVSORT) environments using environment variables. This allows you to diagnose issues and test changes across different AWS environments.

## Quick Environment Switch

### To switch to Development (DEVSORT):
1. Set environment variable: `VITE_AWS_ENVIRONMENT=DEVSORT`
2. Restart the application

### To switch to Production (DEV):
1. Set environment variable: `VITE_AWS_ENVIRONMENT=DEV` (or remove the variable entirely)
2. Restart the application

## Environment Configurations

### DEV (Production)
- **Cognito User Pool**: `us-east-2_2sxvJnReu`
- **S3 Bucket**: `scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-dev`
- **GraphQL Endpoint**: `https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql`

### DEVSORT (Development)
- **Cognito User Pool**: `us-east-2_N5trdtp4e`
- **Cognito Client ID**: `kpk9rjugfg5997ann3v40s7hs`
- **S3 Bucket**: `scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort`
- **GraphQL Endpoint**: `https://bbypecanqjgyblz7ikrrk46rbe.appsync-api.us-east-2.amazonaws.com/graphql`

## Environment Variables

Add these to your `.env` file:

```bash
# Environment Control
VITE_AWS_ENVIRONMENT=DEV  # Change to DEVSORT for development

# DEV Environment (Production)
VITE_USER_POOL_ID_DEV=us-east-2_2sxvJnReu
VITE_USER_POOL_CLIENT_ID_DEV=your_production_client_id
VITE_S3_BUCKET_DEV=scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-dev
VITE_GRAPHQL_ENDPOINT_DEV=https://lm5nq7s75raxnd24y67v3civhm.appsync-api.us-east-2.amazonaws.com/graphql

# DEVSORT Environment (Development)
VITE_USER_POOL_ID_DEVSORT=us-east-2_N5trdtp4e
VITE_USER_POOL_CLIENT_ID_DEVSORT=kpk9rjugfg5997ann3v40s7hs
VITE_S3_BUCKET_DEVSORT=scribe8a8fcf3f6cb14734bce4bd48352f8043acdd4-devsort
VITE_GRAPHQL_ENDPOINT_DEVSORT=https://bbypecanqjgyblz7ikrrk46rbe.appsync-api.us-east-2.amazonaws.com/graphql

# Shared Configuration
VITE_AWS_REGION=us-east-2
VITE_APPSYNC_API_KEY=your_appsync_api_key
VITE_LAMBDA_ENDPOINT=https://642l8cabx1.execute-api.us-east-2.amazonaws.com/dev/start-summary
```

## Verification

When the application starts, you'll see console logs indicating the current environment:

```
🔧 AWS Configuration (DEV): { environment: 'DEV', ... }
🔧 Server AWS Configuration (DEV): { environment: 'DEV', ... }
```

or

```
🔧 AWS Configuration (DEVSORT): { environment: 'DEVSORT', ... }
🔧 Server AWS Configuration (DEVSORT): { environment: 'DEVSORT', ... }
```

## Current Status

- ✅ Currently set to: **DEV (Production)**
- ✅ Session creation includes `purchaseStatus: 'NOTPURCHASED'` in both environments
- ✅ All authentication, S3 uploads, and GraphQL queries will use production environment
- ✅ Ready to switch to DEVSORT for debugging when needed

## Notes

- Environment switching requires application restart
- All configurations are centralized and automatically applied
- Both client and server configurations are synchronized
- Default environment is DEV (production) if no variable is set