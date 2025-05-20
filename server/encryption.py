import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Default encryption key - in production, this would be stored securely
# and not hardcoded in the source code
DEFAULT_ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY", "TheraMind_DefaultSecretKey")

class EncryptionManager:
    """
    Class to handle encryption and decryption of sensitive data
    """
    
    def __init__(self, encryption_key=None):
        """
        Initialize the encryption manager
        
        Args:
            encryption_key (str, optional): Custom encryption key
        """
        # Use provided key or default key
        self.encryption_key = encryption_key or DEFAULT_ENCRYPTION_KEY
        
        # Generate a Fernet key from the encryption key
        salt = b'TheraMind_salt'  # In production, use a secure random salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.encryption_key.encode()))
        
        self.cipher = Fernet(key)
    
    def encrypt(self, data):
        """
        Encrypt data
        
        Args:
            data (str): Data to encrypt
            
        Returns:
            str: Encrypted data as base64 string
        """
        if not data:
            return None
            
        encrypted_data = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data):
        """
        Decrypt data
        
        Args:
            encrypted_data (str): Encrypted data as base64 string
            
        Returns:
            str: Decrypted data
        """
        if not encrypted_data:
            return None
            
        try:
            # Decode base64 and decrypt
            decoded_data = base64.b64decode(encrypted_data)
            decrypted_data = self.cipher.decrypt(decoded_data)
            
            return decrypted_data.decode()
        except Exception as e:
            print(f"Error decrypting data: {e}")
            # Return the original data if decryption fails
            return encrypted_data

# Create a singleton instance
encryption_manager = EncryptionManager()