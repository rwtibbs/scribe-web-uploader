import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileAudio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleFileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onFileRemove: () => void;
  disabled?: boolean;
}

export function SimpleFileUpload({ onFileSelect, selectedFile, onFileRemove, disabled = false }: SimpleFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (disabled) return;
    
    // Check if it's an audio file
    const allowedTypes = [
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 
      'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/aac', 
      'audio/flac', 'audio/x-flac', 'video/mp4', 'video/quicktime', 
      'video/x-msvideo'
    ];
    
    if (allowedTypes.includes(file.type) || 
        /\.(mp3|wav|m4a|ogg|aac|flac|mp4|mov|avi)$/i.test(file.name)) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
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
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragOver && !disabled
              ? "border-game-accent bg-game-accent/10"
              : "border-game-primary/30 hover:border-game-accent/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex flex-col items-center space-y-2">
            <Upload className={cn(
              "h-8 w-8",
              isDragOver && !disabled ? "text-game-accent" : "text-game-secondary"
            )} />
            <div className="text-sm">
              <span className="font-medium text-game-primary">Click to upload</span>
              <span className="text-game-secondary"> or drag and drop</span>
            </div>
            <p className="text-xs text-game-secondary">
              MP3, WAV, M4A, OGG, AAC, FLAC
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* File Info Display */}
          <div className="flex items-center gap-3 p-3 bg-game-primary/5 border border-game-primary/20 rounded-lg">
            <FileAudio className="h-5 w-5 text-game-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-game-primary truncate">
                {selectedFile.name}
              </div>
              <div className="text-xs text-game-secondary">
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
              disabled={disabled}
              className="text-game-error hover:text-red-400 disabled:opacity-50 h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Replace File Option */}
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => !disabled && fileInputRef.current?.click()}
              disabled={disabled}
              className="bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600 hover:border-slate-500 disabled:opacity-50 text-xs"
            >
              Replace File
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