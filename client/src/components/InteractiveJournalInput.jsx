import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { submitJournalEntry } from '../lib/api';
import { Brain, Sparkles, Heart, TrendingUp, Lightbulb, MessageCircle, Send, Loader2 } from 'lucide-react';

export default function InteractiveJournalInput({ onSuccess }) {
  const [journalEntry, setJournalEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [userReply, setUserReply] = useState('');
  const lastAnalyzedContent = useRef('');
  const { toast } = useToast();

  // AI responds to journal writing
  useEffect(() => {
    if (journalEntry.trim().length < 50) return;
    
    const contentDiff = Math.abs(journalEntry.length - lastAnalyzedContent.current.length);
    if (contentDiff < 50) return;

    const timer = setTimeout(async () => {
      lastAnalyzedContent.current = journalEntry;
      await getAIResponse(journalEntry);
    }, 3000);

    return () => clearTimeout(timer);
  }, [journalEntry]);

  const getAIResponse = async (content) => {
    setIsAiTyping(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `The user wrote in their journal: "${content}"

As their compassionate AI therapist, provide a thoughtful, empathetic response that:
1. VALIDATES their emotions and experiences
2. REFLECTS back what you heard them say (shows you're listening)
3. HIGHLIGHTS the positive patterns or strengths you notice
4. ACKNOWLEDGES the difficulty of what they're going through
5. Offers gentle encouragement and support

Be warm, personal, and specific to what they wrote. Don't just ask questions - give them real therapeutic validation and insight. Keep it 2-4 sentences.`,
          conversationHistory: aiMessages.map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      
      setAiMessages(prev => [...prev, {
        text: data.response,
        isUser: false,
        timestamp: new Date(),
        followUpQuestions: data.followUpQuestions
      }]);
    } catch (error) {
      console.error('AI response error:', error);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleUserReply = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling to parent form
    
    if (!userReply.trim()) return;

    const userMessage = {
      text: userReply,
      isUser: true,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    setUserReply('');
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userReply,
          conversationHistory: aiMessages.map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      
      setAiMessages(prev => [...prev, {
        text: data.response,
        isUser: false,
        timestamp: new Date(),
        followUpQuestions: data.followUpQuestions
      }]);
    } catch (error) {
      console.error('Reply error:', error);
      setAiMessages(prev => [...prev, {
        text: "I'm here for you. Your feelings are important.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsAiTyping(false);
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
      setAiMessages([]);
      
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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
          {isAiTyping && (
            <span className="text-xs text-primary font-normal flex items-center gap-1 ml-auto">
              <Sparkles className="w-3 h-3 animate-pulse" />
              AI is listening...
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
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="How are you feeling today? What's on your mind? Start writing and I'll respond to support you..."
              className="w-full p-4 border-2 border-neutral-200 rounded-xl min-h-[200px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* AI Conversation Thread - Always visible */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-primary/5 to-purple-50 rounded-xl border border-primary/10">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span>AI Therapist Conversation</span>
            </div>
            
            {/* Show messages if any exist */}
            {aiMessages.length > 0 && (
              <>
                {aiMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <Avatar className={`w-8 h-8 flex-shrink-0 ${
                    message.isUser 
                      ? 'bg-blue-100 border-2 border-blue-200' 
                      : 'bg-primary/10 border-2 border-primary/20'
                  }`}>
                    <AvatarFallback className={message.isUser ? 'text-blue-600' : 'text-primary'}>
                      {message.isUser ? (
                        <span className="text-xs font-semibold">You</span>
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Bubble */}
                  <div className={`flex flex-col max-w-[85%] ${message.isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        message.isUser
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white text-neutral-800 rounded-tl-none border border-neutral-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.text}
                      </p>
                    </div>
                    
                    {/* Follow-up questions */}
                    {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.followUpQuestions.map((question, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => setUserReply(question)}
                            className="text-xs text-primary hover:text-primary/80 hover:underline text-left"
                          >
                            💭 {question}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-xs text-neutral-500 mt-1 px-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {/* AI Typing Indicator */}
              {isAiTyping && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 bg-primary/10 border-2 border-primary/20">
                    <AvatarFallback className="text-primary">
                      <Brain className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-neutral-200">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

            </>
            )}
            
            {/* Show welcome message if no conversation yet */}
            {aiMessages.length === 0 && !isAiTyping && (
              <div className="text-center py-6 text-neutral-500 text-sm">
                <Brain className="w-8 h-8 mx-auto mb-2 text-primary/40" />
                <p>Start writing in your journal above, or type a message below to chat with me.</p>
              </div>
            )}

            {/* Reply form - always visible */}
            <form onSubmit={handleUserReply} className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
              <Input
                type="text"
                value={userReply}
                onChange={(e) => setUserReply(e.target.value)}
                placeholder="Chat with the AI therapist..."
                className="flex-1 rounded-full text-sm"
                disabled={isAiTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUserReply(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!userReply.trim() || isAiTyping}
                size="sm"
                className="rounded-full w-9 h-9 p-0 bg-primary hover:bg-primary/90"
                onClick={(e) => e.stopPropagation()}
              >
                {isAiTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
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
        {journalEntry.length === 0 && aiMessages.length === 0 && (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">Journaling with AI Support:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Start writing your thoughts and feelings</li>
                  <li>• After 50+ characters, I'll respond as your therapist</li>
                  <li>• You can chat with me directly below your writing</li>
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
