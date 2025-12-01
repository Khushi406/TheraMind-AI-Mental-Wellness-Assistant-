import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function TherapistChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI therapist assistant. How are you feeling today? Feel free to share anything that\'s on your mind.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const { toast } = useToast();

  // Auto-scroll to the most recent message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to conversation
    const userMessage = message;
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Generate a therapist response using AI
      const response = await generateTherapistResponse(userMessage, conversation);
      
      // Add assistant response to conversation
      setConversation(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: "Unable to generate a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // This function would normally call an API endpoint to get a response
  // For now, we'll simulate responses based on keywords
  const generateTherapistResponse = async (userMessage, conversationHistory) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const message = userMessage.toLowerCase();
    
    // Simple keyword-based responses
    if (message.includes('anxious') || message.includes('anxiety')) {
      return "I hear that you're feeling anxious. Anxiety is a common experience, and it's important to acknowledge these feelings. Can you tell me more about what specifically is causing these feelings?";
    } else if (message.includes('sad') || message.includes('depressed') || message.includes('depression')) {
      return "I'm sorry to hear you're feeling down. Depression and sadness can be difficult to navigate. Have you noticed any particular triggers for these feelings recently?";
    } else if (message.includes('stress') || message.includes('stressed')) {
      return "Stress can feel overwhelming. One approach is to break down what's causing the stress into smaller, more manageable parts. Would you like to explore some stress management techniques?";
    } else if (message.includes('happy') || message.includes('joy') || message.includes('good')) {
      return "I'm glad to hear you're feeling positive! What's contributing to these good feelings today?";
    } else if (message.includes('thank')) {
      return "You're welcome. I'm here to support you whenever you need someone to talk to.";
    } else if (message.includes('help')) {
      return "I'm here to help. Sometimes just expressing your thoughts can provide clarity. Would you like to tell me more about what's on your mind?";
    } else {
      // Default responses for when no keywords match
      const defaultResponses = [
        "Thank you for sharing that with me. How does this situation make you feel?",
        "I understand. Can you tell me more about that?",
        "That's an interesting perspective. How long have you been feeling this way?",
        "I hear you. What do you think would help you in this situation?",
        "It sounds like this is important to you. How has this affected other areas of your life?",
        "I appreciate you opening up. What would be a small step you could take to address this?"
      ];
      
      // Choose a random default response
      return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
  };

  return (
    <>
      {/* Chat button (fixed at bottom right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          className={`rounded-full p-4 shadow-lg flex items-center justify-center ${isOpen ? 'bg-red-500 text-white' : 'bg-primary text-white'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <i className="fas fa-times text-xl"></i>
          ) : (
            <i className="fas fa-comment-medical text-xl"></i>
          )}
        </button>
      </div>
      
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-h-[500px] flex flex-col rounded-2xl shadow-xl bg-white overflow-hidden">
          {/* Chat header */}
          <div className="bg-primary text-white p-4 flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-user-md text-sm"></i>
            </div>
            <div>
              <h3 className="font-medium">AI Therapist Assistant</h3>
              <p className="text-xs text-white/80">Here to listen and support</p>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[300px]">
            <div className="space-y-4">
              {conversation.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-primary/10 text-neutral-800 rounded-tr-none' 
                        : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-2xl bg-neutral-100 text-neutral-800 rounded-tl-none">
                    <div className="flex space-x-2 items-center">
                      <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
          
          {/* Chat input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-200">
            <div className="flex space-x-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[40px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !message.trim()}
                className="rounded-full aspect-square p-2"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}