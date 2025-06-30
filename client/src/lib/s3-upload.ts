import { getAwsConfig } from './aws-config';
import { S3UploadParams } from '@/types/aws';

export class S3UploadService {
  static async uploadFile({ key, file, onProgress }: S3UploadParams): Promise<string> {
    return new Promise((resolve, reject) => {
      const config = getAwsConfig();
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          // Simulate progress during file conversion
          if (onProgress) {
            onProgress({
              loaded: file.size * 0.2,
              total: file.size,
              percentage: 20,
            });
          }

          // Upload via backend endpoint
          const response = await fetch('/api/upload-to-s3', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: key,
              fileContent: base64String,
              contentType: file.type,
              bucket: config.s3Bucket,
            }),
          });

          if (onProgress) {
            onProgress({
              loaded: file.size * 0.8,
              total: file.size,
              percentage: 80,
            });
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
          }

          const result = await response.json();
          
          if (onProgress) {
            onProgress({
              loaded: file.size,
              total: file.size,
              percentage: 100,
            });
          }

          resolve(result.location);
        } catch (error) {
          reject(new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  static generateFileName(campaignId: string, sessionId: string, originalFileName: string): string {
    const extension = originalFileName.split('.').pop();
    return `campaign${campaignId}Session${sessionId}.${extension}`;
  }
}
