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
  console.log('🧠 Starting emotion analysis for:', content.substring(0, 50) + '...');
  console.log('🔑 API Key available:', !!GEMINI_API_KEY);

  if (!GEMINI_API_KEY) {
    console.error('❌ Gemini API key not configured');
    throw new Error('Gemini API key not configured');
  }

  // ... rest of the function remains the same

  const prompt = `You are an EXPERT CLINICAL PSYCHOLOGIST AI with advanced training in emotion recognition, microexpressions, linguistic analysis, and deep psychological assessment. Perform a COMPREHENSIVE MULTI-LAYERED emotional analysis.

Journal Entry: "${content}"

═══════════════════════════════════════════════════════════
ADVANCED EMOTION DETECTION PROTOCOL - MAXIMUM SENSITIVITY
═══════════════════════════════════════════════════════════

🔬 LAYER 1: SURFACE EMOTIONS (Explicitly Stated)
- Direct emotional words: happy, sad, angry, anxious, etc.
- Obvious emotional declarations

🔬 LAYER 2: UNDERLYING EMOTIONS (Implicit/Hidden)
- Emotional subtext and implications
- What they're NOT saying but feeling
- Defense mechanisms: denial, rationalization, intellectualization
- Emotional masks: "I'm fine" (when clearly not)

🔬 LAYER 3: CONFLICTING EMOTIONS (Emotional Ambivalence)
- Contradictory feelings co-existing (happy BUT anxious)
- Approach-avoidance conflicts
- Mixed feelings about situations/people
- Emotional confusion and uncertainty

🔬 LAYER 4: PHYSICAL-EMOTIONAL MARKERS
- Somatic symptoms: tired, tense, nauseous, heart racing
- Energy levels: drained, restless, hyperactive, lethargic
- Sleep patterns mentioned: insomnia, oversleeping, nightmares
- Physical pain correlating with emotional state

🔬 LAYER 5: COGNITIVE-EMOTIONAL PATTERNS
- Rumination indicators: "can't stop thinking", "keeps replaying"
- Catastrophizing: worst-case scenarios, "what if" spirals
- Black-and-white thinking: all-or-nothing statements
- Self-criticism vs self-compassion language
- Future vs past focus (anxiety vs regret)

🔬 LAYER 6: LINGUISTIC MARKERS
- Minimizing language: "just", "a bit", "kinda", "sort of", "I guess"
- Intensifiers: "really", "very", "so", "extremely"
- Hedging: "maybe", "perhaps", "possibly", "might"
- Qualifiers: "but", "however", "though", "although"
- Absolutes: "always", "never", "everyone", "nothing"

🔬 LAYER 7: EMOTIONAL INTENSITY SPECTRUM
- Rate each emotion's intensity: minimal (0.1-0.3), mild (0.4-0.6), moderate (0.6-0.8), strong (0.8-0.95)
- Detect intensity fluctuations within the text
- Identify emotional crescendos and valleys

🔬 LAYER 8: TEMPORAL EMOTIONAL SHIFTS
- Past emotions: regret, nostalgia, resentment, grief
- Present emotions: confusion, overwhelm, contentment, panic
- Future emotions: anxiety, hope, dread, anticipation
- Emotional time-travel patterns

🔬 LAYER 9: INTERPERSONAL EMOTIONAL DYNAMICS
- Emotions about relationships: loneliness, connection, betrayal
- Social emotions: shame, pride, jealousy, empathy
- Attachment-related feelings: abandonment, security, dependence

🔬 LAYER 10: EXISTENTIAL & MEANING-MAKING
- Purpose/meaninglessness feelings
- Identity confusion or clarity
- Existential anxiety or peace
- Value conflicts

═══════════════════════════════════════════════════════════
EMOTION TAXONOMY (100+ Emotions to Detect):
═══════════════════════════════════════════════════════════

POSITIVE SPECTRUM:
Joy, Ecstasy, Elation, Delight, Contentment, Satisfaction, Pride, Gratitude, Relief, Hope, Optimism, Excitement, Enthusiasm, Peace, Serenity, Love, Affection, Warmth, Connection, Confidence, Empowerment, Inspiration, Awe, Wonder, Amusement, Playfulness

NEGATIVE SPECTRUM:
Sadness, Grief, Melancholy, Despair, Depression, Disappointment, Hurt, Heartbreak, Loneliness, Isolation, Anxiety, Worry, Nervousness, Panic, Fear, Terror, Dread, Insecurity, Vulnerability, Anger, Rage, Frustration, Irritation, Resentment, Bitterness, Disgust, Contempt, Shame, Guilt, Embarrassment, Humiliation, Regret, Remorse

COMPLEX/MIXED:
Ambivalence, Confusion, Bewilderment, Overwhelm, Numbness, Emptiness, Apathy, Indifference, Restlessness, Tension, Unease, Discomfort, Jealousy, Envy, Nostalgia, Longing, Yearning, Homesickness, Boredom, Frustration, Impatience

PHYSICAL-EMOTIONAL:
Exhaustion, Fatigue, Burnout, Depletion, Tension, Stress, Restlessness, Hyperarousal, Dissociation, Detachment

═══════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS:
═══════════════════════════════════════════════════════════

Return ONLY valid JSON with this structure:
{
  "primaryEmotion": "most dominant emotion (be specific: not just 'sad' but 'melancholic' or 'grief-stricken')",
  "emotions": [
    {
      "emotion": "specific emotion name from taxonomy",
      "confidence": 0.XX (decimal precision to hundredths: 0.87, 0.92, etc.),
      "intensity": "minimal/mild/moderate/strong",
      "layer": "surface/underlying/conflicting/physical/cognitive",
      "evidence": "specific phrase or word that indicates this emotion"
    }
  ],
  "mood": "positive/negative/neutral/mixed/conflicted/unstable",
  "emotionalComplexity": "simple/moderate/complex/highly-complex (based on number of conflicting emotions)",
  "triggers": ["specific situations, thoughts, or events causing these emotions"],
  "themes": ["psychological themes: uncertainty, loss, hope, identity-crisis, burnout, ambivalence, etc."],
  "copingStyle": "adaptive/maladaptive/avoidant/expressive (how they're handling emotions)",
  "defenseMechanisms": ["denial, rationalization, intellectualization, etc. if present"],
  "sentiment": {
    "score": -1.0 to 1.0 (precise decimal: -0.73, 0.82, etc.),
    "magnitude": 0.0-1.0 (emotional intensity overall),
    "stability": "stable/fluctuating/volatile"
  },
  "insights": "Deep psychological insight (2-3 sentences) acknowledging ALL layers of emotion, contradictions, and validating their experience",
  "suggestions": ["5-7 specific, evidence-based, personalized coping strategies based on detected emotions and patterns"],
  "clinicalNotes": "Brief observation of any concerning patterns (rumination, catastrophizing, numbness, etc.)"
}

CRITICAL REQUIREMENTS:
- Detect 5-10 emotions minimum (be THOROUGH)
- Use maximum granularity: not "sad" but "melancholic", "grief-stricken", "heartbroken"
- Include evidence field for each emotion showing exact text
- Acknowledge ALL contradictions and complexities
- If ANY concerning patterns detected, note them
- Suggestions must be SPECIFIC and ACTIONABLE, not generic
- Use decimal precision for ALL numerical scores`;

  try {
    console.log('🚀 Calling Gemini API for emotion analysis...');
    const result = await emotionModel.generateContent(prompt);
    const responseText = result.response.text();
    
    console.log('📝 Raw Gemini response:', responseText.substring(0, 200) + '...');
    
    // Clean up the response to ensure it's valid JSON
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('🧹 Cleaned response:', cleanedResponse.substring(0, 200) + '...');
    
    const analysis = JSON.parse(cleanedResponse);
    
    // Validate the response structure
    if (!analysis.primaryEmotion || !analysis.emotions || !Array.isArray(analysis.emotions)) {
      console.error('❌ Invalid response structure:', analysis);
      throw new Error('Invalid response structure from Gemini');
    }
    
    console.log('✅ Emotion analysis successful:', analysis.primaryEmotion);
    return analysis;
  } catch (error) {
    console.error('❌ Gemini emotion analysis error:', error);
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : {
      message: 'Unknown error',
      stack: undefined,
      name: 'Unknown'
    };
    console.error('🔍 Error details:', errorDetails);
    
    // Intelligent fallback analysis based on keyword detection
    const lowerContent = content.toLowerCase();
    let primaryEmotion = 'neutral';
    let mood = 'neutral';
    let sentimentScore = 0;
    const emotions: Array<{ emotion: string; confidence: number; intensity: 'low' | 'medium' | 'high' }> = [];
    const triggers: string[] = [];
    const themes: string[] = [];
    
    // Emotion keyword detection
    const emotionKeywords = {
      happy: ['happy', 'joy', 'glad', 'excited', 'great', 'wonderful', 'amazing', 'fantastic'],
      sad: ['sad', 'down', 'depressed', 'unhappy', 'miserable', 'hurt', 'cry', 'crying'],
      anxious: ['anxious', 'worried', 'nervous', 'stress', 'overwhelm', 'panic', 'tense'],
      angry: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated'],
      confused: ['confused', 'unclear', 'uncertain', 'mixed', 'conflicted', 'weird'],
      tired: ['tired', 'exhausted', 'drained', 'weary', 'burnt out', 'fatigue'],
      hopeful: ['hope', 'optimistic', 'better', 'improve', 'tomorrow', 'future'],
      fearful: ['afraid', 'scared', 'terrified', 'fear', 'frightened']
    };
    
    // Detect emotions based on keywords
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const matches = keywords.filter(keyword => lowerContent.includes(keyword));
      if (matches.length > 0) {
        emotions.push({
          emotion,
          confidence: Math.min(0.5 + (matches.length * 0.15), 0.85),
          intensity: matches.length > 2 ? 'high' : matches.length > 1 ? 'medium' : 'low'
        });
      }
    });
    
    // Determine primary emotion and mood
    if (emotions.length > 0) {
      emotions.sort((a, b) => b.confidence - a.confidence);
      primaryEmotion = emotions[0].emotion;
      
      const positiveEmotions = ['happy', 'hopeful'];
      const negativeEmotions = ['sad', 'anxious', 'angry', 'fearful', 'tired'];
      
      const hasPositive = emotions.some(e => positiveEmotions.includes(e.emotion));
      const hasNegative = emotions.some(e => negativeEmotions.includes(e.emotion));
      
      if (hasPositive && hasNegative) {
        mood = 'mixed';
        sentimentScore = 0;
      } else if (hasPositive) {
        mood = 'positive';
        sentimentScore = 0.6;
      } else if (hasNegative) {
        mood = 'negative';
        sentimentScore = -0.6;
      }
    } else {
      emotions.push({ emotion: 'neutral', confidence: 0.5, intensity: 'medium' });
    }
    
    // Detect common triggers
    if (lowerContent.includes('test') || lowerContent.includes('exam')) triggers.push('academic stress');
    if (lowerContent.includes('work') || lowerContent.includes('job')) triggers.push('work-related stress');
    if (lowerContent.includes('failed') || lowerContent.includes('mistake')) triggers.push('performance concerns');
    if (lowerContent.includes('but') || lowerContent.includes('however')) themes.push('conflicting feelings');
    if (lowerContent.includes('unclear') || lowerContent.includes('confused')) themes.push('uncertainty');
    
    const fallbackAnalysis: EmotionAnalysis = {
      primaryEmotion,
      emotions: emotions.slice(0, 5),
      mood,
      triggers: triggers.length > 0 ? triggers : ['general life events'],
      themes: themes.length > 0 ? themes : ['self-reflection'],
      sentiment: { 
        score: sentimentScore, 
        magnitude: emotions.length > 0 ? emotions[0].confidence : 0.5 
      },
      insights: emotions.length > 1 
        ? `You seem to be experiencing mixed emotions. It's completely normal to feel multiple things at once.`
        : `Your feelings are valid. It's okay to take time to process your emotions.`,
      suggestions: [
        'Take a few deep breaths and ground yourself in the present moment',
        'Write down your thoughts to help clarify your feelings',
        'Consider talking to someone you trust about how you\'re feeling',
        'Be gentle with yourself - all emotions are valid'
      ]
    };
    return fallbackAnalysis;
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