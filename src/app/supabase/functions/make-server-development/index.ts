// DEVELOPMENT SERVER ENTRY POINT
// This server is used for development and testing
// AI modifications target the shared /server/ directory
// Import and serve the main server app
import app from '../server/index.tsx';

Deno.serve(app.fetch);
