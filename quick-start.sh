#!/bin/bash

# Finance AI Agent Quick Start Script

echo "🚀 Setting up Finance AI Agent..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from template. Please edit it to add your API keys."
        echo "📝 See get-api-keys.md for instructions on obtaining API keys."
    else
        echo "❌ .env.example file not found. Creating a basic .env file..."
        echo "# Google Gemini API Key (required)" > .env
        echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env
        echo "# Alpha Vantage API Key (for stock data)" >> .env
        echo "ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here" >> .env
        echo "# Port (optional)" >> .env
        echo "PORT=3001" >> .env
        echo "✅ Created basic .env file. Please edit it to add your API keys."
        echo "📝 See get-api-keys.md for instructions on obtaining API keys."
    fi
    
    # Give user time to edit the .env file
    read -p "Press Enter after you've added your API keys to continue (or Ctrl+C to exit)..." 
fi

# Start the server
echo "🌐 Starting Finance AI Agent server..."
npm start 