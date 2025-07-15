import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import fetch, { HeadersInit, RequestInit } from "node-fetch";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the Flask backend service
  const flaskProcess = spawn(
    "C:/Users/khush/Downloads/TheraMindhack/TheraMindWellness/server/venv/Scripts/python.exe",
    [path.join(__dirname, "flask_app.py")],
    { cwd: __dirname, shell: true, env: process.env }
  );
  
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
  
  // Proxy requests to Flask backend
  app.all('/api/*', async (req, res) => {
    try {
      const targetUrl = `http://localhost:8000${req.url}`;
      const headers: HeadersInit = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (value && !['host', 'connection'].includes(key.toLowerCase())) {
          headers[key] = value as string;
        }
      }
      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };
      if (['POST', 'PUT', 'PATCH'].includes(req.method!)) {
        fetchOptions.body = JSON.stringify(req.body);
        headers['Content-Type'] = 'application/json';
      }
      const response = await fetch(targetUrl, fetchOptions);
      res.status(response.status);
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }
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

  // Cleanup function to kill Flask process when the Express server exits
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

  return httpServer;
}
