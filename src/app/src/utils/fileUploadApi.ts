import { projectId, publicAnonKey } from './supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

export interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  evidenceType: string;
  fileSize: number;
  fileType: string;
}

export interface FileUploadResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  message: string;
}

export interface TaskEvidenceResponse {
  success: boolean;
  evidence: UploadedFile[];
}

// Upload file as evidence for a task
export const uploadTaskEvidence = async (
  file: File,
  taskId: string,
  businessId: string,
  evidenceType: string,
  accessToken: string
): Promise<FileUploadResponse> => {
  try {
    console.log('📁 Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      taskId,
      businessId,
      evidenceType
    });

    // Validate file size (10MB limit)
    if (file.size > 10485760) {
      throw new Error('File size must be less than 10MB');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Unsupported file type. Allowed: images, PDF, DOC, XLS, TXT');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);
    formData.append('businessId', businessId);
    formData.append('evidenceType', evidenceType);

    const response = await fetch(`${SERVER_URL}/upload-evidence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📁 Upload successful:', result);
    
    return result;
  } catch (error) {
    console.error('📁 Upload error:', error);
    throw error;
  }
};

// Get uploaded evidence for a task
export const getTaskEvidence = async (
  businessId: string,
  taskId: string,
  accessToken: string
): Promise<UploadedFile[]> => {
  try {
    console.log('📁 Getting task evidence:', { businessId, taskId });

    const response = await fetch(`${SERVER_URL}/task-evidence/${businessId}/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to get evidence: ${response.status} ${response.statusText}`);
    }

    const result: TaskEvidenceResponse = await response.json();
    console.log('📁 Evidence retrieved:', result.evidence.length, 'files');
    
    return result.evidence;
  } catch (error) {
    console.error('📁 Get evidence error:', error);
    throw error;
  }
};

// Delete uploaded evidence
export const deleteEvidence = async (
  fileId: string,
  accessToken: string
): Promise<void> => {
  try {
    console.log('📁 Deleting evidence:', fileId);

    const response = await fetch(`${SERVER_URL}/evidence/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete evidence: ${response.status} ${response.statusText}`);
    }

    console.log('📁 Evidence deleted successfully');
  } catch (error) {
    console.error('📁 Delete evidence error:', error);
    throw error;
  }
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file type icon
export const getFileTypeIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
  if (fileType === 'text/plain') return '📋';
  return '📎';
};