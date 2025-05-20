import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getHistory } from '../lib/api';
import Chart from 'chart.js/auto';
import { format, subDays, subMonths, addDays, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import MoodAnalytics from '../components/MoodAnalytics';

export default function DashboardPage() {
  const moodChartRef = useRef(null);
  const emotionPieChartRef = useRef(null);
  const weeklyMoodChartRef = useRef(null);
  const monthlyMoodChartRef = useRef(null);
  const moodCalendarRef = useRef(null);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'radar'
  
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
      if (weeklyMoodChartRef.current?.chart) {
        weeklyMoodChartRef.current.chart.destroy();
      }
      if (monthlyMoodChartRef.current?.chart) {
        monthlyMoodChartRef.current.chart.destroy();
      }
      if (moodCalendarRef.current?.chart) {
        moodCalendarRef.current.chart.destroy();
      }
    };
  }, [historyData, isLoading, timeRange, chartType]);

  // Convert emotions to a mood score (positive emotions high, negative emotions low)
  const calculateMoodScore = (emotions) => {
    // Emotional valence scoring system
    const valenceMap = {
      joy: 1.0,      // Very positive
      surprise: 0.5,  // Mildly positive
      neutral: 0,    // Neutral
      fear: -0.5,    // Mildly negative
      sadness: -0.8, // Quite negative
      anger: -0.9,   // Very negative
      disgust: -0.7  // Negative
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    emotions.forEach(emotion => {
      const emotionName = emotion.label.toLowerCase();
      const valence = valenceMap[emotionName] || 0;
      totalScore += valence * emotion.score;
      totalWeight += emotion.score;
    });
    
    // Convert to 0-100 scale (0 = very negative, 50 = neutral, 100 = very positive)
    const normalizedScore = totalWeight > 0 ? 50 + (totalScore / totalWeight) * 50 : 50;
    
    return Math.round(normalizedScore);
  };

  // Group entries by time periods
  const groupEntriesByTimePeriod = (entries, periodType) => {
    const now = new Date();
    const periodStart = 
      periodType === 'week' ? subDays(now, 7) : 
      periodType === 'month' ? subDays(now, 30) : 
      subMonths(now, 12);
    
    // Filter entries to the selected period
    const periodEntries = entries.filter(entry => new Date(entry.timestamp) >= periodStart);
    
    // Group entries by day, week or month
    const groupedEntries = {};
    
    if (periodType === 'week') {
      // Create objects for each day of the week
      for (let i = 7; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        groupedEntries[dateStr] = { 
          date, 
          dateFormatted: format(date, 'EEE, MMM d'),
          entries: [] 
        };
      }
    } else if (periodType === 'month') {
      // Create objects for each day of the month
      for (let i = 30; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        groupedEntries[dateStr] = { 
          date, 
          dateFormatted: format(date, 'MMM d'),
          entries: [] 
        };
      }
    } else if (periodType === 'year') {
      // Create objects for each month of the year
      for (let i = 12; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthStr = format(date, 'yyyy-MM');
        groupedEntries[monthStr] = { 
          date, 
          dateFormatted: format(date, 'MMM yyyy'),
          entries: [] 
        };
      }
    }
    
    // Assign entries to their respective time periods
    periodEntries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      const dateKey = 
        periodType === 'year' 
          ? format(entryDate, 'yyyy-MM')
          : format(entryDate, 'yyyy-MM-dd');
      
      if (groupedEntries[dateKey]) {
        groupedEntries[dateKey].entries.push(entry);
      }
    });
    
    return groupedEntries;
  };

  const initializeCharts = (entries) => {
    if (!entries || entries.length === 0) return;
    
    // Create simple emotional journey chart (daily view)
    createEmotionalJourneyChart(entries);
    
    // Create emotion distribution pie chart
    createEmotionDistributionChart(entries);
    
    // Create weekly mood chart
    createWeeklyMoodChart(entries);
    
    // Create monthly mood chart
    createMonthlyMoodChart(entries);
  };

  const createEmotionalJourneyChart = (entries) => {
    if (!moodChartRef.current) return;
    
    const ctx = moodChartRef.current.getContext('2d');
    
    if (moodChartRef.current.chart) {
      moodChartRef.current.chart.destroy();
    }
    
    // Group entries by selected period
    const groupedEntries = groupEntriesByTimePeriod(entries, timeRange);
    
    // Set up emotional data
    const emotionsToShow = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'neutral'];
    
    // Extract labels and datasets
    const labels = Object.values(groupedEntries).map(group => group.dateFormatted);
    
    // Create datasets
    const datasets = emotionsToShow.map(emotion => {
      const emotionData = Object.values(groupedEntries).map(group => {
        // Calculate average emotion score for this time period
        const periodEntries = group.entries;
        if (periodEntries.length === 0) return null;
        
        let totalScore = 0;
        let entryCount = 0;
        
        periodEntries.forEach(entry => {
          const emotionObj = entry.emotions.find(e => e.label.toLowerCase() === emotion);
          if (emotionObj) {
            totalScore += emotionObj.score * 100; // Convert to percentage
            entryCount++;
          }
        });
        
        return entryCount > 0 ? (totalScore / entryCount) : 0;
      });
      
      // Color mapping
      const colorMap = {
        joy: '#4CAF50',
        sadness: '#2196F3',
        anger: '#F44336',
        fear: '#FF9800',
        surprise: '#9C27B0',
        neutral: '#9E9E9E'
      };
      
      return {
        label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        data: emotionData,
        borderColor: colorMap[emotion],
        backgroundColor: `${colorMap[emotion]}20`,
        tension: 0.4,
        fill: chartType === 'radar' ? true : 'origin',
        pointBackgroundColor: colorMap[emotion]
      };
    });
    
    // Create chart
    moodChartRef.current.chart = new Chart(ctx, {
      type: chartType,
      data: {
        labels: labels,
        datasets: datasets
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
        scales: chartType !== 'radar' ? {
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
              text: timeRange === 'week' ? 'Day' : timeRange === 'month' ? 'Date' : 'Month'
            }
          }
        } : {}
      }
    });
  };

  const createEmotionDistributionChart = (entries) => {
    if (!emotionPieChartRef.current) return;
    
    const ctx = emotionPieChartRef.current.getContext('2d');
    
    if (emotionPieChartRef.current.chart) {
      emotionPieChartRef.current.chart.destroy();
    }
    
    // Process emotions data for chart
    const emotionCounts = {};
    
    // Process entries for chart
    entries.forEach(entry => {
      // Count emotions for pie chart
      entry.emotions.forEach(emotion => {
        const emotionName = emotion.label.toLowerCase();
        emotionCounts[emotionName] = (emotionCounts[emotionName] || 0) + emotion.score;
      });
    });
    
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
      neutral: '#9E9E9E',
      disgust: '#FF5722'
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
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  };

  const createWeeklyMoodChart = (entries) => {
    if (!weeklyMoodChartRef.current) return;
    
    const ctx = weeklyMoodChartRef.current.getContext('2d');
    
    if (weeklyMoodChartRef.current.chart) {
      weeklyMoodChartRef.current.chart.destroy();
    }
    
    // Group entries by days of the week
    const now = new Date();
    const weekStart = subDays(now, 7);
    const groupedByDay = {};
    
    // Initialize days
    for (let i = 0; i <= 6; i++) {
      const day = addDays(weekStart, i);
      const dayStr = format(day, 'EEEE');
      groupedByDay[dayStr] = {
        entries: [],
        date: day
      };
    }
    
    // Assign entries to days
    entries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      if (entryDate >= weekStart && entryDate <= now) {
        const dayName = format(entryDate, 'EEEE');
        if (groupedByDay[dayName]) {
          groupedByDay[dayName].entries.push(entry);
        }
      }
    });
    
    // Calculate average mood score for each day
    const labels = Object.keys(groupedByDay);
    const moodScores = labels.map(day => {
      const dayEntries = groupedByDay[day].entries;
      if (dayEntries.length === 0) return null;
      
      // Calculate average mood score
      const totalScore = dayEntries.reduce((sum, entry) => sum + calculateMoodScore(entry.emotions), 0);
      return totalScore / dayEntries.length;
    });
    
    // Create mood score chart
    weeklyMoodChartRef.current.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mood Score',
          data: moodScores,
          backgroundColor: moodScores.map(score => {
            if (score === null) return '#e0e0e0'; // No data
            if (score >= 70) return '#4CAF50'; // Positive
            if (score >= 50) return '#8BC34A'; // Slightly positive
            if (score >= 30) return '#FFC107'; // Neutral/slightly negative
            return '#F44336'; // Negative
          }),
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Mood Score'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: function(tooltipItems) {
                return tooltipItems[0].label;
              },
              label: function(context) {
                const score = context.raw;
                if (score === null) return 'No data';
                
                let mood = '';
                if (score >= 80) mood = 'Very Positive';
                else if (score >= 65) mood = 'Positive';
                else if (score >= 50) mood = 'Slightly Positive';
                else if (score >= 40) mood = 'Neutral';
                else if (score >= 25) mood = 'Slightly Negative';
                else if (score >= 10) mood = 'Negative';
                else mood = 'Very Negative';
                
                return `Mood: ${mood} (${Math.round(score)}/100)`;
              }
            }
          }
        }
      }
    });
  };

  const createMonthlyMoodChart = (entries) => {
    if (!monthlyMoodChartRef.current) return;
    
    const ctx = monthlyMoodChartRef.current.getContext('2d');
    
    if (monthlyMoodChartRef.current.chart) {
      monthlyMoodChartRef.current.chart.destroy();
    }
    
    // Group entries by month
    const now = new Date();
    const yearStart = subMonths(now, 11);
    const monthlyData = {};
    
    // Initialize months
    for (let i = 0; i < 12; i++) {
      const month = addDays(yearStart, i * 30);
      const monthStr = format(month, 'MMM');
      monthlyData[monthStr] = {
        entries: [],
        date: month
      };
    }
    
    // Assign entries to months
    entries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      if (entryDate >= yearStart) {
        const monthName = format(entryDate, 'MMM');
        if (monthlyData[monthName]) {
          monthlyData[monthName].entries.push(entry);
        }
      }
    });
    
    // Calculate average mood score and emotion intensity for each month
    const labels = Object.keys(monthlyData);
    
    // Mood score dataset
    const moodScores = labels.map(month => {
      const monthEntries = monthlyData[month].entries;
      if (monthEntries.length === 0) return null;
      
      // Calculate average mood score
      const totalScore = monthEntries.reduce((sum, entry) => sum + calculateMoodScore(entry.emotions), 0);
      return totalScore / monthEntries.length;
    });
    
    // Joy and sadness datasets for comparison
    const joyIntensity = labels.map(month => {
      const monthEntries = monthlyData[month].entries;
      if (monthEntries.length === 0) return null;
      
      let totalJoy = 0;
      let entryCount = 0;
      
      monthEntries.forEach(entry => {
        const joyEmotion = entry.emotions.find(e => e.label.toLowerCase() === 'joy');
        if (joyEmotion) {
          totalJoy += joyEmotion.score * 100;
          entryCount++;
        }
      });
      
      return entryCount > 0 ? (totalJoy / entryCount) : 0;
    });
    
    const sadnessIntensity = labels.map(month => {
      const monthEntries = monthlyData[month].entries;
      if (monthEntries.length === 0) return null;
      
      let totalSadness = 0;
      let entryCount = 0;
      
      monthEntries.forEach(entry => {
        const sadnessEmotion = entry.emotions.find(e => e.label.toLowerCase() === 'sadness');
        if (sadnessEmotion) {
          totalSadness += sadnessEmotion.score * 100;
          entryCount++;
        }
      });
      
      return entryCount > 0 ? (totalSadness / entryCount) : 0;
    });
    
    // Create mood score chart
    monthlyMoodChartRef.current.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Mood Score',
            data: moodScores,
            borderColor: '#9C27B0',
            backgroundColor: '#9C27B020',
            tension: 0.4,
            fill: true,
            yAxisID: 'y',
            pointBackgroundColor: '#9C27B0'
          },
          {
            label: 'Joy',
            data: joyIntensity,
            borderColor: '#4CAF50',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4,
            yAxisID: 'y1',
            pointBackgroundColor: '#4CAF50'
          },
          {
            label: 'Sadness',
            data: sadnessIntensity,
            borderColor: '#2196F3',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4,
            yAxisID: 'y1',
            pointBackgroundColor: '#2196F3'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  if (label.includes('Mood')) {
                    let moodText = '';
                    const score = context.parsed.y;
                    if (score >= 80) moodText = 'Very Positive';
                    else if (score >= 65) moodText = 'Positive';
                    else if (score >= 50) moodText = 'Slightly Positive';
                    else if (score >= 40) moodText = 'Neutral';
                    else if (score >= 25) moodText = 'Slightly Negative';
                    else if (score >= 10) moodText = 'Negative';
                    else moodText = 'Very Negative';
                    
                    label += `${Math.round(context.parsed.y)}/100 (${moodText})`;
                  } else {
                    label += `${Math.round(context.parsed.y)}%`;
                  }
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Mood Score'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            max: 100,
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'Emotion Intensity (%)'
            }
          }
        }
      }
    });
  };

  // Calculate streaks
  const calculateStreak = (entries) => {
    if (!entries || entries.length === 0) return 0;
    
    const sortedEntries = [...entries].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let currentStreak = 0;
    let previousDate = null;
    
    // Check if there's an entry for today
    const latestEntry = sortedEntries[0];
    const latestDate = new Date(latestEntry.timestamp);
    const latestDateWithoutTime = new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate());
    
    if (latestDateWithoutTime.getTime() === today.getTime()) {
      // If there's an entry for today, start the streak at 1
      currentStreak = 1;
      previousDate = today;
    } else {
      // No entry for today, check if there's one for yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (latestDateWithoutTime.getTime() === yesterday.getTime()) {
        // If there's an entry for yesterday, start the streak at 1
        currentStreak = 1;
        previousDate = yesterday;
      } else {
        // No entry for yesterday either, streak is 0
        return 0;
      }
    }
    
    // Iterate through sorted entries, starting from the second one (if any)
    for (let i = 1; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      const entryDate = new Date(entry.timestamp);
      const entryDateWithoutTime = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      
      // Calculate the expected previous date for a continuous streak
      const expectedPreviousDate = new Date(previousDate);
      expectedPreviousDate.setDate(expectedPreviousDate.getDate() - 1);
      
      if (entryDateWithoutTime.getTime() === expectedPreviousDate.getTime()) {
        // Found an entry for the expected previous day, increment streak
        currentStreak++;
        previousDate = entryDateWithoutTime;
      } else {
        // Streak is broken
        break;
      }
    }
    
    return currentStreak;
  };

  // Data for display
  const entries = historyData?.entries || [];
  const streak = calculateStreak(entries);
  const entriesCount = entries.length;

  // Calculate emotion distribution
  const emotionCounts = {};
  entries.forEach(entry => {
    entry.emotions.forEach(emotion => {
      const emotionName = emotion.label.toLowerCase();
      emotionCounts[emotionName] = (emotionCounts[emotionName] || 0) + emotion.score;
    });
  });
  
  const colorMap = {
    joy: '#4CAF50',
    sadness: '#2196F3',
    anger: '#F44336',
    fear: '#FF9800',
    surprise: '#9C27B0',
    neutral: '#9E9E9E',
    disgust: '#FF5722'
  };

  const emotionTotal = Object.values(emotionCounts).reduce((acc, val) => acc + val, 0);
  const emotionDistribution = Object.entries(emotionCounts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / emotionTotal) * 100),
      color: colorMap[name] || '#9E9E9E'
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Get dominant emotion
  const dominantEmotion = emotionDistribution.length > 0 ? emotionDistribution[0].name : null;

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Card */}
        <Card className="bg-gradient-to-r from-primary/90 to-primary text-white">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold mb-2">Journaling Streak</h3>
            <div className="text-5xl font-bold mb-2">{streak}</div>
            <p className="text-white/80">consecutive days</p>
            {streak > 0 && streak < 3 && (
              <p className="text-sm mt-2 font-medium">Keep going! Build that habit 🚀</p>
            )}
            {streak >= 3 && streak < 7 && (
              <p className="text-sm mt-2 font-medium">Great consistency! 🔥</p>
            )}
            {streak >= 7 && (
              <p className="text-sm mt-2 font-medium">Amazing dedication! 🏆</p>
            )}
          </CardContent>
        </Card>
        
        {/* Total Entries Card */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold mb-2">Total Entries</h3>
            <div className="text-5xl font-bold mb-2">{historyData?.entries?.length || 0}</div>
            <p className="text-muted-foreground">journal reflections</p>
          </CardContent>
        </Card>
        
        {/* Dominant Emotion Card */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <h3 className="text-xl font-semibold mb-2">Dominant Emotion</h3>
            <div className="text-3xl font-bold mb-2 capitalize">{dominantEmotion || "N/A"}</div>
            <p className="text-muted-foreground">past 7 days</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="classic" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="classic">Classic View</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="classic" className="mt-4">
          <Tabs defaultValue="journey" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="journey">Emotional Journey</TabsTrigger>
              <TabsTrigger value="distribution">Emotion Distribution</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Mood</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Mood</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              {/* Filters for Emotional Journey Tab */}
              <TabsContent value="journey" className="mt-0">
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    variant={timeRange === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('week')}
                  >
                    Past Week
                  </Button>
                  <Button
                    variant={timeRange === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('month')}
                  >
                    Past Month
                  </Button>
                  <Button
                    variant={timeRange === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('year')}
                  >
                    Past Year
                  </Button>
                  <div className="border-l mx-2 h-8"></div>
                  <Button
                    variant={chartType === 'line' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('line')}
                  >
                    Line
                  </Button>
                  <Button
                    variant={chartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('bar')}
                  >
                    Bar
                  </Button>
                  <Button
                    variant={chartType === 'radar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('radar')}
                  >
                    Radar
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="h-80">
                      <canvas ref={moodChartRef}></canvas>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="distribution" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-4 text-center">Emotion Distribution</h3>
                        <div className="h-64 md:h-80 relative flex items-center justify-center">
                          <canvas ref={emotionPieChartRef}></canvas>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <p className="text-3xl font-bold">{entriesCount}</p>
                            <p className="text-sm text-muted-foreground">entries</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 mt-6 md:mt-0">
                        <h3 className="text-lg font-semibold mb-4 text-center">Emotion Legend</h3>
                        <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                          {emotionDistribution.map(item => (
                            <div key={item.name} className="flex items-center">
                              <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                              <span className="capitalize">{item.name}</span>
                              <div className="ml-auto">{item.percentage}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="weekly" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <div className="h-80">
                      <canvas ref={weeklyMoodChartRef}></canvas>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="monthly" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <div className="h-80">
                      <canvas ref={monthlyMoodChartRef}></canvas>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-4">
          <MoodAnalytics />
        </TabsContent>
      </Tabs>
    </main>
  );
}