// Import and serve the main server app
import app from '../server/index.tsx';

Deno.serve(app.fetch);
