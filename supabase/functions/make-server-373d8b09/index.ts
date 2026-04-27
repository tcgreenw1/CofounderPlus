import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// KV Store helper
const kv = {
  client: () => createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  ),

  get: async (key: string) => {
    const supabase = kv.client();
    const { data, error } = await supabase
      .from("kv_store_373d8b09")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value;
  },

  set: async (key: string, value: any) => {
    const supabase = kv.client();
    const { error } = await supabase
      .from("kv_store_373d8b09")
      .upsert({ key, value });
    if (error) throw new Error(error.message);
  }
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Subscriptions endpoint
app.get("/subscriptions/user-subscriptions", async (c) => {
  console.log("✅ Subscriptions endpoint called");
  try {
    const subscriptions = await kv.get("user_subscriptions") || [];
    return c.json({ success: true, subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return c.json({
      success: false,
      error: error.message,
      subscriptions: []
    }, 500);
  }
});

// Dashboard widgets endpoint
app.get("/dashboard/widgets", async (c) => {
  console.log("✅ Dashboard widgets endpoint called");
  try {
    const widgets = await kv.get("dashboard_widgets") ||
      ["getting-started", "number-one-goal", "important-notes"];
    return c.json({ success: true, widgets });
  } catch (error) {
    console.error("Error fetching dashboard widgets:", error);
    return c.json({
      success: false,
      error: error.message,
      widgets: ["getting-started", "number-one-goal", "important-notes"]
    }, 500);
  }
});

// Notifications list endpoint
app.get("/notifications/list", async (c) => {
  console.log("✅ Notifications endpoint called");
  try {
    const notifications = await kv.get("notifications") || [];
    return c.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return c.json({
      success: false,
      error: error.message,
      notifications: []
    }, 500);
  }
});

// Navigation customization endpoint
app.get("/nav-customize/get-desktop", async (c) => {
  console.log("✅ Nav customize endpoint called");
  try {
    const navOptions = await kv.get("nav_options_desktop") ||
      ["dashboard", "operations-hub", "cofounder-agi", "notes"];
    return c.json({ success: true, navOptions });
  } catch (error) {
    console.error("Error fetching nav options:", error);
    return c.json({
      success: false,
      error: error.message,
      navOptions: ["dashboard", "operations-hub", "cofounder-agi", "notes"]
    }, 500);
  }
});

// Users/team endpoint
app.get("/users/team", async (c) => {
  console.log("✅ Users/team endpoint called");
  try {
    const team = await kv.get("team_members") || [];
    return c.json({ success: true, team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return c.json({
      success: false,
      error: error.message,
      team: []
    }, 500);
  }
});

// Team v3 data endpoint
app.get("/team-v3/data", async (c) => {
  console.log("✅ Team v3 data endpoint called");
  try {
    const teamData = await kv.get("team_v3_data") || {
      members: [],
      roles: [],
      departments: []
    };
    return c.json({ success: true, data: teamData });
  } catch (error) {
    console.error("Error fetching team v3 data:", error);
    return c.json({
      success: false,
      error: error.message,
      data: { members: [], roles: [], departments: [] }
    }, 500);
  }
});

// User data context endpoint
app.post("/user-data-context", async (c) => {
  console.log("✅ User data context endpoint called");
  try {
    const body = await c.req.json();
    const userId = body.userId || "default";

    if (body.context) {
      await kv.set(`user_context_${userId}`, body.context);
    }

    const context = await kv.get(`user_context_${userId}`) || {};
    return c.json({ success: true, context });
  } catch (error) {
    console.error("Error handling user data context:", error);
    return c.json({
      success: false,
      error: error.message,
      context: {}
    }, 500);
  }
});

// BUSINESSES ENDPOINT - PRIORITY
app.get("/businesses", async (c) => {
  console.log("✅ Businesses endpoint called");
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Extract user ID from token if available
    let userId = "default";
    if (token) {
      // For now, store by token - in production you'd validate the JWT
      userId = token.substring(0, 20); // Use first 20 chars as identifier
    }

    const businesses = await kv.get(`businesses_${userId}`) || [];
    return c.json({ success: true, businesses });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return c.json({
      success: false,
      error: error.message,
      businesses: []
    }, 500);
  }
});

// POST businesses endpoint
app.post("/businesses", async (c) => {
  console.log("✅ POST Businesses endpoint called");
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const body = await c.req.json();

    let userId = "default";
    if (token) {
      userId = token.substring(0, 20);
    }

    const businesses = await kv.get(`businesses_${userId}`) || [];
    const newBusiness = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString()
    };

    businesses.push(newBusiness);
    await kv.set(`businesses_${userId}`, businesses);

    return c.json({ success: true, business: newBusiness });
  } catch (error) {
    console.error("Error creating business:", error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Number one goal endpoint
app.get("/number-one-goal", async (c) => {
  console.log("✅ Number one goal endpoint called");
  try {
    const userId = c.req.query("userId") || "default";
    const goal = await kv.get(`number_one_goal_${userId}`) || null;
    return c.json({ success: true, goal });
  } catch (error) {
    console.error("Error fetching number one goal:", error);
    return c.json({
      success: false,
      error: error.message,
      goal: null
    }, 500);
  }
});

// POST number one goal
app.post("/number-one-goal", async (c) => {
  console.log("✅ POST Number one goal endpoint called");
  try {
    const body = await c.req.json();
    const userId = body.userId || "default";
    const goal = body.goal;

    await kv.set(`number_one_goal_${userId}`, goal);
    return c.json({ success: true, goal });
  } catch (error) {
    console.error("Error saving number one goal:", error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Organizations list endpoint
app.get("/organizations/list", async (c) => {
  console.log("✅ Organizations list endpoint called");
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId = "default";
    if (token) {
      userId = token.substring(0, 20);
    }

    const organizations = await kv.get(`organizations_${userId}`) || [];
    return c.json({ success: true, organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return c.json({
      success: false,
      error: error.message,
      organizations: []
    }, 500);
  }
});

// Organizations current endpoint
app.get("/organizations/current", async (c) => {
  console.log("✅ Organizations current endpoint called");
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId = "default";
    if (token) {
      userId = token.substring(0, 20);
    }

    const currentOrg = await kv.get(`current_organization_${userId}`) || null;
    return c.json({ success: true, organization: currentOrg });
  } catch (error) {
    console.error("Error fetching current organization:", error);
    return c.json({
      success: false,
      error: error.message,
      organization: null
    }, 500);
  }
});

// Support user tickets endpoint
app.get("/support/user-tickets", async (c) => {
  console.log("✅ Support user tickets endpoint called");
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId = "default";
    if (token) {
      userId = token.substring(0, 20);
    }

    const tickets = await kv.get(`support_tickets_${userId}`) || [];
    return c.json({ success: true, tickets });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return c.json({
      success: false,
      error: error.message,
      tickets: []
    }, 500);
  }
});

// Credits balance endpoint
app.get("/credits/balance", async (c) => {
  console.log("✅ Credits balance endpoint called");
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId = "default";
    if (token) {
      userId = token.substring(0, 20);
    }

    const balance = await kv.get(`credits_balance_${userId}`) || { balance: 0, used: 0 };
    return c.json({ success: true, ...balance });
  } catch (error) {
    console.error("Error fetching credits balance:", error);
    return c.json({
      success: false,
      error: error.message,
      balance: 0,
      used: 0
    }, 500);
  }
});

// Email 2FA check enabled endpoint
app.get("/email-2fa/check-enabled", async (c) => {
  console.log("✅ Email 2FA check enabled endpoint called");
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return c.json({
        success: false,
        enabled: false,
        error: "Unauthorized"
      }, 401);
    }

    let userId = token.substring(0, 20);
    const twoFAEnabled = await kv.get(`2fa_enabled_${userId}`) || false;

    return c.json({ success: true, enabled: twoFAEnabled });
  } catch (error) {
    console.error("Error checking 2FA status:", error);
    return c.json({
      success: false,
      error: error.message,
      enabled: false
    }, 500);
  }
});

// Bookkeeping test endpoint
app.get("/bookkeeping/test", async (c) => {
  console.log("✅ Bookkeeping test endpoint called");
  return c.json({
    success: true,
    message: "Bookkeeping service available",
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get("/test", (c) => {
  return c.json({
    status: "WORKING",
    timestamp: new Date().toISOString(),
    version: "2026-04-26-all-endpoints",
    message: "All endpoints active including businesses"
  });
});

console.log("🚀 make-server-373d8b09 starting with ALL endpoints at", new Date().toISOString());

Deno.serve(app.fetch);
