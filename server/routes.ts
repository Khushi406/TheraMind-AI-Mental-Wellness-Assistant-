import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerRoutes(app: Express): Promise<Server> {
  // Flask backend service should be started manually
  // Uncomment and modify the following lines if you want automatic Flask startup:
  /*
  const flaskProcess = spawn("python3", [path.join(__dirname, "flask_app.py")]);
  
  // Log Flask output (useful for debugging)
  flaskProcess.stdout.on('data', (data) => {
    console.log(`Flask stdout: ${data}`);
  });
  
  flaskProcess.stderr.on('data', (data) => {
    console.error(`Flask stderr: ${data}`);
  });
  
  flaskProcess.on('close', (code) => {
    console.log(`Flask process exited with code ${code}`);
  });
  */
  
  // Create proxy routes to forward requests to Flask backend
  app.all('/api/*', async (req, res) => {
    try {
      // Determine the target URL (Flask backend)
      const targetUrl = `http://localhost:8000${req.url}`;
      
      // Create headers for the request
      const headers: HeadersInit = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (value && !['host', 'connection'].includes(key.toLowerCase())) {
          headers[key] = value as string;
        }
      }
      
      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };
      
      // Add body for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method!)) {
        fetchOptions.body = JSON.stringify(req.body);
      }
      
      // Forward the request to Flask
      const response = await fetch(targetUrl, fetchOptions);
      
      // Copy status and headers from Flask response
      res.status(response.status);
      
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }
      
      // Get response body as text or JSON
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (error) {
      console.error('Error proxying request to Flask:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  // Cleanup handlers for automatic Flask process (currently disabled)
  /*
  process.on('exit', () => {
    flaskProcess.kill();
  });
  
  process.on('SIGINT', () => {
    flaskProcess.kill();
    process.exit();
  });
  
  process.on('SIGTERM', () => {
    flaskProcess.kill();
    process.exit();
  });
  */

  return httpServer;
}
