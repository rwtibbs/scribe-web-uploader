import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Upload, RotateCcw } from 'lucide-react';
import { FileUploadZone } from './file-upload-zone';
import { UploadProgressComponent } from './upload-progress';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useAuth } from '@/hooks/use-auth';
import { graphqlClient } from '@/lib/graphql';
import { S3UploadService } from '@/lib/s3-upload';
import { UploadProgress } from '@shared/schema';

const sessionFormSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  name: z.string().min(1, 'Session name is required'),
  date: z.string().min(1, 'Session date is required'),
});

type SessionFormData = z.infer<typeof sessionFormSchema>;

export function SessionForm() {
  const { user } = useAuth();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns(user?.username);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      campaignId: '',
      name: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (data: SessionFormData) => {
    if (!selectedFile) {
      setErrorMessage('Please select an audio file');
      return;
    }

    if (!user) {
      setErrorMessage('User not authenticated');
      return;
    }

    try {
      setUploadStatus('uploading');
      setErrorMessage(null);

      // Find selected campaign to get session count
      const selectedCampaign = campaigns?.find(c => c.id === data.campaignId);
      
      // Generate session name if not provided  
      const sessionName = data.name || `Session ${1}`; // Simplified for now, can be enhanced later
      
      // Helper function to get local date string
      const getLocalDateString = (date: Date) => {
        return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      };

      // Step 1: Create session record and wait for completion
      setUploadProgress({ percentage: 10, loaded: 0, total: 100, status: 'Creating session...' });
      
      const session: { id: string; _version: number } = await graphqlClient.createSession({
        name: sessionName,
        duration: 0, // Will be updated after audio processing
        audioFile: "",
        transcriptionFile: "",
        transcriptionStatus: "NOTSTARTED",
        campaignSessionsId: data.campaignId,
        date: data.date || getLocalDateString(new Date()),
      });

      // Validate session was created properly
      if (!session || !session.id) {
        throw new Error('Failed to create session - invalid session object');
      }

      // Step 2: Upload audio file and wait for completion
      setUploadProgress({ percentage: 30, loaded: 0, total: 100, status: 'Uploading audio file...' });
      
      const fileName = S3UploadService.generateFileName(
        data.campaignId,
        session.id,
        selectedFile.name
      );

      const s3Url = await S3UploadService.uploadFile({
        key: fileName,
        file: selectedFile,
        onProgress: (progress) => {
          setUploadProgress({
            ...progress,
            percentage: 30 + (progress.percentage * 0.4), // 30-70% range
            status: 'Uploading to S3...',
          });
        },
      });

      // Step 3: Update session data with uploaded file information
      setUploadProgress({ percentage: 80, loaded: 0, total: 100, status: 'Updating session data...' });
      
      await graphqlClient.updateSessionAudioFile(session.id, fileName, session._version);

      setUploadProgress({ percentage: 100, loaded: 100, total: 100, status: 'Upload complete!' });
      setUploadStatus('success');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);

    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedFile(null);
    setUploadProgress(null);
    setUploadStatus('idle');
    setErrorMessage(null);
  };

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-game-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-game-primary">
          Upload Session Recording
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Campaign Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-game-primary">
              Campaign <span className="text-game-error">*</span>
            </Label>
            <Select
              value={form.watch('campaignId')}
              onValueChange={(value) => form.setValue('campaignId', value)}
            >
              <SelectTrigger className="form-input bg-white/95 border-game-primary/20 text-gray-900">
                <SelectValue placeholder="Select a campaign..." />
              </SelectTrigger>
              <SelectContent>
                {campaignsLoading ? (
                  <SelectItem value="loading" disabled>Loading campaigns...</SelectItem>
                ) : campaigns && campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-campaigns" disabled>
                    No campaigns found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.campaignId && (
              <p className="text-sm text-game-error">{form.formState.errors.campaignId.message}</p>
            )}
            
            {/* Manual Campaign ID Entry */}
            {(!campaigns || campaigns.length === 0) && (
              <div className="mt-2">
                <Label className="text-sm font-medium text-game-primary">
                  Or enter Campaign ID manually
                </Label>
                <Input
                  value={form.watch('campaignId')}
                  onChange={(e) => form.setValue('campaignId', e.target.value)}
                  className="form-input bg-game-primary/5 border-game-primary/20 text-game-primary placeholder:text-game-secondary/50"
                  placeholder="Enter campaign ID (e.g., campaign-123)"
                />
              </div>
            )}
          </div>

          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-game-primary">
                Session Name <span className="text-game-error">*</span>
              </Label>
              <Input
                {...form.register('name')}
                className="form-input bg-game-primary/5 border-game-primary/20 text-game-primary placeholder:text-game-secondary/50"
                placeholder="Session 1: The Goblin Ambush"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-game-error">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-game-primary">
                Session Date <span className="text-game-error">*</span>
              </Label>
              <Input
                type="date"
                {...form.register('date')}
                className="form-input bg-game-primary/5 border-game-primary/20 text-game-primary"
              />
              {form.formState.errors.date && (
                <p className="text-sm text-game-error">{form.formState.errors.date.message}</p>
              )}
            </div>
          </div>



          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-game-primary">
              Audio Recording <span className="text-game-error">*</span>
            </Label>
            <FileUploadZone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onFileRemove={handleFileRemove}
            />
          </div>

          {/* Upload Progress */}
          {uploadProgress && uploadStatus === 'uploading' && (
            <UploadProgressComponent progress={uploadProgress} />
          )}

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <Alert className="bg-game-success/10 border-game-success/20">
              <CheckCircle className="h-4 w-4 text-game-success" />
              <AlertDescription className="text-game-success">
                Upload Successful! Your session has been uploaded and is being processed. 
                You'll receive a notification when transcription is complete.
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'error' && errorMessage && (
            <Alert className="bg-game-error/10 border-game-error/20">
              <AlertTriangle className="h-4 w-4 text-game-error" />
              <AlertDescription className="text-game-error">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && uploadStatus !== 'error' && (
            <Alert className="bg-game-error/10 border-game-error/20">
              <AlertTriangle className="h-4 w-4 text-game-error" />
              <AlertDescription className="text-game-error">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              disabled={uploadStatus === 'uploading' || !selectedFile}
              className="btn-primary flex-1 py-3 bg-game-accent hover:bg-game-hover text-white font-medium"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Session'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
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
