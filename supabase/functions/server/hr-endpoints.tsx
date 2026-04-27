// HR endpoints for the Cofounder API Server
import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Helper function: Retry auth requests with exponential backoff
async function retryAuthRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;
      const errorMessage = error?.message || String(error);
      
      const shouldRetry = 
        errorMessage.includes('connection reset') ||
        errorMessage.includes('connection error') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('503') ||
        errorMessage.includes('502') ||
        errorMessage.includes('500');
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Auth request failed after retries');
}

// Helper to verify user
async function verifyUser(authHeader: string | undefined) {
  if (!authHeader) {
    throw new Error('Authorization token is required');
  }
  
  const accessToken = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY ?? ''
  );

  try {
    const { data: { user }, error } = await retryAuthRequest(() => 
      supabase.auth.getUser(accessToken)
    );
    
    if (error || !user) {
      // Manual JWT decode check for anon tokens
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role === 'anon') {
             console.error('❌ Anonymous token rejected');
          }
        }
      } catch (e) {
        // Ignore decode errors
      }
      throw new Error('Invalid authorization');
    }
    
    return user;
  } catch (error: any) {
    console.error('❌ Auth verification failed:', error.message);
    throw new Error('Invalid authorization');
  }
}

export function addHREndpoints(app: Hono, unusedVerify: any) {
  
  // Sync payroll to finance as monthly expense transactions
  app.post('/make-server-373d8b09/hr/sync-payroll-to-finance', async (c) => {
    console.log('🧑‍💼💰 HR: Sync payroll to finance endpoint called');
    try {
      const user = await verifyUser(c.req.header('Authorization'));
      const userId = user.id;
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const { month, year } = await c.req.json();
      
      if (!month || !year) {
        return new Response('Month and year are required', { status: 400 });
      }

      console.log(`🧑‍💼💰 Syncing payroll for business ${businessId}, month ${month}/${year}`);

      // Get all active employees
      const employees = await kv.get(`business:${userId}:${businessId}:employees`) || [];
      const activeEmployees = employees.filter((e: any) => e.status === 'active');

      if (activeEmployees.length === 0) {
        return c.json({ 
          success: true, 
          message: 'No active employees to sync',
          transactionCount: 0
        });
      }

      // Calculate monthly payroll
      const totalMonthlyPayroll = activeEmployees.reduce((sum: number, e: any) => sum + (e.salary / 12), 0);

      // Create a single monthly payroll transaction
      const transactionId = `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      
      const payrollTransaction = {
        id: transactionId,
        type: 'expense',
        amount: Math.round(totalMonthlyPayroll * 100) / 100, // Round to 2 decimals
        description: `${monthName} ${year} Payroll - ${activeEmployees.length} employees`,
        category: 'Payroll',
        subcategory: 'Employee Salaries',
        date: `${year}-${String(month).padStart(2, '0')}-01`,
        status: 'completed',
        payment_method: 'Bank Transfer',
        tags: ['payroll', 'hr-synced', 'employee-expense'],
        notes: `Synced from HR: ${activeEmployees.map((e: any) => `${e.first_name} ${e.last_name} (${Math.round((e.salary / 12) * 100) / 100})`).join(', ')}`,
        is_payroll_sync: true,
        payroll_month: month,
        payroll_year: year,
        employee_count: activeEmployees.length,
        business_id: businessId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store the transaction
      await kv.set(`business:${userId}:${businessId}:transaction:${transactionId}`, payrollTransaction);

      // Update bank balance
      let bankBalance = await kv.get(`business:${userId}:${businessId}:bank_balance`);
      if (!bankBalance) {
        bankBalance = {
          balance: 0,
          currency: 'USD',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
      }
      
      // Subtract payroll expense from balance
      bankBalance.balance = (bankBalance.balance || 0) - payrollTransaction.amount;
      bankBalance.last_updated = new Date().toISOString();
      await kv.set(`business:${userId}:${businessId}:bank_balance`, bankBalance);

      console.log(`🧑‍💼💰 Payroll synced: ${payrollTransaction.amount} for ${activeEmployees.length} employees`);

      return c.json({
        success: true,
        message: `Payroll synced successfully for ${monthName} ${year}`,
        transaction: payrollTransaction,
        bankBalance,
        employeeCount: activeEmployees.length,
        totalAmount: payrollTransaction.amount
      });

    } catch (error: any) {
      console.error('Sync payroll to finance error:', error);
      const status = error.message === 'Invalid authorization' ? 401 : 500;
      return new Response(`Error syncing payroll: ${error.message}`, { status });
    }
  });
  
  // HR data endpoint - get all HR data for a business
  app.get('/make-server-373d8b09/hr/data', async (c) => {
    console.log('Get HR data endpoint called');
    try {
      const user = await verifyUser(c.req.header('Authorization'));
      const userId = user.id;
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      console.log('🧑‍💼 HR: Fetching HR data for business:', businessId);

      const employees = await kv.get(`business:${userId}:${businessId}:employees`) || [];
      const contractors = await kv.get(`business:${userId}:${businessId}:contractors`) || [];
      const time_entries = await kv.get(`business:${userId}:${businessId}:time_entries`) || [];
      const performance_reviews = await kv.get(`business:${userId}:${businessId}:performance_reviews`) || [];
      const benefits = await kv.get(`business:${userId}:${businessId}:benefits`) || [];
      
      return c.json({
        employees: employees || [],
        contractors: contractors || [],
        timeEntries: time_entries || [],
        performanceReviews: performance_reviews || [],
        benefits: benefits || []
      });

    } catch (error: any) {
      console.error('Get HR data error:', error);
      const status = error.message === 'Invalid authorization' ? 401 : 500;
      return new Response(`Error getting HR data: ${error.message}`, { status });
    }
  });

  // Create employee endpoint
  app.post('/make-server-373d8b09/hr/employees', async (c) => {
    console.log('🧑‍💼 HR: Create employee endpoint called');
    try {
      const user = await verifyUser(c.req.header('Authorization'));
      const userId = user.id;
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const employeeData = await c.req.json();
      
      if (!employeeData.first_name || !employeeData.last_name || !employeeData.email) {
        return new Response('First name, last name, and email are required', { status: 400 });
      }

      const employeeId = `employee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const employee = {
        id: employeeId,
        first_name: employeeData.first_name.trim(),
        last_name: employeeData.last_name.trim(),
        email: employeeData.email.trim().toLowerCase(),
        phone: employeeData.phone?.trim() || '',
        position: employeeData.position?.trim() || 'Team Member',
        department: employeeData.department?.trim() || 'General',
        employment_type: employeeData.employment_type || 'full_time',
        status: employeeData.status || 'active',
        hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
        salary: Number(employeeData.salary) || 0,
        manager_id: employeeData.manager_id || null,
        location: employeeData.location?.trim() || 'Remote',
        skills: employeeData.skills || [],
        performance_score: Number(employeeData.performance_score) || null,
        business_id: businessId,
        created_at: new Date().toISOString()
      };

      // Get existing employees and add the new one
      const existingEmployees = await kv.get(`business:${userId}:${businessId}:employees`) || [];
      const updatedEmployees = [employee, ...existingEmployees];
      
      await kv.set(`business:${userId}:${businessId}:employees`, updatedEmployees);
      
      console.log('🧑‍💼 HR: Employee created successfully:', employeeId);
      return c.json({ 
        success: true, 
        employee,
        message: 'Employee created successfully'
      });

    } catch (error: any) {
      console.error('Create employee error:', error);
      const status = error.message === 'Invalid authorization' ? 401 : 500;
      return new Response(`Error creating employee: ${error.message}`, { status });
    }
  });

  // Update employee endpoint
  app.put('/make-server-373d8b09/hr/employees/:id', async (c) => {
    console.log('🧑‍💼 HR: Update employee endpoint called');
    try {
      const user = await verifyUser(c.req.header('Authorization'));
      const userId = user.id;
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const employeeId = c.req.param('id');
      const employeeData = await c.req.json();
      
      if (!employeeData.first_name || !employeeData.last_name || !employeeData.email) {
        return new Response('First name, last name, and email are required', { status: 400 });
      }

      // Get existing employees
      const existingEmployees = await kv.get(`business:${userId}:${businessId}:employees`) || [];
      const employeeIndex = existingEmployees.findIndex((emp: any) => emp.id === employeeId);
      
      if (employeeIndex === -1) {
        return new Response('Employee not found', { status: 404 });
      }

      // Update the employee
      const updatedEmployee = {
        ...existingEmployees[employeeIndex],
        ...employeeData,
        id: employeeId, // Ensure ID doesn't change
        business_id: businessId, // Ensure business ID doesn't change
        created_at: existingEmployees[employeeIndex].created_at // Preserve creation date
      };

      existingEmployees[employeeIndex] = updatedEmployee;
      await kv.set(`business:${userId}:${businessId}:employees`, existingEmployees);
      
      console.log('🧑‍💼 HR: Employee updated successfully:', employeeId);
      return c.json({ 
        success: true, 
        employee: updatedEmployee,
        message: 'Employee updated successfully'
      });

    } catch (error: any) {
      console.error('Update employee error:', error);
      const status = error.message === 'Invalid authorization' ? 401 : 500;
      return new Response(`Error updating employee: ${error.message}`, { status });
    }
  });

  // Delete employee endpoint
  app.delete('/make-server-373d8b09/hr/employees/:id', async (c) => {
    console.log('🧑‍💼 HR: Delete employee endpoint called');
    try {
      const user = await verifyUser(c.req.header('Authorization'));
      const userId = user.id;
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const employeeId = c.req.param('id');

      // Get existing employees
      const existingEmployees = await kv.get(`business:${userId}:${businessId}:employees`) || [];
      const filteredEmployees = existingEmployees.filter((emp: any) => emp.id !== employeeId);
      
      if (filteredEmployees.length === existingEmployees.length) {
        return new Response('Employee not found', { status: 404 });
      }

      await kv.set(`business:${userId}:${businessId}:employees`, filteredEmployees);
      
      console.log('🧑‍💼 HR: Employee deleted successfully:', employeeId);
      return c.json({ 
        success: true, 
        message: 'Employee deleted successfully'
      });

    } catch (error: any) {
      console.error('Delete employee error:', error);
      const status = error.message === 'Invalid authorization' ? 401 : 500;
      return new Response(`Error deleting employee: ${error.message}`, { status });
    }
  });

  // Create contractor endpoint
  app.post('/make-server-373d8b09/hr/contractors', async (c) => {
    console.log('Create contractor endpoint called');
    try {
      const user = await verifyUser(c.req.header('Authorization'));
      const userId = user.id;
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const contractorData = await c.req.json();
      
      if (!contractorData.name || !contractorData.email) {
        return new Response('Name and email are required', { status: 400 });
      }

      const contractorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const contractor = {
        id: contractorId,
        name: contractorData.name.trim(),
        email: contractorData.email.trim().toLowerCase(),
        company: contractorData.company?.trim() || '',
        specialization: contractorData.specialization?.trim() || 'General',
        hourly_rate: Number(contractorData.hourly_rate) || 0,
        contract_start: contractorData.contract_start || new Date().toISOString().split('T')[0],
        contract_end: contractorData.contract_end || null,
        status: contractorData.status || 'active',
        total_hours_worked: Number(contractorData.total_hours_worked) || 0,
        total_amount_paid: Number(contractorData.total_amount_paid) || 0,
        business_id: businessId,
        user_id: userId,
        created_at: new Date().toISOString()
      };

      // Get existing contractors and add the new one
      const existingContractors = await kv.get(`business:${userId}:${businessId}:contractors`) || [];
      const updatedContractors = [contractor, ...existingContractors];
      
      await kv.set(`business:${userId}:${businessId}:contractors`, updatedContractors);
      
      return c.json({ 
        success: true,
        contractor,
        message: 'Contractor created successfully'
      });

    } catch (error: any) {
      console.error('Create contractor error:', error);
      const status = error.message === 'Invalid authorization' ? 401 : 500;
      return new Response(`Error creating contractor: ${error.message}`, { status });
    }
  });

  // Create benefit endpoint
  app.post('/make-server-373d8b09/hr/benefits', async (c) => {
    console.log('Create benefit endpoint called');
    try {
      const user = await verifyUser(c.req.header('Authorization'));
      const userId = user.id;
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const benefitData = await c.req.json();
      
      if (!benefitData.name || benefitData.cost_per_employee === undefined) {
        return new Response('Name and cost per employee are required', { status: 400 });
      }

      const benefitId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const benefit = {
        id: benefitId,
        name: benefitData.name.trim(),
        type: benefitData.type || 'other',
        description: benefitData.description?.trim() || '',
        provider: benefitData.provider?.trim() || '',
        cost_per_employee: Number(benefitData.cost_per_employee),
        employee_contribution: Number(benefitData.employee_contribution) || 0,
        is_active: benefitData.is_active !== false,
        enrolled_employees: benefitData.enrolled_employees || [],
        business_id: businessId,
        user_id: userId,
        created_at: new Date().toISOString()
      };

      // Get existing benefits and add the new one
      const existingBenefits = await kv.get(`business:${userId}:${businessId}:benefits`) || [];
      const updatedBenefits = [benefit, ...existingBenefits];
      
      await kv.set(`business:${userId}:${businessId}:benefits`, updatedBenefits);
      
      return c.json({ 
        success: true,
        benefit,
        message: 'Benefit created successfully'
      });

    } catch (error: any) {
      console.error('Create benefit error:', error);
      const status = error.message === 'Invalid authorization' ? 401 : 500;
      return new Response(`Error creating benefit: ${error.message}`, { status });
    }
  });

  // Smart Actions endpoint - AI-powered HR recommendations
  app.post('/make-server-373d8b09/hr/smart-actions', async (c) => {
    console.log('🤖 HR Smart Actions endpoint called');
    try {
      const user = await verifyUser(c.req.header('Authorization'));
      const userId = user.id;
      
      const { businessId, businessName, businessIndustry, employees, contractors, benefits, performanceReviews } = await c.req.json();
      
      if (!businessId) {
        return c.json({
          success: false,
          error: 'Business ID is required'
        }, 400);
      }

      console.log('🤖 Running Smart Actions for HR...', {
        businessId,
        employeeCount: employees?.length || 0,
        contractorCount: contractors?.length || 0
      });

      // For now, return mock smart actions since we don't have OpenAI configured
      // In production, this would call OpenAI API to generate personalized recommendations
      const mockSmartActions = [
        {
          id: '1',
          type: 'hiring',
          priority: 'high',
          title: 'Consider hiring a Senior Developer',
          description: 'Your product team is growing fast. Based on your roadmap, you\'ll need senior technical leadership.',
          action: 'Post job listing',
          impact: 'Accelerate product development by 40%',
          estimated_cost: '$120,000/year',
          icon: 'user-plus'
        },
        {
          id: '2',
          type: 'retention',
          priority: 'medium',
          title: 'Schedule performance reviews',
          description: `${employees?.length || 0} employees haven't had reviews in over 6 months. Regular feedback improves retention.`,
          action: 'Schedule reviews',
          impact: 'Reduce turnover risk by 25%',
          estimated_cost: '10 hours of manager time',
          icon: 'award'
        },
        {
          id: '3',
          type: 'benefits',
          priority: 'low',
          title: 'Expand benefits package',
          description: 'Consider adding mental health benefits and professional development budget to stay competitive.',
          action: 'Research providers',
          impact: 'Improve employee satisfaction by 30%',
          estimated_cost: '$200/employee/month',
          icon: 'heart'
        },
        {
          id: '4',
          type: 'training',
          priority: 'medium',
          title: 'Invest in leadership training',
          description: 'Your team is growing. Managers need training in delegation, feedback, and conflict resolution.',
          action: 'Book training program',
          impact: 'Increase team productivity by 20%',
          estimated_cost: '$5,000 one-time',
          icon: 'graduation-cap'
        }
      ];

      return c.json({
        success: true,
        smartActions: mockSmartActions,
        summary: `Generated ${mockSmartActions.length} personalized HR recommendations for ${businessName || 'your business'}`
      });

    } catch (error: any) {
      console.error('Smart Actions error:', error);
      const status = error.message === 'Invalid authorization' ? 401 : 500;
      return c.json({
        success: false,
        error: error.message || 'Failed to generate smart actions'
      }, status);
    }
  });

  // Generate HR document with GPT-4o
  app.post('/make-server-373d8b09/hr/generate-document', async (c) => {
    console.log('📄 HR: Generate document endpoint called');
    try {
      const user = await verifyUser(c.req.header('Authorization'));
      const userId = user.id;
      
      const { documentType, businessId, additionalContext } = await c.req.json();

      console.log('📥 Received request body:', { documentType, businessId, additionalContext, userId });

      if (!documentType) {
        return c.json({ error: 'Document type is required' }, 400);
      }

      if (!businessId) {
        console.error('❌ Business ID is missing or undefined:', { businessId });
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get business data for context - automatically fetch company name and industry
      const businessKey = `business:${userId}:${businessId}`;
      const business = await kv.get(businessKey);
      
      if (!business) {
        return c.json({ error: 'Business not found' }, 404);
      }

      const businessName = business.name || 'Your Company';
      const businessIndustry = business.industry || 'your industry';

      console.log(`📄 Generating ${documentType} for ${businessName} (${businessIndustry})`);

      // Map document types to detailed prompts
      const documentPrompts: Record<string, { title: string; prompt: string }> = {
        'employee-handbook': {
          title: 'Employee Handbook',
          prompt: `Create a comprehensive employee handbook for ${businessName}, a company in ${businessIndustry}. Include sections on:
- Company Mission & Values
- Employment Policies (work hours, attendance, dress code)
- Code of Conduct & Ethics
- Workplace Safety
- Anti-Discrimination & Harassment Policy
- Benefits Overview
- Performance Reviews
- Grievance Procedures
- Termination Policy

Make it professional, legally sound, and tailored to a modern workplace. Use clear language and proper formatting with sections and subsections.`
        },
        'offer-letter': {
          title: 'Job Offer Letter Template',
          prompt: `Create a professional job offer letter template for ${businessName}, a company in ${businessIndustry}. Include:
- Welcome message
- Position title placeholder
- Start date placeholder
- Compensation details placeholder
- Benefits summary
- Employment terms (at-will, probation period)
- Acceptance deadline
- Next steps

Make it warm yet professional, and legally compliant. Use [POSITION], [SALARY], [START_DATE] as placeholders.`
        },
        'employment-contract': {
          title: 'Employment Contract Template',
          prompt: `Create a comprehensive employment contract template for ${businessName}, a company in ${businessIndustry}. Include:
- Parties to the agreement
- Position and duties
- Compensation and benefits
- Work schedule
- Confidentiality clause
- Non-compete clause (reasonable)
- Intellectual property rights
- Termination conditions
- Dispute resolution
- Governing law

Make it legally sound with clear terms. Use placeholders like [EMPLOYEE_NAME], [POSITION], [SALARY].`
        },
        'performance-review': {
          title: 'Performance Review Template',
          prompt: `Create a structured performance review template for ${businessName}, a company in ${businessIndustry}. Include:
- Employee information section
- Review period
- Evaluation criteria (Job Knowledge, Quality of Work, Communication, Initiative, Teamwork)
- Rating scale (1-5 or similar)
- Key achievements
- Areas for improvement
- Goals for next period
- Comments section
- Signatures

Make it objective and growth-oriented.`
        },
        'termination-letter': {
          title: 'Termination Letter Template',
          prompt: `Create a formal termination letter template for ${businessName}, a company in ${businessIndustry}. Include:
- Date of termination
- Reason (optional/placeholder)
- Final paycheck details
- Benefits continuation info (COBRA etc.)
- Return of company property
- Confidentiality reminder
- Contact person for questions

Make it respectful but firm and legally compliant.`
        },
        'remote-work-policy': {
          title: 'Remote Work Policy',
          prompt: `Create a comprehensive remote work policy for ${businessName}, a company in ${businessIndustry}. Include:
- Eligibility criteria
- Work hours and availability
- Communication expectations
- Equipment and security
- Environment and safety
- Expense reimbursement (if applicable)
- Right to revoke

Make it flexible but clear on expectations.`
        }
      };

      const selectedPrompt = documentPrompts[documentType];
      
      if (!selectedPrompt) {
        return c.json({ error: 'Invalid document type' }, 400);
      }

      // Check OpenAI key
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        return c.json({ 
          success: false, 
          error: 'OpenAI API key not configured' 
        }, 500);
      }

      // Call OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert HR consultant and legal assistant specializing in creating professional, compliant business documents."
            },
            {
              role: "user",
              content: `${selectedPrompt.prompt}\n\nAdditional Context: ${additionalContext || 'None provided'}`
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API Error:', error);
        return c.json({ error: 'Failed to generate document content' }, 500);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Save the generated document
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const document = {
        id: documentId,
        type: documentType,
        title: selectedPrompt.title,
        content: content,
        businessId: businessId,
        createdAt: new Date().toISOString(),
        createdBy: userId
      };

      // Store in KV
      await kv.set(`business:${userId}:${businessId}:hr_documents:${documentId}`, document);

      return c.json({
        success: true,
        document: document
      });

    } catch (error: any) {
      console.error('Generate document error:', error);
      const status = error.message === 'Invalid authorization' ? 401 : 500;
      return c.json({ error: `Error generating document: ${error.message}` }, status);
    }
  });
}