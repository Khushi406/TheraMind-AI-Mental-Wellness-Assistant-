import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Loader2, Sparkles } from 'lucide-react';

export default function LiveTherapistChat({ journalContent }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi there! I'm your AI mental health companion. As you write in your journal, I'm here to listen and support you. Feel free to chat with me about what you're feeling. 💙",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const scrollRef = useRef(null);
  const lastJournalContentRef = useRef('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // React to journal writing with AI insights
  useEffect(() => {
    if (!journalContent || journalContent.length < 20) return;
    
    // Check if journal content changed significantly
    const contentChanged = journalContent !== lastJournalContentRef.current;
    const isSignificantChange = Math.abs(journalContent.length - lastJournalContentRef.current.length) > 50;
    
    if (contentChanged && isSignificantChange) {
      lastJournalContentRef.current = journalContent;
      
      // AI proactively responds to journal writing
      const timer = setTimeout(async () => {
        await sendAIProactiveMessage(journalContent);
      }, 3000); // Wait 3 seconds after significant writing

      return () => clearTimeout(timer);
    }
  }, [journalContent]);

  const sendAIProactiveMessage = async (content) => {
    setAiIsThinking(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `The user is journaling and wrote: "${content.slice(-200)}". Respond empathetically as their therapist, acknowledging what they shared and asking a gentle follow-up question to help them explore their feelings deeper.`,
          conversationHistory: messages.slice(-4).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        emotionalTone: data.emotionalTone
      }]);
    } catch (error) {
      console.error('AI proactive message error:', error);
    } finally {
      setAiIsThinking(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      
      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        emotionalTone: data.emotionalTone,
        followUpQuestions: data.followUpQuestions
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now, but I'm here for you. Your feelings are important.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="h-[600px] flex flex-col shadow-xl border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-50 border-b">
        <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Therapist Chat
          {aiIsThinking && (
            <span className="text-xs text-primary font-normal flex items-center gap-1 ml-auto">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Listening...
            </span>
          )}
        </CardTitle>
        <p className="text-xs text-neutral-600 mt-1">
          I respond as you write and you can chat with me anytime
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <Avatar className={`w-8 h-8 flex-shrink-0 ${
                  message.role === 'assistant' 
                    ? 'bg-primary/10 border-2 border-primary/20' 
                    : 'bg-blue-100 border-2 border-blue-200'
                }`}>
                  <AvatarFallback className={
                    message.role === 'assistant' ? 'text-primary' : 'text-blue-600'
                  }>
                    {message.role === 'assistant' ? (
                      <Brain className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-semibold">You</span>
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Message Bubble */}
                <div
                  className={`flex flex-col max-w-[75%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  
                  {/* Follow-up questions */}
                  {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.followUpQuestions.map((question, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => setInputMessage(question)}
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

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 bg-primary/10 border-2 border-primary/20">
                  <AvatarFallback className="text-primary">
                    <Brain className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-neutral-100 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Share your thoughts with me..."
              className="flex-1 rounded-full border-neutral-300 focus:ring-2 focus:ring-primary/20"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="rounded-full w-10 h-10 p-0 bg-primary hover:bg-primary/90"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-neutral-500 mt-2 text-center">
            Your conversation is private and secure 🔒
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
