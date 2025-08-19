import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import AWS from 'aws-sdk';
import multer from 'multer';
import { awsConfig } from './services/aws';

// Configure AWS Lambda
const lambda = new AWS.Lambda({
  region: awsConfig.region,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Configure AWS S3 with minimal configuration for presigned URLs
const s3 = new AWS.S3({
  region: awsConfig.region,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4', // Ensure we're using signature v4
});

// Configure multer for file uploads (store in memory for direct S3 upload)
// Support 300MB total files through chunked uploads
const chunkSize = 45 * 1024 * 1024; // 45MB chunks to work with Replit infrastructure
const maxTotalFileSize = 300 * 1024 * 1024; // 300MB total file size

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxTotalFileSize, // Allow full 300MB for server-side uploads
  },
});

// Separate upload configuration for chunked uploads
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: chunkSize, // Individual chunk limit for chunked uploads
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Multer error handling middleware
  const handleMulterError = (err: any, req: any, res: any, next: any) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        const limitMB = Math.round(chunkSize / (1024 * 1024));
        return res.status(413).json({ 
          message: `Chunk too large. Maximum chunk size is ${limitMB}MB.`,
          error: 'LIMIT_FILE_SIZE',
          maxSize: limitMB
        });
      }
      return res.status(400).json({ 
        message: 'File upload error',
        error: err.message || 'Unknown upload error'
      });
    }
    next();
  };

  // Chunked upload endpoints for large files
  app.post('/api/upload-chunk', chunkUpload.single('chunk'), handleMulterError, async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const { uploadId, partNumber, fileName, bucket } = req.body;

      if (!file || !uploadId || !partNumber || !fileName || !bucket) {
        return res.status(400).json({ 
          message: 'Missing required fields: chunk, uploadId, partNumber, fileName, bucket' 
        });
      }

      console.log(`📦 Uploading chunk ${partNumber} for ${fileName}`);

      const uploadParams = {
        Bucket: bucket,
        Key: `public/audioUploads/${fileName}`,
        PartNumber: parseInt(partNumber),
        UploadId: uploadId,
        Body: file.buffer,
      };

      const result = await s3.uploadPart(uploadParams).promise();
      
      res.json({
        success: true,
        partNumber: parseInt(partNumber),
        etag: result.ETag
      });
    } catch (error) {
      console.error('Error uploading chunk:', error);
      res.status(500).json({ 
        message: 'Failed to upload chunk',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/initiate-multipart', async (req: Request, res: Response) => {
    try {
      const { fileName, bucket, totalSize } = req.body;

      if (!fileName || !bucket || !totalSize) {
        return res.status(400).json({ 
          message: 'Missing required fields: fileName, bucket, totalSize' 
        });
      }

      if (totalSize > maxTotalFileSize) {
        return res.status(413).json({
          message: `File too large. Maximum size is ${Math.round(maxTotalFileSize / (1024 * 1024))}MB.`,
          error: 'FILE_TOO_LARGE'
        });
      }

      console.log(`🚀 Initiating multipart upload for ${fileName} (${Math.round(totalSize / (1024 * 1024))}MB)`);

      const uploadParams = {
        Bucket: bucket,
        Key: `public/audioUploads/${fileName}`,
        ContentType: 'audio/mpeg', // Default to MP3, can be made dynamic
      };

      const result = await s3.createMultipartUpload(uploadParams).promise();
      
      res.json({
        success: true,
        uploadId: result.UploadId,
        key: result.Key
      });
    } catch (error) {
      console.error('Error initiating multipart upload:', error);
      res.status(500).json({ 
        message: 'Failed to initiate multipart upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/complete-multipart', async (req: Request, res: Response) => {
    try {
      const { uploadId, fileName, bucket, parts } = req.body;

      if (!uploadId || !fileName || !bucket || !parts) {
        return res.status(400).json({ 
          message: 'Missing required fields: uploadId, fileName, bucket, parts' 
        });
      }

      console.log(`✅ Completing multipart upload for ${fileName}`);

      const completeParams = {
        Bucket: bucket,
        Key: `public/audioUploads/${fileName}`,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((part: any) => ({
            ETag: part.etag,
            PartNumber: part.partNumber
          }))
        }
      };

      const result = await s3.completeMultipartUpload(completeParams).promise();
      
      res.json({
        success: true,
        location: result.Location,
        key: result.Key
      });
    } catch (error) {
      console.error('Error completing multipart upload:', error);
      res.status(500).json({ 
        message: 'Failed to complete multipart upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/abort-multipart', async (req: Request, res: Response) => {
    try {
      const { uploadId, fileName, bucket } = req.body;

      if (!uploadId || !fileName || !bucket) {
        return res.status(400).json({ 
          message: 'Missing required fields: uploadId, fileName, bucket' 
        });
      }

      console.log(`❌ Aborting multipart upload for ${fileName}`);

      const abortParams = {
        Bucket: bucket,
        Key: `public/audioUploads/${fileName}`,
        UploadId: uploadId
      };

      await s3.abortMultipartUpload(abortParams).promise();
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error aborting multipart upload:', error);
      res.status(500).json({ 
        message: 'Failed to abort multipart upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Server-side S3 upload fallback (for CORS issues)
  app.post('/api/upload-server-side', upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const { fileName } = req.body;

      if (!file || !fileName) {
        return res.status(400).json({ 
          message: 'Missing required fields: file, fileName' 
        });
      }

      console.log(`📤 Server-side upload: ${fileName} (${Math.round(file.size / (1024 * 1024))}MB)`);
      
      const maxFileSize = 300 * 1024 * 1024; // 300MB
      if (file.size > maxFileSize) {
        return res.status(413).json({
          message: `File too large: ${Math.round(file.size / (1024 * 1024))}MB. Maximum size is 300MB.`,
          error: 'FILE_TOO_LARGE'
        });
      }

      const key = `public/audioUploads/${fileName}`;
      const bucketName = process.env.AWS_S3_BUCKET || awsConfig.s3Bucket;
      
      console.log(`⬆️ Uploading to S3: ${bucketName}/${key}`);

      const uploadParams = {
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'audio/mpeg'
      };

      const result = await s3.upload(uploadParams).promise();
      
      console.log('✅ Server-side upload completed:', result.Location);
      
      res.json({
        success: true,
        location: result.Location,
        key: result.Key
      });
    } catch (error) {
      console.error('Error in server-side upload:', error);
      res.status(500).json({ 
        message: 'Failed to upload file',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate presigned URL for direct client-to-S3 upload
  app.post('/api/generate-presigned-url', async (req: Request, res: Response) => {
    try {
      const { fileName, fileSize, contentType } = req.body;

      if (!fileName || !fileSize || !contentType) {
        return res.status(400).json({ 
          message: 'Missing required fields: fileName, fileSize, contentType' 
        });
      }

      const maxFileSize = 300 * 1024 * 1024; // 300MB
      if (fileSize > maxFileSize) {
        return res.status(413).json({
          message: `File too large: ${Math.round(fileSize / (1024 * 1024))}MB. Maximum size is 300MB.`,
          error: 'FILE_TOO_LARGE'
        });
      }

      console.log(`🔗 Generating presigned URL for: ${fileName} (${Math.round(fileSize / (1024 * 1024))}MB)`);
      console.log(`🔧 AWS Config:`, {
        region: awsConfig.region,
        bucket: awsConfig.s3Bucket,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      });

      const key = `public/audioUploads/${fileName}`;
      const bucketName = process.env.AWS_S3_BUCKET || awsConfig.s3Bucket;
      
      console.log(`📝 Generating presigned URL with params:`, {
        Bucket: bucketName,
        Key: key,
        Operation: 'putObject',
        Expires: 3600
      });

      let presignedUrl;
      try {
        presignedUrl = s3.getSignedUrl('putObject', {
          Bucket: bucketName,
          Key: key,
          Expires: 3600, // 1 hour expiration
          ContentType: contentType // Add back ContentType as it's usually required
        });
        console.log(`✅ Presigned URL generated successfully`);
      } catch (urlError) {
        console.error('🚨 Error in getSignedUrl:', urlError);
        throw urlError;
      }
      
      res.json({
        success: true,
        presignedUrl,
        key,
        bucket: bucketName
      });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      res.status(500).json({ 
        message: 'Failed to generate presigned URL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Public session sharing endpoint
  app.get('/api/share/:sessionId', async (req: Request, res: Response) => {
    console.log('🔗 Public share route hit for sessionId:', req.params.sessionId);
    try {
      const { sessionId } = req.params;
      
      // Fetch session data from GraphQL without authentication
      console.log('🌐 Making GraphQL request to:', awsConfig.graphqlEndpoint);
      console.log('🔑 Using API key:', awsConfig.appsyncApiKey ? 'Present' : 'Missing');
      
      const response = await fetch(awsConfig.graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': awsConfig.appsyncApiKey,
        },
        body: JSON.stringify({
          query: `
            query GetSession($id: ID!) {
              getSession(id: $id) {
                id
                name
                date
                duration
                campaign {
                  id
                  name
                }
                segments {
                  items {
                    id
                    title
                    description
                    image
                    createdAt
                    updatedAt
                  }
                }
                tldr
              }
            }
          `,
          variables: { id: sessionId }
        })
      });

      const data = await response.json();
      console.log('📊 GraphQL response:', data);
      
      if (data.errors || !data.data?.getSession) {
        console.log('❌ Session not found or has errors - this might be an authentication issue');
        console.log('📝 Note: GraphQL API key might not have permission for direct session access');
        
        // For now, return a placeholder response indicating the feature needs proper authentication setup
        return res.status(404).json({ 
          error: 'Session not found', 
          debug: 'Public sharing requires additional authentication configuration'
        });
      }

      res.json(data.data.getSession);
    } catch (error) {
      console.error('Error fetching public session:', error);
      res.status(500).json({ error: 'Failed to fetch session' });
    }
  });

  app.get('/api/share-image/:encodedKey', async (req: Request, res: Response) => {
    try {
      const { encodedKey } = req.params;
      const key = Buffer.from(encodedKey, 'base64').toString('utf-8');
      
      // Create S3 client with explicit bucket configuration
      console.log('🪣 Using S3 bucket:', awsConfig.s3Bucket);
      const s3 = new AWS.S3({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        region: awsConfig.region
      });

      // Get object from S3
      const params = {
        Bucket: awsConfig.s3Bucket,
        Key: key
      };

      const s3Object = await s3.getObject(params).promise();
      
      if (!s3Object.Body) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Set appropriate headers
      res.set({
        'Content-Type': s3Object.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Length': s3Object.ContentLength?.toString() || '0'
      });

      // Send the image data
      res.send(s3Object.Body);
    } catch (error) {
      console.error('Error serving public image:', error);
      res.status(500).json({ error: 'Failed to serve image' });
    }
  });

  app.get('/api/image/:encodedKey', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      // TODO: Add Cognito token validation here if needed
      // For now, we'll trust the frontend to send valid tokens
      
      const encodedKey = req.params.encodedKey;
      const s3Key = Buffer.from(encodedKey, 'base64').toString('utf-8');
      
      const bucketName = process.env.AWS_S3_BUCKET || awsConfig.s3Bucket;
      
      const params = {
        Bucket: bucketName,
        Key: s3Key,
      };
      
      console.log('🔗 Getting signed URL for authenticated image:', {
        bucket: params.Bucket,
        key: params.Key,
        keyLength: s3Key.length,
        keyPrefix: s3Key.substring(0, 30) + '...'
      });

      // Create S3 client with proper credentials
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: awsConfig.region
      });
      
      const s3Object = await s3.getObject(params).promise();
      
      if (!s3Object.Body) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Set appropriate content type
      const contentType = s3Object.ContentType || 'image/jpeg';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      res.send(s3Object.Body);
    } catch (error) {
      console.error('Error serving authenticated image:', error);
      if (error.code === 'NoSuchKey') {
        res.status(404).json({ error: 'Image not found' });
      } else {
        res.status(500).json({ error: 'Failed to serve image' });
      }
    }
  });

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
