import { getAwsConfig } from './aws-config';
import { S3UploadParams } from '@/types/aws';

export class S3UploadService {
  static async uploadFile({ key, file, onProgress }: S3UploadParams): Promise<string> {
    const config = getAwsConfig();
    const fileSize = file.size;
    const chunkSize = 45 * 1024 * 1024; // 45MB chunks
    const maxFileSize = 300 * 1024 * 1024; // 300MB total limit
    
    if (fileSize > maxFileSize) {
      throw new Error(`File too large: ${Math.round(fileSize / (1024 * 1024))}MB. Maximum size is 300MB.`);
    }

    // For files smaller than chunk size, use regular upload
    if (fileSize <= chunkSize) {
      return this.uploadFileRegular({ key, file, onProgress, config });
    }

    // For larger files, use chunked upload
    return this.uploadFileChunked({ key, file, onProgress, config });
  }

  private static async uploadFileRegular({ key, file, onProgress, config }: S3UploadParams & { config: any }): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileSizeMB = file.size / (1024 * 1024);
      console.log('🔄 Starting regular file upload...');
      console.log(`📁 Uploading file: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
      
      const formData = new FormData();
      formData.append('audioFile', file);
      formData.append('fileName', key);
      formData.append('bucket', config.s3Bucket);

      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
      }

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress({ loaded: event.loaded, total: event.total, percentage });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result.location);
          } catch (parseError) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.message || `Upload failed with status: ${xhr.status}`));
          } catch (parseError) {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', '/api/upload-to-s3');
      xhr.send(formData);
    });
  }

  private static async uploadFileChunked({ key, file, onProgress, config }: S3UploadParams & { config: any }): Promise<string> {
    const chunkSize = 45 * 1024 * 1024; // 45MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    console.log(`🔄 Starting chunked upload for ${file.name}: ${totalChunks} chunks`);

    try {
      // Step 1: Initiate multipart upload
      const initResponse = await fetch('/api/initiate-multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: key,
          bucket: config.s3Bucket,
          totalSize: file.size
        })
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.message || 'Failed to initiate upload');
      }

      const { uploadId } = await initResponse.json();
      const parts: Array<{ partNumber: number; etag: string }> = [];

      // Step 2: Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const partNumber = i + 1;

        console.log(`📦 Uploading chunk ${partNumber}/${totalChunks} (${Math.round(chunk.size / (1024 * 1024))}MB)`);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('uploadId', uploadId);
        formData.append('partNumber', partNumber.toString());
        formData.append('fileName', key);
        formData.append('bucket', config.s3Bucket);

        const chunkResponse = await fetch('/api/upload-chunk', {
          method: 'POST',
          body: formData,
        });

        if (!chunkResponse.ok) {
          // Abort the upload on error
          await this.abortMultipartUpload(uploadId, key, config);
          const errorData = await chunkResponse.json();
          throw new Error(errorData.message || `Failed to upload chunk ${partNumber}`);
        }

        const { etag } = await chunkResponse.json();
        parts.push({ partNumber, etag });

        // Update progress
        if (onProgress) {
          const loaded = end;
          const percentage = Math.round((loaded / file.size) * 100);
          onProgress({ loaded, total: file.size, percentage });
        }
      }

      // Step 3: Complete multipart upload
      console.log(`✅ Completing multipart upload for ${key}`);
      const completeResponse = await fetch('/api/complete-multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          fileName: key,
          bucket: config.s3Bucket,
          parts
        })
      });

      if (!completeResponse.ok) {
        await this.abortMultipartUpload(uploadId, key, config);
        const errorData = await completeResponse.json();
        throw new Error(errorData.message || 'Failed to complete upload');
      }

      const result = await completeResponse.json();
      return result.location;

    } catch (error) {
      console.error('Chunked upload failed:', error);
      throw error;
    }
  }

  private static async abortMultipartUpload(uploadId: string, fileName: string, config: any): Promise<void> {
    try {
      await fetch('/api/abort-multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          fileName,
          bucket: config.s3Bucket
        })
      });
    } catch (error) {
      console.error('Failed to abort multipart upload:', error);
    }
  }

  static generateFileName(campaignId: string, sessionId: string, originalFileName: string): string {
    const extension = originalFileName.split('.').pop();
    return `campaign${campaignId}Session${sessionId}.${extension}`;
  }
}
