import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PromptDisplay({ prompt, affirmation, loading }) {
  return (
    <section className="mb-8">
      <Card className="bg-white rounded-2xl shadow-md transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="h-10 w-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
              <i className="fas fa-lightbulb text-white"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Today's Journaling Prompt</h3>
              
              {loading ? (
                <Skeleton className="h-4 w-full mb-6" />
              ) : (
                <p className="text-neutral-700 mb-4">{prompt || "What made you feel grateful today, and how did those moments affect your overall mood?"}</p>
              )}
              
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Daily Affirmation</h3>
              
              {loading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <p className="text-neutral-700 italic">{affirmation || "I acknowledge my emotions and treat myself with compassion. Each day is an opportunity for growth."}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
