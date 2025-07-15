import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface AuthenticatedImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function AuthenticatedImage({ imageUrl, alt, className, fallbackClassName }: AuthenticatedImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!imageUrl || !user?.accessToken) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const fetchAuthenticatedImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Extract the S3 key from the full URL
        let s3Key: string;
        
        if (imageUrl.includes('amazonaws.com/')) {
          // Extract key from full S3 URL
          const urlParts = imageUrl.split('amazonaws.com/');
          s3Key = urlParts[1];
        } else if (imageUrl.startsWith('public/')) {
          // Already a key format
          s3Key = imageUrl;
        } else {
          // Assume it's a relative path and add public prefix
          s3Key = `public/${imageUrl}`;
        }
        
        // Base64 encode the S3 key for URL safety (using browser btoa)
        const encodedKey = btoa(s3Key);
        
        console.log('🖼️ AuthenticatedImage requesting:', {
          originalUrl: imageUrl,
          s3Key: s3Key,
          s3KeyLength: s3Key.length,
          encodedKey: encodedKey
        });
        
        // Fetch the image with Cognito authentication
        const response = await fetch(`/api/image/${encodedKey}`, {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch authenticated image:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    fetchAuthenticatedImage();
    
    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [imageUrl, user?.accessToken]);

  if (isLoading) {
    return (
      <div className={fallbackClassName || "w-full h-64 bg-gradient-to-br from-game-accent/20 to-game-primary/20 rounded-lg flex items-center justify-center"}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-game-accent"></div>
      </div>
    );
  }

  if (hasError || !user?.accessToken) {
    return (
      <div className={fallbackClassName || "w-full h-64 bg-gradient-to-br from-game-accent/20 to-game-primary/20 rounded-lg flex items-center justify-center"}>
        <Users className="h-8 w-8 text-game-accent/60" />
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className={fallbackClassName || "w-full h-64 bg-gradient-to-br from-game-accent/20 to-game-primary/20 rounded-lg flex items-center justify-center"}>
        <Users className="h-8 w-8 text-game-accent/60" />
      </div>
    );
  }

  return (
    <img 
      src={blobUrl}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}