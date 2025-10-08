import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { 
  analyzeEmotions, 
  generateTherapySuggestions, 
  chatWithTherapist, 
  predictMoodTrends,
  type EmotionAnalysis,
  type ChatResponse 
} from "./gemini-client";

// Legacy HF models (for fallback only)
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

  // Root health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'TheraMind Server is running', timestamp: new Date().toISOString() });
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

  // Analyze entry (emotion + reflection) and persist - Enhanced with Gemini AI
  app.post('/api/analyze', async (req, res) => {
    try {
      const { content } = req.body as { content?: string };
      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Missing content in request' });
      }

      console.log('🧠 Analyzing emotions with Gemini AI...');
      
      // Use Gemini AI for comprehensive emotion analysis
      let emotionAnalysis: EmotionAnalysis;
      let emotions: Array<{ label: string; score: number }> = [];
      
      try {
        emotionAnalysis = await analyzeEmotions(content);
        console.log('✅ Gemini analysis successful:', emotionAnalysis.primaryEmotion);
        
        // Convert Gemini format to legacy format for compatibility
        emotions = emotionAnalysis.emotions.map(e => ({
          label: e.emotion,
          score: e.confidence
        }));
        
      } catch (geminiError) {
        console.error('⚠️ Gemini analysis failed, using HF fallback:', geminiError);
        
        // Fallback to HF/Flask if Gemini fails
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
            console.log('Flask proxy error, continuing with HF fallback:', proxyErr?.message || proxyErr);
          }
        }
        
        // HF emotion detection fallback
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
        } catch (hfError) {
          console.error('HF fallback also failed:', hfError);
        }
        
        if (!emotions || emotions.length === 0) {
          emotions = defaultEmotions();
        }
        emotions.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        
        // Create basic emotion analysis for fallback
        emotionAnalysis = {
          primaryEmotion: emotions[0]?.label || 'neutral',
          emotions: emotions.slice(0, 3).map(e => ({
            emotion: e.label,
            confidence: e.score,
            intensity: e.score > 0.7 ? 'high' : e.score > 0.4 ? 'medium' : 'low'
          })),
          mood: emotions[0]?.score > 0.6 ? 'positive' : emotions[0]?.score < 0.3 ? 'negative' : 'neutral',
          triggers: [],
          themes: ['general'],
          sentiment: { score: emotions[0]?.score > 0.5 ? 0.5 : -0.5, magnitude: 0.5 },
          insights: 'Thank you for sharing your thoughts. Your feelings are valid and important.',
          suggestions: ['Take time to reflect on your feelings', 'Consider what might help you feel better']
        };
      }

      // Use Gemini's insights as reflection, or fallback to HF generation
      let reflection = emotionAnalysis.insights;
      
      if (!reflection || reflection.length < 20) {
        // Fallback to HF text generation
        const top = emotions.slice(0, Math.min(3, emotions.length));
        const emotionText = top.map((e) => `${e.label} (${Math.round((e.score ?? 0) * 100)}%)`).join(', ');
        const themes = extractThemesFromContent(content);
        const topicText = themes.length ? themes.join(', ') : 'no specific topics';
        const reflectionPrompt = `Based on a journal entry, I detected these emotions: ${emotionText}. The entry discusses: ${topicText}. Entry excerpt: ${content.slice(0, 150)}...\n\nGenerate a short, warm, supportive reflection (3-4 sentences) that:\n1) Acknowledges their feelings empathetically\n2) Offers a helpful perspective\n3) Ends with a gentle question or suggestion.`;

        try {
          const r = await hfPost(TEXT_GEN_MODEL, {
            inputs: reflectionPrompt,
            parameters: { max_length: 200, temperature: 0.7, top_p: 0.95, do_sample: true },
          });
          const d = r.data;
          if (Array.isArray(d) && d[0] && d[0].generated_text) reflection = d[0].generated_text.trim();
          else if (d && d.generated_text) reflection = d.generated_text.trim();
        } catch (hfReflectionError) {
          console.error('HF reflection generation failed:', hfReflectionError);
        }
        
        if (!reflection) reflection = defaultReflection(emotions[0]?.label ?? 'neutral');
      }

      // Persist entry with enhanced emotion data
      const saved = await storage.saveJournalEntry({ 
        content, 
        emotions, 
        reflection, 
        user_id: null
      });

      // Return enhanced response with Gemini insights
      return res.json({ 
        id: saved.id, 
        emotions, 
        reflection, 
        timestamp: saved.timestamp,
        // Enhanced data from Gemini
        analysis: {
          primaryEmotion: emotionAnalysis.primaryEmotion,
          mood: emotionAnalysis.mood,
          triggers: emotionAnalysis.triggers,
          themes: emotionAnalysis.themes,
          sentiment: emotionAnalysis.sentiment,
          suggestions: emotionAnalysis.suggestions,
          insights: emotionAnalysis.insights
        }
      });
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

  // 🤖 AI Chatbot endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, conversationHistory } = req.body as { 
        message?: string; 
        conversationHistory?: Array<{role: 'user' | 'assistant', content: string}> 
      };
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Missing message in request' });
      }

      console.log('🤖 Processing chat message with Gemini...');
      
      const chatResponse = await chatWithTherapist(message, conversationHistory || []);
      
      return res.json({
        response: chatResponse.response,
        emotionalTone: chatResponse.emotionalTone,
        supportType: chatResponse.supportType,
        followUpQuestions: chatResponse.followUpQuestions,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error in chat endpoint:', err);
      return res.status(500).json({ 
        message: 'Chat temporarily unavailable',
        response: "I'm here to listen and support you. While my AI features are temporarily unavailable, remember that your feelings matter and seeking help is a sign of strength.",
        emotionalTone: 'supportive',
        supportType: 'validation'
      });
    }
  });

  // 📊 Mood trends and predictions
  app.get('/api/mood-trends', async (_req, res) => {
    try {
      console.log('📊 Analyzing mood trends...');
      
      // Get recent journal entries (last 30 days)
      const entries = await storage.getAllJournalEntries();
      const recentEntries = entries.slice(-30); // Get last 30 entries
      
      if (recentEntries.length < 3) {
        return res.json({
          prediction: 'stable',
          confidence: 0.5,
          insights: 'Keep journaling to build better insights over time. You\'re doing great!',
          recommendations: ['Continue regular journaling', 'Track your daily mood patterns'],
          trends: {
            weekly: { improvement: 0, total: recentEntries.length },
            monthly: { improvement: 0, total: recentEntries.length }
          }
        });
      }
      
      // Convert journal entries to emotion analyses for trend prediction
      const emotionAnalyses: EmotionAnalysis[] = recentEntries.map(entry => {
        const emotions = Array.isArray(entry.emotions) ? entry.emotions : [];
        const primaryEmotion = emotions[0]?.label || 'neutral';
        
        return {
          primaryEmotion,
          emotions: emotions.slice(0, 3).map((e: any) => ({
            emotion: e.label || 'neutral',
            confidence: e.score || 0.5,
            intensity: (e.score || 0.5) > 0.7 ? 'high' : (e.score || 0.5) > 0.4 ? 'medium' : 'low'
          })),
          mood: (emotions[0]?.score || 0.5) > 0.6 ? 'positive' : (emotions[0]?.score || 0.5) < 0.3 ? 'negative' : 'neutral',
          triggers: [],
          themes: ['general'],
          sentiment: { 
            score: (emotions[0]?.score || 0.5) > 0.5 ? 0.5 : -0.5, 
            magnitude: 0.5 
          },
          insights: 'Continuing to track patterns...',
          suggestions: []
        };
      });
      
      const trendAnalysis = await predictMoodTrends(emotionAnalyses);
      
      // Calculate simple trend metrics
      const positiveCount = emotionAnalyses.filter(e => e.mood === 'positive').length;
      const trends = {
        weekly: { 
          improvement: Math.round((positiveCount / emotionAnalyses.length) * 100), 
          total: emotionAnalyses.length 
        },
        monthly: { 
          improvement: Math.round((positiveCount / emotionAnalyses.length) * 100), 
          total: emotionAnalyses.length 
        }
      };
      
      return res.json({
        ...trendAnalysis,
        trends,
        totalEntries: emotionAnalyses.length
      });
    } catch (err) {
      console.error('Error analyzing mood trends:', err);
      return res.status(500).json({ message: 'Error analyzing mood trends' });
    }
  });

  // 💡 Personalized therapy suggestions
  app.get('/api/therapy-suggestions', async (_req, res) => {
    try {
      console.log('💡 Generating therapy suggestions...');
      
      // Get recent journal entries for context
      const entries = await storage.getAllJournalEntries();
      const recentEntries = entries.slice(-10); // Last 10 entries
      
      if (recentEntries.length === 0) {
        return res.json({
          suggestions: [
            'Start with regular journaling to track your emotional patterns',
            'Practice mindfulness meditation for 5-10 minutes daily',
            'Maintain a consistent sleep schedule',
            'Engage in physical activity you enjoy',
            'Connect with supportive friends or family'
          ],
          context: 'general wellness',
          personalized: false
        });
      }
      
      // Convert to emotion analyses
      const emotionAnalyses: EmotionAnalysis[] = recentEntries.map(entry => {
        const emotions = Array.isArray(entry.emotions) ? entry.emotions : [];
        const primaryEmotion = emotions[0]?.label || 'neutral';
        
        return {
          primaryEmotion,
          emotions: emotions.slice(0, 3).map((e: any) => ({
            emotion: e.label || 'neutral',
            confidence: e.score || 0.5,
            intensity: (e.score || 0.5) > 0.7 ? 'high' : (e.score || 0.5) > 0.4 ? 'medium' : 'low'
          })),
          mood: (emotions[0]?.score || 0.5) > 0.6 ? 'positive' : (emotions[0]?.score || 0.5) < 0.3 ? 'negative' : 'neutral',
          triggers: [],
          themes: ['general'],
          sentiment: { score: (emotions[0]?.score || 0.5) > 0.5 ? 0.5 : -0.5, magnitude: 0.5 },
          insights: '',
          suggestions: []
        };
      });
      
      const suggestions = await generateTherapySuggestions(emotionAnalyses);
      
      return res.json({
        suggestions,
        context: 'personalized based on recent entries',
        personalized: true,
        basedOnEntries: recentEntries.length
      });
    } catch (err) {
      console.error('Error generating therapy suggestions:', err);
      return res.status(500).json({ 
        message: 'Error generating suggestions',
        suggestions: [
          'Practice deep breathing exercises when feeling overwhelmed',
          'Set small, achievable daily goals',
          'Engage in physical activity you enjoy',
          'Connect with supportive friends or family',
          'Consider professional counseling if needed'
        ],
        context: 'general fallback',
        personalized: false
      });
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
