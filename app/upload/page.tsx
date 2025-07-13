'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@supabase/auth-helpers-react'
import AuthGuard from '@/components/AuthGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  File, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  X,
  Download
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/utils'

interface UploadedFile {
  id: string
  filename: string
  size: number
  type: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  uploadedAt: string
  errorMessage?: string
  summaryId?: string
}

function UploadContent() {
  const user = useUser()
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error('Please log in to upload files')
      return
    }

    setIsUploading(true)

    for (const file of acceptedFiles) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only PDF and DOCX files are supported`)
        continue
      }

      // Validate file size (20MB limit)
      const maxSize = 20 * 1024 * 1024 // 20MB
      if (file.size > maxSize) {
        toast.error(`${file.name}: File size must be less than 20MB`)
        continue
      }

      const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Add file to state with uploading status
      const newFile: UploadedFile = {
        id: fileId,
        filename: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
        uploadedAt: new Date().toISOString()
      }

      setFiles(prev => [...prev, newFile])

      try {
        // Create FormData for upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileId', fileId)

        // Upload file with progress tracking
        const xhr = new XMLHttpRequest()
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, progress } : f
            ))
          }
        })

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            
            if (response.success) {
              // Update status to processing
              setFiles(prev => prev.map(f => 
                f.id === fileId ? { 
                  ...f, 
                  status: 'processing', 
                  progress: 100 
                } : f
              ))

              toast.success(`${file.name} uploaded successfully! Processing...`)

              // Poll for processing completion
              pollProcessingStatus(fileId)
            } else {
              throw new Error(response.error || 'Upload failed')
            }
          } else {
            throw new Error(`Upload failed with status ${xhr.status}`)
          }
        })

        xhr.addEventListener('error', () => {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { 
              ...f, 
              status: 'error', 
              errorMessage: 'Upload failed' 
            } : f
          ))
          toast.error(`Failed to upload ${file.name}`)
        })

        xhr.open('POST', '/api/upload')
        xhr.send(formData)

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'error', 
            errorMessage: error instanceof Error ? error.message : 'Upload failed' 
          } : f
        ))
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    setIsUploading(false)
  }, [user])

  const pollProcessingStatus = async (fileId: string) => {
    const maxAttempts = 30 // 5 minutes max
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/upload/status?fileId=${fileId}`)
        const data = await response.json()

        if (data.success) {
          const { status, summaryId, errorMessage } = data.data

          setFiles(prev => prev.map(f => 
            f.id === fileId ? { 
              ...f, 
              status,
              summaryId,
              errorMessage 
            } : f
          ))

          if (status === 'completed') {
            toast.success('Summary generated successfully!')
            return
          } else if (status === 'error') {
            toast.error(`Processing failed: ${errorMessage}`)
            return
          }
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000) // Poll every 10 seconds
        } else {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { 
              ...f, 
              status: 'error',
              errorMessage: 'Processing timeout' 
            } : f
          ))
          toast.error('Processing timeout')
        }
      } catch (error) {
        console.error('Error polling status:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000)
        }
      }
    }

    poll()
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    disabled: isUploading
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
          <p className="text-gray-600">
            Upload PDF or DOCX files to generate AI-powered summaries
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Drag and drop your files here, or click to browse. Supports PDF and DOCX files up to 20MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium mb-2">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOCX • Max 20MB per file
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>
                Track the progress of your file uploads and processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div>
                          <p className="font-medium text-gray-900">{file.filename}</p>
                          <p className="text-sm text-gray-500">
                            {formatBytes(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(file.status)}
                        {file.status === 'completed' && file.summaryId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/summaries/${file.summaryId}`)}
                          >
                            View Summary
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <Progress value={file.progress} className="mb-2" />
                    )}
                    
                    {file.status === 'error' && file.errorMessage && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{file.errorMessage}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function UploadPage() {
  return (
    <AuthGuard>
      <UploadContent />
    </AuthGuard>
  )
}
