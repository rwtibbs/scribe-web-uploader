import { getAwsConfig } from './aws-config';
import { S3UploadParams } from '@/types/aws';

// Wake Lock API support detection
interface CustomWakeLockSentinel {
  released: boolean;
  type: string;
  release(): Promise<void>;
}

export class S3UploadService {
  static async uploadFile({ key, file, onProgress }: S3UploadParams): Promise<string> {
    const maxFileSize = 300 * 1024 * 1024; // 300MB total limit
    
    if (file.size > maxFileSize) {
      throw new Error(`File too large: ${Math.round(file.size / (1024 * 1024))}MB. Maximum size is 300MB.`);
    }

    // Force garbage collection before upload to free memory
    if (window.gc) {
      window.gc();
    }

    try {
      // Try direct presigned URL upload first
      console.log('🔄 Attempting direct S3 upload...');
      return await S3UploadService.uploadFileWithPresignedUrl({ key, file, onProgress });
    } catch (error) {
      console.warn('⚠️ Direct upload failed, trying server-side upload fallback:', error);
      
      // If direct upload fails (likely CORS issue), fallback to server-side upload
      return S3UploadService.uploadFileViaServer({ key, file, onProgress });
    }
  }

  private static async uploadFileWithPresignedUrl({ key, file, onProgress }: S3UploadParams): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let wakeLock: CustomWakeLockSentinel | null = null;
      
      // Monitor page visibility changes - declare outside try block for cleanup access
      const handleVisibilityChange = () => {
        if (document.hidden) {
          console.log('📱 App went to background - upload may be suspended');
        } else {
          console.log('📱 App returned to foreground');
        }
      };
      
