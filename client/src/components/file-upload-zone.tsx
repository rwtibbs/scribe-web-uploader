import { useState, useRef } from 'react';
import { CloudUpload, FileAudio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onFileRemove: () => void;
}

export function FileUploadZone({ onFileSelect, selectedFile, onFileRemove }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`file-drop-zone rounded-xl p-8 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
          isDragOver
            ? 'border-game-accent bg-game-accent/10'
            : 'border-game-primary/30'
        }`}
      >
        {!selectedFile ? (
          <div>
            <CloudUpload className="h-16 w-16 text-game-accent mx-auto mb-4" />
            <p className="text-lg font-medium mb-2 text-game-primary">Drop your audio file here</p>
            <p className="text-game-secondary mb-4">or click to browse</p>
            <p className="text-sm text-game-secondary">Supports: MP3, WAV, M4A, OGG (Max 45MB)</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center mb-4">
              <FileAudio className="h-12 w-12 text-game-success mr-3" />
              <div className="text-left">
                <p className="font-medium text-game-primary">{selectedFile.name}</p>
                <p className="text-sm text-game-secondary">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove();
              }}
              className="text-game-error hover:text-red-400"
            >
              <X className="h-4 w-4 mr-1" />
              Remove file
            </Button>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
