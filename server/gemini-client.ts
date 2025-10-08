import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found. Gemini features will be disabled.');
} else {
  console.log('✅ GEMINI_API_KEY found, length:', GEMINI_API_KEY.length);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Emotion analysis model
const emotionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Chatbot model with conversation context
const chatModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
  },
});

export interface EmotionAnalysis {
  primaryEmotion: string;
  emotions: Array<{
    emotion: string;
    confidence: number;
    intensity: 'low' | 'medium' | 'high';
  }>;
  mood: 'positive' | 'negative' | 'neutral';
  triggers: string[];
  themes: string[];
  sentiment: {
    score: number; // -1 to 1
    magnitude: number; // 0 to 1
  };
  insights: string;
  suggestions: string[];
}

export interface ChatResponse {
  response: string;
  emotionalTone: string;
  supportType: 'validation' | 'guidance' | 'information' | 'encouragement';
  followUpQuestions?: string[];
}

/**
 * Analyze emotions in journal entry using Gemini AI
 * @param content - Journal entry text
 * @returns Detailed emotion analysis
 */
export async function analyzeEmotions(content: string): Promise<EmotionAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `
You are an expert mental health AI assistant. Analyze this journal entry for emotions, mood, and psychological patterns. Provide a comprehensive analysis in JSON format.

Journal Entry: "${content}"

Please analyze and return ONLY a valid JSON object with this exact structure:
{
  "primaryEmotion": "dominant emotion (joy, sadness, anger, fear, surprise, disgust, love, excitement, etc.)",
  "emotions": [
    {
      "emotion": "emotion name",
      "confidence": 0.95,
      "intensity": "high"
    }
  ],
  "mood": "positive/negative/neutral",
  "triggers": ["array of potential emotional triggers identified"],
  "themes": ["array of recurring themes or topics"],
  "sentiment": {
    "score": 0.8,
    "magnitude": 0.9
  },
  "insights": "Brief psychological insight about the emotional state",
  "suggestions": ["array of helpful coping strategies or positive actions"]
}

Important: 
- Return ONLY the JSON object, no other text
- Confidence should be 0-1
- Include 1-5 emotions maximum
- Provide 2-4 practical suggestions
- Keep insights empathetic and supportive
`;

  try {
    const result = await emotionModel.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up the response to ensure it's valid JSON
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(cleanedResponse);
    
    // Validate the response structure
    if (!analysis.primaryEmotion || !analysis.emotions || !Array.isArray(analysis.emotions)) {
      throw new Error('Invalid response structure from Gemini');
    }
    
    return analysis;
  } catch (error) {
    console.error('Gemini emotion analysis error:', error);
    
    // Fallback analysis
    return {
      primaryEmotion: 'neutral',
      emotions: [{ emotion: 'neutral', confidence: 0.5, intensity: 'medium' }],
      mood: 'neutral',
      triggers: [],
      themes: ['general'],
      sentiment: { score: 0, magnitude: 0.5 },
      insights: 'Analysis temporarily unavailable. Your feelings are valid and important.',
      suggestions: ['Take a moment to breathe deeply', 'Consider talking to someone you trust']
    };
  }
}

/**
 * Generate personalized therapy suggestions based on emotional patterns
 * @param emotions - Array of recent emotion analyses
 * @returns Personalized suggestions
 */
export async function generateTherapySuggestions(emotions: EmotionAnalysis[]): Promise<string[]> {
  if (!GEMINI_API_KEY || emotions.length === 0) {
    return ['Practice mindfulness meditation', 'Keep a regular sleep schedule', 'Stay connected with supportive people'];
  }

  const emotionSummary = emotions.map(e => ({
    primary: e.primaryEmotion,
    mood: e.mood,
    triggers: e.triggers,
    themes: e.themes
  }));

  const prompt = `
As a mental health AI assistant, analyze these recent emotional patterns and provide personalized therapy suggestions.

Recent Emotions: ${JSON.stringify(emotionSummary)}

Provide 3-5 specific, actionable therapy suggestions in JSON format:
{
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}

Focus on:
- Evidence-based coping strategies
- Practical daily activities
- Emotional regulation techniques
- Positive behavioral changes
- Self-care practices

Return ONLY the JSON object.
`;

  try {
    const result = await emotionModel.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const response = JSON.parse(cleanedResponse);
    return response.suggestions || [];
  } catch (error) {
    console.error('Therapy suggestions error:', error);
    return [
      'Practice deep breathing exercises when feeling overwhelmed',
      'Set small, achievable daily goals',
      'Engage in physical activity you enjoy',
      'Connect with supportive friends or family',
      'Consider professional counseling if needed'
    ];
  }
}

/**
 * AI Chatbot for mental health support
 * @param message - User's message
 * @param conversationHistory - Previous messages for context
 * @returns Supportive AI response
 */
