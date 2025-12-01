import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { submitJournalEntry } from '../lib/api';

export default function JournalInput({ onSuccess }) {
  const [journalEntry, setJournalEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  return (
    <section className="mb-8 bg-white rounded-2xl shadow-md p-6 card transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-lg">
      <h3 className="text-xl font-semibold text-neutral-800 mb-4">Write Your Journal Entry</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Textarea
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="How are you feeling today? What's on your mind?"
            className="w-full p-4 border border-neutral-300 rounded-xl h-40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-neutral-600">
            <i className="fas fa-shield-alt"></i>
            <span className="text-sm">Your entries are private and secure</span>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:shadow-md transition-all hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <span>Saving...</span>
                <i className="fas fa-spinner fa-spin ml-2"></i>
              </>
            ) : (
              <>
                <span>Save Entry</span>
                <i className="fas fa-paper-plane ml-2"></i>
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
