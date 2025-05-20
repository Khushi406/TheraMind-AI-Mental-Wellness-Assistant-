import json
import os
from datetime import datetime, timedelta
import time
from encryption import encryption_manager

class DataStorage:
    """
    Class to handle storage of journal entries and emotions in a JSON file
    with encryption support for privacy
    """
    
    def __init__(self, filename="data.json"):
        """
        Initialize the data storage
        
        Args:
            filename (str): Name of the JSON file to store data
        """
        self.filename = filename
        self.ensure_file_exists()
        self.encryption_enabled = True  # Set to True to enable encryption
    
    def ensure_file_exists(self):
        """
        Create the data file if it doesn't exist
        """
        if not os.path.exists(self.filename):
            with open(self.filename, 'w') as f:
                json.dump({
                    "entries": [],
                    "user": {
                        "streak": 0,
                        "last_entry_date": "",
                        "badges": [],
                        "total_entries": 0,
                        "level": 1,
                        "pin_protected": False,
                        "pin": None  # Will be hashed if set
                    }
                }, f)
    
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
            data = {
                "entries": [],
                "user": {
                    "streak": 0,
                    "last_entry_date": "",
                    "badges": [],
                    "total_entries": 0,
                    "level": 1,
                    "pin_protected": False,
                    "pin": None
                }
            }
        
        # Assign an ID to the new entry
        entry_id = len(data["entries"]) + 1
        
        # Create the entry object
        entry = {
            "id": entry_id,
            "content": encryption_manager.encrypt(content) if self.encryption_enabled else content,
            "emotions": emotions,  # Not encrypted as needed for analytics
            "reflection": encryption_manager.encrypt(reflection) if self.encryption_enabled else reflection,
            "timestamp": timestamp
        }
        
        # Add to entries
        data["entries"].append(entry)
        
        # Update user stats
        self.update_user_stats(data, timestamp)
        
        # Save the updated data
        with open(self.filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        return entry_id
    
    def update_user_stats(self, data, timestamp):
        """
        Update user statistics based on the new entry
        
        Args:
            data (dict): The current data object
            timestamp (str): ISO format timestamp of the new entry
        """
        # Initialize user data if it doesn't exist
        if "user" not in data:
            data["user"] = {
                "streak": 0,
                "last_entry_date": "",
                "badges": [],
                "total_entries": 0,
                "level": 1,
                "pin_protected": False,
                "pin": None
            }
        
        # Update total entries
        data["user"]["total_entries"] = len(data["entries"])
        
        # Calculate streak
        entry_date = timestamp.split('T')[0]  # Get date part only
        
        if data["user"]["last_entry_date"]:
            last_date = datetime.fromisoformat(data["user"]["last_entry_date"].replace('Z', '+00:00'))
            current_date = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            # Check if this is a consecutive day
            date_diff = (current_date.date() - last_date.date()).days
            
            if date_diff == 1:
                # Entry is for consecutive day
                data["user"]["streak"] += 1
            elif date_diff == 0:
                # Same day, streak doesn't change
                pass
            else:
                # Streak broken
                data["user"]["streak"] = 1
        else:
            # First entry
            data["user"]["streak"] = 1
        
        # Update last entry date
        data["user"]["last_entry_date"] = timestamp
        
        # Update level (1 level per 10 entries)
        data["user"]["level"] = max(1, (data["user"]["total_entries"] // 10) + 1)
        
        # Add badges based on achievements
        self.update_badges(data)
    
    def update_badges(self, data):
        """
        Update badges based on user achievements
        
        Args:
            data (dict): The current data object
        """
        badges = data["user"].get("badges", [])
        
        # Streak badges
        if data["user"]["streak"] >= 3 and "streak_3" not in badges:
            badges.append("streak_3")
        if data["user"]["streak"] >= 7 and "streak_7" not in badges:
            badges.append("streak_7")
        if data["user"]["streak"] >= 30 and "streak_30" not in badges:
            badges.append("streak_30")
        
        # Entry count badges
        if data["user"]["total_entries"] >= 5 and "entries_5" not in badges:
            badges.append("entries_5")
        if data["user"]["total_entries"] >= 20 and "entries_20" not in badges:
            badges.append("entries_20")
        if data["user"]["total_entries"] >= 50 and "entries_50" not in badges:
            badges.append("entries_50")
        
        # Update badges
        data["user"]["badges"] = badges
    
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
            
            # Decrypt content and reflection if encryption is enabled
            if self.encryption_enabled:
                for entry in entries:
                    if "content" in entry:
                        entry["content"] = encryption_manager.decrypt(entry["content"])
                    if "reflection" in entry:
                        entry["reflection"] = encryption_manager.decrypt(entry["reflection"])
            
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
                    # Decrypt content and reflection if encryption is enabled
                    if self.encryption_enabled:
                        if "content" in entry:
                            entry["content"] = encryption_manager.decrypt(entry["content"])
                        if "reflection" in entry:
                            entry["reflection"] = encryption_manager.decrypt(entry["reflection"])
                    return entry
            
            return None
        
        except (json.JSONDecodeError, FileNotFoundError):
            return None
    
    def get_user_stats(self):
        """
        Get user statistics
        
        Returns:
            dict: User stats including streak, badges, etc.
        """
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
            
            return data.get("user", {
                "streak": 0,
                "last_entry_date": "",
                "badges": [],
                "total_entries": 0,
                "level": 1,
                "pin_protected": False
            })
        
        except (json.JSONDecodeError, FileNotFoundError):
            return {
                "streak": 0,
                "last_entry_date": "",
                "badges": [],
                "total_entries": 0,
                "level": 1,
                "pin_protected": False
            }
    
    def get_weekly_summary(self):
        """
        Get a summary of the past week's emotions and entries
        
        Returns:
            dict: Weekly summary data
        """
        entries = self.get_all_entries()
        
        # Calculate the date for one week ago
        one_week_ago = datetime.now() - timedelta(days=7)
        
        # Filter entries from the past week
        weekly_entries = []
        for entry in entries:
            entry_date = datetime.fromisoformat(entry.get("timestamp", "").replace('Z', '+00:00'))
            if entry_date >= one_week_ago:
                weekly_entries.append(entry)
        
        # Calculate statistics
        emotion_counts = {}
        emotion_scores = {}
        
        for entry in weekly_entries:
            for emotion in entry.get("emotions", []):
                emotion_name = emotion.get("label", "").lower()
                emotion_counts[emotion_name] = emotion_counts.get(emotion_name, 0) + 1
                emotion_scores[emotion_name] = emotion_scores.get(emotion_name, 0) + emotion.get("score", 0)
        
        # Calculate average scores
        avg_emotion_scores = {}
        for emotion, count in emotion_counts.items():
            if count > 0:
                avg_emotion_scores[emotion] = emotion_scores[emotion] / count
        
        # Get the dominant emotion
        dominant_emotion = None
        highest_score = 0
        for emotion, score in avg_emotion_scores.items():
            if score > highest_score:
                highest_score = score
                dominant_emotion = emotion
        
        return {
            "entry_count": len(weekly_entries),
            "emotion_counts": emotion_counts,
            "avg_emotion_scores": avg_emotion_scores,
            "dominant_emotion": dominant_emotion
        }
    
    def get_monthly_summary(self):
        """
        Get a summary of the past month's emotions and entries
        
        Returns:
            dict: Monthly summary data
        """
        entries = self.get_all_entries()
        
        # Calculate the date for one month ago
        one_month_ago = datetime.now() - timedelta(days=30)
        
        # Filter entries from the past month
        monthly_entries = []
        for entry in entries:
            entry_date = datetime.fromisoformat(entry.get("timestamp", "").replace('Z', '+00:00'))
            if entry_date >= one_month_ago:
                monthly_entries.append(entry)
        
        # Calculate statistics
        emotion_counts = {}
        emotion_scores = {}
        daily_entry_counts = {}
        
        for entry in monthly_entries:
            # Process emotions
            for emotion in entry.get("emotions", []):
                emotion_name = emotion.get("label", "").lower()
                emotion_counts[emotion_name] = emotion_counts.get(emotion_name, 0) + 1
                emotion_scores[emotion_name] = emotion_scores.get(emotion_name, 0) + emotion.get("score", 0)
            
            # Count entries per day
            entry_date = datetime.fromisoformat(entry.get("timestamp", "").replace('Z', '+00:00'))
            date_str = entry_date.strftime("%Y-%m-%d")
            daily_entry_counts[date_str] = daily_entry_counts.get(date_str, 0) + 1
        
        # Calculate average scores
        avg_emotion_scores = {}
        for emotion, count in emotion_counts.items():
            if count > 0:
                avg_emotion_scores[emotion] = emotion_scores[emotion] / count
        
        # Calculate average entries per week
        weeks_in_month = 4.345  # Approximate
        total_entries = len(monthly_entries)
        avg_entries_per_week = total_entries / weeks_in_month if weeks_in_month > 0 else 0
        
        return {
            "entry_count": total_entries,
            "emotion_counts": emotion_counts,
            "avg_emotion_scores": avg_emotion_scores,
            "avg_entries_per_week": avg_entries_per_week,
            "days_with_entries": len(daily_entry_counts)
        }
    
    def set_pin_protection(self, pin):
        """
        Set PIN protection for the journal
        
        Args:
            pin (str): PIN code
            
        Returns:
            bool: Success flag
        """
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
            
            # Simple hash for the PIN (in production, use a proper password hashing algorithm)
            hashed_pin = str(hash(pin))
            
            if "user" not in data:
                data["user"] = {
                    "streak": 0,
                    "last_entry_date": "",
                    "badges": [],
                    "total_entries": 0,
                    "level": 1,
                    "pin_protected": True,
                    "pin": hashed_pin
                }
            else:
                data["user"]["pin_protected"] = True
                data["user"]["pin"] = hashed_pin
            
            with open(self.filename, 'w') as f:
                json.dump(data, f, indent=2)
            
            return True
        
        except (json.JSONDecodeError, FileNotFoundError, Exception) as e:
            print(f"Error setting PIN protection: {e}")
            return False
    
    def verify_pin(self, pin):
        """
        Verify the PIN code
        
        Args:
            pin (str): PIN code to verify
            
        Returns:
            bool: True if PIN is correct
        """
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
            
            if "user" not in data or not data["user"].get("pin_protected", False):
                # No PIN protection
                return True
            
            # Simple hash verification (in production, use a proper password verification)
            hashed_pin = str(hash(pin))
            stored_pin = data["user"].get("pin")
            
            return hashed_pin == stored_pin
        
        except (json.JSONDecodeError, FileNotFoundError, Exception) as e:
            print(f"Error verifying PIN: {e}")
            return False