      try {
        const fileSizeMB = file.size / (1024 * 1024);
        console.log('🔗 Starting presigned URL upload...');
        console.log(`📁 Uploading file: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
        
        // Request wake lock to prevent background suspension
        try {
          if ('wakeLock' in navigator && navigator.wakeLock) {
            wakeLock = await (navigator.wakeLock as any).request('screen');
            console.log('🔒 Wake lock acquired - preventing background suspension');
          }
        } catch (wakeLockError) {
          console.warn('⚠️ Wake lock not supported or failed:', wakeLockError);
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
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
        
        // Set timeout to 10 minutes for large files
        xhr.timeout = 10 * 60 * 1000; // 10 minutes
        
        // Configure for better reliability with large files
        xhr.withCredentials = false; // Disable credentials for S3 uploads
        
        let lastProgressTime = Date.now();
        let progressStalled = false;
        
        xhr.upload.addEventListener('progress', (event) => {
          lastProgressTime = Date.now();
          if (event.lengthComputable && onProgress) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            console.log(`📈 Upload progress: ${percentage}% (${Math.round(event.loaded / (1024 * 1024))}MB / ${Math.round(event.total / (1024 * 1024))}MB)`);
            onProgress({ loaded: event.loaded, total: event.total, percentage });
          }
        });

        xhr.addEventListener('load', () => {
          // Cleanup
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (wakeLock) {
            wakeLock.release();
            console.log('🔓 Wake lock released');
          }
          
          console.log(`📥 Upload finished with status: ${xhr.status}, response: ${xhr.responseText || 'empty'}`);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            // Construct the S3 location URL
            const config = getAwsConfig();
            const location = `https://${config.s3Bucket}.s3.${config.region}.amazonaws.com/public/audioUploads/${key}`;
            console.log('✅ Upload completed successfully');
            resolve(location);
          } else {
            console.error(`❌ Upload failed with status: ${xhr.status}, response: ${xhr.responseText}`);
            reject(new Error(`Upload failed with status: ${xhr.status}. ${xhr.responseText || 'Please try again.'}`));
          }
        });

        xhr.addEventListener('timeout', () => {
          // Cleanup
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (wakeLock) {
            wakeLock.release();
            console.log('🔓 Wake lock released (timeout)');
          }
          
          console.error('⏰ Upload timed out after 10 minutes');
          reject(new Error('Upload timed out. Please check your connection and try again with a smaller file.'));
        });

        xhr.addEventListener('error', (event) => {
          // Cleanup
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (wakeLock) {
            wakeLock.release();
            console.log('🔓 Wake lock released (error)');
          }
          
          console.error('❌ Network error during upload:', event);
          console.error('❌ XHR status:', xhr.status, 'readyState:', xhr.readyState);
          console.error('❌ Presigned URL used:', presignedUrl.substring(0, 100) + '...');
          console.error('❌ Upload target bucket:', presignedUrl.includes('scribe8a8fcf3f6cb14734bce4bd48352f80433dbd8-dev') ? 'Production (DEV)' : 'Unknown');
          
          // More specific error handling
          if (document.hidden) {
            reject(new Error('Upload failed: App was moved to background. Please keep the app active during upload.'));
          } else if (xhr.status === 0) {
            // This is likely a CORS issue with the production S3 bucket
            reject(new Error('Unable to connect to storage server. This appears to be a CORS configuration issue with the production bucket. Please contact support to resolve S3 bucket permissions.'));
          } else {
            reject(new Error(`Network error during upload (status: ${xhr.status}). Please check your connection and try again.`));
          }
        });

        xhr.addEventListener('abort', () => {
          // Cleanup
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (wakeLock) {
            wakeLock.release();
            console.log('🔓 Wake lock released (abort)');
          }
          
          console.warn('⚠️ Upload was aborted');
          reject(new Error('Upload was cancelled'));
        });

        // Monitor for stalled uploads - more aggressive detection
        const stallCheckInterval = setInterval(() => {
          const timeSinceLastProgress = Date.now() - lastProgressTime;
          if (timeSinceLastProgress > 60 * 1000) { // 1 minute without progress
            console.warn('⚠️ Upload appears stalled, no progress for 1 minute');
            clearInterval(stallCheckInterval);
            xhr.abort();
          }
        }, 15000); // Check every 15 seconds

        xhr.addEventListener('loadend', () => {
          clearInterval(stallCheckInterval);
        });

        // Upload directly to S3
        xhr.open('PUT', presignedUrl);
        
        // Important: Set the exact same content type that was used to generate the presigned URL
        const uploadContentType = file.type || 'audio/mpeg';
        xhr.setRequestHeader('Content-Type', uploadContentType);
        
        console.log(`📤 Starting direct S3 upload with Content-Type: ${uploadContentType}`);
        console.log(`📊 File size: ${Math.round(file.size / (1024 * 1024))}MB, timeout: 10 minutes`);
        xhr.send(file);

      } catch (error) {
        // Cleanup on error
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (wakeLock) {
          wakeLock.release();
          console.log('🔓 Wake lock released (catch)');
        }
        
        reject(new Error(`Presigned URL upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  private static async uploadFileViaServer({ key, file, onProgress }: S3UploadParams): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🌐 Starting server-side upload fallback...');
        console.log(`📁 Uploading file via server: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', key);

        const xhr = new XMLHttpRequest();
        xhr.timeout = 15 * 60 * 1000; // 15 minutes for server-side upload

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            console.log(`📈 Server upload progress: ${percentage}%`);
            onProgress({ loaded: event.loaded, total: event.total, percentage });
          }
        });

        xhr.addEventListener('load', () => {
          console.log(`📥 Server upload finished with status: ${xhr.status}`);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.location) {
                console.log('✅ Server-side upload completed successfully');
                resolve(response.location);
              } else {
                reject(new Error(response.message || 'Server upload failed'));
              }
            } catch (parseError) {
              reject(new Error('Failed to parse server response'));
            }
          } else {
            reject(new Error(`Server upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('❌ Server upload network error');
          reject(new Error('Server upload failed due to network error'));
        });

        xhr.addEventListener('timeout', () => {
          console.error('⏰ Server upload timed out');
          reject(new Error('Server upload timed out'));
        });

        xhr.open('POST', '/api/upload-server-side');
        xhr.send(formData);

      } catch (error) {
        reject(new Error(`Server upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  static generateFileName(campaignId: string, sessionId: string, originalFileName: string): string {
    const extension = originalFileName.split('.').pop();
    return `campaign${campaignId}Session${sessionId}.${extension}`;
  }
}