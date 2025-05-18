import json
import os
from datetime import datetime

class DataStorage:
    """
    Class to handle storage of journal entries and emotions in a JSON file
    """
    
    def __init__(self, filename="data.json"):
        """
        Initialize the data storage
        
        Args:
            filename (str): Name of the JSON file to store data
        """
        self.filename = filename
        self.ensure_file_exists()
    
    def ensure_file_exists(self):
        """
        Create the data file if it doesn't exist
        """
        if not os.path.exists(self.filename):
            with open(self.filename, 'w') as f:
                json.dump({"entries": []}, f)
    
    def save_entry(self, content, emotions, reflection, timestamp):
        """
        Save a journal entry with emotions and timestamp
        
        Args:
            content (str): The journal entry content
            emotions (list): List of emotions with scores
            reflection (str): AI-generated reflection
            timestamp (str): ISO format timestamp
            
        Returns:
            int: The ID of the saved entry
        """
        # Load existing data
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            # If file is empty or doesn't exist, start with empty data
            data = {"entries": []}
        
        # Assign an ID to the new entry
        entry_id = len(data["entries"]) + 1
        
        # Create the entry object
        entry = {
            "id": entry_id,
            "content": content,
            "emotions": emotions,
            "reflection": reflection,
            "timestamp": timestamp
        }
        
        # Add to entries and save
        data["entries"].append(entry)
        
        with open(self.filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        return entry_id
    
    def get_all_entries(self):
        """
        Get all journal entries
        
        Returns:
            list: List of all entries with their data
        """
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
            
            # Sort entries by timestamp (newest first)
            entries = data.get("entries", [])
            entries.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            return entries
        
        except (json.JSONDecodeError, FileNotFoundError):
            # Return empty list if file doesn't exist or is empty
            return []
    
    def get_entry_by_id(self, entry_id):
        """
        Get a specific entry by ID
        
        Args:
            entry_id (int): The ID of the entry to retrieve
            
        Returns:
            dict: The entry data or None if not found
        """
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
            
            for entry in data.get("entries", []):
                if entry.get("id") == entry_id:
                    return entry
            
            return None
        
        except (json.JSONDecodeError, FileNotFoundError):
            return None
