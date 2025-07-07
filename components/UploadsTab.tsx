'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  FileDown,
  Table
} from 'lucide-react';
import { formatFileSize, truncateText } from '@/lib/file-parser';
import { toast } from 'sonner';
import FileUpload from './FileUpload';

interface FileUploadData {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadStatus: string;
  processingStatus: string;
  errorMessage?: string;
  createdAt: string;
  summary?: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
  };
}

interface UploadsTabProps {
  organizationId?: string;
}

export default function UploadsTab({ organizationId }: UploadsTabProps) {
  const [uploads, setUploads] = useState<FileUploadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUploads();
  }, [organizationId]);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = organizationId 
        ? `/api/uploads?organizationId=${organizationId}`
        : '/api/uploads';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch uploads');
      }

      const data = await response.json();
      setUploads(data.data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setError(error instanceof Error ? error.message : 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (fileId: string) => {
    // Refresh uploads list
    fetchUploads();
  };

  const handleViewFile = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleViewSummary = (summaryId: string) => {
    // Navigate to summary detail page
    window.location.href = `/dashboard/summaries/${summaryId}`;
  };

  const handleExport = async (summaryId: string, exportType: 'pdf' | 'excel' | 'notion') => {
    try {
      const response = await fetch(`/api/export/${exportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summaryId })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary.${exportType === 'excel' ? 'xlsx' : exportType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported as ${exportType.toUpperCase()}!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: 'Please try again later'
      });
    }
  };

  const getStatusIcon = (uploadStatus: string, processingStatus: string) => {
    if (uploadStatus === 'failed' || processingStatus === 'failed') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (processingStatus === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (uploadStatus === 'uploading' || processingStatus === 'processing' || processingStatus === 'extracting' || processingStatus === 'summarizing') {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (uploadStatus: string, processingStatus: string) => {
    if (uploadStatus === 'failed') return 'Upload Failed';
    if (processingStatus === 'failed') return 'Processing Failed';
    if (processingStatus === 'completed') return 'Completed';
    if (processingStatus === 'summarizing') return 'Generating Summary';
    if (processingStatus === 'extracting') return 'Extracting Text';
    if (processingStatus === 'processing') return 'Processing';
    if (uploadStatus === 'uploading') return 'Uploading';
    return 'Pending';
  };

  const getStatusVariant = (uploadStatus: string, processingStatus: string) => {
    if (uploadStatus === 'failed' || processingStatus === 'failed') return 'destructive';
    if (processingStatus === 'completed') return 'default';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading uploads...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Upload Component */}
      <FileUpload 
        organizationId={organizationId}
        onUploadComplete={handleUploadComplete}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploads List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Uploads</CardTitle>
          <CardDescription>
            View and manage your uploaded documents and their summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No uploads yet. Upload your first document to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="border rounded-lg p-4 space-y-3">
                  {/* File Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">{upload.fileName}</h4>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(upload.fileSize)} • {new Date(upload.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(upload.uploadStatus, upload.processingStatus)}
                      <Badge variant={getStatusVariant(upload.uploadStatus, upload.processingStatus)}>
                        {getStatusText(upload.uploadStatus, upload.processingStatus)}
                      </Badge>
                    </div>
                  </div>

                  {/* Error Message */}
                  {upload.errorMessage && (
                    <Alert variant="destructive">
                      <AlertDescription>{upload.errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {/* Summary Info */}
                  {upload.summary && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <h5 className="font-medium text-sm mb-2">Summary</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {truncateText(upload.summary.content, 150)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSummary(upload.summary!.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Summary
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport(upload.summary!.id, 'pdf')}
                        >
                          <FileDown className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport(upload.summary!.id, 'excel')}
                        >
                          <Table className="h-3 w-3 mr-1" />
                          Excel
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport(upload.summary!.id, 'notion')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Notion
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewFile(upload.fileUrl, upload.fileName)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      View Original
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
