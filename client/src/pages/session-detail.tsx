import { ArrowLeft, Calendar, Clock, Users, Share2 } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from '@/hooks/use-sessions';
import { AuthenticatedImage } from '@/components/authenticated-image';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading, error } = useSession(sessionId!);
  const { toast } = useToast();

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/share/${sessionId}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Share URL copied!",
        description: "The public session link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

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
            <p className="text-game-error">Session not found</p>
            <Link href="/sessions">
              <Button variant="ghost" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sessions
              </Button>
            </Link>
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
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sessions">
                <Button variant="ghost" size="sm" className="text-game-secondary hover:text-game-primary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sessions
                </Button>
              </Link>
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
            
            {/* Share Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              className="border-game-primary/30 hover:border-game-primary/50 text-game-primary hover:text-game-accent"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-8">


        {/* TLDR Section */}
        {session.tldr && (
          <Card className="bg-slate-800/50 border-slate-600/30">
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
            <h2 className="text-2xl font-bold text-[F3A66F]">Full Summary
</h2>
            
            {sortedSegments.map((segment: any, index: number) => (
              <Card key={segment.id} className="bg-slate-800/50 border-0">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Segment Image */}
                    {segment.image ? (
                      <AuthenticatedImage 
                        imageUrl={segment.image}
                        alt={segment.title || `Segment ${index + 1}`}
                        className="w-full h-auto object-cover rounded-lg"
                        fallbackClassName="w-full h-64 bg-gradient-to-br from-game-accent/20 to-game-primary/20 rounded-lg flex items-center justify-center"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-game-accent/20 to-game-primary/20 rounded-lg flex items-center justify-center">
                        <Users className="h-8 w-8 text-game-accent/60" />
                      </div>
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
          <Card className="bg-slate-800/50 border-0">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-game-secondary mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-game-primary mb-2">Session Processing</h3>
              <p className="text-game-secondary">
                This session is still being processed. Content will appear here once transcription and analysis are complete.
              </p>
              {session.transcriptionStatus && (
                <div className="mt-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    session.transcriptionStatus === 'completed' 
                      ? 'bg-game-success/20 text-game-success' 
                      : session.transcriptionStatus === 'processing'
                      ? 'bg-game-accent/20 text-game-accent'
                      : session.transcriptionStatus === 'error'
                      ? 'bg-game-error/20 text-game-error'
                      : 'bg-game-secondary/20 text-game-secondary'
                  }`}>
                    Status: {session.transcriptionStatus === 'UPLOADED' ? 'Processing' : session.transcriptionStatus}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}