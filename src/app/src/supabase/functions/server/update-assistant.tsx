import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}));

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const ASSISTANT_ID = 'asst_Wfoh17ScM2gQ2i83sMQn7Z4o';

app.post('/make-server-373d8b09/update-assistant', async (c) => {
  try {
    console.log('🤖 Updating OpenAI Assistant with business update function...');
    
    if (!OPENAI_API_KEY) {
      return c.json({ success: false, error: 'OpenAI API key not found' }, 500);
    }
    
    // First, get the current assistant configuration
    const getResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      }
    });
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('Failed to get assistant:', errorText);
      return c.json({ success: false, error: `Failed to get assistant: ${getResponse.status}` }, 500);
    }
    
    const assistant = await getResponse.json();
    console.log('🤖 Current assistant tools:', assistant.tools?.length || 0);
    
    // Create the new business update function definition
    const businessUpdateFunction = {
      type: "function",
      function: {
        name: "update_business_info",
        description: "Update business information including name, description, industry, or stage when the user requests changes to their business details",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "New business name to update to"
            },
            description: {
              type: "string", 
              description: "New business description to update to"
            },
            industry: {
              type: "string",
              description: "New business industry to update to"
            },
            stage: {
              type: "string",
              description: "New business stage to update to (e.g., 'idea', 'startup', 'growth', 'mature')"
            }
          },
          required: []
        }
      }
    };
    
    // Check if the function already exists
    const existingTools = assistant.tools || [];
    const functionExists = existingTools.some(tool => 
      tool.type === 'function' && tool.function?.name === 'update_business_info'
    );
    
    if (functionExists) {
      console.log('🤖 Business update function already exists in assistant');
      return c.json({ 
        success: true, 
        message: 'Function already exists',
        toolCount: existingTools.length
      });
    }
    
    // Add the new function to existing tools
    const updatedTools = [...existingTools, businessUpdateFunction];
    
    // Update the assistant
    const updateResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        tools: updatedTools
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update assistant:', errorText);
      return c.json({ success: false, error: `Failed to update assistant: ${updateResponse.status}` }, 500);
    }
    
    const updatedAssistant = await updateResponse.json();
    console.log('🤖 Assistant updated successfully!');
    console.log('🤖 New tool count:', updatedAssistant.tools?.length || 0);
    
    return c.json({ 
      success: true, 
      message: 'Assistant updated with business update function',
      toolCount: updatedAssistant.tools?.length || 0,
      addedFunction: 'update_business_info'
    });
    
  } catch (error) {
    console.error('🤖 Error updating assistant:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;