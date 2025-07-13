// Dynamic imports to avoid build issues
// import pdf from 'pdf-parse';
// import mammoth from 'mammoth';

export interface ParsedFileResult {
  text: string;
  metadata: {
    pages?: number;
    wordCount: number;
    characterCount: number;
  };
}

export interface FileParseError {
  error: string;
  details?: string;
}

/**
 * Parse PDF file and extract text content
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedFileResult | FileParseError> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);
    
    if (!data.text || data.text.trim().length === 0) {
      return {
        error: 'No text content found in PDF',
        details: 'The PDF might be image-based or corrupted'
      };
    }

    const text = data.text.trim();
    const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
    
    return {
      text,
      metadata: {
        pages: data.numpages,
        wordCount,
        characterCount: text.length
      }
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      error: 'Failed to parse PDF file',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Parse DOCX file and extract text content
 */
export async function parseDOCX(buffer: Buffer): Promise<ParsedFileResult | FileParseError> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    
    if (!result.value || result.value.trim().length === 0) {
      return {
        error: 'No text content found in DOCX',
        details: 'The document might be empty or corrupted'
      };
    }

    const text = result.value.trim();
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages);
    }
    
    return {
      text,
      metadata: {
        wordCount,
        characterCount: text.length
      }
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    return {
      error: 'Failed to parse DOCX file',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Parse file based on its type
 */
export async function parseFile(buffer: Buffer, mimeType: string): Promise<ParsedFileResult | FileParseError> {
  switch (mimeType) {
    case 'application/pdf':
      return parsePDF(buffer);
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return parseDOCX(buffer);
    
    default:
      return {
        error: 'Unsupported file type',
        details: `File type ${mimeType} is not supported. Please upload PDF or DOCX files.`
      };
  }
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 20MB'
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PDF and DOCX files are supported'
    };
  }

  return { valid: true };
}

/**
 * Get file extension from mime type
 */
export function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return '.docx';
    default:
      return '';
  }
}

/**
 * Generate storage path for uploaded file
 */
export function generateStoragePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text for preview
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
