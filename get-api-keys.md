# How to Get API Keys for the Finance AI Agent

Follow these steps to obtain all the API keys needed to run the Finance AI Agent with full functionality:

## 1. Google Gemini API Key (Required)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an account or log in with your Google account
3. Click on "Get API key" in the API section
4. Create a new API key or use an existing one
5. Copy the key and add it to your `.env` file as `GEMINI_API_KEY=your_key_here`

Note: Google offers free API credits each month for Gemini API calls.

## 2. Alpha Vantage API Key (For Stock Prices)

1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Fill out the form to request a free API key
3. Copy the key from the confirmation page or email
4. Add it to your `.env` file as `ALPHA_VANTAGE_API_KEY=your_key_here`

Note: The free tier allows 5 API calls per minute and 500 calls per day.

## 3. CoinMarketCap API Key (For Crypto Prices)

1. Go to [CoinMarketCap](https://coinmarketcap.com/api/)
2. Click "Get Your API Key Now"
3. Sign up for a free account
4. Once registered, copy your API key from the dashboard
5. Add it to your `.env` file as `CMC_API_KEY=your_key_here`

Note: The Basic plan offers 10,000 credits per month which is sufficient for basic cryptocurrency price queries.

## 4. CoinGecko API (For Crypto Prices)

CoinGecko offers a free API with reasonable rate limits and doesn't require an API key for basic usage. The application is configured to use this as a fallback if CoinMarketCap is unavailable.

## 5. ExchangeRate API Key (For Currency Exchange Rates)

1. Go to [ExchangeRate-API](https://www.exchangerate-api.com/)
2. Sign up for a free account
3. After verification, get your API key from the dashboard
4. Add it to your `.env` file as `EXCHANGE_RATE_API_KEY=your_key_here`

## 6. News API Key (For Financial News)

1. Visit [News API](https://newsapi.org/)
2. Sign up for a developer account
3. After signing up, get your API key from the dashboard
4. Add it to your `.env` file as `NEWS_API_KEY=your_key_here`

## Running with Limited API Keys

If you don't want to sign up for all services, the minimal requirement is the Gemini API key. For other services, the application will fall back to mock data when API keys are not provided. 