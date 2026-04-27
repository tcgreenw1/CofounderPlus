import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { useNavigate } from 'react-router-dom';

export function AdminAccountCreator() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@cofounderplus.com');
  const [password, setPassword] = useState('Corbett-6!');
  const [name, setName] = useState('Admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const createAdminAccount = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use Supabase's built-in signUp method - no custom endpoint needed!
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim()
          },
          // Auto-confirm for admin account creation
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setSuccess('Account already exists! You can now log in.');
          setTimeout(() => navigate('/auth?mode=login'), 2000);
        } else {
          setError(error.message);
        }
      } else {
        setSuccess('Account created! You can now log in.');
        setTimeout(() => navigate('/auth?mode=login'), 2000);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth?mode=login')}
              className="p-0 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Admin Account Setup</CardTitle>
          </div>
          <CardDescription>
            Create or verify the admin account for Cofounder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cofounderplus.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          <Button
            onClick={createAdminAccount}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </Button>

          {success && (
            <Button
              variant="outline"
              onClick={() => navigate('/auth?mode=login')}
              className="w-full"
            >
              Go to Login
            </Button>
          )}

          {/* Debug Information */}
          {debugInfo.length > 0 && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Debug Log:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {debugInfo.map((info, idx) => (
                  <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {info}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> This will create the admin account in Supabase. Once created, you can log in at /auth with the credentials above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
