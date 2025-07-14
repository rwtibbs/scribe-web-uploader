import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AuthenticatedImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function AuthenticatedImage({ imageUrl, alt, className, fallbackClassName }: AuthenticatedImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const fetchSignedUrl = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const response = await apiRequest(
          'POST',
          '/api/generate-image-url',
          { imageUrl }
        );
        
        const data = await response.json();
        
        if (data.signedUrl) {
          setSignedUrl(data.signedUrl);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('Failed to generate signed URL for image:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedUrl();
  }, [imageUrl]);

  if (isLoading) {
    return (
      <div className={fallbackClassName || "w-full h-64 bg-gradient-to-br from-game-accent/20 to-game-primary/20 rounded-lg flex items-center justify-center"}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-game-accent"></div>
      </div>
    );
  }

  if (hasError || !signedUrl) {
    return (
      <div className={fallbackClassName || "w-full h-64 bg-gradient-to-br from-game-accent/20 to-game-primary/20 rounded-lg flex items-center justify-center"}>
        <Users className="h-8 w-8 text-game-accent/60" />
      </div>
    );
  }

  return (
    <img 
      src={signedUrl}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}