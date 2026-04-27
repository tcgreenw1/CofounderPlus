import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://*.figma.com', 'https://www.figma.com'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Initialize Supabase client for server operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Bucket name for task evidence
const EVIDENCE_BUCKET = 'make-ac1075a9-task-evidence';

// Initialize storage bucket on startup
const initializeStorage = async () => {
  try {
    console.log('📁 Initializing storage bucket:', EVIDENCE_BUCKET);
    
    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('📁 Failed to list buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === EVIDENCE_BUCKET);
    console.log('📁 Bucket existence check:', { bucketExists, totalBuckets: buckets?.length });
    
    if (!bucketExists) {
      console.log('📁 Creating evidence storage bucket...');
      const { data, error } = await supabase.storage.createBucket(EVIDENCE_BUCKET, {
        public: false, // Private bucket for security
        allowedMimeTypes: [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (error) {
        // Handle "already exists" error gracefully
        if (error.message?.includes('already exists') || error.statusCode === '409') {
          console.log('📁 Evidence bucket already exists (race condition), continuing...');
        } else {
          console.error('📁 Failed to create evidence bucket:', error);
        }
      } else {
        console.log('📁 Evidence bucket created successfully');
      }
    } else {
      console.log('📁 Evidence bucket already exists, skipping creation');
    }
  } catch (error) {
    console.error('📁 Error initializing storage:', error);
    
    // If it's a "resource already exists" error, that's actually fine
    if (error.message?.includes('already exists') || error.statusCode === 409) {
      console.log('📁 Storage bucket already exists (caught in catch), continuing...');
    }
  }
};

// Initialize storage on startup
initializeStorage();

// Upload file endpoint
app.post('/make-server-ac1075a9/upload-evidence', async (c) => {
  try {
    console.log('📁 File upload request received');
    
    // Get authorization header
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      console.error('Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    console.log('📁 User authenticated:', user.email);
    
    // Parse form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string;
    const businessId = formData.get('businessId') as string;
    const evidenceType = formData.get('evidenceType') as string;
    
    if (!file || !taskId || !businessId || !evidenceType) {
      return c.json({ 
        error: 'Missing required fields: file, taskId, businessId, evidenceType' 
      }, 400);
    }
    
    console.log('📁 Upload details:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      taskId,
      businessId,
      evidenceType
    });
    
    // Validate file size (10MB limit)
    if (file.size > 10485760) {
      return c.json({ error: 'File size must be less than 10MB' }, 400);
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
      return c.json({ 
        error: 'Unsupported file type. Allowed: images, PDF, DOC, XLS, TXT' 
      }, 400);
    }
    
    // Generate unique file path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${businessId}/${taskId}/${timestamp}_${evidenceType.replace(/\s+/g, '_')}.${fileExtension}`;
    
    console.log('📁 Uploading to path:', fileName);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return c.json({ error: 'Failed to upload file: ' + uploadError.message }, 500);
    }
    
    console.log('📁 File uploaded successfully:', uploadData.path);
    
    // Generate signed URL for immediate access (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(fileName, 3600);
    
    if (urlError) {
      console.error('Signed URL error:', urlError);
      return c.json({ error: 'Failed to generate file URL' }, 500);
    }
    
    // Store file metadata in KV store
    const fileMetadata = {
      id: crypto.randomUUID(),
      userId: user.id,
      businessId,
      taskId,
      evidenceType,
      fileName: file.name,
      filePath: fileName,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      signedUrl: urlData.signedUrl,
      urlExpiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };
    
    // Store in KV store with composite key
    const metadataKey = `evidence:${user.id}:${businessId}:${taskId}:${fileMetadata.id}`;
    await kv.set(metadataKey, fileMetadata);
    
    // Also store in user's evidence index for easy retrieval
    const userEvidenceKey = `user_evidence:${user.id}:${businessId}`;
    let userEvidence = await kv.get(userEvidenceKey) || {};
    
    if (!userEvidence[taskId]) {
      userEvidence[taskId] = [];
    }
    userEvidence[taskId].push(fileMetadata);
    
    await kv.set(userEvidenceKey, userEvidence);
    
    console.log('📁 File metadata stored with key:', metadataKey);
    
    return c.json({
      success: true,
      fileId: fileMetadata.id,
      fileName: file.name,
      fileUrl: urlData.signedUrl,
      uploadedAt: fileMetadata.uploadedAt,
      message: 'File uploaded successfully'
    });
    
  } catch (error) {
    console.error('📁 Upload error:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

// Get all uploaded evidence for a user's business (for Proof Locker)
app.get('/make-server-ac1075a9/user-evidence/:businessId', async (c) => {
  try {
    console.log('📁 Get user evidence request');
    
    // Get authorization header
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const businessId = c.req.param('businessId');
    
    console.log('📁 Getting all evidence for:', { userId: user.id, businessId });
    
    // Get user's evidence for this business
    const userEvidenceKey = `user_evidence:${user.id}:${businessId}`;
    const userEvidence = await kv.get(userEvidenceKey) || {};
    
    // Refresh signed URLs for files that are expired or expiring soon
    const refreshedEvidence = {};
    
    for (const [taskId, evidenceList] of Object.entries(userEvidence)) {
      const taskEvidence = evidenceList as any[];
      const refreshedTaskEvidence = [];
      
      for (const evidence of taskEvidence) {
        let currentEvidence = { ...evidence };
        
        // Check if URL is expired or expiring in the next 10 minutes
        const expiresAt = new Date(evidence.urlExpiresAt);
        const tenMinutesFromNow = new Date(Date.now() + 600000);
        
        if (expiresAt < tenMinutesFromNow) {
          console.log('📁 Refreshing expired URL for:', evidence.fileName);
          
          // Generate new signed URL
          const { data: urlData, error: urlError } = await supabase.storage
            .from(EVIDENCE_BUCKET)
            .createSignedUrl(evidence.filePath, 3600);
          
          if (!urlError && urlData) {
            currentEvidence.signedUrl = urlData.signedUrl;
            currentEvidence.urlExpiresAt = new Date(Date.now() + 3600000).toISOString();
            
            // Update stored metadata
            const metadataKey = `evidence:${user.id}:${businessId}:${taskId}:${evidence.id}`;
            await kv.set(metadataKey, currentEvidence);
          }
        }
        
        refreshedTaskEvidence.push(currentEvidence);
      }
      
      refreshedEvidence[taskId] = refreshedTaskEvidence;
    }
    
    // Update user evidence index if any URLs were refreshed
    if (Object.keys(refreshedEvidence).length > 0) {
      await kv.set(userEvidenceKey, refreshedEvidence);
    }
    
    const totalFiles = Object.values(refreshedEvidence).reduce((sum, files: any[]) => sum + files.length, 0);
    console.log('📁 Returning evidence for', Object.keys(refreshedEvidence).length, 'tasks with', totalFiles, 'total files');
    
    return c.json({
      success: true,
      evidence: refreshedEvidence
    });
    
  } catch (error) {
    console.error('📁 Get user evidence error:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

// Get uploaded files for a task
app.get('/make-server-ac1075a9/task-evidence/:businessId/:taskId', async (c) => {
  try {
    console.log('📁 Get task evidence request');
    
    // Get authorization header
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const businessId = c.req.param('businessId');
    const taskId = c.req.param('taskId');
    
    console.log('📁 Getting evidence for:', { userId: user.id, businessId, taskId });
    
    // Get user's evidence for this task
    const userEvidenceKey = `user_evidence:${user.id}:${businessId}`;
    const userEvidence = await kv.get(userEvidenceKey) || {};
    const taskEvidence = userEvidence[taskId] || [];
    
    // Refresh signed URLs for files that are expired or expiring soon
    const refreshedEvidence = [];
    
    for (const evidence of taskEvidence) {
      let currentEvidence = { ...evidence };
      
      // Check if URL is expired or expiring in the next 10 minutes
      const expiresAt = new Date(evidence.urlExpiresAt);
      const tenMinutesFromNow = new Date(Date.now() + 600000);
      
      if (expiresAt < tenMinutesFromNow) {
        console.log('📁 Refreshing expired URL for:', evidence.fileName);
        
        // Generate new signed URL
        const { data: urlData, error: urlError } = await supabase.storage
          .from(EVIDENCE_BUCKET)
          .createSignedUrl(evidence.filePath, 3600);
        
        if (!urlError && urlData) {
          currentEvidence.signedUrl = urlData.signedUrl;
          currentEvidence.urlExpiresAt = new Date(Date.now() + 3600000).toISOString();
          
          // Update stored metadata
          const metadataKey = `evidence:${user.id}:${businessId}:${taskId}:${evidence.id}`;
          await kv.set(metadataKey, currentEvidence);
        }
      }
      
      refreshedEvidence.push(currentEvidence);
    }
    
    // Update user evidence index if any URLs were refreshed
    if (refreshedEvidence.length > 0) {
      userEvidence[taskId] = refreshedEvidence;
      await kv.set(userEvidenceKey, userEvidence);
    }
    
    console.log('📁 Returning evidence files:', refreshedEvidence.length);
    
    return c.json({
      success: true,
      evidence: refreshedEvidence
    });
    
  } catch (error) {
    console.error('📁 Get evidence error:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

// Delete uploaded file
app.delete('/make-server-ac1075a9/evidence/:fileId', async (c) => {
  try {
    console.log('📁 Delete evidence request');
    
    // Get authorization header
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const fileId = c.req.param('fileId');
    
    // Find the file metadata by searching user's evidence
    const userEvidenceKey = `user_evidence:${user.id}:*`;
    const evidenceKeys = await kv.getByPrefix(userEvidenceKey);
    
    let fileMetadata = null;
    let businessId = null;
    let taskId = null;
    
    for (const evidenceData of evidenceKeys) {
      const evidence = evidenceData.value;
      for (const [task, files] of Object.entries(evidence)) {
        const file = files.find(f => f.id === fileId);
        if (file) {
          fileMetadata = file;
          businessId = file.businessId;
          taskId = task;
          break;
        }
      }
      if (fileMetadata) break;
    }
    
    if (!fileMetadata) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    console.log('📁 Deleting file:', fileMetadata.fileName);
    
    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .remove([fileMetadata.filePath]);
    
    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      return c.json({ error: 'Failed to delete file: ' + deleteError.message }, 500);
    }
    
    // Remove from KV store
    const metadataKey = `evidence:${user.id}:${businessId}:${taskId}:${fileId}`;
    await kv.del(metadataKey);
    
    // Update user evidence index
    const userEvidenceKeyFull = `user_evidence:${user.id}:${businessId}`;
    const userEvidence = await kv.get(userEvidenceKeyFull) || {};
    
    if (userEvidence[taskId]) {
      userEvidence[taskId] = userEvidence[taskId].filter(f => f.id !== fileId);
      await kv.set(userEvidenceKeyFull, userEvidence);
    }
    
    console.log('📁 File deleted successfully');
    
    return c.json({
      success: true,
      message: 'File deleted successfully'
    });
    
  } catch (error) {
    console.error('📁 Delete error:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

export default app;