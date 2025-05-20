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


def generate_prompt(user_emotions=None, user_themes=None):
    """
    Generate a journaling prompt using Hugging Face API, personalized to user's
    recent emotions and themes if available
    
    Args:
        user_emotions (list, optional): List of user's recent emotions
        user_themes (list, optional): List of themes from user's recent entries
    
    Returns:
        str: A journaling prompt
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Select a prompt category based on user's dominant emotions/themes
    prompt_type = "general"
    
    if user_emotions:
        # Check for dominant emotions
        if any(e.get('label', '').lower() in ['joy', 'happiness'] and e.get('score', 0) > 0.5 for e in user_emotions):
            prompt_type = "gratitude"
        elif any(e.get('label', '').lower() in ['sadness', 'fear'] and e.get('score', 0) > 0.5 for e in user_emotions):
            prompt_type = "growth"
        elif any(e.get('label', '').lower() in ['anger', 'disgust'] and e.get('score', 0) > 0.5 for e in user_emotions):
            prompt_type = "reflection"
    
    if user_themes:
        # Check for specific themes
        if "relationships" in user_themes:
            prompt_type = "relationships"
        elif "work" in user_themes or "stress" in user_themes:
            prompt_type = "stress"
        elif "health" in user_themes:
            prompt_type = "health"
        elif "creativity" in user_themes:
            prompt_type = "creativity"
    
    # Define instruction for the model
    prompt_instructions = {
        "general": "Generate a thoughtful journaling prompt about emotions and self-reflection:",
        "gratitude": "Generate a journaling prompt about finding gratitude and joy in everyday experiences:",
        "growth": "Generate a journaling prompt about personal growth and navigating challenging emotions:",
        "reflection": "Generate a journaling prompt about processing feelings of frustration or disappointment:",
        "relationships": "Generate a journaling prompt about understanding relationships and interpersonal connections:",
        "stress": "Generate a journaling prompt about managing stress and finding balance:",
        "health": "Generate a journaling prompt about mental and physical well-being:",
        "creativity": "Generate a journaling prompt about creative expression and finding inspiration:"
    }
    
    instruction = prompt_instructions.get(prompt_type, prompt_instructions["general"])
    
    payload = {
        "inputs": instruction,
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
        return get_default_prompt(prompt_type)
    
    except requests.exceptions.RequestException as e:
        print(f"Error calling Hugging Face API for prompt generation: {e}")
        return get_default_prompt(prompt_type)


def generate_affirmation(user_emotions=None, user_themes=None):
    """
    Generate a positive affirmation using Hugging Face API,
    personalized based on the user's emotions if available
    
    Args:
        user_emotions (list, optional): List of user's recent emotions
        user_themes (list, optional): List of themes from user's recent entries
    
    Returns:
        str: A positive affirmation
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Personalize the affirmation based on user's dominant emotion/theme
    affirmation_type = "general"
    
    if user_emotions:
        # Check for dominant emotions
        if any(e.get('label', '').lower() in ['joy', 'happiness'] and e.get('score', 0) > 0.4 for e in user_emotions):
            affirmation_type = "joy"
        elif any(e.get('label', '').lower() in ['sadness'] and e.get('score', 0) > 0.4 for e in user_emotions):
            affirmation_type = "sadness"
        elif any(e.get('label', '').lower() in ['fear', 'anxiety'] and e.get('score', 0) > 0.4 for e in user_emotions):
            affirmation_type = "anxiety"
        elif any(e.get('label', '').lower() in ['anger', 'disgust'] and e.get('score', 0) > 0.4 for e in user_emotions):
            affirmation_type = "anger"
    
    # Define instructions for different types of affirmations
    affirmation_instructions = {
        "general": "Generate a short, positive daily affirmation for emotional well-being:",
        "joy": "Generate a short, grounding affirmation for someone experiencing joy, to help them savor the positive emotion:",
        "sadness": "Generate a short, comforting affirmation for someone feeling sadness, to provide gentle support:",
        "anxiety": "Generate a short, calming affirmation for someone experiencing anxiety, to help them feel more centered:",
        "anger": "Generate a short, balanced affirmation for someone feeling anger, to help them process the emotion constructively:"
    }
    
    # If there are specific themes, prioritize those
    if user_themes:
        if "stress" in user_themes:
            affirmation_type = "anxiety"  # Use anxiety-focused affirmations for stress
        elif "health" in user_themes:
            affirmation_type = "health"
            affirmation_instructions["health"] = "Generate a short, supportive affirmation focused on physical and mental well-being:"
        elif "relationships" in user_themes:
            affirmation_type = "relationships"
            affirmation_instructions["relationships"] = "Generate a short, positive affirmation focused on healthy relationships and connections:"
        elif "growth" in user_themes:
            affirmation_type = "growth"
            affirmation_instructions["growth"] = "Generate a short, empowering affirmation focused on personal growth and development:"
    
    instruction = affirmation_instructions.get(affirmation_type, affirmation_instructions["general"])
    
    payload = {
        "inputs": instruction,
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
        return get_default_affirmation(affirmation_type)
    
    except requests.exceptions.RequestException as e:
        print(f"Error calling Hugging Face API for affirmation generation: {e}")
        return get_default_affirmation(affirmation_type)


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
    
    # Extract potential topics/themes from the content
    topics = extract_themes_from_content(content)
    topic_text = ", ".join(topics) if topics else "no specific topics"
    
    # Define instruction for the model
    input_text = f"""
    Based on a journal entry, I detected these emotions: {emotion_text}. 
    The entry discusses topics like: {topic_text}. 
    The entry includes: {content[:150]}...
    
    Generate a short, supportive, and personalized reflection that:
    1. Acknowledges the emotions in an empathetic way
    2. Offers a perspective that might be helpful
    3. Ends with a gentle suggestion or question for further exploration
    
    Keep the tone warm and supportive, and focus on their emotional experience:
    """
    
    payload = {
        "inputs": input_text,
        "parameters": {
            "max_length": 200,
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


def extract_themes_from_content(content):
    """
    Extract potential themes/topics from journal content
    
    Args:
        content (str): The journal entry content
        
    Returns:
        list: List of potential themes/topics
    """
    # Simple keyword-based extraction
    themes = []
    
    # Topic categories with related keywords
    topic_keywords = {
        "work": ["job", "career", "boss", "office", "colleague", "meeting", "project", "deadline", "work"],
        "relationships": ["friend", "partner", "family", "relationship", "date", "love", "marriage", "boyfriend", "girlfriend", "husband", "wife"],
        "health": ["health", "sick", "doctor", "pain", "exercise", "workout", "diet", "sleep", "tired", "energy"],
        "stress": ["stress", "anxiety", "worry", "overwhelm", "pressure", "burnout", "tension"],
        "achievement": ["success", "achieve", "goal", "accomplish", "proud", "progress", "milestone"],
        "creativity": ["creative", "art", "music", "write", "paint", "play", "hobby", "create"],
        "finance": ["money", "finance", "budget", "cost", "afford", "expense", "saving", "debt", "pay"],
        "growth": ["learn", "grow", "improve", "develop", "change", "better", "progress"],
        "gratitude": ["grateful", "thankful", "appreciate", "blessed", "fortunate", "lucky"]
    }
    
    # Check for each topic in the content
    content_lower = content.lower()
    for topic, keywords in topic_keywords.items():
        for keyword in keywords:
            if keyword in content_lower:
                themes.append(topic)
                break  # Found one keyword for this topic, no need to check others
    
    return themes


# Default content if API calls fail
def get_default_prompt(prompt_type="general"):
    # Dictionary of prompt categories with list of prompts for each
    themed_prompts = {
        "general": [
            "What made you feel grateful today, and how did those moments affect your overall mood?",
            "Describe a challenging emotion you experienced recently. What triggered it, and how did you cope?",
            "Reflect on a recent interaction that impacted your emotions. What did you learn about yourself?",
            "What activities or people consistently bring you joy? How can you incorporate more of these into your life?",
            "Describe a moment today when you felt at peace. What elements contributed to this feeling?",
            "What worries have been on your mind lately? Try to explore where these concerns stem from."
        ],
        "gratitude": [
            "List three unexpected moments of joy you experienced today. What made them special?",
            "What's something simple in your life that you might be taking for granted? How does it enrich your daily experience?",
            "Who has positively influenced your life recently, and what specific actions made you feel grateful to them?",
            "Think about a challenge you're currently facing. Can you find any hidden blessings or opportunities for growth within it?",
            "Describe something beautiful you noticed today that others might have missed. How did it make you feel?"
        ],
        "growth": [
            "What emotion has been most challenging for you to process lately? How might accepting this emotion help you grow?",
            "Describe a recent mistake or setback. What lessons or insights have you gained from this experience?",
            "What personal quality would you like to develop further? What small step could you take tomorrow to nurture this quality?",
            "Think of someone you admire. What specific quality do they embody that you'd like to cultivate in yourself?",
            "What limiting belief might be holding you back right now? How would your life change if you let it go?"
        ],
        "reflection": [
            "When you felt frustrated or angry recently, what need wasn't being met? How might you address this need differently next time?",
            "Think about a recent disappointment. How might this experience look different when viewed from a different perspective?",
            "Describe a situation where you wish you had responded differently. What would that response have looked like?",
            "What boundaries might you need to establish or reinforce in your life right now? What's making this difficult?",
            "Think about a recurring thought or feeling that troubles you. What might it be trying to tell you?"
        ],
        "relationships": [
            "How do you show care to the important people in your life? How do they show care to you?",
            "Think about a relationship that feels nurturing. What specific elements make it supportive and positive?",
            "Is there a conversation you've been avoiding with someone? What fears or concerns are holding you back?",
            "What qualities do you value most in your close relationships? How do you embody these qualities yourself?",
            "Think about a miscommunication you've experienced recently. What might have helped create better understanding?"
        ],
        "stress": [
            "What activities help you feel most centered when you're overwhelmed? How can you incorporate more of these into your routine?",
            "Identify your three biggest sources of stress right now. Which of these can you influence or change?",
            "How does your body signal to you that you're feeling stressed? What self-care practices help address these physical symptoms?",
            "What boundaries could you establish to protect your energy and well-being?",
            "Think about a current worry. What's the worst that could happen? What resources do you have to handle this scenario?"
        ],
        "health": [
            "How would you describe your relationship with your body today? What small act of kindness could you offer it?",
            "What activities make you feel physically strong and vital? How could you prioritize these this week?",
            "How does your emotional state affect your physical well-being? What patterns have you noticed?",
            "What aspect of your health routine makes you feel most centered and balanced? Why do you think that is?",
            "What's one small health-related habit you'd like to develop? What's the first tiny step you could take?"
        ],
        "creativity": [
            "When do you feel most creatively alive? What elements or conditions contribute to this state?",
            "What creative pursuit have you been curious about but haven't tried yet? What's holding you back?",
            "How does engaging in creative activities affect your mood and energy? What patterns have you noticed?",
            "Think of a creative project you'd like to start or continue. What small step could you take today?",
            "How has your creative expression evolved over time? What influences have shaped your creative journey?"
        ]
    }
    
    # Get the prompts for the requested type, or use general if the type doesn't exist
    prompts = themed_prompts.get(prompt_type, themed_prompts["general"])
    
    # Return a random prompt from the selected category
    return random.choice(prompts)


def get_default_affirmation(affirmation_type="general"):
    # Dictionary of affirmation categories with list of affirmations for each
    themed_affirmations = {
        "general": [
            "I acknowledge my emotions and treat myself with compassion. Each day is an opportunity for growth.",
            "My feelings are valid, and I give myself permission to experience them fully.",
            "I am growing more aware of my emotions every day and learning from them.",
            "I trust in my ability to navigate difficult emotions with grace and patience.",
            "I am worthy of happiness, peace, and emotional well-being.",
            "Today I choose to focus on positive thoughts and nurture my emotional health."
        ],
        "joy": [
            "I savor this moment of joy and let it nourish my spirit.",
            "I am grateful for the happiness in my life and allow myself to fully experience it.",
            "Joy is my natural state of being, and I welcome it with an open heart.",
            "I deserve to experience happiness and will carry this feeling forward.",
            "This moment of joy is teaching me about what truly matters in my life."
        ],
        "sadness": [
            "My sadness is teaching me something important, and I listen with compassion.",
            "I honor my feelings of sadness without judgment and treat myself with extra kindness today.",
            "This difficult emotion will pass, and I have the strength to move through it.",
            "I embrace all my emotions, including sadness, as part of my human experience.",
            "Even in moments of sadness, I am worthy of love and gentleness."
        ],
        "anxiety": [
            "I am safe in this moment, and I can breathe through any feelings of anxiety.",
            "My anxious thoughts are not facts, and I can choose to release them.",
            "I have successfully navigated challenging situations before, and I can do so again.",
            "I give myself permission to take one small step at a time.",
            "As I breathe deeply, I return to the present moment where I am safe."
        ],
        "anger": [
            "I acknowledge my anger and choose to respond rather than react.",
            "My anger is information, and I can use it constructively.",
            "I have the power to transform this energy into positive action.",
            "I can feel angry and still make wise choices that align with my values.",
            "As I release judgment, I create space for understanding and peace."
        ],
        "health": [
            "I listen to my body's wisdom and honor its needs.",
            "Each choice I make for my well-being matters and builds toward my health.",
            "I deserve to prioritize my physical and mental health.",
            "My body is remarkable, and I treat it with respect and gratitude.",
            "I nourish myself with care, patience, and loving attention."
        ],
        "relationships": [
            "I attract relationships that nurture my growth and bring me joy.",
            "I communicate my needs with clarity and listen with an open heart.",
            "I am worthy of deep connection and authentic relationships.",
            "I bring my true self to my relationships and allow others to do the same.",
            "As I cultivate self-love, my relationships become more fulfilling."
        ],
        "growth": [
            "Every challenge presents an opportunity for me to grow stronger.",
            "I embrace change as a pathway to discovering new parts of myself.",
            "I am constantly evolving and becoming more of who I truly am.",
            "My journey is uniquely mine, and I trust my path even when it's unclear.",
            "I celebrate my progress, no matter how small the steps may seem."
        ]
    }
    
    # Get the affirmations for the requested type, or use general if the type doesn't exist
    affirmations = themed_affirmations.get(affirmation_type, themed_affirmations["general"])
    
    # Return a random affirmation from the selected category
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
