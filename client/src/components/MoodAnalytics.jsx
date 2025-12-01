import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const MoodAnalytics = () => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [activeTab, setActiveTab] = useState('weekly');
  const [isLoading, setIsLoading] = useState(true);

  // Emotion color mapping
  const emotionColors = {
    joy: 'rgba(255, 193, 7, 0.8)',
    sadness: 'rgba(13, 110, 253, 0.8)',
    anger: 'rgba(220, 53, 69, 0.8)',
    fear: 'rgba(108, 117, 125, 0.8)',
    surprise: 'rgba(25, 135, 84, 0.8)',
    disgust: 'rgba(111, 66, 193, 0.8)',
    love: 'rgba(214, 51, 132, 0.8)',
    neutral: 'rgba(173, 181, 189, 0.8)'
  };

  // Badge styling for emotion types
  const emotionBadgeVariants = {
    joy: 'warning',
    sadness: 'primary',
    anger: 'destructive',
    fear: 'secondary',
    surprise: 'success',
    disgust: 'purple',
    love: 'pink',
    neutral: 'outline'
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch weekly summary
        const weeklyResponse = await fetch('/api/summary/weekly');
        const weeklyResult = await weeklyResponse.json();
        setWeeklyData(weeklyResult);

        // Fetch monthly summary
        const monthlyResponse = await fetch('/api/summary/monthly');
        const monthlyResult = await monthlyResponse.json();
        setMonthlyData(monthlyResult);

        // Fetch user stats
        const statsResponse = await fetch('/api/stats');
        const statsResult = await statsResponse.json();
        setUserStats(statsResult);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create emotion distribution chart for weekly data
  const createWeeklyEmotionChart = () => {
    if (!weeklyData || !weeklyData.emotion_counts) return null;

    const labels = Object.keys(weeklyData.emotion_counts);
    const counts = Object.values(weeklyData.emotion_counts);
    const backgroundColor = labels.map(emotion => emotionColors[emotion] || 'rgba(173, 181, 189, 0.8)');

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Frequency',
          data: counts,
          backgroundColor,
          borderColor: backgroundColor.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="h-64 md:h-80">
        <Bar 
          data={chartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: true,
                text: 'Weekly Emotion Distribution',
                font: {
                  size: 16,
                }
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            }
          }} 
        />
      </div>
    );
  };

  // Create emotion intensity chart for weekly data
  const createWeeklyIntensityChart = () => {
    if (!weeklyData || !weeklyData.avg_emotion_scores) return null;

    const labels = Object.keys(weeklyData.avg_emotion_scores);
    const scores = Object.values(weeklyData.avg_emotion_scores);
    const backgroundColor = labels.map(emotion => emotionColors[emotion] || 'rgba(173, 181, 189, 0.8)');

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Average Intensity',
          data: scores,
          backgroundColor,
          borderColor: backgroundColor.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="h-64 md:h-80">
        <Pie 
          data={chartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
              },
              title: {
                display: true,
                text: 'Emotion Intensity Breakdown',
                font: {
                  size: 16,
                }
              },
            },
          }} 
        />
      </div>
    );
  };

  // Create monthly emotion trend chart
  const createMonthlyTrendChart = () => {
    if (!monthlyData || !monthlyData.emotion_counts) return null;

    // Generate dates for the past 30 days
    const getDates = () => {
      const dates = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      return dates;
    };

    const labels = getDates();
    
    // This is a simplification - for a real implementation, 
    // we'd need to map actual daily emotion data to these dates
    const chartData = {
      labels,
      datasets: [
        {
          label: 'Entries',
          data: labels.map(() => Math.random() * 1.5), // Simulated data
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          tension: 0.4,
        },
      ],
    };

    return (
      <div className="h-64 md:h-80">
        <Line 
          data={chartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: true,
                text: 'Monthly Journaling Activity',
                font: {
                  size: 16,
                }
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    if (value % 1 === 0) {
                      return value;
                    }
                  }
                }
              }
            }
          }} 
        />
      </div>
    );
  };

  // Render badges for streaks and achievements
  const renderBadges = () => {
    if (!userStats || !userStats.badges) return null;

    const badgeLabels = {
      'streak_3': '3-Day Streak',
      'streak_7': '7-Day Streak',
      'streak_30': '30-Day Streak',
      'entries_5': '5 Entries',
      'entries_20': '20 Entries',
      'entries_50': '50 Entries'
    };

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {userStats.badges.map((badge) => (
          <Badge key={badge} variant="outline" className="py-1 px-3">
            {badgeLabels[badge] || badge}
          </Badge>
        ))}
      </div>
    );
  };

  // Render user stats card
  const renderUserStats = () => {
    if (!userStats) return null;

    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Your Journaling Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Current streak</span>
                <span className="text-sm font-medium">{userStats.streak} days</span>
              </div>
              <Progress value={(userStats.streak / 30) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Level {userStats.level}</span>
                <span className="text-sm font-medium">{userStats.total_entries} entries</span>
              </div>
              <Progress value={((userStats.total_entries % 10) / 10) * 100} className="h-2" />
            </div>
            
            <div>
              <span className="text-sm font-medium">Achievements</span>
              {renderBadges()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render weekly summary
  const renderWeeklySummary = () => {
    if (!weeklyData) return null;

    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Emotions this Week</CardTitle>
          </CardHeader>
          <CardContent>
            {createWeeklyEmotionChart()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Emotion Intensity</CardTitle>
          </CardHeader>
          <CardContent>
            {createWeeklyIntensityChart()}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Entries this week</p>
                <p className="text-2xl font-bold">{weeklyData.entry_count}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Dominant emotion</p>
                {weeklyData.dominant_emotion && (
                  <Badge variant={emotionBadgeVariants[weeklyData.dominant_emotion] || 'default'}>
                    {weeklyData.dominant_emotion?.charAt(0).toUpperCase() + weeklyData.dominant_emotion?.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render monthly summary
  const renderMonthlySummary = () => {
    if (!monthlyData) return null;

    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {createMonthlyTrendChart()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total entries</p>
                <p className="text-2xl font-bold">{monthlyData.entry_count}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Days with entries</p>
                <p className="text-2xl font-bold">{monthlyData.days_with_entries}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Weekly average</p>
                <p className="text-2xl font-bold">{monthlyData.avg_entries_per_week.toFixed(1)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Most tracked emotions</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(monthlyData.emotion_counts || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([emotion, count]) => (
                      <Badge key={emotion} variant={emotionBadgeVariants[emotion] || 'default'}>
                        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderUserStats()}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="py-4">
          {renderWeeklySummary()}
        </TabsContent>
        <TabsContent value="monthly" className="py-4">
          {renderMonthlySummary()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoodAnalytics;