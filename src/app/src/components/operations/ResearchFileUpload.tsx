import React, { useState, useRef } from 'react';
import { Upload, File, X, FileText, FileImage, FileVideo, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: string;
}

interface ResearchFileUploadProps {
  sessionId: string;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

export function ResearchFileUpload({
  sessionId,
  files,
  onFilesChange,
  maxFileSize = 10,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx', '.txt', '.csv']
}: ResearchFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = async (newFiles: File[]) => {
    // Validate file sizes
    const oversizedFiles = newFiles.filter(file => file.size > maxFileSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed ${maxFileSize}MB limit`);
      return;
    }

    setIsUploading(true);
    
    try {
      // In a real implementation, you would upload to Supabase Storage
      // For now, we'll simulate the upload and create file objects
      const uploadedFiles: UploadedFile[] = newFiles.map((file, index) => ({
        id: `${sessionId}-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        // In production, this would be the Supabase Storage URL
        url: URL.createObjectURL(file)
      }));

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      onFilesChange([...files, ...uploadedFiles]);
      toast.success(`Uploaded ${uploadedFiles.length} file(s)`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId));
    toast.success('File removed');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="size-4" />;
    if (type.startsWith('video/')) return <FileVideo className="size-4" />;
    return <FileText className="size-4" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: 'var(--spacing-6)',
          borderRadius: 'var(--radius-lg)',
          border: isDragging ? '2px dashed #8b5cf6' : '2px dashed var(--border)',
          background: isDragging ? 'rgba(139, 92, 246, 0.05)' : 'var(--muted)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'center',
        }}
        className="hover:border-purple-500 hover:bg-purple-50/5"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {isUploading ? (
          <div>
            <Loader2 className="size-8 mx-auto animate-spin" style={{ color: '#8b5cf6', marginBottom: 'var(--spacing-2)' }} />
            <p className="text-sm" style={{ color: '#8b5cf6' }}>Uploading files...</p>
          </div>
        ) : (
          <div>
            <Upload className="size-8 mx-auto" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-2)' }} />
            <p className="text-sm" style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports images, videos, PDFs, and documents (max {maxFileSize}MB)
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <p className="text-xs" style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)' }}>
            Uploaded Files ({files.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {files.map((file) => (
              <div
                key={file.id}
                style={{
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div className="flex items-center" style={{ gap: 'var(--spacing-2)', flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#8b5cf6' }}>
                    {getFileIcon(file.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-sm truncate" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveFile(file.id)}
                  style={{
                    height: '24px',
                    width: '24px',
                    padding: 0,
                    color: 'var(--destructive)',
                  }}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
