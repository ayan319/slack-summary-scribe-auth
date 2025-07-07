'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatFileSize } from '@/lib/file-parser';
import { toast } from 'sonner';

interface FileUploadProps {
  organizationId?: string;
  onUploadComplete?: (fileId: string) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export default function FileUpload({ organizationId, onUploadComplete }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    
    for (const file of acceptedFiles) {
      const fileId = Math.random().toString(36).substring(7);
      
      // Add file to state
      setUploadedFiles(prev => [...prev, {
        id: fileId,
        file,
        status: 'uploading',
        progress: 0
      }]);

      try {
        await uploadFile(file, fileId, organizationId);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'failed', error: 'Upload failed' }
            : f
        ));
      }
    }
    
    setIsUploading(false);
  }, [organizationId]);

  const uploadFile = async (file: File, fileId: string, orgId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (orgId) {
      formData.append('organizationId', orgId);
    }

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId && f.progress < 90
            ? { ...f, progress: f.progress + 10 }
            : f
        ));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Update file status
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'processing', progress: 100 }
          : f
      ));

      // Show success toast
      toast.success('File uploaded successfully!', {
        description: 'Your file is being processed and summarized.'
      });

      // Poll for processing completion
      pollProcessingStatus(result.data.id, fileId);

      if (onUploadComplete) {
        onUploadComplete(result.data.id);
      }

    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'failed', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));
      
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  };

  const pollProcessingStatus = async (uploadId: string, fileId: string) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/upload/${uploadId}/status`);
        if (!response.ok) return;

        const data = await response.json();
        
        if (data.processingStatus === 'completed') {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'completed' }
              : f
          ));
          
          toast.success('Summary ready!', {
            description: 'Your document has been summarized successfully.'
          });
          return;
        }
        
        if (data.processingStatus === 'failed') {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'failed', error: data.errorMessage || 'Processing failed' }
              : f
          ));
          
          toast.error('Processing failed', {
            description: data.errorMessage || 'Please try uploading again'
          });
          return;
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 5000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    disabled: isUploading
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload PDF or DOCX files to generate AI-powered summaries. Maximum file size: 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              {isDragActive ? (
                <p className="text-blue-600 dark:text-blue-400">Drop the files here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag & drop files here, or click to select files
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Supports PDF and DOCX files up to 10MB
                  </p>
                </div>
              )}
              <Button variant="outline" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Files
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(uploadedFile.status)}
                      <div>
                        <p className="font-medium text-sm">{uploadedFile.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      uploadedFile.status === 'completed' ? 'default' :
                      uploadedFile.status === 'failed' ? 'destructive' :
                      'secondary'
                    }>
                      {getStatusText(uploadedFile.status)}
                    </Badge>
                  </div>
                  
                  {uploadedFile.status === 'uploading' && (
                    <Progress value={uploadedFile.progress} className="h-2" />
                  )}
                  
                  {uploadedFile.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadedFile.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
