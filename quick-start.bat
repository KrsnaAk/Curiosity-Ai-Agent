@echo off
echo 🚀 Setting up Finance AI Agent...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v14 or higher.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Check if .env file exists
if not exist .env (
    echo ⚠️ .env file not found. Creating from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo ✅ Created .env file from template. Please edit it to add your API keys.
        echo 📝 See get-api-keys.md for instructions on obtaining API keys.
    ) else (
        echo ❌ .env.example file not found. Creating a basic .env file...
        echo # Google Gemini API Key (required) > .env
        echo GEMINI_API_KEY=your_gemini_api_key_here >> .env
        echo # Alpha Vantage API Key (for stock data) >> .env
        echo ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here >> .env
        echo # Port (optional) >> .env
        echo PORT=3001 >> .env
        echo ✅ Created basic .env file. Please edit it to add your API keys.
        echo 📝 See get-api-keys.md for instructions on obtaining API keys.
    )
    
    REM Give user time to edit the .env file
    echo Press Enter after you've added your API keys to continue (or Ctrl+C to exit)...
    pause > nul
)

REM Start the server
echo 🌐 Starting Finance AI Agent server...
call npm start 