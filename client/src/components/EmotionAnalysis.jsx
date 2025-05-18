import { Card, CardContent } from '@/components/ui/card';

export default function EmotionAnalysis({ analysis }) {
  if (!analysis) return null;
  
  return (
    <section className="mb-8">
      <Card className="bg-white rounded-2xl shadow-md transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="h-10 w-10 rounded-full bg-accent flex-shrink-0 flex items-center justify-center">
              <i className="fas fa-heart-pulse text-white"></i>
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">Emotions Detected</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {analysis.emotions && analysis.emotions.map((emotion, index) => {
                  // Map emotion labels to colors
                  const colorMap = {
                    joy: 'bg-green-100 text-green-800',
                    sadness: 'bg-blue-100 text-blue-800',
                    anger: 'bg-red-100 text-red-800',
                    fear: 'bg-yellow-100 text-yellow-800',
                    surprise: 'bg-purple-100 text-purple-800',
                    neutral: 'bg-gray-100 text-gray-800',
                    disgust: 'bg-orange-100 text-orange-800',
                    shame: 'bg-pink-100 text-pink-800',
                    guilt: 'bg-indigo-100 text-indigo-800'
                  };
                  
                  const emotionClass = colorMap[emotion.label.toLowerCase()] || 'bg-blue-100 text-blue-800';
                  const percentage = Math.round(emotion.score * 100);
                  
                  return (
                    <span 
                      key={index} 
                      className={`emotion-badge ${emotionClass} px-3 py-1 rounded-full text-sm font-medium transition-all hover:transform hover:scale-105`}
                    >
                      {emotion.label} <span className="text-xs opacity-75">{percentage}%</span>
                    </span>
                  );
                })}
              </div>
              
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                <h4 className="font-medium text-neutral-800 mb-2">Reflection</h4>
                <p className="text-neutral-700">
                  {analysis.reflection || "Based on your journal entry, we've detected a mix of emotions. Remember that acknowledging your feelings is an important step toward emotional well-being."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
