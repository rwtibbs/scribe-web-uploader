import logoPath from '@assets/Main-logo_1751318189156.png';
import { LoginForm } from '../components/login-form';
import { UserInfo } from '../components/user-info';
import { MultiSessionForm } from '../components/multi-session-form';
import { useAuth } from '../contexts/auth-context';

export default function MultiUploadPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-game-accent mx-auto mb-4"></div>
          <p className="text-game-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <img src={logoPath} alt="Scribe Logo" className="h-16 w-auto" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-game-primary mb-4">Upload Sessions</h1>
            {!isAuthenticated ? (
              <p className="text-game-secondary text-lg mb-4">Sign in to upload multiple session recordings at once</p>
            ) : (
              <p className="text-game-secondary text-lg max-w-lg mx-auto">Uploaded audio can be found in the "Add Sessions" page. After upload </p>
            )}
          </div>
        </div>

        {/* Authentication Section */}
        {!isAuthenticated ? (
          <LoginForm />
        ) : (
          <div className="space-y-8">
            {/* User Info */}
            <UserInfo />

            {/* Multi-Session Upload Form */}
            <MultiSessionForm />
          </div>
        )}
      </div>
    </div>
  );
}