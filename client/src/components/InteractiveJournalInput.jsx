import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { submitJournalEntry, chatWithAI } from '../lib/api';
import { Brain, Sparkles, Heart, TrendingUp, Lightbulb, MessageCircle, Send, Bot, User, CheckCircle, Minimize2, Maximize2 } from 'lucide-react';

export default function InteractiveJournalInput({ onSuccess, onContentChange }) {
  const [journalEntry, setJournalEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your AI wellness companion. Start writing in your journal above, and I'll provide real-time support and insights.",
      emotionalTone: 'welcoming',
      supportType: 'validation',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastAnalyzedLength, setLastAnalyzedLength] = useState(0);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const analysisTimerRef = useRef(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time journal analysis
  useEffect(() => {
    if (!journalEntry || journalEntry.trim().length < 50) {
      return;
    }

    const contentDiff = Math.abs(journalEntry.length - lastAnalyzedLength);
    if (contentDiff < 50) {
      return;
    }

    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
    }

    analysisTimerRef.current = setTimeout(async () => {
      setLastAnalyzedLength(journalEntry.length);
      await analyzeJournalContent(journalEntry);
    }, 3000);

    return () => {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
      }
    };
  }, [journalEntry, lastAnalyzedLength]);

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
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

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
        content: "I'm here for you. Your feelings are important.",
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

  const handleContentChange = (e) => {
    const content = e.target.value;
    setJournalEntry(content);
    if (onContentChange) {
      onContentChange(content);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!journalEntry.trim()) {
      toast({
        title: "Entry Required",
        description: "Please write something in your journal before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await submitJournalEntry(journalEntry);
      
      toast({
        title: "Journal Entry Saved",
        description: "Your thoughts have been recorded successfully.",
      });
      
      setJournalEntry('');
      setMessages([
        {
          id: 1,
          role: 'assistant',
          content: "Hello! I'm your AI wellness companion. Start writing in your journal above, and I'll provide real-time support and insights.",
          emotionalTone: 'welcoming',
          supportType: 'validation',
          timestamp: new Date().toISOString()
        }
      ]);
      setLastAnalyzedLength(0);
      
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(result);
      }
    } catch (error) {
      toast({
        title: "Error Saving Entry",
        description: error.message || "There was a problem saving your journal entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = journalEntry.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = journalEntry.length;
  const minWords = 10;
  const progress = Math.min((wordCount / minWords) * 100, 100);

  return (
    <Card className="bg-white shadow-lg border-none">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Write Your Journal Entry
          {isTyping && (
            <span className="text-xs text-primary font-normal flex items-center gap-1 ml-auto">
              <Sparkles className="w-3 h-3 animate-pulse" />
              AI is analyzing...
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-neutral-600 mt-2">
          Express your thoughts freely. I'll respond like a therapist to support you as you write.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Journal Textarea */}
          <div className="relative">
            <Textarea
              value={journalEntry}
              onChange={handleContentChange}
              placeholder="How are you feeling today? What's on your mind? Start writing and the AI Companion will respond..."
              className="w-full p-4 border-2 border-neutral-200 rounded-xl min-h-[200px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* AI Therapist Conversation */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-primary/5 to-purple-50 rounded-xl border border-primary/10">
            <div className="flex items-center justify-between text-sm font-medium text-neutral-700 mb-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>AI Therapist Conversation</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className="h-6 w-6"
              >
                {isChatMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
            </div>
            
            {!isChatMinimized && (
              <>
                {/* Messages */}
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
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

                        <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-800 border'
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
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Chat Input */}
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 pt-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Reply to the AI therapist..."
                    className="flex-1 rounded-full text-sm"
                    disabled={isTyping}
                  />
                  <Button 
                    type="submit"
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || isTyping}
                    size="sm"
                    className="rounded-full w-9 h-9 p-0 bg-primary hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            )}
          </div>

          {/* Word Count Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-neutral-600">
              <span>{wordCount} words · {charCount} characters</span>
              <span className={wordCount >= minWords ? 'text-green-600 font-medium' : ''}>
                {wordCount >= minWords ? '✓ Ready to save' : `${minWords - wordCount} more words`}
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-neutral-600">
              <Heart className="w-4 h-4" />
              <span className="text-sm">Your entries are private and secure</span>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || wordCount < minWords}
              className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span>Saving...</span>
                  <Sparkles className="w-4 h-4 ml-2 animate-spin" />
                </>
              ) : (
                <>
                  <span>Save Entry</span>
                  <TrendingUp className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Helpful Tips */}
        {journalEntry.length === 0 && messages.length === 1 && (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">How it works:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Start writing your thoughts and feelings above</li>
                  <li>• After ~50 characters, the AI will analyze and respond below</li>
                  <li>• Chat with the AI for deeper support and insights</li>
                  <li>• Everything is private and confidential</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
