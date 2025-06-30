import { getAwsConfig } from './aws-config';
import { S3UploadParams } from '@/types/aws';

export class S3UploadService {
  static async uploadFile({ key, file, onProgress }: S3UploadParams): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const config = getAwsConfig();
        
        const fileSizeMB = file.size / (1024 * 1024);
        console.log('🔄 Starting file upload process...');
        console.log(`📁 Uploading file: ${file.name} (${fileSizeMB.toFixed(2)}MB / ${file.size} bytes)`);
        console.log(`🏷️ File type: ${file.type}, Key: ${key}`);
        
        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append('audioFile', file);
        formData.append('fileName', key);
        formData.append('bucket', config.s3Bucket);

        if (onProgress) {
          onProgress({
            loaded: 0,
            total: file.size,
            percentage: 0,
          });
        }

        console.log(`🚀 Uploading to backend: ${key}`);
        
        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage,
            });
          }
        });

        xhr.addEventListener('load', () => {
          console.log(`📡 Backend response status: ${xhr.status}`);
          console.log(`📡 Backend response text:`, xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result.location);
            } catch (parseError) {
              console.error('Failed to parse successful response:', parseError);
              reject(new Error('Failed to parse response'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              console.error('Upload failed with error data:', errorData);
              reject(new Error(errorData.message || `Upload failed with status: ${xhr.status}`));
            } catch (parseError) {
              console.error('Failed to parse error response:', parseError);
              reject(new Error(`Upload failed with status: ${xhr.status}. Response: ${xhr.responseText}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/upload-to-s3');
        xhr.send(formData);

      } catch (error) {
        reject(new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  static generateFileName(campaignId: string, sessionId: string, originalFileName: string): string {
    const extension = originalFileName.split('.').pop();
    return `campaign${campaignId}Session${sessionId}.${extension}`;
  }
}
