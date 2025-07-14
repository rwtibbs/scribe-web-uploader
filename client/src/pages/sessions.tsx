import { Calendar, Clock, Users, ArrowLeft, Dice6 } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSessions } from '@/hooks/use-sessions';
import { useCampaign } from '@/contexts/campaign-context';
import { AuthenticatedImage } from '@/components/authenticated-image';
import { formatDistanceToNow } from 'date-fns';

export default function SessionsPage() {
  const { selectedCampaign } = useCampaign();
  const { data: sessions, isLoading, error } = useSessions();

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-game-accent mx-auto mb-4"></div>
            <p className="text-game-secondary">Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-game-error">Failed to load sessions</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort sessions by date (newest first)
  const sortedSessions = sessions?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  // Show message if no campaign is selected
  if (!selectedCampaign) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Dice6 className="h-16 w-16 text-game-secondary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-game-primary mb-2">Select a Campaign</h3>
            <p className="text-game-secondary mb-6">
              Please select a campaign from the dropdown above to view your sessions.
            </p>
            <Link href="/">
              <Button className="btn-primary bg-game-accent hover:bg-game-hover text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Upload
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-game-primary mb-2">
            Sessions
          </h1>
          <p className="text-game-secondary">Browse and manage your sessions for this campaign</p>
        </div>

        {/* Sessions Grid */}
        {sortedSessions.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-game-secondary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-game-primary mb-2">No Sessions Yet</h3>
            <p className="text-game-secondary mb-6">Upload your first session to get started</p>
            <Link href="/upload">
              <Button className="btn-primary bg-game-accent hover:bg-game-hover text-white">
                Upload Session
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedSessions.map((session) => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-slate-800/50 border-slate-600/30 hover:border-game-accent/50">
                  <CardContent className="p-6">
                    {/* Session Image */}
                    <div className="w-full h-32 bg-gradient-to-br from-game-accent/20 to-game-primary/20 rounded-lg mb-4 overflow-hidden group-hover:from-game-accent/30 group-hover:to-game-primary/30 transition-all duration-300">
                      {session.primaryImage ? (
                        <AuthenticatedImage 
                          imageUrl={session.primaryImage}
                          alt={session.name}
                          className="w-full h-full object-cover"
                          fallbackClassName="w-full h-full bg-gradient-to-br from-game-accent/20 to-game-primary/20 flex items-center justify-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="h-8 w-8 text-game-accent/60" />
                        </div>
                      )}
                    </div>

                    {/* Session Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg text-game-primary group-hover:text-game-accent transition-colors">
                        {session.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-game-secondary">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      
                      {session.duration && (
                        <div className="flex items-center gap-2 text-sm text-game-secondary">
                          <Clock className="h-4 w-4" />
                          <span>{Math.round(session.duration / 60000)} minutes</span>
                        </div>
                      )}

                      <div className="text-xs text-game-secondary/70">
                        Campaign: {session.campaign?.name || 'Unknown'}
                      </div>

                      {/* Status Badge */}
                      <div className="pt-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          session.transcriptionStatus === 'completed' 
                            ? 'bg-game-success/20 text-game-success' 
                            : session.transcriptionStatus === 'processing'
                            ? 'bg-game-accent/20 text-game-accent'
                            : session.transcriptionStatus === 'error'
                            ? 'bg-game-error/20 text-game-error'
                            : 'bg-game-secondary/20 text-game-secondary'
                        }`}>
                          {session.transcriptionStatus === 'completed' && 'Ready'}
                          {session.transcriptionStatus === 'processing' && 'Processing'}
                          {session.transcriptionStatus === 'error' && 'Error'}
                          {session.transcriptionStatus === 'UPLOADED' && 'Uploaded'}
                          {session.transcriptionStatus === 'NOTSTARTED' && 'Pending'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}