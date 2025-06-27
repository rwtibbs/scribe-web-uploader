import AWS from 'aws-sdk';
import { getAwsConfig } from './aws-config';
import { S3UploadParams } from '@/types/aws';

// Configure AWS dynamically
const getS3Client = () => {
  const config = getAwsConfig();
  AWS.config.update({
    region: config.region,
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  });
  return new AWS.S3();
};

export class S3UploadService {
  static async uploadFile({ key, file, onProgress }: S3UploadParams): Promise<string> {
    return new Promise((resolve, reject) => {
      const config = getAwsConfig();
      const s3 = getS3Client();
      
      const uploadParams = {
        Bucket: config.s3Bucket,
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