export async function chatWithTherapist(
  message: string, 
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<ChatResponse> {
  console.log('🤖 Chatbot called with:', message);
  console.log('🔑 API Key available:', !!GEMINI_API_KEY);
  
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY not configured, using fallback response');
    return {
      response: "I'm here to listen and support you. While my AI features are temporarily unavailable, remember that your feelings matter and seeking help is a sign of strength.",
      emotionalTone: 'supportive',
      supportType: 'validation'
    };
  }

  try {
    console.log('🚀 Attempting Gemini API call...');
    
    // Build conversation context (limit to last 6 messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-6);
    const context = recentHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const prompt = `You are TheraMind, a compassionate AI mental health assistant. You provide emotional support, active listening, and gentle guidance. You are NOT a replacement for professional therapy but offer empathetic support.

Previous conversation:
${context}

Current user message: "${message}"

Guidelines:
- Be empathetic, warm, and non-judgmental
- Use active listening techniques
- Validate emotions and experiences
- Offer gentle insights when appropriate
- Suggest coping strategies if relevant
- Know your limitations - refer to professionals when needed
- Keep responses concise but meaningful (2-3 sentences max)
- Be conversational and natural
- Respond directly to what the user said

Respond in JSON format:
{
  "response": "Your supportive response here",
  "emotionalTone": "supportive/empathetic/encouraging/calming",
  "supportType": "validation/guidance/information/encouragement",
  "followUpQuestions": ["optional array of gentle follow-up questions"]
}

Return ONLY the JSON object.`;

    const result = await chatModel.generateContent(prompt);
    const responseText = result.response.text();
    
    console.log('✅ Gemini response received:', responseText.substring(0, 100) + '...');
    
    // Clean up the response to ensure it's valid JSON
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const response = JSON.parse(cleanedResponse);
    
    console.log('📝 Parsed response:', response.response);
    
    return {
      response: response.response || "I hear you and I'm here to support you through this.",
      emotionalTone: response.emotionalTone || 'supportive',
      supportType: response.supportType || 'validation',
      followUpQuestions: response.followUpQuestions
    };
  } catch (error) {
    console.error('❌ Gemini chatbot error:', error);
    
    // Provide contextual fallback responses based on user input
    const lowerMessage = message.toLowerCase();
    let fallbackResponse = "I hear you, and I want you to know that your feelings are completely valid.";
    
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
      fallbackResponse = "It sounds like you're feeling anxious. That's completely understandable, and you're not alone in feeling this way. Taking slow, deep breaths can sometimes help in moments like these.";
    } else if (lowerMessage.includes('sad') || lowerMessage.includes('down')) {
      fallbackResponse = "I can hear that you're going through a difficult time. Your feelings are valid, and it's okay to not be okay sometimes. You've taken a positive step by reaching out.";
    } else if (lowerMessage.includes('good') || lowerMessage.includes('better') || lowerMessage.includes('happy')) {
      fallbackResponse = "I'm so glad to hear you're doing well! It's wonderful when we can recognize and appreciate the good moments. What's contributing to your positive feelings today?";
    } else if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) {
      fallbackResponse = "That's fantastic that you're learning new skills! Personal growth and learning are such powerful ways to boost our confidence and sense of accomplishment. What skill are you working on?";
    } else if (lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
      fallbackResponse = "Hello! I'm TheraMind, and I'm here to listen and support you. How are you feeling today? What's on your mind?";
    }
    
    console.log('🔄 Using fallback response:', fallbackResponse);
    
    return {
      response: fallbackResponse,
      emotionalTone: 'empathetic',
      supportType: 'validation',
      followUpQuestions: ["What's one thing that's been on your mind lately?"]
    };
  }
}

/**
 * Predict mood trends based on historical data
 * @param historicalEmotions - Array of past emotion analyses
 * @returns Mood prediction and insights
 */
export async function predictMoodTrends(historicalEmotions: EmotionAnalysis[]): Promise<{
  prediction: 'improving' | 'stable' | 'declining';
  confidence: number;
  insights: string;
  recommendations: string[];
}> {
  if (!GEMINI_API_KEY || historicalEmotions.length < 3) {
    return {
      prediction: 'stable',
      confidence: 0.5,
      insights: 'Not enough data for accurate prediction. Keep journaling to build insights.',
      recommendations: ['Continue regular journaling', 'Track your daily mood patterns']
    };
  }

  const emotionTrends = historicalEmotions.map(e => ({
    primary: e.primaryEmotion,
    mood: e.mood,
    sentiment: e.sentiment.score,
    triggers: e.triggers.length
  }));

  const prompt = `
Analyze these emotion patterns and predict mood trends for mental health insights.

Historical Emotions (chronological): ${JSON.stringify(emotionTrends)}

Analyze patterns and provide prediction in JSON format:
{
  "prediction": "improving/stable/declining",
  "confidence": 0.85,
  "insights": "Key insights about emotional patterns",
  "recommendations": ["specific actionable recommendations"]
}

Consider:
- Sentiment score trends
- Emotion variety and intensity
- Trigger patterns
- Overall mood direction

Return ONLY the JSON object.
`;

  try {
    const result = await emotionModel.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Mood prediction error:', error);
    return {
      prediction: 'stable',
      confidence: 0.5,
      insights: 'Continue tracking your emotions to build better insights over time.',
      recommendations: ['Maintain regular journaling', 'Focus on self-care activities']
    };
  }
}