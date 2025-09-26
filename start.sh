#!/bin/bash
# Production start script for TheraMind

echo "🚀 Starting TheraMind in production mode..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Build the application
echo "🔨 Building application..."
npm run build

# Start the application
echo "✨ Starting server..."
npm start