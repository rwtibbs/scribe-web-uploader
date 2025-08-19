import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { AuthenticatedImage } from '@/components/authenticated-image';
import { AdminGuard } from '@/components/admin-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft, Calendar, User, FileImage } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

interface ImageData {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  session: {
    id: string;
    name: string;
    date: string;
  };
  campaign: {
    id: string;
    name: string;
  };
  user: {
    username: string;
    email: string;
  };
}

interface AllImagesResponse {
  success: boolean;
  total: number;
  images: ImageData[];
}

export default function InternalImagesPage() {
  return (
    <AdminGuard fallbackMessage="This internal image viewer is restricted to authorized administrators only.">
      <InternalImagesContent />
    </AdminGuard>
  );
}

function InternalImagesContent() {
  const { user } = useAuth();

  const { data: imagesData, isLoading, error } = useQuery({
    queryKey: ['/api/internal/all-images'],
    queryFn: async () => {
      const response = await apiRequest('/api/internal/all-images');
      return response as AllImagesResponse;
    },
    enabled: !!user?.accessToken,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Internal Image Viewer</h1>
            <p className="text-gray-300">Loading all generated images...</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-white/10 rounded-lg mb-4"></div>
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded mb-1"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101] text-white">
        <div className="container mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Error Loading Images</h1>
            <p className="text-gray-300 mb-4">
              {error instanceof Error ? error.message : 'Failed to load images'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const images = imagesData?.images || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Internal Image Viewer</h1>
              <p className="text-gray-300">
                All generated images from all users ({imagesData?.total || 0} total)
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <FileImage className="w-4 h-4 mr-2" />
              {imagesData?.total || 0} Images
            </Badge>
          </div>
        </div>

        {/* Images Grid */}
        {images.length === 0 ? (
          <div className="text-center py-16">
            <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">No Images Found</h2>
            <p className="text-gray-300">
              No generated images have been created yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {images.map((image: ImageData) => (
              <Card 
                key={image.id} 
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors group"
              >
                <CardContent className="p-4">
                  {/* Image */}
                  <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gradient-to-br from-game-accent/20 to-game-primary/20">
                    <AuthenticatedImage
                      imageUrl={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackClassName="w-full h-full bg-gradient-to-br from-game-accent/20 to-game-primary/20 flex items-center justify-center"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                    {image.title}
                  </h3>

                  {/* Description */}
                  {image.description && (
                    <p className="text-xs text-gray-300 mb-3 line-clamp-2">
                      {image.description}
                    </p>
                  )}

                  {/* User Info */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-xs text-gray-300">
                      <User className="w-3 h-3 mr-1" />
                      <span className="truncate">{image.user.email}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-300">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>
                        {format(new Date(image.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  {/* Campaign and Session Info */}
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs text-white border-white/20">
                      {image.campaign.name}
                    </Badge>
                    <p className="text-xs text-gray-400 truncate">
                      {image.session.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}