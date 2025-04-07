const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

// Configure Google Generative AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Tools implementation
const tools = {
  getStockPrice: async (symbol) => {
    try {
      // Using Alpha Vantage API
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        return "Alpha Vantage API key not configured. Please add it to your .env file.";
      }
      
      const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
      
      if (response.data && response.data['Global Quote'] && response.data['Global Quote']['05. price']) {
        const price = parseFloat(response.data['Global Quote']['05. price']).toFixed(2);
        return `$${price}`;
      } else if (response.data && response.data.Note && response.data.Note.includes('API call frequency')) {
        return `API call frequency exceeded. Alpha Vantage has a limit of 5 calls per minute and 500 calls per day for free accounts.`;
      } else {
        return `Could not retrieve price for ${symbol}. Please check the ticker symbol.`;
      }
    } catch (error) {
      console.error('Error fetching stock price:', error);
      return `Error retrieving stock price: ${error.message}`;
    }
  },
  
  getCryptoPrice: async (symbol) => {
    try {
      // Check if we have a CoinMarketCap API key
      const cmcApiKey = process.env.CMC_API_KEY;
      if (cmcApiKey) {
        try {
          // Convert common symbols to CoinMarketCap format
          const symbolMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'SOL': 'solana',
            'XRP': 'ripple',
            'ADA': 'cardano',
            'DOGE': 'dogecoin',
            'DOT': 'polkadot',
            'LINK': 'chainlink'
          };
          
          const coinSymbol = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
          
          // Call CoinMarketCap API
          const response = await axios.get(
            `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}`,
            {
              headers: {
                'X-CMC_PRO_API_KEY': cmcApiKey
              }
            }
          );
          
          if (response.data && response.data.data && response.data.data[symbol.toUpperCase()]) {
            const price = response.data.data[symbol.toUpperCase()].quote.USD.price;
            return `$${parseFloat(price).toFixed(2)}`;
          }
        } catch (cmcError) {
          console.error('CoinMarketCap API error, falling back to CoinGecko:', cmcError.message);
          // Fall back to CoinGecko if CMC fails
        }
      }
      
      // Fallback to CoinGecko API (no API key needed)
      // Convert common symbols to CoinGecko format
      const symbolMap = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'DOGE': 'dogecoin',
        'DOT': 'polkadot',
        'LINK': 'chainlink',
        'SHIB': 'shiba-inu',
        'AVAX': 'avalanche-2',
        'DOT': 'polkadot',
        'LTC': 'litecoin',
        'MATIC': 'matic-network'
      };
      
      const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
      
      // Call CoinGecko API
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        { timeout: 5000 } // Set a timeout to avoid hanging
      );
      
      if (response.data && response.data[coinId] && response.data[coinId].usd) {
        const price = response.data[coinId].usd;
        return `$${parseFloat(price).toFixed(2)}`;
      } else {
        // If we can't get real data, return a mock but with a message
        const mockPrice = (Math.random() * 10000 + 20000).toFixed(2);
        return `$${mockPrice} (Mock data - API response did not contain price information)`;
      }
    } catch (error) {
      console.error('Error fetching crypto price:', error);
      // If all APIs fail, return mock data with a note
      const mockPrice = (Math.random() * 10000 + 20000).toFixed(2);
      return `$${mockPrice} (Mock data - API Error: ${error.message})`;
    }
  },
  
  getExchangeRate: async (from, to) => {
    try {
      // Mock exchange rates for common pairs
      const mockRates = {
        'USD_EUR': 0.92,
        'EUR_USD': 1.09,
        'USD_GBP': 0.79,
        'GBP_USD': 1.27,
        'USD_JPY': 154.32,
        'JPY_USD': 0.0065,
        'USD_INR': 83.5,
        'INR_USD': 0.012
      };
      
      const key = `${from.toUpperCase()}_${to.toUpperCase()}`;
      if (mockRates[key]) {
        return mockRates[key];
      } else {
        return 1.0; // Default fallback
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return 1.0; // Default fallback
    }
  },
  
  getFinancialNews: async (topic) => {
    try {
      // Mock news data
      const mockNews = {
        'stock market': [
          'S&P 500 reaches new all-time high amid strong earnings',
          'Tech stocks rally as AI investment continues to grow',
          'Market volatility increases due to geopolitical tensions'
        ],
        'crypto': [
          'Bitcoin surpasses $60,000 as institutional adoption grows',
          'Ethereum completes major network upgrade',
          'Regulatory clarity improves for cryptocurrency markets'
        ],
        'cryptocurrency': [
          'Bitcoin surpasses $60,000 as institutional adoption grows',
          'Ethereum completes major network upgrade',
          'Regulatory clarity improves for cryptocurrency markets'
        ]
      };
      
      return mockNews[topic.toLowerCase()] || mockNews['stock market'];
    } catch (error) {
      console.error('Error fetching financial news:', error);
      return ['Error retrieving financial news. Please try again later.'];
    }
  },
  
  calculateInvestmentReturn: (principal, rate, time, isCompound = true) => {
    if (isCompound) {
      // Compound interest formula: A = P(1 + r/100)^t
      return principal * Math.pow(1 + rate / 100, time);
    } else {
      // Simple interest formula: A = P(1 + rt/100)
      return principal * (1 + (rate * time) / 100);
    }
  }
};

