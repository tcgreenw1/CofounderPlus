/**
 * Enhanced Build Preview Function with Auto-Fix
 */

import { toast } from 'sonner@2.0.3';

export interface BuildPreviewParams {
  codeFiles: any[];
  selectedRepo: any;
  userId: string | null;
  projectId: string;
  publicAnonKey: string;
  setIsBuilding: (building: boolean) => void;
  setBuildStatus: (status: any) => void;
  setPreviewHtml: (html: string) => void;
  setLastBuildError: (error: string | null) => void;
  autoFixEnabled: boolean;
  isAutoFixing: boolean;
  triggerAutoFix: (error: string, filePath: string, fileContent?: string) => void;
}

export async function buildPreview(params: BuildPreviewParams) {
  const {
    codeFiles,
    selectedRepo,
    userId,
    projectId,
    publicAnonKey,
    setIsBuilding,
    setBuildStatus,
    setPreviewHtml,
    setLastBuildError,
    autoFixEnabled,
    isAutoFixing,
    triggerAutoFix
  } = params;

  if (codeFiles.length === 0 || !selectedRepo || !userId) {
    toast.error('No files to preview. Pull from GitHub first.');
    return;
  }

  setIsBuilding(true);
  setBuildStatus({ status: 'building', message: 'Building preview...' });

  try {
    const owner = selectedRepo.fullName.split('/')[0];
    const repo = selectedRepo.fullName.split('/')[1];

    const appFile = codeFiles.find((f: any) => 
      f.name === 'App.tsx' || f.path === 'src/App.tsx' || f.path === 'App.tsx'
    );

    if (!appFile) {
      const errorMsg = 'Could not find App.tsx entry point in the repository';
      toast.error(errorMsg);
      setBuildStatus({ status: 'error', message: 'No App.tsx found' });
      setLastBuildError(errorMsg);
      setIsBuilding(false);
      
      // Trigger auto-fix
      if (autoFixEnabled && !isAutoFixing) {
        triggerAutoFix(errorMsg, 'App.tsx');
      }
      return;
    }

    const appResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/repos/${owner}/${repo}/contents?userId=${userId}&path=${appFile.path}&ref=${selectedRepo.defaultBranch}`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );

    const appData = await appResponse.json();
    
    if (!appData.success || !appData.contents.content) {
      throw new Error('Failed to fetch App.tsx content');
    }

    const appCode = atob(appData.contents.content);

    // Enhanced preview HTML with better error capture
    const previewHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    #root { width: 100%; min-height: 100vh; }
    .error-container {
      padding: 2rem;
      background: #fee;
      color: #c33;
      font-family: monospace;
      white-space: pre-wrap;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    // Capture all errors
    window.addEventListener('error', function(e) {
      const errorDetails = {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error?.stack || e.error?.toString() || 'Unknown error'
      };
      
      document.getElementById('root').innerHTML = 
        '<div class="error-container">' +
        '<strong>⚠️ Runtime Error:</strong><br/><br/>' +
        '<strong>Message:</strong> ' + errorDetails.message + '<br/><br/>' +
        '<strong>Stack:</strong><br/>' + errorDetails.error +
        '</div>';
      
      // Send error to parent
      window.parent.postMessage({
        type: 'PREVIEW_ERROR',
        error: errorDetails
      }, '*');
    });

    try {
      const { useState, useEffect } = React;
      
      // Basic component stubs
      const Button = ({ children, className, ...props }) => 
        <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer' }} className={className} {...props}>{children}</button>;
      const Input = ({ className, ...props }) => 
        <input style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px' }} className={className} {...props} />;
      const Card = ({ children, className, ...props }) => 
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} className={className} {...props}>{children}</div>;
      
      ${appCode.replace(/import\s+.*?from\s+['"'].*?['"'];?\s*/g, '').replace(/export\s+default\s+/g, 'const App = ')}
      
      const root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(React.createElement(App, null));
      
      // Notify parent of success
      window.parent.postMessage({
        type: 'PREVIEW_SUCCESS'
      }, '*');
      
    } catch (error) {
      const errorMessage = error.message || error.toString();
      const errorStack = error.stack || 'No stack trace available';
      
      document.getElementById('root').innerHTML = 
        '<div class="error-container">' +
        '<strong>⚠️ Build Error:</strong><br/><br/>' +
        '<strong>Message:</strong> ' + errorMessage + '<br/><br/>' +
        '<strong>Stack:</strong><br/>' + errorStack +
        '</div>';
      
      // Send error to parent
      window.parent.postMessage({
        type: 'PREVIEW_ERROR',
        error: {
          message: errorMessage,
          stack: errorStack,
          file: '${appFile.path}'
        }
      }, '*');
    }
  </script>
</body>
</html>`;

    setPreviewHtml(previewHTML);
    setLastBuildError(null); // Clear previous errors
    setBuildStatus({ 
      status: 'deployed', 
      message: 'Preview ready',
      timestamp: new Date().toISOString(),
      url: 'preview'
    });
    
    toast.success('Preview built successfully!');
  } catch (error: any) {
    const errorMsg = error.message || 'Failed to build preview';
    console.error('Error building preview:', error);
    toast.error(errorMsg);
    setBuildStatus({ status: 'error', message: 'Build failed' });
    setLastBuildError(errorMsg);
    
    // Trigger auto-fix
    if (autoFixEnabled && !isAutoFixing) {
      const appFile = codeFiles.find((f: any) => 
        f.name === 'App.tsx' || f.path === 'src/App.tsx' || f.path === 'App.tsx'
      );
      triggerAutoFix(errorMsg, appFile?.path || 'Unknown file');
    }
  } finally {
    setIsBuilding(false);
  }
}
