import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { getHistory } from '../lib/api';
import Chart from 'chart.js/auto';

export default function DashboardPage() {
  const moodChartRef = useRef(null);
  const emotionPieChartRef = useRef(null);
  
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: getHistory
  });

  useEffect(() => {
    if (isLoading || !historyData) return;
    
    // Initialize charts when data is available
    initializeCharts(historyData.entries);
    
    // Cleanup function to destroy charts when component unmounts
    return () => {
      if (moodChartRef.current?.chart) {
        moodChartRef.current.chart.destroy();
      }
      if (emotionPieChartRef.current?.chart) {
        emotionPieChartRef.current.chart.destroy();
      }
    };
  }, [historyData, isLoading]);

  const initializeCharts = (entries) => {
    if (!entries || entries.length === 0) return;
    
    const dates = entries.map(entry => {
      const date = new Date(entry.timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Process emotions data for charts
    const emotionCounts = {};
    const emotionsByDate = {
      joy: [],
      sadness: [],
      anger: [],
      fear: [],
      surprise: [],
      neutral: []
    };
    
    // Process entries for charts
    entries.forEach(entry => {
      // Count emotions for pie chart
      entry.emotions.forEach(emotion => {
        const emotionName = emotion.label.toLowerCase();
        emotionCounts[emotionName] = (emotionCounts[emotionName] || 0) + emotion.score;
        
        // Track emotion values by date for line chart
        Object.keys(emotionsByDate).forEach(emotionKey => {
          if (emotionKey === emotionName) {
            emotionsByDate[emotionKey].push(emotion.score * 100);
          } else if (!emotionsByDate[emotionKey][emotionsByDate[emotionKey].length - 1]) {
            emotionsByDate[emotionKey].push(0);
          }
        });
      });
    });
    
    // Create mood line chart
    if (moodChartRef.current) {
      const ctx = moodChartRef.current.getContext('2d');
      
      if (moodChartRef.current.chart) {
        moodChartRef.current.chart.destroy();
      }
      
      moodChartRef.current.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates.slice(-7).reverse(), // Get the last 7 entries
          datasets: [
            {
              label: 'Joy',
              data: emotionsByDate.joy.slice(-7).reverse(),
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Sadness',
              data: emotionsByDate.sadness.slice(-7).reverse(),
              borderColor: '#2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Fear',
              data: emotionsByDate.fear.slice(-7).reverse(),
              borderColor: '#FF9800',
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Intensity (%)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });
    }
    
    // Create emotion distribution pie chart
    if (emotionPieChartRef.current) {
      const ctx = emotionPieChartRef.current.getContext('2d');
      
      if (emotionPieChartRef.current.chart) {
        emotionPieChartRef.current.chart.destroy();
      }
      
      // Prepare pie chart data
      const labels = Object.keys(emotionCounts);
      const data = Object.values(emotionCounts);
      const total = data.reduce((acc, val) => acc + val, 0);
      const percentages = data.map(val => Math.round((val / total) * 100));
      
      // Color mapping
      const colorMap = {
        joy: '#4CAF50',
        sadness: '#2196F3',
        anger: '#F44336',
        fear: '#FF9800',
        surprise: '#9C27B0',
        neutral: '#9E9E9E'
      };
      
      emotionPieChartRef.current.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
          datasets: [{
            data: percentages,
            backgroundColor: labels.map(label => colorMap[label] || '#9E9E9E'),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          cutout: '70%'
        }
      });
    }
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Mood Overview */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-neutral-800 mb-4">Emotional Journey</h3>
            <div className="h-80">
              <canvas ref={moodChartRef}></canvas>
              {isLoading && (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Emotion Distribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-neutral-800 mb-4">Emotion Distribution</h3>
            <div className="h-60">
              <canvas ref={emotionPieChartRef}></canvas>
              {isLoading && (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            {!isLoading && historyData && historyData.entries.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries({
                  joy: ['#4CAF50', '32%'],
                  sadness: ['#2196F3', '18%'],
                  anger: ['#F44336', '10%'],
                  fear: ['#FF9800', '15%'],
                  surprise: ['#9C27B0', '5%'],
                  neutral: ['#9E9E9E', '20%']
                }).map(([emotion, [color, percent]]) => (
                  <div key={emotion} className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: color}}></span>
                    <span className="text-sm text-neutral-700">
                      {emotion.charAt(0).toUpperCase() + emotion.slice(1)} ({percent})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Insights and Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Patterns */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                <i className="fas fa-chart-line text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Patterns & Trends</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <i className="fas fa-chevron-right text-primary mt-1 mr-2"></i>
                    <p className="text-neutral-700">Your mood tends to improve on weekends</p>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-chevron-right text-primary mt-1 mr-2"></i>
                    <p className="text-neutral-700">Anxiety appears more frequently on Monday mornings</p>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-chevron-right text-primary mt-1 mr-2"></i>
                    <p className="text-neutral-700">Social activities correlate with positive emotions</p>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-chevron-right text-primary mt-1 mr-2"></i>
                    <p className="text-neutral-700">Your emotions have been more stable in the past week</p>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Common Triggers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
                <i className="fas fa-bolt text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Emotional Triggers</h3>
                <div className="space-y-3">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-1">Stress Triggers</h4>
                    <p className="text-neutral-700 text-sm">Work deadlines, financial concerns, family conflicts</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-1">Joy Triggers</h4>
                    <p className="text-neutral-700 text-sm">Time with friends, outdoor activities, creative projects</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Calm Triggers</h4>
                    <p className="text-neutral-700 text-sm">Morning walks, meditation, reading before bed</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Wellness Resources */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Wellness Resources</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl overflow-hidden shadow-sm">
              <img 
                src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80" 
                alt="Person meditating" 
                className="w-full h-40 object-cover" 
              />
              <div className="p-4">
                <h4 className="font-medium text-neutral-800 mb-1">Guided Meditation</h4>
                <p className="text-neutral-600 text-sm mb-2">5-minute practices for anxiety relief</p>
                <a href="#" className="text-primary text-sm font-medium hover:underline">Explore →</a>
              </div>
            </div>
            
            <div className="rounded-xl overflow-hidden shadow-sm">
              <img 
                src="https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80" 
                alt="Person journaling" 
                className="w-full h-40 object-cover" 
              />
              <div className="p-4">
                <h4 className="font-medium text-neutral-800 mb-1">Journaling Techniques</h4>
                <p className="text-neutral-600 text-sm mb-2">Advanced methods for emotional clarity</p>
                <a href="#" className="text-primary text-sm font-medium hover:underline">Explore →</a>
              </div>
            </div>
            
            <div className="rounded-xl overflow-hidden shadow-sm">
              <img 
                src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80" 
                alt="Peaceful nature scene" 
                className="w-full h-40 object-cover" 
              />
              <div className="p-4">
                <h4 className="font-medium text-neutral-800 mb-1">Breathing Exercises</h4>
                <p className="text-neutral-600 text-sm mb-2">Simple techniques for instant calm</p>
                <a href="#" className="text-primary text-sm font-medium hover:underline">Explore →</a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
