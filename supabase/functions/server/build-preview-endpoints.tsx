/**
 * Build Preview Endpoints for Cofounder Make
 * 
 * Generates preview HTML for React applications pulled from GitHub
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Health check endpoint
app.get('/make-server-373d8b09/build-preview/health', async (c) => {
  console.log('🏗️ Build Preview health check');
  return c.json({ 
    status: 'ok', 
    service: 'build-preview',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /make-server-373d8b09/build-preview/generate
 * 
 * Generate a preview build from GitHub repository files
 */
app.post('/make-server-373d8b09/build-preview/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { files, repository, selectedAppPath, supabaseProjectId, supabaseAnonKey } = body;

    console.log('🏗️ Build Preview: Starting build...');
    console.log('📦 Files received:', files?.length || 0);
    console.log('📂 Repository:', repository?.name);
    console.log('🎯 Selected App Path:', selectedAppPath);

    // Validate input
    if (!files || !Array.isArray(files) || files.length === 0) {
      return c.json({
        success: false,
        error: 'No files provided',
        message: 'Please pull files from GitHub first'
      }, 400);
    }

    // Find App.tsx or main entry file
    let appFile = null;
    let appPath = selectedAppPath;

    if (appPath) {
      // User selected a specific path
      appFile = files.find(f => f.path === appPath);
      console.log('✅ Using user-selected App path:', appPath);
    } else {
      // Auto-detect App.tsx
      const possiblePaths = [
        'src/App.tsx',
        'App.tsx',
        'src/app.tsx',
        'app.tsx',
        'src/components/App.tsx',
        'components/App.tsx'
      ];

      for (const path of possiblePaths) {
        const file = files.find(f => f.path === path);
        if (file) {
          appFile = file;
          appPath = path;
          console.log('✅ Found App.tsx at:', path);
          break;
        }
      }
    }

    // If still not found, look for any .tsx file with "App" in the name
    if (!appFile) {
      const appFiles = files.filter(f => 
        f.path?.toLowerCase().includes('app') && 
        f.path?.endsWith('.tsx')
      );
      
      if (appFiles.length === 1) {
        appFile = appFiles[0];
        appPath = appFile.path;
        console.log('✅ Found single App file:', appPath);
      } else if (appFiles.length > 1) {
        // Multiple App files found - ask user to select
        console.log('⚠️ Multiple App files found:', appFiles.map(f => f.path));
        return c.json({
          success: false,
          needsUserSelection: true,
          availableAppFiles: appFiles.map(f => f.path),
          message: 'Multiple App files found. Please select one.'
        });
      }
    }

    if (!appFile) {
      // No App.tsx found - show all .tsx files for user to select
      const tsxFiles = files.filter(f => f.path?.endsWith('.tsx'));
      console.log('❌ No App.tsx found. Available .tsx files:', tsxFiles.map(f => f.path));
      
      return c.json({
        success: false,
        needsUserSelection: true,
        availableTsxFiles: tsxFiles.map(f => f.path),
        message: 'Could not find App.tsx. Please select your main component file.'
      });
    }

    console.log('🎨 Building preview HTML...');
    console.log('📁 Using file:', appPath);

    // Build file map for module resolution
    const fileMap = {};
    for (const file of files) {
      if (file.path && file.content) {
        fileMap[file.path] = file.content;
      }
    }

    // Generate preview HTML that actually renders the app
    const previewHtml = generateReactPreviewHTML(fileMap, appPath, repository, supabaseProjectId, supabaseAnonKey);

    console.log('✅ Preview HTML generated');

    return c.json({
      success: true,
      html: previewHtml,
      detectedAppPath: appPath,
      fileCount: files.length,
      message: 'Preview built successfully'
    });

  } catch (error) {
    console.error('❌ Build Preview Error:', error);
    return c.json({
      success: false,
      error: (error as Error).message || 'Unknown error',
      message: 'Failed to build preview'
    }, 500);
  }
});

/**
 * Generate preview HTML that actually renders the React app
 */
