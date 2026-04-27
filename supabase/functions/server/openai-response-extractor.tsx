/**
 * OPENAI RESPONSE EXTRACTOR UTILITY
 * 
 * Unified logic for extracting text content from GPT-5.1 Responses API
 * This ensures all chat endpoints extract responses correctly
 */

/**
 * Extracts the text response from OpenAI GPT-5.1 Responses API
 * 
 * The Responses API can return data in various formats:
 * - data.text (direct text field)
 * - data.output_text (output text field)
 * - data.output[0].content (string or object)
 * - data.output[0].content[].text (array of content blocks)
 * 
 * @param data - The JSON response from OpenAI Responses API
 * @param fallback - Fallback text if extraction fails (default: "Sorry, I could not process your request.")
 * @returns Extracted text content
 */
export function extractOpenAIResponse(data: any, fallback = "Sorry, I could not process your request."): string {
  // Check for direct text field
  if (data.text && typeof data.text === 'string') {
    return data.text;
  }
  
  // Check for output_text field
  if (data.output_text && typeof data.output_text === 'string') {
    return data.output_text;
  }
  
  // Check for output array format
  if (data.output && Array.isArray(data.output) && data.output.length > 0) {
    const firstOutput = data.output[0];
    
    // Output is a string
    if (typeof firstOutput === 'string') {
      return firstOutput;
    }
    
    // Output is an object
    if (firstOutput && typeof firstOutput === 'object') {
      // Check for content field as string
      if (typeof firstOutput.content === 'string') {
        return firstOutput.content;
      }
      
      // Check for content as array of content blocks
      if (Array.isArray(firstOutput.content)) {
        const textBlock = firstOutput.content.find((block: any) => block.type === 'text');
        if (textBlock && textBlock.text) {
          return textBlock.text;
        }
      }
      
      // Check for direct text field in output object
      if (firstOutput.text && typeof firstOutput.text === 'string') {
        return firstOutput.text;
      }
    }
  }
  
  // Return fallback if nothing found
  return fallback;
}
