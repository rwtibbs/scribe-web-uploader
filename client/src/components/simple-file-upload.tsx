import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SimpleFileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onFileRemove: () => void;
  disabled?: boolean;
}

export function SimpleFileUpload({ onFileSelect, selectedFile, onFileRemove, disabled = false }: SimpleFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      {!selectedFile ? (
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => !disabled && fileInputRef.current?.click()}
            disabled={disabled}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500 disabled:opacity-50"
          >
            Choose File
          </Button>
          <span className="ml-3 text-sm text-game-secondary">No file chosen</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => !disabled && fileInputRef.current?.click()}
            disabled={disabled}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500 disabled:opacity-50"
          >
            Choose File
          </Button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm text-game-primary truncate">{selectedFile.name}</span>
            <span className="text-xs text-game-secondary whitespace-nowrap">({formatFileSize(selectedFile.size)})</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
              disabled={disabled}
              className="text-game-error hover:text-red-400 disabled:opacity-50 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.ogg,.aac,.flac,.mp4,.mov,.avi"
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}