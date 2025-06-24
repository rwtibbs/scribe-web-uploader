import AWS from 'aws-sdk';
import { awsConfig } from './aws-config';
import { S3UploadParams } from '@/types/aws';

// Configure AWS
AWS.config.update({
  region: awsConfig.region,
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

export class S3UploadService {
  static async uploadFile({ key, file, onProgress }: S3UploadParams): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadParams = {
        Bucket: awsConfig.s3Bucket,
        Key: `public/audioUploads/${key}`,
        Body: file,
        ContentType: file.type,
      };

      const upload = s3.upload(uploadParams);

      if (onProgress) {
        upload.on('httpUploadProgress', (progress) => {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          onProgress({
            loaded: progress.loaded,
            total: progress.total,
            percentage,
          });
        });
      }

      upload.send((err, data) => {
        if (err) {
          reject(new Error(`S3 upload failed: ${err.message}`));
        } else {
          resolve(data.Location);
        }
      });
    });
  }

  static generateFileName(campaignId: string, sessionId: string, originalFileName: string): string {
    const extension = originalFileName.split('.').pop();
    return `campaign${campaignId}Session${sessionId}.${extension}`;
  }
}
