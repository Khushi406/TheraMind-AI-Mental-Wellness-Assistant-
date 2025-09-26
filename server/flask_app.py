from flask import Flask, request, jsonify
import os
from flask_cors import CORS
import json
from datetime import datetime
import huggingface_api
import data_storage
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create data storage instance
storage = data_storage.DataStorage()

@app.route('/api/analyze', methods=['POST'])
def analyze_entry():
    """
    Analyze a journal entry for emotions and save it to storage
    """
    if not request.json or 'content' not in request.json:
        return jsonify({'message': 'Missing content in request'}), 400
    
    content = request.json['content']
    
    try:
        # Get emotion analysis from Hugging Face
        emotions = huggingface_api.analyze_emotion(content)
        
        # Generate a reflection based on the emotions
        reflection = huggingface_api.generate_reflection(content, emotions)
        
        # Create timestamp
        timestamp = datetime.now().isoformat()
        
        # Save to data storage
        entry_id = storage.save_entry(content, emotions, reflection, timestamp)
        
        # Return analysis results
        return jsonify({
            'id': entry_id,
            'emotions': emotions,
            'reflection': reflection,
            'timestamp': timestamp
        })
    
    except Exception as e:
        print(f"Error analyzing entry: {str(e)}")
        return jsonify({'message': f'Error analyzing entry: {str(e)}'}), 500


@app.route('/api/prompt', methods=['GET'])
def get_prompt():
    """
    Generate a journaling prompt and affirmation,
    personalized based on user's recent emotions and topics
    """
    try:
        # Get the most recent emotions and topics from entries
        entries = storage.get_all_entries()
        
        # Default values if no entries exist
        recent_emotions = None
        recent_themes = None
        
        if entries and len(entries) > 0:
            # Get the most recent entry
            recent_entry = entries[0]
            
            # Extract emotions
            if 'emotions' in recent_entry:
                recent_emotions = recent_entry['emotions']
            
            # Extract themes from content
            if 'content' in recent_entry:
                recent_themes = huggingface_api.extract_themes_from_content(recent_entry['content'])
        
        # Generate personalized prompt and affirmation
        prompt = huggingface_api.generate_prompt(user_emotions=recent_emotions, user_themes=recent_themes)
        affirmation = huggingface_api.generate_affirmation(user_emotions=recent_emotions, user_themes=recent_themes)
        
        return jsonify({
            'prompt': prompt,
            'affirmation': affirmation
        })
    
    except Exception as e:
        print(f"Error generating prompt: {str(e)}")
        return jsonify({'message': f'Error generating prompt: {str(e)}'}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """
    Get all journal entries with their emotion data
    """
    try:
        # Check PIN protection if provided
        pin = request.args.get('pin')
        if pin and not storage.verify_pin(pin):
            return jsonify({'message': 'Invalid PIN code'}), 401
        
        entries = storage.get_all_entries()
        return jsonify({'entries': entries})
    
    except Exception as e:
        print(f"Error retrieving history: {str(e)}")
        return jsonify({'message': f'Error retrieving history: {str(e)}'}), 500


@app.route('/api/stats', methods=['GET'])
def get_user_stats():
    """
    Get user statistics including streak, badges, level, etc.
    """
    try:
        stats = storage.get_user_stats()
        return jsonify(stats)
    
    except Exception as e:
        print(f"Error retrieving user stats: {str(e)}")
        return jsonify({'message': f'Error retrieving user stats: {str(e)}'}), 500


@app.route('/api/summary/weekly', methods=['GET'])
def get_weekly_summary():
    """
    Get weekly summary of emotions and entries
    """
    try:
        summary = storage.get_weekly_summary()
        return jsonify(summary)
    
    except Exception as e:
        print(f"Error retrieving weekly summary: {str(e)}")
        return jsonify({'message': f'Error retrieving weekly summary: {str(e)}'}), 500


@app.route('/api/summary/monthly', methods=['GET'])
def get_monthly_summary():
    """
    Get monthly summary of emotions and entries
    """
    try:
        summary = storage.get_monthly_summary()
        return jsonify(summary)
    
    except Exception as e:
        print(f"Error retrieving monthly summary: {str(e)}")
        return jsonify({'message': f'Error retrieving monthly summary: {str(e)}'}), 500


@app.route('/api/security/pin', methods=['POST'])
def set_pin_protection():
    """
    Set PIN protection for the journal
    """
    try:
        if not request.json or 'pin' not in request.json:
            return jsonify({'message': 'Missing PIN in request'}), 400
        
        pin = request.json['pin']
        
        # Validate PIN (simple 4-digit validation)
        if not pin.isdigit() or len(pin) != 4:
            return jsonify({'message': 'PIN must be a 4-digit number'}), 400
        
        # Set PIN protection
        success = storage.set_pin_protection(pin)
        
        if success:
            return jsonify({'message': 'PIN protection enabled successfully'})
        else:
            return jsonify({'message': 'Failed to enable PIN protection'}), 500
    
    except Exception as e:
        print(f"Error setting PIN protection: {str(e)}")
        return jsonify({'message': f'Error setting PIN protection: {str(e)}'}), 500


if __name__ == '__main__':
    # Check if running in development mode
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    
    # Start the Flask app
    app.run(host='0.0.0.0', port=8000, debug=debug_mode)
