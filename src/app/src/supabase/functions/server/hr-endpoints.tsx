// HR endpoints for the Cofounder API Server
import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addHREndpoints(app: Hono, verifyUserAccess: any) {
  
  // Sync payroll to finance as monthly expense transactions
  app.post('/make-server-373d8b09/hr/sync-payroll-to-finance', async (c) => {
    console.log('🧑‍💼💰 HR: Sync payroll to finance endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyUserAccess(accessToken);
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const { userId, month, year } = await c.req.json();
      
      if (!userId || !month || !year) {
        return new Response('User ID, month, and year are required', { status: 400 });
      }

      console.log(`🧑‍💼💰 Syncing payroll for business ${businessId}, month ${month}/${year}`);

      // Get all active employees
      const employees = await kv.get(`business:${businessId}:employees`) || [];
      const activeEmployees = employees.filter(e => e.status === 'active');

      if (activeEmployees.length === 0) {
        return c.json({ 
          success: true, 
          message: 'No active employees to sync',
          transactionCount: 0
        });
      }

      // Calculate monthly payroll
      const totalMonthlyPayroll = activeEmployees.reduce((sum, e) => sum + (e.salary / 12), 0);

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
        notes: `Synced from HR: ${activeEmployees.map(e => `${e.first_name} ${e.last_name} (${Math.round((e.salary / 12) * 100) / 100})`).join(', ')}`,
        is_payroll_sync: true,
        payroll_month: month,
        payroll_year: year,
        employee_count: activeEmployees.length,
        business_id: businessId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store the transaction
      await kv.set(`transaction:${userId}:${businessId}:${transactionId}`, payrollTransaction);

      // Update bank balance
      let bankBalance = await kv.get(`bank_balance:${userId}:${businessId}`);
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
      await kv.set(`bank_balance:${userId}:${businessId}`, bankBalance);

      console.log(`🧑‍💼💰 Payroll synced: ${payrollTransaction.amount} for ${activeEmployees.length} employees`);

      return c.json({
        success: true,
        message: `Payroll synced successfully for ${monthName} ${year}`,
        transaction: payrollTransaction,
        bankBalance,
        employeeCount: activeEmployees.length,
        totalAmount: payrollTransaction.amount
      });

    } catch (error) {
      console.error('Sync payroll to finance error:', error);
      return new Response(`Error syncing payroll: ${error.message}`, { status: 500 });
    }
  });
  
  // HR data endpoint - get all HR data for a business
  app.get('/make-server-373d8b09/hr/data', async (c) => {
    console.log('Get HR data endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyUserAccess(accessToken);
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      console.log('🧑‍💼 HR: Fetching HR data for business:', businessId);

      const employees = await kv.get(`business:${businessId}:employees`) || [];
      const contractors = await kv.get(`business:${businessId}:contractors`) || [];
      const time_entries = await kv.get(`business:${businessId}:time_entries`) || [];
      const performance_reviews = await kv.get(`business:${businessId}:performance_reviews`) || [];
      const benefits = await kv.get(`business:${businessId}:benefits`) || [];
      
      return c.json({
        employees: employees || [],
        contractors: contractors || [],
        timeEntries: time_entries || [],
        performanceReviews: performance_reviews || [],
        benefits: benefits || []
      });

    } catch (error) {
      console.error('Get HR data error:', error);
      return new Response(`Error getting HR data: ${error.message}`, { status: 500 });
    }
  });

  // Create employee endpoint
  app.post('/make-server-373d8b09/hr/employees', async (c) => {
    console.log('🧑‍💼 HR: Create employee endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyUserAccess(accessToken);
      
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
      const existingEmployees = await kv.get(`business:${businessId}:employees`) || [];
      const updatedEmployees = [employee, ...existingEmployees];
      
      await kv.set(`business:${businessId}:employees`, updatedEmployees);
      
      console.log('🧑‍💼 HR: Employee created successfully:', employeeId);
      return c.json({ 
        success: true, 
        employee,
        message: 'Employee created successfully'
      });

    } catch (error) {
      console.error('Create employee error:', error);
      return new Response(`Error creating employee: ${error.message}`, { status: 500 });
    }
  });

  // Update employee endpoint
  app.put('/make-server-373d8b09/hr/employees/:id', async (c) => {
    console.log('🧑‍💼 HR: Update employee endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyUserAccess(accessToken);
      
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
      const existingEmployees = await kv.get(`business:${businessId}:employees`) || [];
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
      await kv.set(`business:${businessId}:employees`, existingEmployees);
      
      console.log('🧑‍💼 HR: Employee updated successfully:', employeeId);
      return c.json({ 
        success: true, 
        employee: updatedEmployee,
        message: 'Employee updated successfully'
      });

    } catch (error) {
      console.error('Update employee error:', error);
      return new Response(`Error updating employee: ${error.message}`, { status: 500 });
    }
  });

  // Delete employee endpoint
  app.delete('/make-server-373d8b09/hr/employees/:id', async (c) => {
    console.log('🧑‍💼 HR: Delete employee endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyUserAccess(accessToken);
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const employeeId = c.req.param('id');

      // Get existing employees
      const existingEmployees = await kv.get(`business:${businessId}:employees`) || [];
      const filteredEmployees = existingEmployees.filter((emp: any) => emp.id !== employeeId);
      
      if (filteredEmployees.length === existingEmployees.length) {
        return new Response('Employee not found', { status: 404 });
      }

      await kv.set(`business:${businessId}:employees`, filteredEmployees);
      
      console.log('🧑‍💼 HR: Employee deleted successfully:', employeeId);
      return c.json({ 
        success: true, 
        message: 'Employee deleted successfully'
      });

    } catch (error) {
      console.error('Delete employee error:', error);
      return new Response(`Error deleting employee: ${error.message}`, { status: 500 });
    }
  });

  // Create contractor endpoint
  app.post('/make-server-373d8b09/hr/contractors', async (c) => {
    console.log('Create contractor endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const business = await kv.get(`business:${user.id}:${businessId}`);
      if (!business) {
        return new Response('Business not found', { status: 404 });
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
        businessId,
        userId: user.id,
        created_at: new Date().toISOString()
      };

      await kv.set(`contractor:${businessId}:${contractorId}`, contractor);
      return c.json({ contractor });

    } catch (error) {
      console.error('Create contractor error:', error);
      return new Response(`Error creating contractor: ${error.message}`, { status: 500 });
    }
  });

  // Create benefit endpoint
  app.post('/make-server-373d8b09/hr/benefits', async (c) => {
    console.log('Create benefit endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const business = await kv.get(`business:${user.id}:${businessId}`);
      if (!business) {
        return new Response('Business not found', { status: 404 });
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
        businessId,
        userId: user.id,
        created_at: new Date().toISOString()
      };

      await kv.set(`benefit:${businessId}:${benefitId}`, benefit);
      return c.json({ benefit });

    } catch (error) {
      console.error('Create benefit error:', error);
      return new Response(`Error creating benefit: ${error.message}`, { status: 500 });
    }
  });

}