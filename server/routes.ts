import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

// HF models
const EMOTION_MODEL = "bhadresh-savani/distilbert-base-uncased-emotion";
const TEXT_GEN_MODEL = "google/flan-t5-large";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const FLASK_URL = process.env.FLASK_URL || "";

async function hfPost(model: string, payload: any) {
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}` as any, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_API_KEY ? { Authorization: `Bearer ${HF_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
    } as any);
    
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // ignore parse errors
    }
    
    return { ok: res.ok, status: res.status, data: json };
  } catch (error) {
    console.error('HF API Request failed:', error);
    return { ok: false, status: 500, data: null };
  }
}

function extractThemesFromContent(content: string): string[] {
  const themes: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    work: ["job", "career", "boss", "office", "colleague", "meeting", "project", "deadline", "work"],
    relationships: ["friend", "partner", "family", "relationship", "date", "love", "marriage", "boyfriend", "girlfriend", "husband", "wife"],
    health: ["health", "sick", "doctor", "pain", "exercise", "workout", "diet", "sleep", "tired", "energy"],
    stress: ["stress", "anxiety", "worry", "overwhelm", "pressure", "burnout", "tension"],
    achievement: ["success", "achieve", "goal", "accomplish", "proud", "progress", "milestone"],
    creativity: ["creative", "art", "music", "write", "paint", "play", "hobby", "create"],
    finance: ["money", "finance", "budget", "cost", "afford", "expense", "saving", "debt", "pay"],
    growth: ["learn", "grow", "improve", "develop", "change", "better", "progress"],
    gratitude: ["grateful", "thankful", "appreciate", "blessed", "fortunate", "lucky"],
  };
  const lc = content.toLowerCase();
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((k) => lc.includes(k))) themes.push(topic);
  }
  return themes;
}

function defaultEmotions() {
  return [
    { label: "neutral", score: 0.5 },
    { label: "contemplative", score: 0.3 },
    { label: "hopeful", score: 0.2 }
  ];
}

function defaultReflection(primary: string) {
  return `I hear that you're experiencing ${primary}. It's valid to feel this way. Try to notice what
might be underneath this feeling and offer yourself some kindness. What small thing could support you right now?`;
}

function getDefaultPrompt(type: string) {
  const prompts: Record<string, string[]> = {
    general: [
      "What made you feel grateful today, and how did those moments affect your overall mood?",
      "Describe a challenging emotion you experienced recently. What triggered it, and how did you cope?",
    ],
    gratitude: [
      "List three unexpected moments of joy you experienced today. What made them special?",
    ],
    growth: [
      "What emotion has been most challenging for you to process lately? How might accepting this emotion help you grow?",
    ],
    reflection: [
      "When you felt frustrated or angry recently, what need wasn't being met? How might you address this next time?",
    ],
    relationships: [
      "How do you show care to the important people in your life? How do they show care to you?",
    ],
    stress: [
      "What helps you feel grounded when stress builds up? Describe a moment you felt calmer and why.",
    ],
    health: [
      "How has your body been feeling lately? What gentle changes could support your well-being?",
    ],
    creativity: [
      "What creative outlet energizes you? How can you make space for it this week?",
    ],
  };
  const list = prompts[type] ?? prompts.general;
  return list[Math.floor(Math.random() * list.length)];
}

