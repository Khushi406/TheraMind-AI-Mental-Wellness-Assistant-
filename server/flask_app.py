from flask import Flask, request, jsonify
import os
from flask_cors import CORS
import json
from datetime import datetime
import huggingface_api
import data_storage

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
    Generate a journaling prompt and affirmation
    """
    try:
        # Get prompt and affirmation from Hugging Face
        prompt = huggingface_api.generate_prompt()
        affirmation = huggingface_api.generate_affirmation()
        
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
        entries = storage.get_all_entries()
        return jsonify({'entries': entries})
    
    except Exception as e:
        print(f"Error retrieving history: {str(e)}")
        return jsonify({'message': f'Error retrieving history: {str(e)}'}), 500


if __name__ == '__main__':
    # Check if running in development mode
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    
    # Start the Flask app
    app.run(host='0.0.0.0', port=8000, debug=debug_mode)
