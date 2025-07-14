import { Calendar, Clock, Users } from 'lucide-react';
import { useParams } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PublicSession {
  id: string;
  name: string;
  date: string;
  duration?: number;
  campaign?: {
    id: string;
    name: string;
  };
  segments?: {
    items: Array<{
      id: string;
      title?: string;
      description?: string;
      image?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  tldr?: string;
}

export default function PublicSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['/api/public-session', sessionId],
    queryFn: () => apiRequest<PublicSession>(`/api/public-session/${sessionId}`, { on401: 'returnNull' }),
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-game-accent mx-auto mb-4"></div>
            <p className="text-game-secondary">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-game-error">Session not found or not available for public viewing</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort segments by order if available, otherwise by creation date
  const sortedSegments = session.segments?.items?.sort((a: any, b: any) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }) || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto p-4">
          <div>
            <h1 className="text-2xl font-bold text-game-primary">{session.name}</h1>
            <div className="flex items-center gap-4 text-sm text-game-secondary mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(session.date).toLocaleDateString()}</span>
              </div>
              {session.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{Math.round(session.duration / 60000)} minutes</span>
                </div>
              )}
              <span>Campaign: {session.campaign?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* TLDR Section */}
        {session.tldr && (
          <Card className="bg-white/10 border-slate-600/30">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-[F3A66F]">TL;DR</h2>
              <p className="leading-relaxed whitespace-pre-wrap text-[#f8f3ed]">
                {session.tldr}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Session Segments */}
        {sortedSegments.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[F3A66F]">Full Summary</h2>
            
            {sortedSegments.map((segment: any, index: number) => (
              <Card key={segment.id} className="bg-white/10 border-0">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Segment Image */}
                    {segment.image && (
                      <img 
                        src={`/api/public-image/${btoa(segment.image)}`}
                        alt={segment.title || `Segment ${index + 1}`}
                        className="w-full h-auto object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    
                    {/* Segment Content */}
                    <div className="space-y-4">
                      {segment.title && (
                        <h3 className="text-xl font-semibold text-[FCEBD5]">
                          {segment.title}
                        </h3>
                      )}
                      
                      {segment.description && (
                        <div className="leading-relaxed whitespace-pre-wrap text-[FCEBD5]">
                          {segment.description}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Content Message */}
        {!session.tldr && sortedSegments.length === 0 && (
          <Card className="bg-white/10 border-0">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-game-secondary mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-game-primary mb-2">Session Processing</h3>
              <p className="text-game-secondary">
                This session is still being processed. Content will appear here once transcription and analysis are complete.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}