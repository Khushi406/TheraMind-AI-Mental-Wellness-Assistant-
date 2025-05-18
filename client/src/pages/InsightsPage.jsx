import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { getHistory } from '../lib/api';

export default function InsightsPage() {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: getHistory
  });

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="relative h-60 sm:h-80 rounded-2xl overflow-hidden shadow-md mb-4">
          <img 
            src="https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&h=400&q=80" 
            alt="Tranquil lake with flowers" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/70 to-transparent flex items-center">
            <div className="px-6 py-4 max-w-md">
              <h2 className="text-white text-2xl font-bold mb-2">Your Emotional Insights</h2>
              <p className="text-white/90">Discover patterns in your emotional journey and learn more about yourself.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Monthly Overview */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Monthly Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-50 rounded-xl p-4 flex flex-col items-center">
              <div className="text-4xl font-bold text-primary mb-2">62%</div>
              <div className="text-center">
                <h4 className="font-medium text-neutral-800">Positive Emotions</h4>
                <p className="text-neutral-600 text-sm">Joy, Gratitude, Hope</p>
              </div>
            </div>
            
            <div className="bg-neutral-50 rounded-xl p-4 flex flex-col items-center">
              <div className="text-4xl font-bold text-secondary mb-2">23%</div>
              <div className="text-center">
                <h4 className="font-medium text-neutral-800">Neutral Emotions</h4>
                <p className="text-neutral-600 text-sm">Calm, Balanced, Normal</p>
              </div>
            </div>
            
            <div className="bg-neutral-50 rounded-xl p-4 flex flex-col items-center">
              <div className="text-4xl font-bold text-neutral-600 mb-2">15%</div>
              <div className="text-center">
                <h4 className="font-medium text-neutral-800">Challenging Emotions</h4>
                <p className="text-neutral-600 text-sm">Anxiety, Sadness, Stress</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Word Clouds and Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Word Frequency */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Words You Use Most</h3>
            <div className="h-60 bg-neutral-50 rounded-xl p-4 flex items-center justify-center">
              <div className="text-center text-neutral-400">
                <i className="fas fa-cloud text-4xl mb-2"></i>
                <p>Word cloud visualization</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-neutral-700">Your most frequent positive words: <span className="font-medium">grateful, happy, excited</span></p>
              <p className="text-neutral-700">Your most frequent challenging words: <span className="font-medium">worried, tired, anxious</span></p>
            </div>
          </CardContent>
        </Card>
        
        {/* AI Insights */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">AI-Powered Insights</h3>
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-xl p-4">
                <h4 className="font-medium text-neutral-800 mb-1">Self-Awareness</h4>
                <p className="text-neutral-700">Your ability to identify and express your emotions has improved by 15% in the past month.</p>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4">
                <h4 className="font-medium text-neutral-800 mb-1">Emotional Balance</h4>
                <p className="text-neutral-700">You've been experiencing more balanced emotions compared to last month.</p>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4">
                <h4 className="font-medium text-neutral-800 mb-1">Growth Areas</h4>
                <p className="text-neutral-700">Consider exploring techniques for managing work-related stress, which appears as a recurring theme.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recommended Activities */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Recommended for You</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50 transition-colors cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <i className="fas fa-spa text-green-600"></i>
              </div>
              <h4 className="font-medium text-neutral-800 mb-1">Gratitude Practice</h4>
              <p className="text-neutral-600 text-sm">5-minute daily exercise</p>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50 transition-colors cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <i className="fas fa-lungs text-blue-600"></i>
              </div>
              <h4 className="font-medium text-neutral-800 mb-1">Deep Breathing</h4>
              <p className="text-neutral-600 text-sm">For moments of anxiety</p>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50 transition-colors cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <i className="fas fa-book-open text-purple-600"></i>
              </div>
              <h4 className="font-medium text-neutral-800 mb-1">Reflective Reading</h4>
              <p className="text-neutral-600 text-sm">Mindfulness literature</p>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50 transition-colors cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                <i className="fas fa-users text-yellow-600"></i>
              </div>
              <h4 className="font-medium text-neutral-800 mb-1">Social Connection</h4>
              <p className="text-neutral-600 text-sm">Schedule time with friends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
