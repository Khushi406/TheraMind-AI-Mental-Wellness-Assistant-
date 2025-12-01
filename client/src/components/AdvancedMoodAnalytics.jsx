import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getMoodTrends, getTherapySuggestions } from '../lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Brain, 
  Lightbulb, 
  Target,
  Calendar,
  BarChart3,
  Heart,
  Sparkles,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';

const AdvancedMoodAnalytics = () => {
  const [moodTrends, setMoodTrends] = useState(null);
  const [therapySuggestions, setTherapySuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      const [trendsData, suggestionsData] = await Promise.all([
        getMoodTrends(),
        getTherapySuggestions()
      ]);
      
      setMoodTrends(trendsData);
      setTherapySuggestions(suggestionsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const getPredictionIcon = (prediction) => {
    switch (prediction) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPredictionColor = (prediction) => {
    switch (prediction) {
      case 'improving': return 'text-green-600 bg-green-50 border-green-200';
      case 'declining': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Advanced Mood Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Analyzing your mood patterns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-800">Advanced Mood Analytics</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Mood Trends</span>
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Predictions</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Personalized Tips</span>
          </TabsTrigger>
        </TabsList>

        {/* Mood Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weekly Trends */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>Weekly Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Positive Emotions</span>
                    <span className="text-sm text-gray-600">
                      {moodTrends?.trends?.weekly?.improvement || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={moodTrends?.trends?.weekly?.improvement || 0} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Based on {moodTrends?.trends?.weekly?.total || 0} entries</span>
                    {(moodTrends?.trends?.weekly?.improvement || 0) > 50 ? (
                      <ArrowUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span>Monthly Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Wellness</span>
                    <span className="text-sm text-gray-600">
                      {moodTrends?.trends?.monthly?.improvement || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={moodTrends?.trends?.monthly?.improvement || 0} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Total: {moodTrends?.totalEntries || 0} journal entries</span>
                    <Badge variant="outline" className="text-xs">
                      {moodTrends?.totalEntries > 10 ? 'Rich Data' : 'Building Insights'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span>Insights from Your Journey</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {moodTrends?.insights || 'Keep journaling to discover meaningful patterns in your emotional journey.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span>AI Mood Prediction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prediction Summary */}
              <div className={`p-4 rounded-lg border-2 ${getPredictionColor(moodTrends?.prediction)}`}>
                <div className="flex items-center space-x-3">
                  {getPredictionIcon(moodTrends?.prediction)}
                  <div>
                    <h3 className="font-semibold capitalize">
                      Your mood trend is {moodTrends?.prediction || 'stable'}
                    </h3>
                    <p className="text-sm mt-1">
                      Confidence: 
                      <span className={`font-medium ml-1 ${getConfidenceColor(moodTrends?.confidence)}`}>
                        {Math.round((moodTrends?.confidence || 0.5) * 100)}%
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {moodTrends?.recommendations && moodTrends.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">AI Recommendations:</h4>
                  <div className="space-y-2">
                    {moodTrends.recommendations.map((rec, index) => (
                      <div 
                        key={index} 
                        className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg"
                      >
                        <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personalized Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span>Personalized Wellness Tips</span>
                {therapySuggestions?.personalized && (
                  <Badge className="bg-green-100 text-green-800">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Personalized
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Context Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Context:</strong> {therapySuggestions?.context || 'General wellness guidance'}
                  {therapySuggestions?.basedOnEntries && (
                    <span className="ml-2">
                      • Based on your last {therapySuggestions.basedOnEntries} journal entries
                    </span>
                  )}
                </p>
              </div>

              {/* Suggestions */}
              <div className="space-y-3">
                {therapySuggestions?.suggestions?.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 leading-relaxed">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>Save Favorites</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <RefreshCw className="w-4 h-4" />
                  <span>Get New Tips</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedMoodAnalytics;