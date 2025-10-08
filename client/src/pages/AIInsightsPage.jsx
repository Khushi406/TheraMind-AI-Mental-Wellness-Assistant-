import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvancedMoodAnalytics from '../components/AdvancedMoodAnalytics';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  MessageCircle, 
  Target,
  Lightbulb,
  Calendar,
  Heart,
  BarChart3,
  Zap
} from 'lucide-react';

const AIInsightsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Insights & Analytics
          </h1>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Powered by advanced AI to understand your emotional patterns, predict trends, 
          and provide personalized mental wellness guidance.
        </p>
        
        {/* AI Features Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Gemini AI Powered
          </Badge>
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            Mood Prediction
          </Badge>
          <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
            <MessageCircle className="w-3 h-3 mr-1" />
            AI Therapist Chat
          </Badge>
          <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
            <Target className="w-3 h-3 mr-1" />
            Personalized Tips
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Advanced Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>AI Features</span>
          </TabsTrigger>
          <TabsTrigger value="wellness" className="flex items-center space-x-2">
            <Heart className="w-4 h-4" />
            <span>Wellness Hub</span>
          </TabsTrigger>
        </TabsList>

        {/* Advanced Analytics Tab */}
        <TabsContent value="analytics">
          <AdvancedMoodAnalytics />
        </TabsContent>

        {/* AI Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emotion Analysis Card */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-blue-500" />
                  <span>Advanced Emotion Analysis</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Gemini AI
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Our AI analyzes your journal entries to identify emotions, triggers, themes, and sentiment with incredible accuracy.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Multi-emotion detection with confidence scores</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Automatic trigger and theme identification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Sentiment analysis with magnitude scoring</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mood Prediction Card */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span>Predictive Mood Analytics</span>
                  <Badge className="bg-green-100 text-green-800">
                    <Calendar className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  AI predicts your mood trends and provides early insights into emotional patterns.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Mood trend prediction (improving/stable/declining)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Confidence scoring for predictions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Personalized recommendations based on trends</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Therapist Card */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-purple-500" />
                  <span>AI Wellness Companion</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    <Heart className="w-3 h-3 mr-1" />
                    24/7 Support
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Chat with our empathetic AI companion for emotional support, validation, and guidance.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Contextual conversation with emotional intelligence</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span className="text-sm">Support type classification (validation, guidance, etc.)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Follow-up questions for deeper exploration</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personalized Suggestions Card */}
            <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span>Smart Therapy Suggestions</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Target className="w-3 h-3 mr-1" />
                    Personalized
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  AI generates personalized coping strategies and therapy suggestions based on your emotional patterns.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Evidence-based coping strategies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Behavioral change recommendations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Personalized self-care practices</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Wellness Hub Tab */}
        <TabsContent value="wellness" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <span>Your Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Journal Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">85%</div>
                    <div className="text-sm text-gray-600">Positive Trend</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">7</div>
                    <div className="text-sm text-gray-600">Days Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Tip */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span>Today's Tip</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    "Take 5 minutes today to practice gratitude. Write down three things you're thankful for."
                  </p>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Heart className="w-3 h-3 mr-1" />
                    Gratitude Practice
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Mood Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>Today's Mood</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl">😊</div>
                    <div className="text-sm font-medium text-gray-700">Content</div>
                  </div>
                  <div className="text-xs text-gray-600 text-center">
                    Based on your latest journal entry
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wellness Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-500" />
                <span>Wellness Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-800">Daily Check-in</h3>
                  <p className="text-sm text-gray-600 mt-1">Track your daily mood and emotions</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-800">AI Chat</h3>
                  <p className="text-sm text-gray-600 mt-1">Talk to your wellness companion</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-800">Insights</h3>
                  <p className="text-sm text-gray-600 mt-1">Discover patterns in your journey</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInsightsPage;