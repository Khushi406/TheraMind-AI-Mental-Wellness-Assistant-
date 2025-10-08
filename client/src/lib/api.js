// API client for TheraMind
// Railway deployment - both frontend and backend on same domain

const API_BASE_URL = '/api';

/**
 * Submit a journal entry for emotion analysis
 * @param {string} content - The journal entry content
 * @returns {Promise<Object>} - The analysis results
 */
export async function submitJournalEntry(content) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Backend API failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting journal entry:', error);
    throw new Error('Failed to analyze journal entry. Please try again.');
  }
}

/**
 * Get a daily journaling prompt and affirmation
 * @returns {Promise<Object>} - Prompt and affirmation
 */
export async function getPrompt() {
  try {
    const response = await fetch(`${API_BASE_URL}/prompt`);
    
    if (!response.ok) {
      throw new Error(`Backend API failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting prompt:', error);
    throw new Error('Failed to get daily prompt. Please try again.');
  }
}

/**
 * Get journal entry history with emotion data
 * @returns {Promise<Object>} - Journal history data
 */
export async function getHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/history`);
    
    if (!response.ok) {
      throw new Error(`Backend API failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting history:', error);
    throw new Error('Failed to get journal history. Please try again.');
  }
}

/**
 * Test emotion detection functionality
 * @param {string} content - Test content for emotion analysis
 * @returns {Promise<Object>} - Debug information about emotion detection
 */
export async function testEmotionDetection(content) {
  try {
    const response = await fetch(`${API_BASE_URL}/test-emotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to test emotion detection');
    }

    return await response.json();
  } catch (error) {
    console.error('Error testing emotion detection:', error);
    throw error;
  }
}

/**
 * 🤖 Chat with AI therapist
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Previous conversation context
 * @returns {Promise<Object>} - AI response with emotional analysis
 */
export async function chatWithAI(message, conversationHistory = []) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationHistory }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get AI response');
    }

    return await response.json();
  } catch (error) {
    console.error('Error chatting with AI:', error);
    // Return supportive fallback response
    return {
      response: "I'm here to listen and support you. While my AI features are temporarily unavailable, remember that your feelings matter and seeking help is a sign of strength.",
      emotionalTone: 'supportive',
      supportType: 'validation',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 📊 Get mood trends and predictions
 * @returns {Promise<Object>} - Mood analysis and predictions
 */
export async function getMoodTrends() {
  try {
    const response = await fetch(`${API_BASE_URL}/mood-trends`);
    
    if (!response.ok) {
      throw new Error('Failed to get mood trends');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting mood trends:', error);
    // Return fallback data
    return {
      prediction: 'stable',
      confidence: 0.5,
      insights: 'Keep journaling to build better insights over time.',
      recommendations: ['Continue regular journaling', 'Focus on self-care'],
      trends: {
        weekly: { improvement: 0, total: 0 },
        monthly: { improvement: 0, total: 0 }
      }
    };
  }
}

/**
 * 💡 Get personalized therapy suggestions
 * @returns {Promise<Object>} - Personalized suggestions based on patterns
 */
export async function getTherapySuggestions() {
  try {
    const response = await fetch(`${API_BASE_URL}/therapy-suggestions`);
    
    if (!response.ok) {
      throw new Error('Failed to get therapy suggestions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting therapy suggestions:', error);
    // Return fallback suggestions
    return {
      suggestions: [
        'Practice mindfulness meditation for 5-10 minutes daily',
        'Maintain a consistent sleep schedule',
        'Engage in physical activity you enjoy',
        'Connect with supportive friends or family',
        'Take breaks when feeling overwhelmed'
      ],
      context: 'general wellness',
      personalized: false
    };
  }
}
