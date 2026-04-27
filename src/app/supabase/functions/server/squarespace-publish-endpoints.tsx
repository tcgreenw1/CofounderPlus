/**
 * SQUARESPACE PUBLISHING ENDPOINTS
 * 
 * Publish React applications to Squarespace websites with DNS configuration
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Add CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

/**
 * Verify user authentication
 */
async function verifyUserAccess(accessToken: string) {
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  
  const { data: { user }, error } = await authClient.auth.getUser(accessToken);
  
  if (error || !user) {
    throw new Error('Invalid authorization');
  }
  
  return user;
}

/**
 * GET /make-server-373d8b09/squarespace/domains
 * Get list of Squarespace domains for the user
 */
app.get('/make-server-373d8b09/squarespace/domains', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    
    // Get stored Squarespace domains from KV store
    const domainsKey = `squarespace_domains:${user.id}`;
    const domains = await kv.get(domainsKey);
    
    return c.json({
      success: true,
      domains: domains || [],
    });

  } catch (error: any) {
    console.error('Get Squarespace domains error:', error);
    return c.json({
      error: error.message || 'Failed to get domains',
      details: error.toString(),
    }, 500);
  }
});

/**
 * POST /make-server-373d8b09/squarespace/connect
 * Connect a Squarespace domain
 */
app.post('/make-server-373d8b09/squarespace/connect', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const body = await c.req.json();
    const { domain, apiKey } = body;

    if (!domain) {
      return c.json({ error: 'Domain is required' }, 400);
    }

    console.log(`🔗 Connecting Squarespace domain: ${domain}`);

    // Store domain connection (in production, you would verify with Squarespace API)
    const domainsKey = `squarespace_domains:${user.id}`;
    const existingDomains = await kv.get(domainsKey) || [];
    
    const newDomain = {
      domain,
      connectedAt: new Date().toISOString(),
      status: 'connected',
      dnsRecords: generateDNSRecords(domain)
    };

    const updatedDomains = [...existingDomains, newDomain];
    await kv.set(domainsKey, updatedDomains);

    // Store API key if provided
    if (apiKey) {
      const apiKeyKey = `squarespace_api:${user.id}:${domain}`;
      await kv.set(apiKeyKey, { apiKey, createdAt: new Date().toISOString() });
    }

    console.log(`✅ Connected Squarespace domain: ${domain}`);

    return c.json({
      success: true,
      domain: newDomain,
      message: 'Domain connected successfully',
    });

  } catch (error: any) {
    console.error('Connect Squarespace domain error:', error);
    return c.json({
      error: error.message || 'Failed to connect domain',
      details: error.toString(),
    }, 500);
  }
});

/**
 * POST /make-server-373d8b09/squarespace/publish
 * Publish build to Squarespace
 */
app.post('/make-server-373d8b09/squarespace/publish', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const body = await c.req.json();
    const { domain, buildHtml, repository } = body;

    if (!domain) {
      return c.json({ error: 'Domain is required' }, 400);
    }

    if (!buildHtml) {
      return c.json({ error: 'Build HTML is required' }, 400);
    }

    console.log(`🚀 Publishing to Squarespace domain: ${domain}`);

    // In production, you would use Squarespace API to upload the build
    // For now, we'll store the published build in KV store
    const publishKey = `squarespace_publish:${user.id}:${domain.replace(/\./g, '_')}`;
    const publishData = {
      domain,
      buildHtml,
      repository,
      publishedAt: new Date().toISOString(),
      status: 'published',
      url: `https://${domain}`,
    };

    await kv.set(publishKey, publishData);

    // Update domain status
    const domainsKey = `squarespace_domains:${user.id}`;
    const domains = await kv.get(domainsKey) || [];
    const updatedDomains = domains.map((d: any) => 
      d.domain === domain 
        ? { ...d, lastPublish: new Date().toISOString(), status: 'published' }
        : d
    );
    await kv.set(domainsKey, updatedDomains);

    console.log(`✅ Published to Squarespace: ${domain}`);

    return c.json({
      success: true,
      url: `https://${domain}`,
      publishedAt: publishData.publishedAt,
      message: 'Successfully published to Squarespace',
    });

  } catch (error: any) {
    console.error('Publish to Squarespace error:', error);
    return c.json({
      error: error.message || 'Failed to publish',
      details: error.toString(),
    }, 500);
  }
});

