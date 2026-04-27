import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, XCircle, RefreshCw, Brain, Zap } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

export function CofounderAIAssistantSync() {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const syncAssistantWithAIFunctions = async () => {
    setIsFixing(true);
    setResults([]);
    setIsComplete(false);

    try {
      // Step 1: Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        addResult({
          step: 'Authentication',
          success: false,
          message: 'Failed to get authentication session'
        });
        return;
      }

      addResult({
        step: 'Authentication',
        success: true,
        message: 'Successfully authenticated user'
      });

      // Step 2: Update OpenAI Assistant with latest AI function definitions
      console.log('🤖 Syncing OpenAI Assistant with latest AI functions...');
      const syncResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sync-assistant-functions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const syncResult = await syncResponse.json();
      console.log('🔄 Sync result:', syncResult);

      addResult({
        step: 'Assistant Sync',
        success: syncResponse.ok,
        message: syncResponse.ok 
          ? `Successfully synced assistant with ${syncResult.functionCount || 'multiple'} AI functions`
          : `Failed to sync assistant: ${syncResult.error || 'Unknown error'}`
      });

      if (!syncResponse.ok) {
        return;
      }

      // Step 3: Test business update endpoint directly
      console.log('🏢 Testing business update endpoint...');
      const testBusinessData = {
        name: 'Test Business Name Update - ' + new Date().toISOString().slice(0, 19)
      };

      const updateResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/test-business-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(testBusinessData)
      });

      const updateResult = await updateResponse.json();
      console.log('💼 Business update test:', updateResult);

      addResult({
        step: 'Business Update Test',
        success: updateResponse.ok,
        message: updateResponse.ok 
          ? 'Business update endpoint is working correctly'
          : `Business update failed: ${updateResult.error || 'Unknown error'}`
      });

      // Step 4: Test AI business name change via chat
      console.log('🧠 Testing AI business name change...');
      const testMessage = `Please change my business name to "AI-Enhanced Solutions ${Date.now()}". This is a test to verify the update_business_info function is working properly.`;
      
      const aiResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ai/chat-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: testMessage,
          sessionId: `test-session-${Date.now()}`
        })
      });

      const aiResult = await aiResponse.json();
      console.log('🤖 AI test response:', aiResult);

      // Check if the AI successfully used the function
      const aiUsedFunction = aiResult.response?.toLowerCase().includes('successfully') || 
                           aiResult.response?.toLowerCase().includes('updated') ||
                           aiResult.response?.toLowerCase().includes('changed');

      addResult({
        step: 'AI Function Test',
        success: aiResponse.ok && aiUsedFunction,
        message: aiResponse.ok 
          ? (aiUsedFunction 
             ? 'AI successfully used the update_business_info function!'
             : 'AI responded but may not have used the update function properly')
          : `AI test failed: ${aiResult.error || 'Unknown error'}`,
        data: aiResult.response ? { aiResponse: aiResult.response } : undefined
      });

      // Step 5: Verify assistant configuration
      console.log('🔍 Verifying assistant configuration...');
      const verifyResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/verify-assistant-config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const verifyResult = await verifyResponse.json();
      console.log('✅ Verification result:', verifyResult);

      addResult({
        step: 'Configuration Verification',
        success: verifyResponse.ok,
        message: verifyResponse.ok 
          ? `Assistant configured with ${verifyResult.toolCount || 0} tools, business function: ${verifyResult.hasBusinessUpdate ? 'YES' : 'NO'}`
          : `Verification failed: ${verifyResult.error || 'Unknown error'}`,
        data: verifyResult
      });

      setIsComplete(true);

    } catch (error: any) {
      console.error('❌ Fix process error:', error);
      addResult({
        step: 'Process Error',
        success: false,
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsFixing(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const totalSteps = results.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <CardTitle>CofounderAI Assistant Synchronization</CardTitle>
          </div>
          <CardDescription>
            Sync the OpenAI Assistant with the latest AI function definitions to enable business name changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Fix Button */}
          <div className="flex justify-center">
            <Button 
              onClick={syncAssistantWithAIFunctions}
              disabled={isFixing}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isFixing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing Assistant...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Sync CofounderAI Assistant
                </>
              )}
            </Button>
          </div>

          {/* Progress */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Synchronization Progress</h3>
                <Badge variant={isComplete ? (successCount === totalSteps ? "default" : "destructive") : "secondary"}>
                  {successCount}/{totalSteps} Steps Complete
                </Badge>
              </div>

              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{result.step}</div>
                      <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {result.message}
                      </div>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">View Details</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Status */}
          {isComplete && (
            <Alert className={successCount === totalSteps ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>
                {successCount === totalSteps ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800">Synchronization Complete!</span>
                    <span className="text-green-700">The AI should now be able to change business names properly.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-800">Synchronization Issues Detected</span>
                    <span className="text-red-700">Some steps failed. Please check the results above.</span>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">What This Synchronization Does:</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Updates the OpenAI Assistant with the latest AI function definitions</li>
              <li>• Ensures the update_business_info function is properly configured</li>
              <li>• Tests business update functionality end-to-end</li>
              <li>• Verifies the AI can properly change business names, descriptions, and other info</li>
              <li>• Synchronizes hardcoded function definitions with dynamic AI functions</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">After Synchronization:</h3>
            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• Try asking the AI to change your business name: "Change my business name to NewCorp"</li>
              <li>• The AI should immediately use the update_business_info function</li>
              <li>• You should see confirmation that the business name was updated</li>
              <li>• The change should be reflected in your business context immediately</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}