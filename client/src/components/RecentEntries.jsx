import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';

export default function RecentEntries({ entries = [], loading }) {
  // Ensure we have entries and take the most recent 3
  const recentEntries = entries.slice(0, 3);
  
  return (
    <section className="mb-8">
      <Card className="bg-white rounded-2xl shadow-md transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Recent Entries</h3>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="border-l-4 border-neutral-300 pl-4 py-1">
                  <div className="flex justify-between items-center mb-1">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <i className="fas fa-book-open text-2xl mb-2"></i>
              <p>No journal entries yet. Start writing to see your recent entries here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEntries.map((entry, index) => {
                // Get the primary emotion (highest score) for display
                const primaryEmotion = entry.emotions?.length > 0 
                  ? entry.emotions.reduce((prev, current) => 
                      (prev.score > current.score) ? prev : current
                    ) 
                  : null;
                
                // Map emotion to color
                const emotionColorMap = {
                  joy: 'border-green-400',
                  sadness: 'border-blue-400',
                  anger: 'border-red-400',
                  fear: 'border-yellow-400',
                  surprise: 'border-purple-400',
                  neutral: 'border-gray-400',
                  disgust: 'border-orange-400'
                };
                
                const borderColor = primaryEmotion 
                  ? emotionColorMap[primaryEmotion.label.toLowerCase()] || 'border-primary'
                  : 'border-primary';
                
                const timeAgo = entry.timestamp 
                  ? formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })
                  : 'Recently';
                
                const dateStr = entry.timestamp 
                  ? format(new Date(entry.timestamp), 'MMMM d, yyyy')
                  : '';
                
                return (
                  <div key={index} className={`border-l-4 ${borderColor} pl-4 py-1`}>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-neutral-800">{timeAgo}</h4>
                      <div className="flex items-center space-x-2">
                        {primaryEmotion && (
                          <span className={`emotion-badge ${
                            emotionColorMap[primaryEmotion.label.toLowerCase()]?.replace('border', 'bg').replace('400', '100')
                            || 'bg-primary-100'
                          } px-2 py-0.5 rounded-full text-xs`}>
                            {primaryEmotion.label}
                          </span>
                        )}
                        <span className="text-neutral-500 text-sm">{dateStr}</span>
                      </div>
                    </div>
                    <p className="text-neutral-600 line-clamp-2">{entry.content}</p>
                  </div>
                );
              })}
            </div>
          )}
          
          {!loading && recentEntries.length > 0 && (
            <div className="mt-4 text-center">
              <button className="text-primary font-medium hover:underline">
                View All Entries <i className="fas fa-chevron-right text-xs ml-1"></i>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
