// Production server entry point
// Updated: 2026-04-21 20:26 UTC - Added inline route handlers
import app from '../server/index.tsx';

console.log('🚀 make-server-373d8b09 starting at', new Date().toISOString());

Deno.serve(app.fetch);