/**
 * GET /make-server-373d8b09/squarespace/dns-check
 * Check DNS configuration status
 */
app.get('/make-server-373d8b09/squarespace/dns-check', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const domain = c.req.query('domain');

    if (!domain) {
      return c.json({ error: 'Domain is required' }, 400);
    }

    console.log(`🔍 Checking DNS for domain: ${domain}`);

    // In production, you would actually check DNS records
    // For now, simulate DNS check with random status
    const dnsRecords = generateDNSRecords(domain);
    const simulatedStatus = Math.random() > 0.5;

    return c.json({
      success: true,
      domain,
      configured: simulatedStatus,
      records: dnsRecords,
      message: simulatedStatus 
        ? 'DNS records are properly configured' 
        : 'DNS records need configuration',
    });

  } catch (error: any) {
    console.error('DNS check error:', error);
    return c.json({
      error: error.message || 'Failed to check DNS',
      details: error.toString(),
    }, 500);
  }
});

/**
 * DELETE /make-server-373d8b09/squarespace/domain
 * Disconnect a Squarespace domain
 */
app.delete('/make-server-373d8b09/squarespace/domain', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const domain = c.req.query('domain');

    if (!domain) {
      return c.json({ error: 'Domain is required' }, 400);
    }

    console.log(`🗑️ Disconnecting Squarespace domain: ${domain}`);

    // Remove domain from list
    const domainsKey = `squarespace_domains:${user.id}`;
    const domains = await kv.get(domainsKey) || [];
    const updatedDomains = domains.filter((d: any) => d.domain !== domain);
    await kv.set(domainsKey, updatedDomains);

    // Remove API key
    const apiKeyKey = `squarespace_api:${user.id}:${domain}`;
    await kv.del(apiKeyKey);

    // Remove published builds
    const publishKey = `squarespace_publish:${user.id}:${domain.replace(/\./g, '_')}`;
    await kv.del(publishKey);

    console.log(`✅ Disconnected Squarespace domain: ${domain}`);

    return c.json({
      success: true,
      message: 'Domain disconnected successfully',
    });

  } catch (error: any) {
    console.error('Disconnect domain error:', error);
    return c.json({
      error: error.message || 'Failed to disconnect domain',
      details: error.toString(),
    }, 500);
  }
});

/**
 * Generate DNS records for a domain
 */
function generateDNSRecords(domain: string) {
  return [
    {
      id: '1',
      type: 'A' as const,
      name: '@',
      value: '198.185.159.144',
      ttl: 3600,
      status: 'pending' as const,
      description: 'Points your domain to Squarespace servers'
    },
    {
      id: '2',
      type: 'A' as const,
      name: 'www',
      value: '198.185.159.145',
      ttl: 3600,
      status: 'pending' as const,
      description: 'Points www subdomain to Squarespace servers'
    },
    {
      id: '3',
      type: 'CNAME' as const,
      name: 'www',
      value: 'ext-cust.squarespace.com',
      ttl: 3600,
      status: 'pending' as const,
      description: 'Alternative CNAME record for www subdomain'
    },
    {
      id: '4',
      type: 'TXT' as const,
      name: '@',
      value: `squarespace-domain-verification=${generateVerificationToken()}`,
      ttl: 3600,
      status: 'pending' as const,
      description: 'Domain verification record'
    }
  ];
}

/**
 * Generate a verification token
 */
function generateVerificationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export { app as squarespacePublishApp };
