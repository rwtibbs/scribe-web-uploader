import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Upload, RotateCcw, X, Dice6, Plus, Trash2 } from 'lucide-react';
import { SimpleFileUpload } from './simple-file-upload';
import { UploadProgressComponent } from './upload-progress';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useAuth } from '@/contexts/auth-context';
import { useCampaign } from '@/contexts/campaign-context';
import { graphqlClient } from '@/lib/graphql';
import { S3UploadService } from '@/lib/s3-upload';
import { UploadProgress } from '@shared/schema';

// Schema for a single session
const singleSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  date: z.string().min(1, 'Session date is required'),
  file: z.any().optional(), // Will be validated separately
});

// Schema for the entire form
const multiSessionFormSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  sessions: z.array(singleSessionSchema).min(1, 'At least one session is required'),
});

type SingleSession = z.infer<typeof singleSessionSchema> & {
  id: string;
  file?: File;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  uploadProgress?: UploadProgress;
  errorMessage?: string;
};

type MultiSessionFormData = z.infer<typeof multiSessionFormSchema>;

const MAX_SESSIONS = 5;

export function MultiSessionForm() {
  const { user } = useAuth();
  const { selectedCampaign } = useCampaign();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns(user?.username);
  
  const [sessions, setSessions] = useState<SingleSession[]>([
    {
      id: '1',
      name: '',
      date: new Date().toISOString().split('T')[0],
      uploadStatus: 'idle'
    }
  ]);
  
  const [globalUploadStatus, setGlobalUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState<number | null>(null);
  const [completedUploads, setCompletedUploads] = useState<number>(0);
  const [globalErrorMessage, setGlobalErrorMessage] = useState<string | null>(null);

  const form = useForm<MultiSessionFormData>({
    resolver: zodResolver(multiSessionFormSchema),
    defaultValues: {
      campaignId: selectedCampaign?.id || '',
      sessions: sessions.map(s => ({ name: s.name, date: s.date })),
    },
  });

  // Update campaignId when selectedCampaign changes
  useEffect(() => {
    if (selectedCampaign) {
      form.setValue('campaignId', selectedCampaign.id);
    }
  }, [selectedCampaign, form]);

  // Update form sessions when sessions state changes
  useEffect(() => {
    form.setValue('sessions', sessions.map(s => ({ name: s.name, date: s.date })));
  }, [sessions, form]);

  const addSession = () => {
    if (sessions.length < MAX_SESSIONS) {
      const newSession: SingleSession = {
        id: Date.now().toString(),
        name: '',
        date: new Date().toISOString().split('T')[0],
        uploadStatus: 'idle'
      };
      setSessions([...sessions, newSession]);
    }
  };

  const removeSession = (sessionId: string) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter(s => s.id !== sessionId));
    }
  };

  const updateSession = (sessionId: string, updates: Partial<SingleSession>) => {
    setSessions(sessions.map(s => 
      s.id === sessionId ? { ...s, ...updates } : s
    ));
  };

  const handleFileSelect = (sessionId: string, file: File) => {
    const maxSize = 300 * 1024 * 1024; // 300MB limit
    const fileSizeMB = file.size / (1024 * 1024);
    
    console.log(`📁 File selected for session ${sessionId}: ${file.name}, Size: ${fileSizeMB.toFixed(2)}MB`);
    
    if (file.size > maxSize) {
      updateSession(sessionId, {
        errorMessage: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 300MB. Please compress your audio file using tools like Audacity (Export > MP3 with lower bitrate) or online audio compressors.`
      });
      return;
    }
    
    updateSession(sessionId, {
      file,
      errorMessage: undefined
    });
  };

  const handleFileRemove = (sessionId: string) => {
    updateSession(sessionId, {
      file: undefined,
      errorMessage: undefined
    });
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        const durationMillis = Math.round(audio.duration * 1000);
        resolve(durationMillis);
        URL.revokeObjectURL(audio.src);
      };
      
      audio.onerror = () => {
        reject(new Error('Failed to load audio metadata'));
        URL.revokeObjectURL(audio.src);
      };
      
      audio.src = URL.createObjectURL(file);
    });
  };

  const uploadSingleSession = async (sessionData: SingleSession, campaignId: string): Promise<void> => {
    if (!sessionData.file || !user) {
      throw new Error('Missing file or user authentication');
    }

    const selectedCampaign = campaigns?.find(c => c.id === campaignId);
    if (!selectedCampaign) {
      throw new Error('Selected campaign not found');
    }

    const getLocalDateString = (date: Date) => {
      return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    };

    // Step 1: Get audio duration
    updateSession(sessionData.id, {
      uploadStatus: 'uploading',
      uploadProgress: { percentage: 5, loaded: 0, total: 100, status: 'Analyzing audio file...' },
      errorMessage: undefined
    });
    
    const currentDurationMillis = await getAudioDuration(sessionData.file);
    console.log(`📊 Audio duration detected for session ${sessionData.id}: ${currentDurationMillis}ms`);

    // Step 2: Create session record
    updateSession(sessionData.id, {
      uploadProgress: { percentage: 10, loaded: 0, total: 100, status: 'Creating session...' }
    });
    
    const session = await graphqlClient.createSession({
      name: sessionData.name,
      duration: currentDurationMillis,
      audioFile: "",
      transcriptionFile: "",
      transcriptionStatus: "NOTSTARTED",
      campaignSessionsId: campaignId,
      date: sessionData.date || getLocalDateString(new Date()),
    }, user?.accessToken);

    if (!session || !session.id) {
      throw new Error('Failed to create session - invalid session object');
    }
    
    console.log(`✅ Session created successfully: id=${session.id}, version=${session._version}`);

    // Step 3: Upload audio file
    updateSession(sessionData.id, {
      uploadProgress: { percentage: 30, loaded: 0, total: 100, status: 'Uploading audio file...' }
    });
    
    const fileName = S3UploadService.generateFileName(
      campaignId,
      session.id,
      sessionData.file.name
    );

    const s3Url = await S3UploadService.uploadFile({
      key: fileName,
      file: sessionData.file,
      onProgress: (progress) => {
        updateSession(sessionData.id, {
          uploadProgress: {
            ...progress,
            percentage: 30 + (progress.percentage * 0.4), // 30-70% range
            status: 'Uploading to S3...',
          }
        });
      },
    });

    // Step 4: Update session data
    updateSession(sessionData.id, {
      uploadProgress: { percentage: 80, loaded: 0, total: 100, status: 'Updating session data...' }
    });
    
    const fileExtension = sessionData.file.name.split('.').pop() || 'unknown';
    const baseFile = `campaign${selectedCampaign.id}Session${session.id}`;
    const baseAudioFile = `${baseFile}.${fileExtension}`;
    const baseTranscriptionFile = `${baseFile}.json`;
    
    console.log(`📝 Updating session ${sessionData.id} with files: audio=${baseAudioFile}, transcription=${baseTranscriptionFile}`);
    
    await graphqlClient.updateSessionAudioFile(
      session.id, 
      baseAudioFile, 
      baseTranscriptionFile, 
      session._version, 
      user?.accessToken
    );

    updateSession(sessionData.id, {
      uploadProgress: { percentage: 100, loaded: 100, total: 100, status: 'Upload complete!' },
      uploadStatus: 'success'
    });
  };

  const handleSubmit = async (data: MultiSessionFormData) => {
    // Validate all sessions have files
    const sessionsWithFiles = sessions.filter(s => s.file);
    if (sessionsWithFiles.length === 0) {
      setGlobalErrorMessage('Please select at least one audio file');
      return;
    }

    if (!user) {
      setGlobalErrorMessage('User not authenticated');
      return;
    }

    try {
      setGlobalUploadStatus('uploading');
      setGlobalErrorMessage(null);
      setCompletedUploads(0);

      // Process each session sequentially
      for (let i = 0; i < sessionsWithFiles.length; i++) {
        const sessionData = sessionsWithFiles[i];
        setCurrentUploadingIndex(i);
        
        console.log(`🚀 Starting upload for session ${i + 1}/${sessionsWithFiles.length}: ${sessionData.name}`);
        
        // Add delay between uploads to prevent resource conflicts
        if (i > 0) {
          console.log(`⏳ Waiting 3 seconds before starting next upload...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            if (retryCount > 0) {
              console.log(`🔄 Retry attempt ${retryCount}/${maxRetries} for session "${sessionData.name}"`);
              updateSession(sessionData.id, {
                uploadProgress: { percentage: 0, loaded: 0, total: 100, status: `Retrying upload (${retryCount}/${maxRetries})...` }
              });
            }
            
            await uploadSingleSession(sessionData, data.campaignId);
            
            // Explicitly mark session as successful
            updateSession(sessionData.id, {
              uploadStatus: 'success',
              errorMessage: undefined,
              uploadProgress: { percentage: 100, loaded: 100, total: 100, status: 'Upload complete!' }
            });
            
            setCompletedUploads(i + 1);
            console.log(`✅ Completed upload for session ${i + 1}/${sessionsWithFiles.length}`);
            
            // Force memory cleanup after successful upload
            if (window.gc) {
              window.gc();
            }
            
            break; // Success, exit retry loop
            
          } catch (error) {
            retryCount++;
            console.error(`❌ Upload attempt ${retryCount} failed for session "${sessionData.name}":`, error);
            
            if (retryCount > maxRetries) {
              // Final failure after all retries
              const errorMessage = error instanceof Error ? error.message : 'Upload failed';
              updateSession(sessionData.id, {
                uploadStatus: 'error',
                errorMessage: `Failed after ${maxRetries} retries: ${errorMessage}`,
                uploadProgress: undefined
              });
              throw new Error(`Failed to upload session "${sessionData.name}" after ${maxRetries} retries: ${errorMessage}`);
            } else {
              // Wait before retry
              console.log(`⏳ Waiting 2 seconds before retry ${retryCount}...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      }

      setGlobalUploadStatus('success');
      setCurrentUploadingIndex(null);
      console.log(`🎉 All ${sessionsWithFiles.length} sessions uploaded successfully!`);

    } catch (error) {
      setGlobalUploadStatus('error');
      setCurrentUploadingIndex(null);
      setGlobalErrorMessage(error instanceof Error ? error.message : 'Batch upload failed');
    }
  };

  const resetForm = () => {
    setSessions([
      {
        id: '1',
        name: '',
        date: new Date().toISOString().split('T')[0],
        uploadStatus: 'idle'
      }
    ]);
    form.reset();
    setGlobalUploadStatus('idle');
    setCurrentUploadingIndex(null);
    setCompletedUploads(0);
    setGlobalErrorMessage(null);
  };

  const dismissSuccessMessage = () => {
    setGlobalUploadStatus('idle');
  };

  // Show message if no campaign is selected
  if (!selectedCampaign) {
    return (
      <Card className="bg-black/20 backdrop-blur-sm border-game-primary/20">
        <CardContent className="p-12 text-center">
          <Dice6 className="h-16 w-16 text-game-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-game-primary mb-2">Select a Campaign</h3>
          <p className="text-game-secondary">
            Please select a campaign from the dropdown above to upload session recordings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-game-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-game-primary">Upload Sessions</CardTitle>
        <p className="text-game-secondary">
          Uploading to campaign: <span className="text-game-accent font-medium">{selectedCampaign.name}</span>
        </p>
        {sessions.filter(s => s.file).length > 0 && (
          <p className="text-sm text-game-secondary">
            Sessions with files: {sessions.filter(s => s.file).length} / {sessions.length}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

          {/* Session List */}
          <div className="space-y-6">
            {sessions.map((session, index) => (
              <Card key={session.id} className="bg-game-primary/5 border-game-primary/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-game-primary">
                      Session {index + 1}
                      {session.uploadStatus === 'uploading' && currentUploadingIndex === index && (
                        <span className="ml-2 text-sm text-game-accent">(Uploading...)</span>
                      )}
                      {session.uploadStatus === 'success' && (
                        <span className="ml-2 text-sm text-game-success">(✓ Complete)</span>
                      )}
                      {session.uploadStatus === 'error' && (
                        <span className="ml-2 text-sm text-game-error">(⚠ Error)</span>
                      )}
                    </h3>
                    {sessions.length > 1 && globalUploadStatus !== 'uploading' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSession(session.id)}
                        className="text-game-error hover:text-red-400 hover:bg-game-error/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* All Fields in One Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_auto] gap-4 items-end">
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-game-primary">
                        Audio Recording <span className="text-game-error">*</span>
                      </Label>
                      <SimpleFileUpload
                        onFileSelect={(file) => handleFileSelect(session.id, file)}
                        selectedFile={session.file}
                        onFileRemove={() => handleFileRemove(session.id)}
                        disabled={globalUploadStatus === 'uploading'}
                      />
                    </div>

                    {/* Session Name */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-game-primary">
                        Session Name <span className="text-game-error">*</span>
                      </Label>
                      <Input
                        value={session.name}
                        onChange={(e) => updateSession(session.id, { name: e.target.value })}
                        className="form-input bg-game-primary/5 border-game-primary/20 text-game-primary placeholder:text-game-secondary/50"
                        placeholder={`Session ${index + 1}: The Adventure Begins`}
                        disabled={globalUploadStatus === 'uploading'}
                      />
                    </div>

                    {/* Session Date */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-game-primary">
                        Session Date <span className="text-game-error">*</span>
                      </Label>
                      <Input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={session.date}
                        onChange={(e) => updateSession(session.id, { date: e.target.value })}
                        className="form-input bg-game-primary/5 border-game-primary/20 text-game-primary"
                        disabled={globalUploadStatus === 'uploading'}
                      />
                    </div>
                  </div>

                  {/* Session Upload Progress */}
                  {session.uploadProgress && session.uploadStatus === 'uploading' && (
                    <UploadProgressComponent progress={session.uploadProgress} />
                  )}

                  {/* Session Error Message */}
                  {session.errorMessage && (
                    <Alert className="bg-game-error/10 border-game-error/20">
                      <AlertTriangle className="h-4 w-4 text-game-error" />
                      <AlertDescription className="text-game-error">
                        {session.errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Session Button or Max Message */}
          {globalUploadStatus !== 'uploading' && (
            <div className="text-center">
              {sessions.length < MAX_SESSIONS ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSession}
                  className="border-game-accent/30 hover:border-game-accent/50 text-game-accent hover:text-game-accent hover:bg-game-accent/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Session
                </Button>
              ) : (
                <Alert className="bg-game-secondary/10 border-game-secondary/20">
                  <AlertTriangle className="h-4 w-4 text-game-secondary" />
                  <AlertDescription className="text-game-secondary">
                    <div className="font-medium mb-1">Maximum Sessions Reached</div>
                    Max {MAX_SESSIONS} sessions per upload batch. To upload more, submit these sessions first then refresh the page.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Global Progress Status */}
          {globalUploadStatus === 'uploading' && (
            <Alert className="bg-game-accent/10 border-game-accent/20">
              <AlertTriangle className="h-4 w-4 text-game-accent" />
              <AlertDescription className="text-game-accent">
                <div className="font-medium mb-1">Processing Sessions ({completedUploads}/{sessions.filter(s => s.file).length})</div>
                {currentUploadingIndex !== null && (
                  <div>Currently uploading: Session {currentUploadingIndex + 1}</div>
                )}
                <div className="text-sm mt-1">Please keep this tab open and avoid switching to other apps during upload to prevent network interruptions.</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Global Status Messages */}
          {globalUploadStatus === 'success' && (
            <Alert className="bg-game-success/10 border-game-success/20 relative">
              <CheckCircle className="h-4 w-4 text-game-success" />
              <AlertDescription className="text-game-success pr-8">
                <div className="font-medium mb-1">All Sessions Uploaded Successfully!</div>
                {completedUploads} session{completedUploads !== 1 ? 's' : ''} uploaded. To continue, open the New Session page in the app to find your saved files.
              </AlertDescription>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-game-success/20"
                onClick={dismissSuccessMessage}
              >
                <X className="h-4 w-4 text-game-success hover:text-game-success" />
                <span className="sr-only">Dismiss success message</span>
              </Button>
            </Alert>
          )}

          {globalUploadStatus === 'error' && globalErrorMessage && (
            <Alert className="bg-game-error/10 border-game-error/20">
              <AlertTriangle className="h-4 w-4 text-game-error" />
              <AlertDescription className="text-game-error">
                {globalErrorMessage}
              </AlertDescription>
            </Alert>
          )}

          {globalErrorMessage && globalUploadStatus !== 'error' && (
            <Alert className="bg-game-error/10 border-game-error/20">
              <AlertTriangle className="h-4 w-4 text-game-error" />
              <AlertDescription className="text-game-error">
                {globalErrorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              disabled={globalUploadStatus === 'uploading' || sessions.filter(s => s.file).length === 0}
              className="btn-primary flex-1 py-3 bg-game-accent hover:bg-game-hover text-white font-medium"
            >
              <Upload className="h-4 w-4 mr-2" />
              {globalUploadStatus === 'uploading' 
                ? `Uploading ${currentUploadingIndex !== null ? currentUploadingIndex + 1 : ''}/${sessions.filter(s => s.file).length}...` 
                : `Upload ${sessions.filter(s => s.file).length} Session${sessions.filter(s => s.file).length !== 1 ? 's' : ''}`
              }
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={globalUploadStatus === 'uploading'}
              className="border-game-primary/30 hover:border-game-primary/50 text-game-primary hover:text-game-primary py-3 px-6 font-medium"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}