function getDefaultAffirmation(type: string) {
  const affirmations: Record<string, string[]> = {
    general: [
      "I meet myself with patience and compassion.",
      "Each day, I grow a little stronger and wiser.",
    ],
    joy: ["I allow myself to savor moments of joy."],
    sadness: ["All feelings pass; I am gentle with myself today."],
    anxiety: ["I breathe deeply; calm grows within me."],
    anger: ["I honor my boundaries and respond with care."],
    health: ["I listen to my body and support its needs."],
    relationships: ["I nurture connections that uplift me."],
    growth: ["I’m becoming who I want to be, one step at a time."],
  };
  const list = affirmations[type] ?? affirmations.general;
  return list[Math.floor(Math.random() * list.length)];
}

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
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // Journal entries endpoints
  app.get('/api/journal-entries', async (req, res) => {
    try {
      const entries = await storage.getAllJournalEntries();
      res.json(entries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({ message: 'Failed to fetch journal entries' });
    }
  });

  app.post('/api/journal-entries', async (req, res) => {
    try {
      const { content, emotions = {} } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }

      const newEntry = await storage.saveJournalEntry({
        content,
        emotions,
        reflection: null,
        user_id: null // For now, no user authentication
      });

      res.status(201).json(newEntry);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      res.status(500).json({ message: 'Failed to save journal entry' });
    }
  });

  // Analyze entry (emotion + reflection) and persist
  app.post('/api/analyze', async (req, res) => {
    try {
      // If a Flask service is configured, proxy to it
      if (FLASK_URL) {
        try {
          const flaskUrl = FLASK_URL.startsWith('http') ? FLASK_URL : `https://${FLASK_URL}`;
          const response = await fetch(`${flaskUrl}/api/analyze` as any, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
          } as any);
          if (response.ok) {
            const data = await response.json();
            return res.status(response.status).json(data);
          }
          throw new Error(`Flask responded with ${response.status}`);
        } catch (proxyErr: any) {
          console.log('Flask proxy error (/api/analyze), using local fallback:', proxyErr?.message || proxyErr);
          // fall through to local implementation
        }
      }

      const { content } = req.body as { content?: string };
      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Missing content in request' });
      }

      // 1) Emotions via HF
      let emotions: Array<{ label: string; score: number }> = [];
      try {
        const r = await hfPost(EMOTION_MODEL, { inputs: content });
        if (r.ok && r.data) {
          const d = r.data;
          if (Array.isArray(d) && d.length > 0) {
            if (Array.isArray(d[0])) {
              emotions = d[0];
            } else if (d[0] && typeof d[0] === 'object' && 'label' in d[0]) {
              emotions = d as any;
            }
          }
        }
      } catch (error) {
        console.error('Error calling HF emotion API:', error);
      }
      
      if (!emotions || emotions.length === 0 || !Array.isArray(emotions)) {
        emotions = defaultEmotions();
      }
      emotions.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      // 2) Reflection via HF
      const top = emotions.slice(0, Math.min(3, emotions.length));
      const emotionText = top.map((e) => `${e.label} (${Math.round((e.score ?? 0) * 100)}%)`).join(', ');
      const themes = extractThemesFromContent(content);
      const topicText = themes.length ? themes.join(', ') : 'no specific topics';
      const reflectionPrompt = `Based on a journal entry, I detected these emotions: ${emotionText}. The entry discusses: ${topicText}. Entry excerpt: ${content.slice(0, 150)}...\n\nGenerate a short, warm, supportive reflection (3-4 sentences) that:\n1) Acknowledges their feelings empathetically\n2) Offers a helpful perspective\n3) Ends with a gentle question or suggestion.`;

      let reflection = '';
      try {
        const r = await hfPost(TEXT_GEN_MODEL, {
          inputs: reflectionPrompt,
          parameters: { max_length: 200, temperature: 0.7, top_p: 0.95, do_sample: true },
        });
        const d = r.data;
        if (Array.isArray(d) && d[0] && d[0].generated_text) reflection = d[0].generated_text.trim();
        else if (d && d.generated_text) reflection = d.generated_text.trim();
      } catch {}
      if (!reflection) reflection = defaultReflection(top[0]?.label ?? 'neutral');

      // 3) Persist entry
      const saved = await storage.saveJournalEntry({ content, emotions, reflection, user_id: null });

      // 4) Respond similar to Flask shape
      return res.json({ id: saved.id, emotions, reflection, timestamp: saved.timestamp });
    } catch (err) {
      console.error('Error analyzing entry:', err);
      return res.status(500).json({ message: 'Error analyzing entry' });
    }
  });

  // Prompt + affirmation
  app.get('/api/prompt', async (_req, res) => {
    try {
      // If a Flask service is configured, proxy to it
      if (FLASK_URL) {
        try {
          const flaskUrl = FLASK_URL.startsWith('http') ? FLASK_URL : `https://${FLASK_URL}`;
          const response = await fetch(`${flaskUrl}/api/prompt` as any);
          if (response.ok) {
            const data = await response.json();
            return res.status(response.status).json(data);
          }
          throw new Error(`Flask responded with ${response.status}`);
        } catch (proxyErr: any) {
          console.log('Flask proxy error (/api/prompt), using local fallback:', proxyErr?.message || proxyErr);
          // fall through to local implementation
        }
      }

      const entries = await storage.getAllJournalEntries();
      const recent = entries[0];
      const recentEmotions = recent?.emotions as Array<{ label: string; score: number }> | undefined;
      const recentThemes = recent?.content ? extractThemesFromContent(recent.content) : undefined;

      // Decide prompt type
      let type = 'general';
      if (recentEmotions && recentEmotions.length) {
        if (recentEmotions.some((e) => ['joy', 'happiness'].includes(e.label.toLowerCase()) && e.score > 0.5)) type = 'gratitude';
        else if (recentEmotions.some((e) => ['sadness', 'fear'].includes(e.label.toLowerCase()) && e.score > 0.5)) type = 'growth';
        else if (recentEmotions.some((e) => ['anger', 'disgust'].includes(e.label.toLowerCase()) && e.score > 0.5)) type = 'reflection';
      }
      if (recentThemes && recentThemes.length) {
        if (recentThemes.includes('relationships')) type = 'relationships';
        else if (recentThemes.includes('work') || recentThemes.includes('stress')) type = 'stress';
        else if (recentThemes.includes('health')) type = 'health';
        else if (recentThemes.includes('creativity')) type = 'creativity';
      }

      // Try HF for nicer prompt/affirmation; fall back to defaults
      let prompt = '';
      try {
        const r = await hfPost(TEXT_GEN_MODEL, {
          inputs: `Generate a concise journaling prompt about ${type} that encourages emotional reflection:`,
          parameters: { max_length: 100, temperature: 0.7, top_p: 0.95, do_sample: true },
        });
        const d = r.data;
        if (Array.isArray(d) && d[0]?.generated_text) prompt = d[0].generated_text.trim();
        else if (d?.generated_text) prompt = d.generated_text.trim();
      } catch {}
      if (!prompt) prompt = getDefaultPrompt(type);

      let affirmation = '';
      try {
        const r = await hfPost(TEXT_GEN_MODEL, {
          inputs: `Generate a short, positive daily affirmation focused on ${type}:`,
          parameters: { max_length: 50, temperature: 0.7, top_p: 0.95, do_sample: true },
        });
        const d = r.data;
        if (Array.isArray(d) && d[0]?.generated_text) affirmation = d[0].generated_text.trim();
        else if (d?.generated_text) affirmation = d.generated_text.trim();
      } catch {}
      if (!affirmation) {
        const affType = ['stress', 'health', 'relationships', 'growth', 'gratitude'].includes(type) ? type : 'general';
        affirmation = getDefaultAffirmation(affType);
      }

      return res.json({ prompt, affirmation });
    } catch (err) {
      console.error('Error generating prompt:', err);
      return res.status(500).json({ message: 'Error generating prompt' });
    }
  });

  // History
  app.get('/api/history', async (_req, res) => {
    try {
      // If a Flask service is configured, proxy to it
      if (FLASK_URL) {
        try {
          const flaskUrl = FLASK_URL.startsWith('http') ? FLASK_URL : `https://${FLASK_URL}`;
          const response = await fetch(`${flaskUrl}/api/history` as any);
          if (response.ok) {
            const data = await response.json();
            return res.status(response.status).json(data);
          }
          throw new Error(`Flask responded with ${response.status}`);
        } catch (proxyErr: any) {
          console.log('Flask proxy error (/api/history), using local fallback:', proxyErr?.message || proxyErr);
          // fall through to local implementation
        }
      }

      const entries = await storage.getAllJournalEntries();
      return res.json({ entries });
    } catch (err) {
      console.error('Error retrieving history:', err);
      return res.status(500).json({ message: 'Error retrieving history' });
    }
  });

  // Create proxy routes to forward requests to Flask backend (disabled for now)
  /*
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
  */

  // HTTP server instance
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
