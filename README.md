# Finance AI Agent

A specialized AI agent focused on the finance domain that can provide information about stocks, cryptocurrencies, financial news, and more. This agent follows a structured reasoning process using Start, Plan, Action, Observation, and Output states.

LIVE --- https://curiosity-ai-agent.netlify.app/
OUR PPT --- https://drive.google.com/file/d/1dSL7kldBZxwi-ACS9Pxfs3XXANeQ7-Jg/view?usp=sharing

## Features
- Real-time stock price information and historical data analysis
- Cryptocurrency market tracking and trend analysis
- Currency exchange rates and conversion calculations
- Financial news aggregation and sentiment analysis
- Investment return calculations and portfolio optimization
- Market trend predictions and insights
- Personalized financial advice based on user goals
- Interactive data visualizations for financial metrics
- Automated financial report generation
- Alert system for significant market movements


## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)
- Google Gemini API key
- Alpha Vantage API key (for real-time stock data)
- News API key (optional, for financial news)
- Exchange Rate API key (optional, for currency exchange rates)

### Quick Setup

#### For Windows Users:
```
quick-start.bat
```

#### For Mac/Linux Users:
```
chmod +x quick-start.sh
./quick-start.sh
```

This script will:
1. Check if Node.js and npm are installed
2. Install all dependencies
3. Create a .env file if it doesn't exist
4. Prompt you to add your API keys
5. Start the server

#### Testing Your Setup
To verify that your environment and API keys are properly set up:
```
npm test
```
This will check for:
- Compatible Node.js version
- Required npm packages
- Presence and validity of API keys

See `get-api-keys.md` for detailed instructions on obtaining all necessary API keys.

### Manual Installation

1. Clone the repository
```
git clone https://github.com/yourusername/finance-ai-agent.git
cd finance-ai-agent
```

2. Install dependencies
```
npm install
```

3. Set up environment variables
```
cp .env.example .env
```
Then edit the `.env` file to add your API keys:
- GEMINI_API_KEY (required)
- ALPHA_VANTAGE_API_KEY (for real-time stock data)
- NEWS_API_KEY (optional, for financial news)
- EXCHANGE_RATE_API_KEY (optional, for currency exchange rates)

4. Start the server
```
npm start
```

For development with auto-restart:
```
npm run dev
```

5. Open your browser and navigate to `http://localhost:3001`

                 OR   
   
 You can also Test it here --- `https://curiosity-ai-agent.netlify.app/`

   
## Usage

The Finance AI Agent responds to queries in a structured format:

- **START**: Restates your question or request
- **PLAN**: Outlines the steps to answer your query
- **ACTION**: Specifies the tool and parameters used
- **OBSERVATION**: Shows the data returned from the tool
- **OUTPUT**: Provides the final response based on observations

### Example Queries

- "What is the current price of Tesla stock?"
- "How much is Bitcoin worth right now?"
- "What are the latest news in the stock market?"
- "Calculate the return on $5000 invested at 8% for 5 years with compound interest"
- "What is the exchange rate between USD and EUR?"

## Available Tools

The agent has access to the following financial tools:

1. `getStockPrice`: Retrieves the current stock price from Alpha Vantage API
2. `getCryptoPrice`: Retrieves the current price of cryptocurrencies from CoinGecko API
3. `getExchangeRate`: Gets current exchange rate between two currencies
4. `getFinancialNews`: Retrieves recent news articles about a financial topic
5. `calculateInvestmentReturn`: Calculates potential returns on investment based on parameters

## API Integrations

### Stock Prices
The application uses [Alpha Vantage](https://www.alphavantage.co/) for real-time stock market data. You need to sign up for a free API key.

### Cryptocurrency Prices
Real-time cryptocurrency prices are fetched from [CoinGecko](https://www.coingecko.com/en/api), which provides free API access with reasonable rate limits.

### Exchange Rates
Currency exchange rates are provided by [ExchangeRate-API](https://www.exchangerate-api.com/). A free tier is available.

### Financial News
Financial news is sourced from [News API](https://newsapi.org/), which offers a free tier with limitations.

## Note on API Keys

If API keys are not provided in the .env file, the respective tools will fall back to mock data to demonstrate functionality. For production use, it's recommended to configure all API keys.

