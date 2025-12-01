import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import InteractiveJournalInput from '../components/InteractiveJournalInput';
import PromptDisplay from '../components/PromptDisplay';
import EmotionAnalysis from '../components/EmotionAnalysis';
import RecentEntries from '../components/RecentEntries';
import { getPrompt, getHistory } from '../lib/api';

export default function JournalPage() {
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Get daily prompt and affirmation
  const { data: promptData, isLoading: promptLoading } = useQuery({
    queryKey: ['prompt'],
    queryFn: getPrompt
  });

  // Get journal history
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['history'],
    queryFn: getHistory
  });

  // Handle successful journal submission
  const handleJournalSuccess = (result) => {
    setAnalysis(result);
    setShowAnalysis(true);
    refetchHistory();
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <section className="mb-8">
        <div className="relative h-60 sm:h-80 rounded-2xl overflow-hidden shadow-md mb-4">
          <img 
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&h=400&q=80" 
            alt="Serene nature landscape" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/70 to-transparent flex items-center">
            <div className="px-6 py-4 max-w-md">
              <h2 className="text-white text-2xl font-bold mb-2">Hi, how are you feeling today?</h2>
              <p className="text-white/90">Express yourself freely. Your thoughts are safe here.</p>
            </div>
          </div>
        </div>
      </section>

      <PromptDisplay 
        prompt={promptData?.prompt} 
        affirmation={promptData?.affirmation} 
        loading={promptLoading} 
      />
      
      <InteractiveJournalInput onSuccess={handleJournalSuccess} />
      
      {showAnalysis && analysis && (
        <EmotionAnalysis analysis={analysis} />
      )}
      
      <RecentEntries entries={historyData?.entries || []} loading={historyLoading} />
    </main>
  );
}
