import { Progress } from '@/components/ui/progress';
import { UploadProgress } from '@shared/schema';

interface UploadProgressProps {
  progress: UploadProgress;
}

export function UploadProgressComponent({ progress }: UploadProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-game-primary">Uploading...</span>
        <span className="text-sm text-game-secondary">{progress.percentage}%</span>
      </div>
      <Progress value={progress.percentage} className="h-2" />
      <p className="text-xs text-game-secondary">
        {progress.status} ({(progress.loaded / 1024 / 1024).toFixed(1)} MB of {(progress.total / 1024 / 1024).toFixed(1)} MB)
      </p>
    </div>
  );
}
