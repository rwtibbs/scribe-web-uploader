import { getAwsConfig } from './aws-config';
import { S3UploadParams } from '@/types/aws';

export class S3UploadService {
  static async uploadFile({ key, file, onProgress }: S3UploadParams): Promise<string> {
    const maxFileSize = 300 * 1024 * 1024; // 300MB total limit
    
    if (file.size > maxFileSize) {
      throw new Error(`File too large: ${Math.round(file.size / (1024 * 1024))}MB. Maximum size is 300MB.`);
    }

    // Use direct presigned URL upload (bypasses server completely)
    return S3UploadService.uploadFileWithPresignedUrl({ key, file, onProgress });
  }

  private static async uploadFileWithPresignedUrl({ key, file, onProgress }: S3UploadParams): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileSizeMB = file.size / (1024 * 1024);
        console.log('🔗 Starting presigned URL upload...');
        console.log(`📁 Uploading file: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
        
        // Step 1: Get presigned URL from server
        const urlResponse = await fetch('/api/generate-presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: key,
            fileSize: file.size,
            contentType: file.type || 'audio/mpeg'
          })
        });

        if (!urlResponse.ok) {
          const errorData = await urlResponse.json();
          throw new Error(errorData.message || 'Failed to get presigned URL');
        }

        const { presignedUrl } = await urlResponse.json();
        
        if (onProgress) {
          onProgress({ loaded: 0, total: file.size, percentage: 0 });
        }

        // Step 2: Upload directly to S3 using presigned URL
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({ loaded: event.loaded, total: event.total, percentage });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Construct the S3 location URL
            const config = getAwsConfig();
            const location = `https://${config.s3Bucket}.s3.${config.region}.amazonaws.com/public/audioUploads/${key}`;
            resolve(location);
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        // Upload directly to S3
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');
        xhr.send(file);

      } catch (error) {
        reject(new Error(`Presigned URL upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  static generateFileName(campaignId: string, sessionId: string, originalFileName: string): string {
    const extension = originalFileName.split('.').pop();
    return `campaign${campaignId}Session${sessionId}.${extension}`;
  }
}