function generateReactPreviewHTML(fileMap: any, appPath: string, repository: any, supabaseProjectId: string, supabaseAnonKey: string): string {
  // Serialize file map for injection
  const fileMapJson = JSON.stringify(fileMap);
  const supabaseConfig = JSON.stringify({
    projectId: supabaseProjectId,
    anonKey: supabaseAnonKey
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${repository?.name || 'App'} - Live Preview</title>
  
  <!-- React, ReactDOM, and Babel -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-router-dom@6/dist/umd/react-router-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  
  <style>
    :root {
      --background: #ffffff;
      --foreground: #030213;
      --card: #ffffff;
      --card-foreground: #030213;
      --muted: #ececf0;
      --muted-foreground: #717182;
      --primary: #030213;
      --primary-foreground: #ffffff;
      --border: rgba(0, 0, 0, 0.1);
      --radius: 0.625rem;
      --spacing-1: 0.25rem;
      --spacing-2: 0.5rem;
      --spacing-3: 0.75rem;
      --spacing-4: 1rem;
      --spacing-6: 1.5rem;
      --spacing-8: 2rem;
      --font-weight-semibold: 600;
      --font-weight-bold: 700;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: var(--background);
      color: var(--foreground);
      margin: 0;
      padding: 0;
    }
    
    #root {
      width: 100%;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    // Inject file map and config
    window.__FILE_MAP__ = ${fileMapJson};
    window.__APP_PATH__ = ${JSON.stringify(appPath)};
    window.__SUPABASE_CONFIG__ = ${supabaseConfig};
  </script>

  <script type="text/babel" data-type="module">
    const { useState, useEffect, createContext, useContext } = React;
    const { BrowserRouter, Routes, Route, useNavigate, useLocation } = window.ReactRouterDOM;

    // Simple module loader
    const modules = {};
    const fileMap = window.__FILE_MAP__;
    const appPath = window.__APP_PATH__;

    // Mock imports for common packages
    const mockModules = {
      'react': React,
      'react-dom': ReactDOM,
      'react-router-dom': window.ReactRouterDOM,
      'lucide-react': window.lucide,
    };

    // Resolve import path
    function resolvePath(from, to) {
      if (to.startsWith('./') || to.startsWith('../')) {
        const fromDir = from.split('/').slice(0, -1);
        const toParts = to.split('/');
        
        for (const part of toParts) {
          if (part === '..') fromDir.pop();
          else if (part !== '.') fromDir.push(part);
        }
        
        let resolved = fromDir.join('/');
        
        // Try adding extensions
        if (fileMap[resolved]) return resolved;
        if (fileMap[resolved + '.tsx']) return resolved + '.tsx';
        if (fileMap[resolved + '.ts']) return resolved + '.ts';
        if (fileMap[resolved + '.jsx']) return resolved + '.jsx';
        if (fileMap[resolved + '.js']) return resolved + '.js';
        if (fileMap[resolved + '/index.tsx']) return resolved + '/index.tsx';
        if (fileMap[resolved + '/index.ts']) return resolved + '/index.ts';
        
        return resolved;
      }
      return to;
    }

    // Load module
    function requireModule(path, fromPath = '') {
      const resolved = fromPath ? resolvePath(fromPath, path) : path;
      
      // Check mock modules first
      if (mockModules[resolved] || mockModules[path]) {
        return mockModules[resolved] || mockModules[path];
      }
      
      // Check if already loaded
      if (modules[resolved]) {
        return modules[resolved];
      }
      
      // Get file content
      const content = fileMap[resolved];
      if (!content) {
        console.warn('Module not found:', resolved, 'from', fromPath);
        return {}; // Return empty object instead of failing
      }
      
      // Create module exports object
      const moduleExports = {};
      modules[resolved] = moduleExports;
      
      try {
        // Very basic transformation - just extract the default export
        // This is a simplified approach that works for basic components
        const transformed = content
          .replace(/import\\s+.*?from\\s+['"].*?['"];?/g, '') // Remove imports
          .replace(/export\\s+default\\s+/, 'return '); // Convert export default to return
        
        const fn = new Function('require', 'exports', 'React', 'useState', 'useEffect', 'useContext', 'createContext', transformed);
        const result = fn(
          (p) => requireModule(p, resolved),
          moduleExports,
          React,
          useState,
          useEffect,
          useContext,
          createContext
        );
        
        if (result) {
          moduleExports.default = result;
        }
      } catch (err) {
        console.error('Error loading module:', resolved, err);
      }
      
      return moduleExports;
    }

    // Load and render the app
    try {
      const AppModule = requireModule(appPath);
      const App = AppModule.default || AppModule;
      
      if (typeof App === 'function') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
      } else {
        throw new Error('App export is not a valid React component');
      }
    } catch (error) {
      console.error('Failed to render app:', error);
      document.getElementById('root').innerHTML = \`
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background: var(--background);">
          <div style="background: var(--card); border: 2px solid #d4183d; border-radius: var(--radius); padding: 40px; max-width: 600px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h1 style="color: #d4183d; font-size: 24px; font-weight: 700; margin-bottom: 12px;">Preview Error</h1>
            <p style="color: var(--muted-foreground); font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
              \${error.message || 'Failed to render preview'}
            </p>
            <pre style="background: var(--muted); padding: 12px; border-radius: 8px; text-align: left; font-size: 12px; overflow-x: auto;">
              \${error.stack || ''}
            </pre>
          </div>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
}

export { app as buildPreviewApp };
