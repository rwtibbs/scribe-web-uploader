import type { Express } from "express";
import { createServer, type Server } from "http";
import AWS from 'aws-sdk';
import { awsConfig } from './services/aws';

// Configure AWS Lambda
const lambda = new AWS.Lambda({
  region: awsConfig.region,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Trigger Lambda function for audio processing
  app.post('/api/trigger-lambda', async (req, res) => {
    try {
      const { sessionId, campaignId, audio_filename, user_specified_fields } = req.body;

      if (!sessionId || !campaignId || !audio_filename) {
        return res.status(400).json({ 
          message: 'Missing required fields: sessionId, campaignId, audio_filename' 
        });
      }

      const lambdaParams = {
        FunctionName: 'start-summary', // Lambda function name
        InvocationType: 'Event', // Async invocation
        Payload: JSON.stringify({
          sessionId,
          campaignId,
          audio_filename,
          user_specified_fields: user_specified_fields || {},
        }),
      };

      const result = await lambda.invoke(lambdaParams).promise();

      if (result.StatusCode === 202) {
        res.json({ 
          success: true, 
          message: 'Lambda function triggered successfully',
          statusCode: result.StatusCode 
        });
      } else {
        throw new Error(`Lambda invocation failed with status: ${result.StatusCode}`);
      }
    } catch (error) {
      console.error('Error triggering Lambda function:', error);
      res.status(500).json({ 
        message: 'Failed to trigger audio processing',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
