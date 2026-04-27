import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addSalesEndpoints(app: any, verifyUserAccess: any) {
  console.log('🏪 Adding Sales endpoints...');

  // Get all sales data for a business
  app.get('/make-server-373d8b09/sales/data', async (c: any) => {
    console.log('Sales data endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get sales data from KV store
      const deals = await kv.getByPrefix(`deal:${user.id}:${businessId}:`) || [];
      const leads = await kv.getByPrefix(`lead:${user.id}:${businessId}:`) || [];
      const customers = await kv.getByPrefix(`customer:${user.id}:${businessId}:`) || [];

      console.log(`Sales data loaded: ${deals.length} deals, ${leads.length} leads, ${customers.length} customers`);

      return c.json({
        deals,
        leads,
        customers,
        businessInfo: {} // Could be expanded to include business-specific sales info
      });

    } catch (error) {
      console.error('Sales data error:', error);
      return new Response(`Error getting sales data: ${error.message}`, { status: 500 });
    }
  });

  // DEALS ENDPOINTS
  app.post('/make-server-373d8b09/sales/deals', async (c: any) => {
    console.log('Create deal endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const dealData = await c.req.json();
      const dealId = `deal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const deal = {
        ...dealData,
        id: dealId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await kv.set(`deal:${user.id}:${businessId}:${dealId}`, deal);
      
      console.log('Deal created:', deal);
      return c.json({ deal });

    } catch (error) {
      console.error('Create deal error:', error);
      return new Response(`Error creating deal: ${error.message}`, { status: 500 });
    }
  });

  app.put('/make-server-373d8b09/sales/deals/:id', async (c: any) => {
    console.log('Update deal endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const dealId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!dealId) {
        return new Response('Deal ID is required', { status: 400 });
      }

      const existingDeal = await kv.get(`deal:${user.id}:${businessId}:${dealId}`);
      if (!existingDeal) {
        return new Response('Deal not found', { status: 404 });
      }

      const updateData = await c.req.json();
      
      const updatedDeal = {
        ...existingDeal,
        ...updateData,
        id: dealId,
        updated_at: new Date().toISOString()
      };

      await kv.set(`deal:${user.id}:${businessId}:${dealId}`, updatedDeal);
      
      console.log('Deal updated:', updatedDeal);
      return c.json({ deal: updatedDeal });

    } catch (error) {
      console.error('Update deal error:', error);
      return new Response(`Error updating deal: ${error.message}`, { status: 500 });
    }
  });

  app.delete('/make-server-373d8b09/sales/deals/:id', async (c: any) => {
    console.log('Delete deal endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const dealId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!dealId) {
        return new Response('Deal ID is required', { status: 400 });
      }

      const existingDeal = await kv.get(`deal:${user.id}:${businessId}:${dealId}`);
      if (!existingDeal) {
        return new Response('Deal not found', { status: 404 });
      }

      await kv.del(`deal:${user.id}:${businessId}:${dealId}`);
      
      console.log('Deal deleted:', dealId);
      return c.json({ success: true, message: 'Deal deleted successfully' });

    } catch (error) {
      console.error('Delete deal error:', error);
      return new Response(`Error deleting deal: ${error.message}`, { status: 500 });
    }
  });

  // LEADS ENDPOINTS
  app.post('/make-server-373d8b09/sales/leads', async (c: any) => {
    console.log('Create lead endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const leadData = await c.req.json();
      const leadId = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const lead = {
        ...leadData,
        id: leadId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await kv.set(`lead:${user.id}:${businessId}:${leadId}`, lead);
      
      console.log('Lead created:', lead);
      return c.json({ lead });

    } catch (error) {
      console.error('Create lead error:', error);
      return new Response(`Error creating lead: ${error.message}`, { status: 500 });
    }
  });

  app.put('/make-server-373d8b09/sales/leads/:id', async (c: any) => {
    console.log('Update lead endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const leadId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!leadId) {
        return new Response('Lead ID is required', { status: 400 });
      }

      const existingLead = await kv.get(`lead:${user.id}:${businessId}:${leadId}`);
      if (!existingLead) {
        return new Response('Lead not found', { status: 404 });
      }

      const updateData = await c.req.json();
      
      const updatedLead = {
        ...existingLead,
        ...updateData,
        id: leadId,
        updated_at: new Date().toISOString()
      };

      await kv.set(`lead:${user.id}:${businessId}:${leadId}`, updatedLead);
      
      console.log('Lead updated:', updatedLead);
      return c.json({ lead: updatedLead });

    } catch (error) {
      console.error('Update lead error:', error);
      return new Response(`Error updating lead: ${error.message}`, { status: 500 });
    }
  });

  app.delete('/make-server-373d8b09/sales/leads/:id', async (c: any) => {
    console.log('Delete lead endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const leadId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!leadId) {
        return new Response('Lead ID is required', { status: 400 });
      }

      const existingLead = await kv.get(`lead:${user.id}:${businessId}:${leadId}`);
      if (!existingLead) {
        return new Response('Lead not found', { status: 404 });
      }

      await kv.del(`lead:${user.id}:${businessId}:${leadId}`);
      
      console.log('Lead deleted:', leadId);
      return c.json({ success: true, message: 'Lead deleted successfully' });

    } catch (error) {
      console.error('Delete lead error:', error);
      return new Response(`Error deleting lead: ${error.message}`, { status: 500 });
    }
  });

  // CUSTOMERS ENDPOINTS
  app.post('/make-server-373d8b09/sales/customers', async (c: any) => {
    console.log('Create customer endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const customerData = await c.req.json();
      const customerId = `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const customer = {
        ...customerData,
        id: customerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await kv.set(`customer:${user.id}:${businessId}:${customerId}`, customer);
      
      console.log('Customer created:', customer);
      return c.json({ customer });

    } catch (error) {
      console.error('Create customer error:', error);
      return new Response(`Error creating customer: ${error.message}`, { status: 500 });
    }
  });

  app.put('/make-server-373d8b09/sales/customers/:id', async (c: any) => {
    console.log('Update customer endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const customerId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!customerId) {
        return new Response('Customer ID is required', { status: 400 });
      }

      const existingCustomer = await kv.get(`customer:${user.id}:${businessId}:${customerId}`);
      if (!existingCustomer) {
        return new Response('Customer not found', { status: 404 });
      }

      const updateData = await c.req.json();
      
      const updatedCustomer = {
        ...existingCustomer,
        ...updateData,
        id: customerId,
        updated_at: new Date().toISOString()
      };

      await kv.set(`customer:${user.id}:${businessId}:${customerId}`, updatedCustomer);
      
      console.log('Customer updated:', updatedCustomer);
      return c.json({ customer: updatedCustomer });

    } catch (error) {
      console.error('Update customer error:', error);
      return new Response(`Error updating customer: ${error.message}`, { status: 500 });
    }
  });

  app.delete('/make-server-373d8b09/sales/customers/:id', async (c: any) => {
    console.log('Delete customer endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const customerId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!customerId) {
        return new Response('Customer ID is required', { status: 400 });
      }

      const existingCustomer = await kv.get(`customer:${user.id}:${businessId}:${customerId}`);
      if (!existingCustomer) {
        return new Response('Customer not found', { status: 404 });
      }

      await kv.del(`customer:${user.id}:${businessId}:${customerId}`);
      
      console.log('Customer deleted:', customerId);
      return c.json({ success: true, message: 'Customer deleted successfully' });

    } catch (error) {
      console.error('Delete customer error:', error);
      return new Response(`Error deleting customer: ${error.message}`, { status: 500 });
    }
  });

  // CUSTOMER INTERACTIONS ENDPOINTS
  app.post('/make-server-373d8b09/sales/customers/:customerId/interactions', async (c: any) => {
    console.log('Create customer interaction endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const customerId = c.req.param('customerId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!customerId) {
        return new Response('Customer ID is required', { status: 400 });
      }

      // Verify customer exists
      const existingCustomer = await kv.get(`customer:${user.id}:${businessId}:${customerId}`);
      if (!existingCustomer) {
        return new Response('Customer not found', { status: 404 });
      }

      const interactionData = await c.req.json();
      const interactionId = `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const interaction = {
        ...interactionData,
        id: interactionId,
        customer_id: customerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await kv.set(`interaction:${user.id}:${businessId}:${customerId}:${interactionId}`, interaction);
      
      console.log('Customer interaction created:', interaction);
      return c.json({ interaction });

    } catch (error) {
      console.error('Create customer interaction error:', error);
      return new Response(`Error creating customer interaction: ${error.message}`, { status: 500 });
    }
  });

  app.get('/make-server-373d8b09/sales/customers/:customerId/interactions', async (c: any) => {
    console.log('Get customer interactions endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const customerId = c.req.param('customerId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!customerId) {
        return new Response('Customer ID is required', { status: 400 });
      }

      // Verify customer exists
      const existingCustomer = await kv.get(`customer:${user.id}:${businessId}:${customerId}`);
      if (!existingCustomer) {
        return new Response('Customer not found', { status: 404 });
      }

      const interactions = await kv.getByPrefix(`interaction:${user.id}:${businessId}:${customerId}:`) || [];
      
      console.log(`Customer interactions loaded: ${interactions.length} interactions for customer ${customerId}`);
      return c.json({ interactions });

    } catch (error) {
      console.error('Get customer interactions error:', error);
      return new Response(`Error getting customer interactions: ${error.message}`, { status: 500 });
    }
  });

  console.log('✅ Sales endpoints added successfully');
}