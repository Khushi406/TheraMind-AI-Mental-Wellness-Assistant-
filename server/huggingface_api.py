import os
import requests
import json
import random

# Get the Hugging Face API key from environment variables
API_KEY = os.environ.get("HUGGING_FACE_API_KEY", "")
if not API_KEY:
    print("Warning: HUGGING_FACE_API_KEY environment variable is not set")

# Emotion detection model
EMOTION_MODEL = "bhadresh-savani/distilbert-base-uncased-emotion"

# Text generation model
TEXT_GEN_MODEL = "google/flan-t5-large"

def analyze_emotion(text):
    """
    Analyze the emotion in a text using Hugging Face API
    
    Args:
        text (str): The text to analyze
        
    Returns:
        list: List of emotions with their scores
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": text
    }
    
    url = f"https://api-inference.huggingface.co/models/{EMOTION_MODEL}"
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        result = response.json()
        
        # Process and format the results
        emotions = []
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict) and "label" in result[0]:
                # Format: [{"label": "joy", "score": 0.9}, ...]
                emotions = result
            elif isinstance(result[0], list):
                # Format: [[{"label": "joy", "score": 0.9}, ...]]
                emotions = result[0]
        
        # Sort emotions by score in descending order
        emotions.sort(key=lambda x: x.get("score", 0), reverse=True)
        
        return emotions
    
    except requests.exceptions.RequestException as e:
        print(f"Error calling Hugging Face API for emotion analysis: {e}")
        # Return some default emotions if API fails
        return [
            {"label": "neutral", "score": 0.5},
            {"label": "joy", "score": 0.2},
            {"label": "sadness", "score": 0.1}
        ]


def generate_prompt():
    """
    Generate a journaling prompt using Hugging Face API
    
    Returns:
        str: A journaling prompt
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Define instruction for the model
    input_text = "Generate a thoughtful journaling prompt about emotions and self-reflection:"
    
    payload = {
        "inputs": input_text,
        "parameters": {
            "max_length": 100,
            "temperature": 0.7,
            "top_p": 0.95,
            "do_sample": True
        }
    }
    
    url = f"https://api-inference.huggingface.co/models/{TEXT_GEN_MODEL}"
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict) and "generated_text" in result[0]:
                return result[0]["generated_text"].strip()
        
        if isinstance(result, dict) and "generated_text" in result:
            return result["generated_text"].strip()
        
        # Fallback to predefined prompts if API response format is unexpected
        return get_default_prompt()
    
    except requests.exceptions.RequestException as e:
        print(f"Error calling Hugging Face API for prompt generation: {e}")
        return get_default_prompt()


def generate_affirmation():
    """
    Generate a positive affirmation using Hugging Face API
    
    Returns:
        str: A positive affirmation
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Define instruction for the model
    input_text = "Generate a short, positive daily affirmation for emotional well-being:"
    
    payload = {
        "inputs": input_text,
        "parameters": {
            "max_length": 50,
            "temperature": 0.7,
            "top_p": 0.95,
            "do_sample": True
        }
    }
    
    url = f"https://api-inference.huggingface.co/models/{TEXT_GEN_MODEL}"
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict) and "generated_text" in result[0]:
                return result[0]["generated_text"].strip()
        
        if isinstance(result, dict) and "generated_text" in result:
            return result["generated_text"].strip()
        
        # Fallback to predefined affirmations if API response format is unexpected
        return get_default_affirmation()
    
    except requests.exceptions.RequestException as e:
        print(f"Error calling Hugging Face API for affirmation generation: {e}")
        return get_default_affirmation()


def generate_reflection(content, emotions):
    """
    Generate a reflection based on the journal content and detected emotions
    
    Args:
        content (str): The journal entry content
        emotions (list): List of emotions with their scores
        
    Returns:
        str: A reflection on the emotions
    """
    # Extract the top 2-3 emotions for the reflection
    top_emotions = emotions[:min(3, len(emotions))]
    emotion_text = ", ".join([f"{e['label']} ({int(e['score']*100)}%)" for e in top_emotions])
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Define instruction for the model
    input_text = f"Based on a journal entry, I detected these emotions: {emotion_text}. The entry discusses: {content[:100]}... Generate a short, supportive reflection about these emotions:"
    
    payload = {
        "inputs": input_text,
        "parameters": {
            "max_length": 150,
            "temperature": 0.7,
            "top_p": 0.95,
            "do_sample": True
        }
    }
    
    url = f"https://api-inference.huggingface.co/models/{TEXT_GEN_MODEL}"
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict) and "generated_text" in result[0]:
                return result[0]["generated_text"].strip()
        
        if isinstance(result, dict) and "generated_text" in result:
            return result["generated_text"].strip()
        
        # Create a default reflection based on the emotions
        primary_emotion = top_emotions[0]["label"] if top_emotions else "neutral"
        return get_default_reflection(primary_emotion)
    
    except requests.exceptions.RequestException as e:
        print(f"Error calling Hugging Face API for reflection generation: {e}")
        primary_emotion = top_emotions[0]["label"] if top_emotions else "neutral"
        return get_default_reflection(primary_emotion)


# Default content if API calls fail
def get_default_prompt():
    prompts = [
        "What made you feel grateful today, and how did those moments affect your overall mood?",
        "Describe a challenging emotion you experienced recently. What triggered it, and how did you cope?",
        "Reflect on a recent interaction that impacted your emotions. What did you learn about yourself?",
        "What activities or people consistently bring you joy? How can you incorporate more of these into your life?",
        "Describe a moment today when you felt at peace. What elements contributed to this feeling?",
        "What worries have been on your mind lately? Try to explore where these concerns stem from."
    ]
    return random.choice(prompts)


def get_default_affirmation():
    affirmations = [
        "I acknowledge my emotions and treat myself with compassion. Each day is an opportunity for growth.",
        "My feelings are valid, and I give myself permission to experience them fully.",
        "I am growing more aware of my emotions every day and learning from them.",
        "I trust in my ability to navigate difficult emotions with grace and patience.",
        "I am worthy of happiness, peace, and emotional well-being.",
        "Today I choose to focus on positive thoughts and nurture my emotional health."
    ]
    return random.choice(affirmations)


def get_default_reflection(emotion):
    reflections = {
        "joy": "You're experiencing joy, which suggests you're connecting with things that bring you fulfillment. Cherish these positive moments and consider how you might create more of them in your life.",
        "sadness": "I notice sadness in your entry. Remember that all emotions, including difficult ones, are part of the human experience. Be gentle with yourself as you process these feelings.",
        "anger": "Your entry reflects anger, which often signals that a boundary has been crossed or a need isn't being met. Consider what this emotion might be trying to tell you.",
        "fear": "There's fear present in your writing. This emotion helps us identify potential threats, but sometimes it can overestimate risks. Try to distinguish between helpful caution and limiting anxiety.",
        "surprise": "Surprise appears in your entry, showing you've encountered something unexpected. These moments can offer fresh perspectives and opportunities for growth.",
        "disgust": "I detect disgust in your entry, which often relates to our values and boundaries. Consider what this reaction might reveal about what matters to you.",
        "neutral": "Your writing has a balanced, neutral tone. This emotional equilibrium can be a good place for clear thinking and decision-making."
    }
    
    return reflections.get(emotion.lower(), "Your emotions are valid and important. Recognizing and acknowledging them is a significant step toward emotional well-being.")
