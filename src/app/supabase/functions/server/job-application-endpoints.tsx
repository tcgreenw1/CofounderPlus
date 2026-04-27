import { Hono } from 'npm:hono@4';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Submit a job application
app.post('/job-applications', async (c) => {
  try {
    const body = await c.req.json();
    
    const {
      jobId,
      jobTitle,
      fullName,
      email,
      phone,
      linkedIn,
      yearsOfExperience,
      currentRole,
      education,
      relevantExpertise,
      whyInterested,
      availability,
      resumeText,
      submittedAt
    } = body;

    // Validate required fields
    if (!jobId || !jobTitle || !fullName || !email || !relevantExpertise || !whyInterested) {
      return c.json({
        success: false,
        error: 'Missing required fields: jobId, jobTitle, fullName, email, relevantExpertise, whyInterested'
      }, 400);
    }

    // Generate unique application ID
    const applicationId = `job_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store application
    const applicationData = {
      id: applicationId,
      jobId,
      jobTitle,
      fullName,
      email,
      phone: phone || '',
      linkedIn: linkedIn || '',
      yearsOfExperience: yearsOfExperience || '',
      currentRole: currentRole || '',
      education: education || '',
      relevantExpertise,
      whyInterested,
      availability: availability || '',
      resumeText: resumeText || '',
      submittedAt: submittedAt || new Date().toISOString(),
      status: 'new', // new, reviewed, interviewing, accepted, rejected
      notes: ''
    };

    await kv.set(`job_application:${applicationId}`, applicationData);
    
    // Also add to list of all applications
    const allApplicationsKey = 'job_applications:all';
    const existingApplications = await kv.get(allApplicationsKey) || { applications: [] };
    existingApplications.applications.unshift(applicationId); // Add to front
    await kv.set(allApplicationsKey, existingApplications);

    console.log(`✅ Job application submitted: ${applicationId} for ${jobTitle} by ${fullName}`);

    return c.json({
      success: true,
      applicationId,
      message: 'Application submitted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error submitting job application:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to submit application'
    }, 500);
  }
});

// Get all job applications (admin only)
app.get('/job-applications', async (c) => {
  try {
    const allApplicationsKey = 'job_applications:all';
    const applicationsData = await kv.get(allApplicationsKey) || { applications: [] };
    const applicationIds = applicationsData.applications || [];

    // Fetch all applications
    const applications = [];
    for (const id of applicationIds) {
      const app = await kv.get(`job_application:${id}`);
      if (app) {
        applications.push(app);
      }
    }

    // Sort by submission date (newest first)
    applications.sort((a, b) => {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    return c.json({
      success: true,
      applications,
      count: applications.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching job applications:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch applications'
    }, 500);
  }
});

// Get a single job application
app.get('/job-applications/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const application = await kv.get(`job_application:${id}`);

    if (!application) {
      return c.json({
        success: false,
        error: 'Application not found'
      }, 404);
    }

    return c.json({
      success: true,
      application
    });

  } catch (error: any) {
    console.error('❌ Error fetching job application:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch application'
    }, 500);
  }
});

// Update application status and notes (admin only)
app.patch('/job-applications/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { status, notes } = body;

    const application = await kv.get(`job_application:${id}`);

    if (!application) {
      return c.json({
        success: false,
        error: 'Application not found'
      }, 404);
    }

    // Update fields
    if (status) application.status = status;
    if (notes !== undefined) application.notes = notes;
    application.lastUpdated = new Date().toISOString();

    await kv.set(`job_application:${id}`, application);

    return c.json({
      success: true,
      application
    });

  } catch (error: any) {
    console.error('❌ Error updating job application:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to update application'
    }, 500);
  }
});

// Delete a job application (admin only)
app.delete('/job-applications/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Remove from individual storage
    await kv.del(`job_application:${id}`);

    // Remove from all applications list
    const allApplicationsKey = 'job_applications:all';
    const applicationsData = await kv.get(allApplicationsKey) || { applications: [] };
    applicationsData.applications = applicationsData.applications.filter((appId: string) => appId !== id);
    await kv.set(allApplicationsKey, applicationsData);

    return c.json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting job application:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to delete application'
    }, 500);
  }
});

// Get application statistics
app.get('/job-applications-stats', async (c) => {
  try {
    const allApplicationsKey = 'job_applications:all';
    const applicationsData = await kv.get(allApplicationsKey) || { applications: [] };
    const applicationIds = applicationsData.applications || [];

    // Fetch all applications
    const applications = [];
    for (const id of applicationIds) {
      const app = await kv.get(`job_application:${id}`);
      if (app) {
        applications.push(app);
      }
    }

    // Calculate statistics
    const stats = {
      total: applications.length,
      byStatus: {
        new: applications.filter(a => a.status === 'new').length,
        reviewed: applications.filter(a => a.status === 'reviewed').length,
        interviewing: applications.filter(a => a.status === 'interviewing').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length
      },
      byJob: {} as Record<string, number>,
      recent: applications.slice(0, 5).map(a => ({
        id: a.id,
        name: a.fullName,
        job: a.jobTitle,
        submittedAt: a.submittedAt,
        status: a.status
      }))
    };

    // Count by job
    applications.forEach(app => {
      if (!stats.byJob[app.jobId]) {
        stats.byJob[app.jobId] = 0;
      }
      stats.byJob[app.jobId]++;
    });

    return c.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('❌ Error fetching job application stats:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch stats'
    }, 500);
  }
});

export default app;
