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
      <div className="min-h-screen p-4">
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
    <div className="min-h-screen p-4">
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
                <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white/10 border-slate-600/30 hover:border-game-accent/50">
                  <CardContent className="p-6">


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