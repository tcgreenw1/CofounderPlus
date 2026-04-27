import React, { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Database, Users, MessageSquare, CheckCircle } from 'lucide-react';
import { toast } from "sonner@2.0.3";

export function AdminDataSeeder() {
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const seedAdminData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('No access token available');
        return;
      }

      console.log('🌱 Seeding admin data...');

      // Create sample admin notifications
      const notifications = [
        {
          id: `notif-${Date.now()}-1`,
          type: 'help_request',
          title: 'User Help Request',
          message: 'User john@example.com requested help with business setup',
          data: { userId: 'user-123', requestType: 'business_setup' },
          read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          id: `notif-${Date.now()}-2`,
          type: 'community_post',
          title: 'New Community Post',
          message: 'Sarah from TechStart posted: "How to validate your business idea"',
          data: { postId: 'post-456', userId: 'user-456' },
          read: false,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
        },
        {
          id: `notif-${Date.now()}-3`,
          type: 'system',
          title: 'Platform Update',
          message: 'New features added to the Notes system',
          data: { updateType: 'feature_release', version: '1.2.0' },
          read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        },
        {
          id: `notif-${Date.now()}-4`,
          type: 'help_request',
          title: 'Feature Request',
          message: 'Multiple users requesting dark mode improvements',
          data: { requestType: 'feature_request', priority: 'medium' },
          read: false,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
        }
      ];

      // Create sample community messages
      const communityMessages = [
        {
          id: `msg-${Date.now()}-1`,
          title: 'Welcome to Cofounder Community!',
          content: 'Welcome everyone to our growing community of entrepreneurs! Here you\'ll find resources, connect with other founders, and get the support you need to build your $1M business.',
          type: 'welcome',
          author: {
            id: 'admin-1',
            email: 'admin@cofounderplus.com',
            name: 'Admin Team'
          },
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
          status: 'sent'
        },
        {
          id: `msg-${Date.now()}-2`,
          title: 'Platform Updates - New Notes Feature',
          content: 'We\'ve just launched our enhanced Notes system with kanban boards! You can now organize your business ideas, tasks, and goals in a visual, drag-and-drop interface. Check it out in the Notes section.',
          type: 'update',
          author: {
            id: 'admin-1',
            email: 'admin@cofounderplus.com',
            name: 'Product Team'
          },
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          status: 'sent'
        }
      ];

      // Send data to server
      const seedRequests = [];

      // Seed notifications
      for (const notification of notifications) {
        const request = fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/seed/notification`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(notification)
          }
        );
        seedRequests.push(request);
      }

      // Seed community messages
      for (const message of communityMessages) {
        const request = fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/admin/seed/community-message`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
          }
        );
        seedRequests.push(request);
      }

      // Wait for all requests to complete
      const responses = await Promise.all(seedRequests);
      const failed = responses.filter(r => !r.ok);

      if (failed.length > 0) {
        console.warn(`${failed.length} seed requests failed`);
        toast.warning(`Seeded data with ${failed.length} failures`);
      } else {
        console.log('✅ All admin data seeded successfully');
        toast.success('Admin data seeded successfully!');
      }

      setSeeded(true);

    } catch (error) {
      console.error('❌ Error seeding admin data:', error);
      toast.error(`Failed to seed data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (seeded) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Admin Data Seeded Successfully
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Sample notifications and community messages have been added to the database.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Admin Data Seeder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will populate the admin portal with sample data including notifications and community messages
          so you can see how the admin dashboard works.
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">
              <MessageSquare className="w-3 h-3 mr-1" />
              4 Notifications
            </Badge>
            <span className="text-muted-foreground">Sample admin notifications</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">
              <Users className="w-3 h-3 mr-1" />
              2 Messages
            </Badge>
            <span className="text-muted-foreground">Community announcements</span>
          </div>
        </div>

        <Button 
          onClick={seedAdminData} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Seeding Data...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Seed Admin Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}