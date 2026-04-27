/**
 * Chat Memory Helpers
 * Unified memory system - allows chat to reference content from any department
 */

import * as kv from './kv_store.tsx';

/**
 * Load marketing content studio data for chat context
 * Part of the unified memory system where any chat can reference memory from another department
 */
export async function loadMarketingMemory(businessId: string): Promise<string> {
  try {
    const contentPrefix = `marketing:content:${businessId}:`;
    const contentItems = await kv.getByPrefix(contentPrefix);
    
    if (!contentItems || contentItems.length === 0) {
      return '';
    }
    
    // Sort by timestamp and get the most recent 10 items
    const recentContent = contentItems
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    // Build context summary
    const contentSummary = recentContent.map((item: any) => {
      const type = item.contentType || 'unknown';
      const topic = item.topic || 'untitled';
      const timestamp = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'unknown date';
      return `- ${type.toUpperCase()}: "${topic}" (${timestamp})`;
    }).join('\n');
    
    return `\n\nCONTENT STUDIO MEMORY (Recent Marketing Content):\nThe user has created the following marketing content in the Content Studio:\n${contentSummary}\n\nYou can reference this content when answering questions about their marketing materials, campaigns, or content strategy.`;
    
  } catch (error) {
    console.error('Failed to load marketing memory for chat:', error);
    return '';
  }
}

/**
 * Load all unified memories for chat context
 * Aggregates memories from all departments (Marketing, HR, Finance, etc.)
 */
export async function loadUnifiedMemory(businessId: string): Promise<string> {
  const memories: string[] = [];
  
  // Load marketing memory
  const marketingMemory = await loadMarketingMemory(businessId);
  if (marketingMemory) {
    memories.push(marketingMemory);
  }
  
  // TODO: Add other department memories as they're built
  // - HR memory (employee data, job postings, etc.)
  // - Finance memory (transactions, budgets, etc.)
  // - Operations memory (tasks, workflows, etc.)
  
  return memories.join('\n\n');
}
