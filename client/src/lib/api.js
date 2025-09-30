// API client for TheraMind
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit journal entry');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting journal entry:', error);
    throw error;
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get prompt');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting prompt:', error);
    throw error;
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting history:', error);
    throw error;
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
