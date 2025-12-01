import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_KEY_BACKUP = process.env.GEMINI_API_KEY_BACKUP || "";
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

if (!GEMINI_API_KEY && !GEMINI_API_KEY_BACKUP && !HF_API_KEY && !GROQ_API_KEY) {
  console.warn('⚠️ No AI API keys found. AI features will use fallback responses.');
} else {
  if (GROQ_API_KEY) console.log('✅ GROQ_API_KEY found, length:', GROQ_API_KEY.length);
  if (HF_API_KEY) console.log('✅ HUGGINGFACE_API_KEY found, length:', HF_API_KEY.length);
  if (GEMINI_API_KEY) console.log('✅ GEMINI_API_KEY found, length:', GEMINI_API_KEY.length);
  if (GEMINI_API_KEY_BACKUP) console.log('✅ GEMINI_API_KEY_BACKUP found, length:', GEMINI_API_KEY_BACKUP.length);
}

// Track which API key is currently active
let currentApiKeyIndex = 0;
const apiKeys = [GEMINI_API_KEY, GEMINI_API_KEY_BACKUP].filter(key => key);

function getActiveApiKey() {
  return apiKeys[currentApiKeyIndex] || GEMINI_API_KEY;
}

function switchToBackupApiKey() {
  if (apiKeys.length > 1) {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
    console.log(`🔄 Switching to API key #${currentApiKeyIndex + 1}`);
    return true;
  }
  return false;
}

const genAI = new GoogleGenerativeAI(getActiveApiKey());

// Emotion analysis model
function getEmotionModel() {
  return new GoogleGenerativeAI(getActiveApiKey()).getGenerativeModel({ model: "gemini-1.5-flash" });
}

// Chatbot model with conversation context
function getChatModel() {
  return new GoogleGenerativeAI(getActiveApiKey()).getGenerativeModel({ 
    model: "gemini-1.5-flash", // Using Flash for better rate limits
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 800,
    },
  });
}

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
/**
 * Simple emotion detection using Groq
 */
