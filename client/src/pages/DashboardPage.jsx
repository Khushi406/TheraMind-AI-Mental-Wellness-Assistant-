import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getHistory } from '../lib/api';
import Chart from 'chart.js/auto';
import { format, subDays, subMonths, addDays, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

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
    
    // Create mood calendar chart (heatmap)
    // createMoodCalendarChart(entries);
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
    
    // Create monthly chart
    monthlyMoodChartRef.current.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'line',
            label: 'Mood Score',
            data: moodScores,
            borderColor: '#3F51B5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'Joy',
            data: joyIntensity,
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderWidth: 0,
            yAxisID: 'y1'
          },
          {
            type: 'bar',
            label: 'Sadness',
            data: sadnessIntensity,
            backgroundColor: 'rgba(33, 150, 243, 0.7)',
            borderWidth: 0,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            title: {
              display: true,
              text: 'Emotion Intensity (%)'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  };

  // Calculate streak (consecutive days with journal entries)
  const calculateStreak = (entries) => {
    if (!entries || entries.length === 0) return 0;
    
    // Sort entries by date, newest first
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let previousDate = today;
    
    // Check if there's an entry for today
    const latestEntry = sortedEntries[0];
    const latestEntryDate = new Date(latestEntry.timestamp);
    latestEntryDate.setHours(0, 0, 0, 0);
    
    if (latestEntryDate.getTime() !== today.getTime()) {
      // No entry today, streak is broken unless there was one yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (latestEntryDate.getTime() !== yesterday.getTime()) {
        return 0; // No entry yesterday either, streak is 0
      }
      
      previousDate = yesterday; // Start counting from yesterday
    }
    
    // Initialize the set of dates with entries
    const entryDates = new Set(
      sortedEntries.map(entry => {
        const date = new Date(entry.timestamp);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );
    
    // Count consecutive days with entries
    for (let date = previousDate; entryDates.has(date.getTime()); date.setDate(date.getDate() - 1)) {
      currentStreak++;
      
      // Check for the next consecutive day
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() - 1);
      
      if (!entryDates.has(nextDay.getTime())) {
        break;
      }
    }
    
    return currentStreak;
  };

  const streak = historyData ? calculateStreak(historyData.entries) : 0;

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
        
        {/* Mood Score Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">Today's Mood</h3>
            {isLoading || !historyData ? (
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-16 w-16 bg-neutral-200 rounded-full mb-2"></div>
                <div className="h-4 w-24 bg-neutral-200 rounded"></div>
              </div>
            ) : historyData.entries.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="relative h-20 w-20 mb-2">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="#e0e0e0" 
                      strokeWidth="10"
                    />
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke={
                        calculateMoodScore(historyData.entries[0].emotions) >= 70 ? "#4CAF50" :
                        calculateMoodScore(historyData.entries[0].emotions) >= 50 ? "#8BC34A" :
                        calculateMoodScore(historyData.entries[0].emotions) >= 30 ? "#FFC107" :
                        "#F44336"
                      } 
                      strokeWidth="10"
                      strokeDasharray="282.7"
                      strokeDashoffset={282.7 - (282.7 * calculateMoodScore(historyData.entries[0].emotions) / 100)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {calculateMoodScore(historyData.entries[0].emotions)}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium text-neutral-700">
                    {calculateMoodScore(historyData.entries[0].emotions) >= 80 ? 'Very Positive' :
                     calculateMoodScore(historyData.entries[0].emotions) >= 65 ? 'Positive' :
                     calculateMoodScore(historyData.entries[0].emotions) >= 50 ? 'Slightly Positive' :
                     calculateMoodScore(historyData.entries[0].emotions) >= 40 ? 'Neutral' :
                     calculateMoodScore(historyData.entries[0].emotions) >= 25 ? 'Slightly Negative' :
                     calculateMoodScore(historyData.entries[0].emotions) >= 10 ? 'Negative' :
                     'Very Negative'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-neutral-500">No entries yet</p>
                <p className="text-sm text-neutral-400">Write your first journal entry to see your mood score</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Progress Card */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">Your Progress</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="flex flex-col items-center p-2 rounded-lg bg-neutral-50">
                <span className="text-xl font-bold text-primary">
                  {isLoading || !historyData ? '-' : historyData.entries.length}
                </span>
                <span className="text-xs text-neutral-600">Entries</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-neutral-50">
                <span className="text-xl font-bold text-secondary">
                  {isLoading || !historyData ? '-' : 
                   historyData.entries.length > 0 ? 
                   Object.keys(historyData.entries.reduce((acc, entry) => {
                     entry.emotions.forEach(emotion => acc[emotion.label.toLowerCase()] = true);
                     return acc;
                   }, {})).length : 0}
                </span>
                <span className="text-xs text-neutral-600">Emotions</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-neutral-50">
                <span className="text-xl font-bold text-accent">
                  {isLoading || !historyData ? '-' : 
                   historyData.entries.length > 1 ? 
                   Math.round((Date.now() - new Date(historyData.entries[historyData.entries.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                </span>
                <span className="text-xs text-neutral-600">Days</span>
              </div>
            </div>
            
            <div className="w-full bg-neutral-100 rounded-full h-2.5 mb-1">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (historyData?.entries.length || 0) * 10)}%` }}
              ></div>
            </div>
            <p className="text-xs text-neutral-500 text-right">
              {historyData?.entries.length || 0}/10 entries to reach level 1
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="emotions" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="emotions">Emotion Tracking</TabsTrigger>
          <TabsTrigger value="mood">Mood Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="emotions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Emotions Chart */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-neutral-800">Emotional Journey</h3>
                  <div className="flex space-x-2">
                    <div className="flex space-x-1 bg-neutral-100 p-1 rounded-md">
                      <Button
                        variant={timeRange === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setTimeRange('week')}
                      >
                        Week
                      </Button>
                      <Button
                        variant={timeRange === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setTimeRange('month')}
                      >
                        Month
                      </Button>
                      <Button
                        variant={timeRange === 'year' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setTimeRange('year')}
                      >
                        Year
                      </Button>
                    </div>
                    <div className="flex space-x-1 bg-neutral-100 p-1 rounded-md">
                      <Button
                        variant={chartType === 'line' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setChartType('line')}
                      >
                        <i className="fas fa-chart-line"></i>
                      </Button>
                      <Button
                        variant={chartType === 'bar' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setChartType('bar')}
                      >
                        <i className="fas fa-chart-bar"></i>
                      </Button>
                      <Button
                        variant={chartType === 'radar' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setChartType('radar')}
                      >
                        <i className="fas fa-spider"></i>
                      </Button>
                    </div>
                  </div>
                </div>
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
        </TabsContent>
        
        <TabsContent value="mood">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Mood */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-neutral-800 mb-4">Weekly Mood</h3>
                <div className="h-80">
                  <canvas ref={weeklyMoodChartRef}></canvas>
                  {isLoading && (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Monthly Mood */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-neutral-800 mb-4">Monthly Patterns</h3>
                <div className="h-80">
                  <canvas ref={monthlyMoodChartRef}></canvas>
                  {isLoading && (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
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
                    <button className="text-primary text-sm font-medium hover:underline">Explore →</button>
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
                    <button className="text-primary text-sm font-medium hover:underline">Explore →</button>
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
                    <button className="text-primary text-sm font-medium hover:underline">Explore →</button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