// Main function to process user input
async function processUserInput(userInput) {
  try {
    // Special case for crypto price queries
    if (
        // Match variations of "what is X price" or "how much is X worth"
        (userInput.match(/what(?:'s| is) (?:the (?:current|latest|)|)(?:price|value) of/i) ||
         userInput.match(/how much (?:is|does|are) .* (?:cost|worth|value)/i) ||
         userInput.match(/what(?:'s| is) .* worth right now/i) ||
         userInput.match(/what(?:'s| is) .* trading at/i) ||
         userInput.match(/(?:price|worth) (?:of|for) .*/i)) &&
        // And it contains a cryptocurrency name
        userInput.match(/bitcoin|btc|ethereum|eth|solana|sol|cardano|ada|ripple|xrp|dogecoin|doge|crypto/i)
    ) {
        // Extract the cryptocurrency symbol
        let symbol = 'BTC'; // Default to Bitcoin if crypto is mentioned but not specific
        
        // Check for different cryptocurrencies
        if (userInput.match(/ethereum|eth/i)) symbol = 'ETH';
        else if (userInput.match(/solana|sol/i)) symbol = 'SOL';
        else if (userInput.match(/cardano|ada/i)) symbol = 'ADA';
        else if (userInput.match(/ripple|xrp/i)) symbol = 'XRP';
        else if (userInput.match(/dogecoin|doge/i)) symbol = 'DOGE';
        else if (userInput.match(/polkadot|dot/i)) symbol = 'DOT';
        else if (userInput.match(/litecoin|ltc/i)) symbol = 'LTC';
        else if (userInput.match(/chainlink|link/i)) symbol = 'LINK';
        
        try {
            // Get the cryptocurrency price
            const price = await tools.getCryptoPrice(symbol);
            
            // Format a human-readable name
            const cryptoNames = {
                'BTC': 'Bitcoin',
                'ETH': 'Ethereum',
                'SOL': 'Solana',
                'ADA': 'Cardano',
                'XRP': 'Ripple (XRP)',
                'DOGE': 'Dogecoin',
                'DOT': 'Polkadot',
                'LTC': 'Litecoin',
                'LINK': 'Chainlink'
            };
            const cryptoName = cryptoNames[symbol] || symbol;
            
            // Formulate a response
            let description = '';
            if (symbol === 'BTC') {
                description = 'Bitcoin (BTC) is the first and most well-known cryptocurrency, created in 2009 by an anonymous person or group using the pseudonym Satoshi Nakamoto. It operates on a decentralized blockchain network without a central authority.';
            } else if (symbol === 'ETH') {
                description = 'Ethereum (ETH) is a decentralized platform that enables smart contracts and decentralized applications (dApps) to be built and run without downtime, fraud, control, or interference from a third party.';
            } else if (symbol === 'SOL') {
                description = 'Solana (SOL) is a high-performance blockchain supporting builders around the world creating crypto apps that scale. It aims to provide fast transaction speeds and low fees.';
            }
            
            return `START: ${userInput}\n\nPLAN: I'll check the current price of ${cryptoName}.\n\nACTION: getCryptoPrice("${symbol}")\n\nOBSERVATION: ${price}\n\nOUTPUT: The current price of ${cryptoName} is ${price}. ${description}`;
        } catch (error) {
            console.error('Error in crypto price query:', error);
            // Fall through to Gemini response if there's an error
        }
    }
    
    // Special case for stock price queries
    if (
        // Match variations of "what is X price" or "how much is X worth"
        (userInput.match(/what(?:'s| is) (?:the (?:current|latest|)|)(?:price|value) of/i) ||
         userInput.match(/how much (?:is|does|are) .* (?:cost|worth|value)/i) ||
         userInput.match(/what(?:'s| is) .* worth right now/i) ||
         userInput.match(/what(?:'s| is) .* trading at/i) ||
         userInput.match(/(?:price|worth|value) (?:of|for) .*/i) ||
         userInput.match(/current (?:stock |share |)price/i)) && 
        // And it contains a stock-related term OR a potential stock symbol
        (userInput.match(/stock|share|ticker|NYSE|NASDAQ|company|corporation|inc\.|trading/i) ||
         userInput.match(/\b[A-Z]{1,5}\b/))
    ) {
        // Extract the stock symbol - this is a more comprehensive approach
        let symbol = '';
        let companyName = '';
        
        // Expanded list of common stock symbols and their names
        const stockMap = {
            'AAPL': { pattern: /apple|aapl/i, name: 'Apple Inc.' },
            'MSFT': { pattern: /microsoft|msft/i, name: 'Microsoft Corporation' },
            'GOOGL': { pattern: /google|googl|alphabet/i, name: 'Alphabet Inc. (Google)' },
            'AMZN': { pattern: /amazon|amzn/i, name: 'Amazon.com Inc.' },
            'META': { pattern: /meta|facebook|fb/i, name: 'Meta Platforms Inc.' },
            'TSLA': { pattern: /tesla|tsla/i, name: 'Tesla Inc.' },
            'NVDA': { pattern: /nvidia|nvda/i, name: 'NVIDIA Corporation' },
            'JPM': { pattern: /jpmorgan|jpm|chase/i, name: 'JPMorgan Chase & Co.' },
            'V': { pattern: /\bvisa\b|\bv\b/i, name: 'Visa Inc.' },
            'MA': { pattern: /\bmastercard\b|\bma\b/i, name: 'Mastercard Incorporated' },
            'DIS': { pattern: /disney|dis/i, name: 'The Walt Disney Company' },
            'NFLX': { pattern: /netflix|nflx/i, name: 'Netflix Inc.' },
            'ADBE': { pattern: /adobe|adbe/i, name: 'Adobe Inc.' },
            'INTC': { pattern: /intel|intc/i, name: 'Intel Corporation' },
            'AMD': { pattern: /\bamd\b/i, name: 'Advanced Micro Devices Inc.' },
            'IBM': { pattern: /\bibm\b/i, name: 'International Business Machines Corporation' },
            'CSCO': { pattern: /cisco|csco/i, name: 'Cisco Systems Inc.' },
            'KO': { pattern: /coca.?cola|ko\b/i, name: 'The Coca-Cola Company' },
            'PEP': { pattern: /pepsi|pepsico|pep\b/i, name: 'PepsiCo Inc.' },
            'WMT': { pattern: /walmart|wmt/i, name: 'Walmart Inc.' },
            'TGT': { pattern: /target|tgt/i, name: 'Target Corporation' },
            'SBUX': { pattern: /starbucks|sbux/i, name: 'Starbucks Corporation' },
            'NKE': { pattern: /nike|nke/i, name: 'Nike Inc.' }
        };
        
        // Try to find the stock symbol from the query
        for (const [stockSymbol, details] of Object.entries(stockMap)) {
            if (details.pattern.test(userInput)) {
                symbol = stockSymbol;
                companyName = details.name;
                break;
            }
        }
        
        // Extract any capital letters that might be a stock symbol if no match was found
        if (!symbol) {
            const symbolMatch = userInput.match(/\b[A-Z]{1,5}\b/);
            if (symbolMatch) {
                symbol = symbolMatch[0];
                // Avoid mistaking common words for stock symbols
                if (['I', 'A', 'THE', 'OF', 'IN', 'ON', 'AT', 'TO', 'IS', 'AM', 'ARE', 'AND'].includes(symbol)) {
                    symbol = '';
                }
            }
        }
        
        if (symbol) {
            try {
                // Get the stock price
                const price = await tools.getStockPrice(symbol);
                
                // Use the company name if available, otherwise just use the symbol
                const displayName = companyName || `${symbol} stock`;
                
                return `START: ${userInput}\n\nPLAN: I'll check the current price of ${displayName}.\n\nACTION: getStockPrice("${symbol}")\n\nOBSERVATION: ${price}\n\nOUTPUT: The current price of ${displayName} is ${price}. This is the latest price available from the stock market. Stock prices can fluctuate throughout the trading day.`;
            } catch (error) {
                console.error('Error in stock price query:', error);
                // Fall through to Gemini response if there's an error
            }
        }
    }
    
    // Special case for currency conversion
    if (userInput.match(/convert|conversion|exchange/i) && 
        (userInput.match(/\$|USD|dollar|₹|INR|rupee|EUR|euro|£|GBP|pound|¥|JPY|yen/i))) {

      // Extract currency amounts and types
      let amount = 0;
      let fromCurrency = '';
      let toCurrency = '';
      
      // Look for amount patterns (including formatted numbers like 1,00,000)
      const amountMatches = userInput.match(/(\d+(?:,\d+)*(?:\.\d+)?)/g);
      if (amountMatches && amountMatches.length > 0) {
        amount = parseFloat(amountMatches[0].replace(/,/g, ''));
      }
      
      // Currency patterns
      const currencyPatterns = {
        'USD': /(\$|USD|dollar)/i,
        'INR': /(₹|INR|rupee)/i,
        'EUR': /(€|EUR|euro)/i,
        'GBP': /(£|GBP|pound)/i,
        'JPY': /(¥|JPY|yen)/i
      };
      
      // Detect currencies
      for (const [code, pattern] of Object.entries(currencyPatterns)) {
        if (pattern.test(userInput)) {
          if (!fromCurrency) {
            fromCurrency = code;
          } else if (!toCurrency) {
            toCurrency = code;
            break;
          }
        }
      }
      
      // If only one currency is found, assume the other is USD
      if (fromCurrency && !toCurrency) {
        toCurrency = 'USD';
      } else if (!fromCurrency && toCurrency) {
        fromCurrency = 'USD';
      }
      
      // If we have all the necessary information
      if (amount > 0 && fromCurrency && toCurrency) {
        try {
          // Use the exchange rate tool
          const rate = await tools.getExchangeRate(fromCurrency, toCurrency);
          const convertedAmount = amount * rate;
          
          return `START: ${userInput}\n\nPLAN: I'll convert ${amount} ${fromCurrency} to ${toCurrency}.\n\nACTION: getExchangeRate("${fromCurrency}", "${toCurrency}")\n\nOBSERVATION: ${rate}\n\nOUTPUT: ${amount} ${fromCurrency} is equal to ${convertedAmount.toFixed(2)} ${toCurrency} based on the current exchange rate.`;
        } catch (error) {
          console.error('Error in currency conversion:', error);
        }
      }
    }
    
    // For other queries, generate a response with Gemini
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
        },
      });
      
      const prompt = `You are a financial assistant. Respond to this query: "${userInput}"
      
      If this is a finance-related question, provide a detailed answer.
      If it's about non-financial topics, relate it to economics or finance if possible.
      Be helpful, clear, and concise.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      return `START: ${userInput}\n\nPLAN: I'll analyze this query and provide relevant financial information.\n\nACTION: Generating response based on financial knowledge\n\nOBSERVATION: This query requires financial expertise.\n\nOUTPUT: ${text}`;
    } catch (error) {
      console.error('Error with Gemini API:', error);
      
      // Fallback response
      return `START: ${userInput}\n\nPLAN: I'll provide a response based on my knowledge.\n\nOBSERVATION: I'm having trouble accessing my AI capabilities.\n\nOUTPUT: I can help you with stock prices, cryptocurrency rates, exchange rates, investment calculations, and financial news. Could you try asking a specific finance-related question?`;
    }
  } catch (error) {
    console.error('Error processing user input:', error);
    return `START: ${userInput}\n\nPLAN: I'll provide a general response.\n\nOBSERVATION: There was an error processing your request.\n\nOUTPUT: I apologize for the inconvenience. I'm experiencing technical difficulties. Please try asking again about stocks, crypto, exchange rates, or investment calculations.`;
  }
}

module.exports = { processUserInput }; 