async function analyzeEmotionsWithGroq(content: string): Promise<EmotionAnalysis> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const prompt = `Analyze the emotions in this journal entry and return ONLY valid JSON (no markdown, no explanations).

Journal Entry: "${content}"

Return this exact JSON structure:
{
  "primaryEmotion": "main emotion",
  "emotions": [{"emotion": "name", "confidence": 0.85, "intensity": "high"}],
  "mood": "positive/negative/neutral",
  "triggers": ["what caused these emotions"],
  "themes": ["main themes"],
  "sentiment": {"score": -0.5, "magnitude": 0.7},
  "insights": "Brief insight",
  "suggestions": ["strategy 1", "strategy 2"]
}`;

  try {
    console.log('🚀 [Groq Emotion] Analyzing with Groq...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {role: 'system', content: 'You are an emotion analysis AI. Return ONLY valid JSON, no markdown or explanations.'},
          {role: 'user', content: prompt}
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Groq Emotion] API error:', response.status, errorText);
      throw new Error(`Groq emotion API failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || '';
    console.log('📦 [Groq Emotion] Response:', generatedText.substring(0, 200));
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Groq response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log('✅ [Groq Emotion] Analysis complete:', analysis.primaryEmotion);
    return analysis;
  } catch (error) {
    console.error('❌ [Groq Emotion] Failed:', error);
    throw error;
  }
}

export async function analyzeEmotions(content: string): Promise<EmotionAnalysis> {
  console.log('🧠 Starting emotion analysis for:', content.substring(0, 50) + '...');
  
  // Try Groq first (fast and reliable)
  if (GROQ_API_KEY) {
    try {
      console.log('🚀 Using Groq for emotion analysis...');
      return await analyzeEmotionsWithGroq(content);
    } catch (groqError) {
      console.error('❌ Groq emotion analysis failed, falling back to Gemini:', groqError);
    }
  }
  
  // Fallback to Gemini
  console.log('🔑 API Key available:', !!getActiveApiKey());

  if (!getActiveApiKey()) {
    console.error('❌ Gemini API key not configured');
    throw new Error('Gemini API key not configured');
  }

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
    const emotionModel = getEmotionModel();
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
    
    // Try backup API key if available
    if (error instanceof Error && error.message.includes('429') && switchToBackupApiKey()) {
      console.log('🔄 Retrying with backup API key...');
      try {
        const emotionModel = getEmotionModel();
        const result = await emotionModel.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const analysis = JSON.parse(cleanedResponse);
        console.log('✅ Emotion analysis successful with backup key:', analysis.primaryEmotion);
        return analysis;
      } catch (retryError) {
        console.error('❌ Backup API key also failed:', retryError);
      }
    }
    
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
      mood: mood as "positive" | "negative" | "neutral",
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
    const emotionModel = getEmotionModel();
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
 * Call Groq API for chat (fast, reliable, free)
 */
async function callGroqChat(message: string, conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const messages = [
    {
      role: 'system',
      content: 'You are TheraMind, a warm, empathetic AI therapist. Respond with compassion, validation, and support in 2-4 sentences. Be personal and specific to what the user shares.'
    },
    ...conversationHistory.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: 'user',
      content: message
    }
  ];

  try {
    console.log('🚀 [Groq] Calling Groq API...');
    console.log('🚀 [Groq] Messages count:', messages.length);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.8,
        max_tokens: 300,
        top_p: 0.9
      })
    });

    console.log('🔍 [Groq] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Groq] API error:', errorText);
      throw new Error(`Groq API failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('📦 [Groq] Response received');
    
    if (data.choices && data.choices[0]?.message?.content) {
      const reply = data.choices[0].message.content.trim();
      console.log('✅ [Groq] Reply length:', reply.length);
      return reply;
    }
    
    console.error('❌ [Groq] Unexpected response format:', data);
    throw new Error('Invalid Groq response format');
  } catch (error) {
    console.error('❌ [Groq] API call failed:', error);
    throw error;
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
  console.log('🤖 Chatbot called with:', message.substring(0, 100));
  
  // Try Groq first (fast, reliable, free)
  if (GROQ_API_KEY) {
    try {
      console.log('🚀 Trying Groq API...');
      const groqResponse = await callGroqChat(message, conversationHistory);
      
      console.log('✅ Groq response received');
      return {
        response: groqResponse,
        emotionalTone: 'empathetic',
        supportType: 'validation',
        followUpQuestions: []
      };
    } catch (groqError) {
      console.error('❌ Groq failed:', groqError);
    }
  }
  
  // Fallback response if Groq fails or isn't configured
  console.warn('⚠️ Using fallback response (Groq unavailable)');
  
  // Contextual fallback based on message content
  const lowerMsg = message.toLowerCase();
  let fallbackResponse = "I'm here to listen and support you. Your feelings are valid, and it takes courage to share them.";
  
  if (lowerMsg.includes('anxious') || lowerMsg.includes('worried') || lowerMsg.includes('stress')) {
    fallbackResponse = "It's completely understandable to feel anxious. Remember to breathe deeply - you're doing better than you think.";
  } else if (lowerMsg.includes('sad') || lowerMsg.includes('depressed') || lowerMsg.includes('down')) {
    fallbackResponse = "Your feelings are valid. It's okay to not be okay sometimes. You don't have to go through this alone.";
  } else if (lowerMsg.includes('angry') || lowerMsg.includes('frustrated') || lowerMsg.includes('mad')) {
    fallbackResponse = "It makes sense that you're feeling this way. Your anger is valid - it's telling you something important about your boundaries and needs.";
  } else if (lowerMsg.includes('happy') || lowerMsg.includes('good') || lowerMsg.includes('great')) {
    fallbackResponse = "I'm so glad to hear that! It's wonderful that you're taking time to notice and appreciate these positive moments.";
  } else if (lowerMsg.includes('confused') || lowerMsg.includes('unclear') || lowerMsg.includes('unsure')) {
    fallbackResponse = "It takes courage to acknowledge when things are unclear. Your willingness to explore these feelings shows real self-awareness.";
  }
  
  return {
    response: fallbackResponse,
    emotionalTone: 'supportive',
    supportType: 'validation'
  };
}
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
    const emotionModel = getEmotionModel();
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
