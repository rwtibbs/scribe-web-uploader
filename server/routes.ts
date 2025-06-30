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

// Configure AWS S3
const s3 = new AWS.S3({
  region: awsConfig.region,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Configure multer for file uploads (store in memory for direct S3 upload)
// Support 300MB total files through chunked uploads
const chunkSize = 45 * 1024 * 1024; // 45MB chunks to work with Replit infrastructure
const maxTotalFileSize = 300 * 1024 * 1024; // 300MB total file size

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: chunkSize, // Individual chunk limit
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
  app.post('/api/upload-chunk', upload.single('chunk'), handleMulterError, async (req: Request, res: Response) => {
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

  // S3 upload endpoint with multipart file support
  app.post('/api/upload-to-s3', (req: Request, res: Response, next: NextFunction) => {
    console.log(`🔄 Received upload request - Content-Length: ${req.get('content-length')}`);
    console.log(`📊 Request headers:`, {
      'content-type': req.get('content-type'),
      'content-length': req.get('content-length'),
      'user-agent': req.get('user-agent')
    });
    next();
  }, upload.single('audioFile'), handleMulterError, async (req: Request, res: Response) => {
    console.log(`✅ Multer processing completed successfully`);
    try {
      const file = req.file;
      const { fileName, bucket } = req.body;

      if (!file || !fileName || !bucket) {
        return res.status(400).json({ 
          message: 'Missing required fields: file, fileName, bucket' 
        });
      }

      const uploadParams = {
        Bucket: bucket,
        Key: `public/audioUploads/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      console.log(`🔄 Uploading file to S3: ${fileName} (${file.size} bytes)`);
      console.log(`📦 Using S3 bucket: ${bucket}`);
      console.log(`🔑 S3 Key: public/audioUploads/${fileName}`);
      const result = await s3.upload(uploadParams).promise();
      console.log(`✅ Upload successful: ${result.Location}`);

      res.json({ 
        success: true, 
        location: result.Location,
        key: result.Key
      });
    } catch (error) {
      console.error('Error uploading to S3:', error);
      
      // Check if this is a multer error
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ 
            message: 'File too large. Maximum size is 500MB.',
            error: 'LIMIT_FILE_SIZE'
          });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ 
            message: 'Unexpected file field. Use "audioFile" field name.',
            error: 'LIMIT_UNEXPECTED_FILE'
          });
        }
      }
      
      res.status(500).json({ 
        message: 'Failed to upload file to S3',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
