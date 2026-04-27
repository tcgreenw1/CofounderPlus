/**
 * Clipboard Utility with Fallback
 * 
 * Handles copying text to clipboard with fallback for when Clipboard API is blocked
 * (e.g., in iframes or certain browser contexts)
 */

/**
 * Copy text to clipboard with fallback methods
 * 
 * @param text - Text to copy to clipboard
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Method 1: Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback method:', err);
      // Fall through to fallback method
    }
  }

  // Method 2: Fallback to execCommand (deprecated but more widely supported)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible but not display:none (which prevents copying)
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    
    // Select the text
    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
      // iOS requires special handling
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, text.length);
    } else {
      textArea.select();
    }
    
    // Execute copy command
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    } else {
      throw new Error('execCommand copy failed');
    }
  } catch (err) {
    console.error('All clipboard methods failed:', err);
    return false;
  }
}

/**
 * Copy text to clipboard and throw error if it fails
 * Use this when you want to handle errors explicitly
 */
export async function copyToClipboardOrThrow(text: string): Promise<void> {
  const success = await copyToClipboard(text);
  if (!success) {
    throw new Error('Failed to copy to clipboard');
  }
}
