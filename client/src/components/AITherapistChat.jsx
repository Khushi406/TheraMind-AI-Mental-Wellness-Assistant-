import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { chatWithAI } from '../lib/api';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Heart, 
  Lightbulb, 
  CheckCircle,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

const AITherapistChat = ({ isEmbedded = false, journalContent = '' }) => {
  const [isOpen, setIsOpen] = useState(isEmbedded ? true : false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your AI wellness companion. I'm here to listen, support, and help you explore your feelings. Start writing in your journal, and I'll provide real-time support and insights.",
      emotionalTone: 'welcoming',
      supportType: 'validation',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastAnalyzedLength, setLastAnalyzedLength] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const analysisTimerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Real-time journal analysis
  useEffect(() => {
    if (!journalContent || journalContent.trim().length < 50) {
      return;
    }

    const contentDiff = Math.abs(journalContent.length - lastAnalyzedLength);
    if (contentDiff < 50) {
      return;
    }

    // Clear existing timer
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
    }

    // Set new timer for analysis
    analysisTimerRef.current = setTimeout(async () => {
      setLastAnalyzedLength(journalContent.length);
      await analyzeJournalContent(journalContent);
    }, 3000);

    return () => {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
      }
    };
  }, [journalContent, lastAnalyzedLength]);

  const analyzeJournalContent = async (content) => {
    setIsTyping(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const analysisPrompt = `The user is writing in their journal: "${content}"

As their compassionate AI therapist, provide a thoughtful, empathetic response that:
1. VALIDATES their emotions and experiences
2. REFLECTS back what you heard them say (shows you're listening)
3. HIGHLIGHTS the positive patterns or strengths you notice
4. ACKNOWLEDGES the difficulty of what they're going through
5. Offers gentle encouragement and support

Be warm, personal, and specific to what they wrote. Keep it 2-4 sentences.`;

      const aiResponse = await chatWithAI(analysisPrompt, conversationHistory);
      
      const assistantMessage = {
        id: Date.now(),
        role: 'assistant',
        content: aiResponse.response,
        emotionalTone: aiResponse.emotionalTone,
        supportType: aiResponse.supportType,
        followUpQuestions: aiResponse.followUpQuestions,
        timestamp: aiResponse.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Journal analysis error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Prepare conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get AI response
      const aiResponse = await chatWithAI(inputMessage, conversationHistory);
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiResponse.response,
        emotionalTone: aiResponse.emotionalTone,
        supportType: aiResponse.supportType,
        followUpQuestions: aiResponse.followUpQuestions,
        timestamp: aiResponse.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm experiencing some technical difficulties, but I want you to know that I'm still here for you. Your feelings are valid and important.",
        emotionalTone: 'supportive',
        supportType: 'validation',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSupportTypeIcon = (supportType) => {
    switch (supportType) {
      case 'validation': return <Heart className="w-3 h-3" />;
      case 'guidance': return <Lightbulb className="w-3 h-3" />;
      case 'encouragement': return <CheckCircle className="w-3 h-3" />;
      default: return <Bot className="w-3 h-3" />;
    }
  };

  const getSupportTypeColor = (supportType) => {
    switch (supportType) {
      case 'validation': return 'bg-red-100 text-red-800';
      case 'guidance': return 'bg-yellow-100 text-yellow-800';
      case 'encouragement': return 'bg-green-100 text-green-800';
      case 'information': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // If embedded, don't show the floating button
  if (!isOpen && !isEmbedded) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  // If embedded mode and not open, return null
  if (!isOpen && isEmbedded) {
    return null;
  }

  return (
    <Card className={`${
      isEmbedded 
        ? 'w-full bg-white shadow-lg border' 
        : 'fixed bottom-6 right-6 w-96 bg-white shadow-xl border-0 z-50'
    } transition-all duration-300 ${
      isMinimized ? 'h-16' : isEmbedded ? 'h-[600px]' : 'h-[600px]'
    }`}>
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <CardTitle className="text-lg font-semibold">AI Wellness Companion</CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            {!isEmbedded && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 h-full flex flex-col">
          {/* Messages */}
          <ScrollArea className={`flex-1 p-4 ${isEmbedded ? 'max-h-[450px]' : 'max-h-[450px]'}`}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800 border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* AI message metadata */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mt-2">
                        {message.supportType && (
                          <Badge variant="outline" className={`text-xs ${getSupportTypeColor(message.supportType)}`}>
                            {getSupportTypeIcon(message.supportType)}
                            <span className="ml-1 capitalize">{message.supportType}</span>
                          </Badge>
                        )}
                        {message.emotionalTone && (
                          <Badge variant="outline" className="text-xs">
                            {message.emotionalTone}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Follow-up questions */}
                    {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.followUpQuestions.map((question, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 bg-white hover:bg-gray-50"
                            onClick={() => setInputMessage(question)}
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Avatar */}
                  <div className={`flex items-end ${message.role === 'user' ? 'order-2 ml-2' : 'order-1 mr-2'}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          {/* Input */}
          <div className="p-4">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputMessage.trim() || isTyping}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💙 I'm here to listen and support you. Remember, I'm an AI assistant and not a replacement for professional therapy.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AITherapistChat;