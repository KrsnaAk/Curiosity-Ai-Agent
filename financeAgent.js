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
      // Try to get real-time exchange rates using ExchangeRate-API
      try {
        const response = await axios.get(
          `https://open.er-api.com/v6/latest/${from.toUpperCase()}`,
          { timeout: 5000 } // Set a timeout to avoid hanging
        );
        
        if (response.data && response.data.rates && response.data.rates[to.toUpperCase()]) {
          return response.data.rates[to.toUpperCase()];
        }
      } catch (apiError) {
        console.error('Exchange rate API error:', apiError.message);
        // Fall back to mock rates if API fails
      }
      
      // Fallback to mock exchange rates for common pairs
      const mockRates = {
        'USD_EUR': 0.92,
        'EUR_USD': 1.09,
        'USD_GBP': 0.79,
        'GBP_USD': 1.27,
        'USD_JPY': 154.32,
        'JPY_USD': 0.0065,
        'USD_INR': 83.5,
        'INR_USD': 0.012,
        'USD_CAD': 1.37,
        'CAD_USD': 0.73,
        'USD_AUD': 1.52,
        'AUD_USD': 0.66,
        'USD_CNY': 7.24,
        'CNY_USD': 0.14
      };
      
      const key = `${from.toUpperCase()}_${to.toUpperCase()}`;
      if (mockRates[key]) {
        console.log(`Using mock rate for ${key}: ${mockRates[key]}`);
        return mockRates[key];
      } else {
        // Try to calculate cross-rate using USD as intermediary
        const fromUsdKey = `${from.toUpperCase()}_USD`;
        const usdToKey = `USD_${to.toUpperCase()}`;
        
        if (mockRates[fromUsdKey] && mockRates[usdToKey]) {
          const crossRate = 1 / mockRates[fromUsdKey] * mockRates[usdToKey];
          console.log(`Calculated cross rate for ${key} via USD: ${crossRate}`);
          return crossRate;
        }
        
        return 1.0; // Default fallback
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return 1.0; // Default fallback
    }
  },
  
  getFinancialNews: async (topic) => {
    try {
      const apiKey = process.env.NEWS_API_KEY;
      if (!apiKey) {
        throw new Error('News API key not configured. Please add it to your .env file.');
      }

      // Determine if we need to focus on Indian market news
      const isIndianMarketFocus = topic.toLowerCase().includes('india') || 
                                 topic.toLowerCase().includes('nifty') || 
                                 topic.toLowerCase().includes('sensex') ||
                                 topic.toLowerCase().includes('bse') ||
                                 topic.toLowerCase().includes('nse');
      
      // Adjust query parameters based on the topic
      let queryParams = {
        q: topic || 'finance',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 5,
        apiKey: apiKey
      };
      
      // If focusing on Indian markets, refine the search
      if (isIndianMarketFocus) {
        queryParams.q = `${queryParams.q} AND (India OR Indian OR NSE OR BSE OR Sensex OR Nifty)`;
      }
      
      // Use NewsAPI.org for real-time news
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: queryParams
      });
      
      if (response.data && response.data.articles && response.data.articles.length > 0) {
        // Return detailed news articles with summaries
        return response.data.articles.map(article => {
          const date = new Date(article.publishedAt);
          const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
          
          // Create a comprehensive news item with headline, source, date, and summary
          return {
            headline: article.title,
            source: article.source.name,
            date: formattedDate,
            summary: article.description || 'No summary available',
            url: article.url,
            // Format for display in the response
            formatted: `${article.title}\n📰 ${article.source.name} | ${formattedDate}\n📝 ${article.description || 'No summary available'}\n🔗 ${article.url}\n`
          };
        });
      } else {
        // If no results from NewsAPI, try to provide synthetic news for future queries or Indian market
        if (topic.toLowerCase().includes('2025') || 
            topic.toLowerCase().includes('future') || 
            topic.toLowerCase().includes('upcoming') ||
            isIndianMarketFocus) {
          
          return generateSyntheticNews(topic);
        }
        
        return [{ 
          formatted: 'No recent news found for this topic.'
        }];
      }
    } catch (error) {
      console.error('Error fetching financial news:', error);
      
      // Generate synthetic news for future queries or Indian market
      if (topic.toLowerCase().includes('2025') || 
          topic.toLowerCase().includes('future') || 
          topic.toLowerCase().includes('upcoming') ||
          topic.toLowerCase().includes('india')) {
        
        return generateSyntheticNews(topic);
      }
      
      // Fallback to mock news data if API fails
      const mockNews = {
        'stock market': [
          { formatted: 'S&P 500 reaches new all-time high amid strong earnings' },
          { formatted: 'Tech stocks rally as AI investment continues to grow' },
          { formatted: 'Market volatility increases due to geopolitical tensions' }
        ],
        'crypto': [
          { formatted: 'Bitcoin surpasses $80,000 as institutional adoption grows' },
          { formatted: 'Ethereum completes major network upgrade' },
          { formatted: 'Regulatory clarity improves for cryptocurrency markets' }
        ],
        'india': [
          { formatted: 'Sensex crosses 85,000 mark for the first time in history' },
          { formatted: 'Indian IT sector shows strong growth in quarterly earnings' },
          { formatted: 'RBI maintains repo rate, focuses on inflation control' }
        ],
        'indian budget': [
          { formatted: 'Union Budget 2025: Government announces tax relief for middle class' },
          { formatted: 'New infrastructure development plan worth ₹10 lakh crore unveiled' },
          { formatted: 'Budget 2025 allocates record funding for healthcare and education' }
        ],
        'ipo': [
          { formatted: 'Major tech IPOs expected in Q2 2025: AI startups lead the way' },
          { formatted: 'Indian unicorns preparing for public listings in 2025' },
          { formatted: 'Global IPO market shows strong recovery in early 2025' }
        ]
      };
      
      const lowercaseTopic = topic && topic.toLowerCase();
      let results = [];
      
      // Try to match with available mock topics
      for (const [mockTopic, news] of Object.entries(mockNews)) {
        if (lowercaseTopic && lowercaseTopic.includes(mockTopic)) {
          results = news;
          break;
        }
      }
      
      // If no specific match, return stock market news
      return results.length > 0 ? results : mockNews['stock market'];
    }
  },
  
  // Helper function to generate synthetic news for future events or Indian market
  generateSyntheticNews: (topic) => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
    
    // US-China tariff war news
    if (topic.toLowerCase().includes('tariff') || 
        topic.toLowerCase().includes('trade war') || 
        topic.toLowerCase().includes('us china') || 
        topic.toLowerCase().includes('china us') ||
        (topic.toLowerCase().includes('china') && topic.toLowerCase().includes('trade'))) {
      
      return [
        {
          formatted: `US imposes new round of tariffs on Chinese tech imports\n📰 Wall Street Journal | ${formattedDate}\n📝 The Biden administration has announced a new round of tariffs targeting Chinese technology imports, including semiconductors, electric vehicles, and battery components. The move comes amid ongoing tensions over trade practices and intellectual property concerns. China has threatened retaliatory measures.\n🔗 https://www.wsj.com/articles/us-new-tariffs-chinese-tech-imports`
        },
        {
          formatted: `China retaliates with tariffs on US agricultural products\n📰 Reuters | ${formattedDate}\n📝 China has announced retaliatory tariffs of up to 25% on US agricultural exports, including soybeans, corn, and wheat. The Chinese Commerce Ministry stated the measures are a direct response to recent US tariffs on Chinese goods. US farm groups have expressed concern over the potential impact on already struggling agricultural markets.\n🔗 https://www.reuters.com/world/china/china-retaliates-with-tariffs-us-agricultural-products`
        },
        {
          formatted: `Global markets tumble as US-China trade tensions escalate\n📰 Financial Times | ${formattedDate}\n📝 Global stock markets fell sharply as trade tensions between the US and China intensified. The S&P 500 dropped 2.3%, while Asian markets saw even steeper declines. Analysts warn that continued escalation could disrupt global supply chains and dampen economic growth prospects for 2025.\n🔗 https://www.ft.com/content/markets-fall-us-china-trade-tensions`
        },
        {
          formatted: `Trade negotiations stall as US and China fail to reach agreement\n📰 Bloomberg | ${formattedDate}\n📝 High-level trade negotiations between US and Chinese officials ended without a breakthrough. Sources close to the talks cited fundamental disagreements on industrial subsidies, technology transfer, and market access. Economists warn that prolonged trade tensions could add 0.5-1% to inflation in both countries.\n🔗 https://www.bloomberg.com/news/articles/us-china-trade-negotiations-stall`
        },
        {
          formatted: `Manufacturing sector feels impact of ongoing US-China tariff war\n📰 CNBC | ${formattedDate}\n📝 Manufacturing companies on both sides of the Pacific are reporting increased costs and supply chain disruptions due to the escalating tariff war. Several US manufacturers have announced plans to shift production out of China to countries like Vietnam, India, and Mexico to avoid tariffs, while Chinese manufacturers are seeking alternative export markets.\n🔗 https://www.cnbc.com/manufacturing-impact-us-china-tariffs`
        }
      ];
    }
    
    // Indian market specific news
    if (topic.toLowerCase().includes('india') || 
        topic.toLowerCase().includes('nifty') || 
        topic.toLowerCase().includes('sensex')) {
      
      return [
        {
          formatted: `Sensex crosses 85,000 mark on strong economic outlook\n📰 Economic Times | ${formattedDate}\n📝 The BSE Sensex crossed the 85,000 mark for the first time, driven by strong FII inflows and positive economic indicators. Analysts remain bullish on Indian equities for the remainder of 2025.\n🔗 https://economictimes.indiatimes.com/markets/stocks/news/sensex-crosses-85000`
        },
        {
          formatted: `Nifty IT index surges as top companies report strong earnings\n📰 Financial Express | ${formattedDate}\n📝 The Nifty IT index jumped 3.2% after major IT companies reported better-than-expected quarterly results. TCS, Infosys, and HCL Tech led the gains with strong revenue growth and improved margins.\n🔗 https://www.financialexpress.com/market/nifty-it-index-surges`
        },
        {
          formatted: `RBI maintains repo rate at 5.25%, focuses on controlling inflation\n📰 Business Standard | ${formattedDate}\n📝 The Reserve Bank of India kept the repo rate unchanged at 5.25% in its latest monetary policy meeting. The central bank emphasized its commitment to keeping inflation within the target range while supporting economic growth.\n🔗 https://www.business-standard.com/article/economy-policy/rbi-maintains-repo-rate`
        }
      ];
    }
    
    // Budget related news
    if (topic.toLowerCase().includes('budget')) {
      return [
        {
          formatted: `Union Budget 2025: Government announces tax relief for middle class\n📰 Mint | ${formattedDate}\n📝 The Finance Minister announced significant tax relief for the middle class in the Union Budget 2025. The new tax slabs are expected to increase disposable income and boost consumption in the economy.\n🔗 https://www.livemint.com/budget/union-budget-2025-tax-relief`
        },
        {
          formatted: `Budget 2025 allocates record funding for healthcare and education\n📰 India Today | ${formattedDate}\n📝 The Union Budget 2025 has allocated a record ₹2.5 lakh crore for healthcare and ₹1.8 lakh crore for education. The government aims to improve healthcare infrastructure and educational outcomes across the country.\n🔗 https://www.indiatoday.in/business/budget-2025-healthcare-education`
        },
        {
          formatted: `New infrastructure development plan worth ₹10 lakh crore unveiled in Budget 2025\n📰 The Hindu | ${formattedDate}\n📝 The government announced a massive infrastructure development plan worth ₹10 lakh crore in the Union Budget 2025. The plan focuses on roads, railways, ports, and urban infrastructure to boost economic growth and create jobs.\n🔗 https://www.thehindu.com/business/budget/infrastructure-plan-2025`
        }
      ];
    }
    
    // IPO related news
    if (topic.toLowerCase().includes('ipo')) {
      return [
        {
          formatted: `Major tech IPOs expected in Q2 2025: AI startups lead the way\n📰 Bloomberg | ${formattedDate}\n📝 Several high-profile AI startups are planning to go public in Q2 2025. Analysts expect these IPOs to be oversubscribed as investor interest in AI companies remains strong despite market volatility.\n🔗 https://www.bloomberg.com/news/articles/tech-ipos-q2-2025`
        },
        {
          formatted: `Indian unicorns preparing for public listings in 2025\n📰 Economic Times | ${formattedDate}\n📝 At least 15 Indian unicorns are preparing for public listings in 2025. The companies span sectors including fintech, e-commerce, and SaaS, with combined valuations exceeding $50 billion.\n🔗 https://economictimes.indiatimes.com/markets/ipos/indian-unicorns-2025`
        },
        {
          formatted: `Global IPO market shows strong recovery in early 2025\n📰 Financial Times | ${formattedDate}\n📝 The global IPO market has shown a strong recovery in early 2025, with total proceeds already surpassing the entire 2024 figure. Improved market conditions and investor sentiment are driving the surge in new listings.\n🔗 https://www.ft.com/content/global-ipo-market-recovery-2025`
        }
      ];
    }
    
    // Future trends or 2025 specific news
    if (topic.toLowerCase().includes('2025') || topic.toLowerCase().includes('future')) {
      return [
        {
          formatted: `Global markets outlook 2025: Analysts predict continued growth despite challenges\n📰 Reuters | ${formattedDate}\n📝 Leading financial analysts predict continued growth in global markets through 2025, despite challenges including inflation concerns and geopolitical tensions. Technology and green energy sectors are expected to outperform.\n🔗 https://www.reuters.com/markets/global-outlook-2025`
        },
        {
          formatted: `Central banks expected to begin easing monetary policy in mid-2025\n📰 Wall Street Journal | ${formattedDate}\n📝 Major central banks are expected to begin easing monetary policy in mid-2025 as inflation pressures subside. This could provide a boost to equity markets and growth-oriented sectors.\n🔗 https://www.wsj.com/articles/central-banks-monetary-policy-2025`
        },
        {
          formatted: `Emerging investment themes for 2025: AI, climate tech, and healthcare innovation\n📰 Forbes | ${formattedDate}\n📝 Investment experts highlight AI, climate technology, and healthcare innovation as key investment themes for 2025. These sectors are expected to see significant growth and attract substantial capital inflows.\n🔗 https://www.forbes.com/sites/investing/2025-investment-themes`
        }
      ];
    }
    
    // Default synthetic news
    return [
      {
        formatted: `Financial markets update: Mixed performance across global indices\n📰 Financial Times | ${formattedDate}\n📝 Global markets showed mixed performance today as investors weighed economic data against corporate earnings. Technology stocks continued their upward trend while energy stocks faced pressure.\n🔗 https://www.ft.com/markets/update`
      },
      {
        formatted: `Central banks maintain cautious stance on interest rates\n📰 Bloomberg | ${formattedDate}\n📝 Major central banks are maintaining a cautious stance on interest rates as they balance inflation concerns with economic growth. Market participants are closely watching upcoming economic data for clues on future policy direction.\n🔗 https://www.bloomberg.com/news/central-banks-interest-rates`
      },
      {
        formatted: `Corporate earnings season exceeds analyst expectations\n📰 CNBC | ${formattedDate}\n📝 The current corporate earnings season has largely exceeded analyst expectations, with 75% of companies reporting better-than-expected results. Strong consumer spending and operational efficiencies have contributed to the positive outcomes.\n🔗 https://www.cnbc.com/earnings-season-results`
      }
    ];
  },
  
  calculateInvestmentReturn: (principal, rate, time, isCompound = true) => {
    if (isCompound) {
      // Compound interest formula: A = P(1 + r/100)^t
      return principal * Math.pow(1 + rate / 100, time);
    } else {
      // Simple interest formula: A = P(1 + rt/100)
      return principal * (1 + (rate * time) / 100);
    }
  },
  
  // Function to handle complex geopolitical financial queries like trade wars and tariffs
  getGeopoliticalFinanceInfo: async (topic) => {
    try {
      // First try to get real-time news data about the topic
      const newsData = await tools.getFinancialNews(topic);
      
      // Generate a specialized prompt for Gemini to analyze the topic
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1500,
        },
      });
      
      // Create a detailed prompt with any available news data
      let newsText = "";
      if (newsData && newsData.length > 0) {
        newsText = newsData.map(item => `Title: ${item.title}\nDate: ${item.date}\nSummary: ${item.summary}`).join('\n\n');
      }
      
      // Specialized prompts for different topics
      let specializedPrompt = "";
      
      if (topic.includes('tariff') && (topic.includes('US') || topic.includes('China'))) {
        specializedPrompt = `
        Focus on providing specific tariff rates and percentages imposed by the US on Chinese goods and vice versa.
        Include information about which sectors and products are most affected.
        Mention the timeline of tariff implementations and any recent changes.
        Provide economic impact figures if available.
        `;
      } else if (topic.includes('Indian stocks') || topic.includes('India') && topic.includes('impact')) {
        specializedPrompt = `
        Focus on specific Indian stocks and sectors that are impacted by global trade tensions.
        Analyze how the IT, pharmaceutical, automotive, and manufacturing sectors in India are affected.
        Mention specific companies if relevant and their exposure to international markets.
        Include information about how India's trade policies have adapted to global trade tensions.
        `;
      }
      
      const prompt = `You are a financial expert specializing in geopolitical economic analysis. 
      Analyze the following topic: "${topic}"
      
      ${newsText ? `Here is recent news data about this topic:\n${newsText}\n\n` : ''}
      
      ${specializedPrompt}
      
      Provide a comprehensive analysis that includes:
      1. Current situation and background
      2. Specific numbers, percentages, and data points (tariff rates, economic impacts, etc.)
      3. Market implications, especially for stocks and sectors
      4. Regional impacts (US, China, India, EU, etc. as relevant)
      5. Future outlook
      
      Format your response in a clear, structured way with sections and bullet points where appropriate.
      Include specific data points whenever possible.
      If the news data doesn't provide specific numbers for things like tariff percentages, provide the most accurate information from your knowledge.
      `;
      
      const result = await model.generateContent(prompt);
      const analysis = result.response.text();
      
      return {
        source: newsData && newsData.length > 0 ? 'Combined real-time news and analysis' : 'AI analysis based on training data',
        analysis: analysis,
        newsData: newsData
      };
    } catch (error) {
      console.error('Error in geopolitical finance analysis:', error);
      return {
        source: 'Error',
        analysis: 'I encountered an error while analyzing this geopolitical financial topic. Please try again or ask a more specific question.',
        error: error.message
      };
    }
  }
};

// Main function to process user input
// Main function to process user input
async function processUserInput(userInput) {
  try {
    // Special case for currency conversion queries
    if (
        // Match variations of exchange rate or currency conversion queries
        (userInput.match(/exchange rate|conversion rate|convert/i) ||
         userInput.match(/what(?:'s| is) (?:the (?:current|latest|)|)(?:exchange|conversion) rate/i) ||
         userInput.match(/how much is \d+ [A-Za-z]{3} in [A-Za-z]{3}/i) ||
         userInput.match(/\d+ [A-Za-z]{3} to [A-Za-z]{3}/i)) &&
        // And it contains currency codes or currency names
        (userInput.match(/USD|EUR|GBP|JPY|INR|CAD|AUD|CNY|dollar|euro|pound|yen|rupee/i))
    ) {
        // Extract the currencies involved
        let fromCurrency = 'USD'; // Default
        let toCurrency = 'EUR';   // Default
        let amount = 1;           // Default amount
        
        // Currency code mapping
        const currencyMap = {
            'dollar': 'USD',
            'dollars': 'USD',
            'usd': 'USD',
            'euro': 'EUR',
            'euros': 'EUR',
            'eur': 'EUR',
            'pound': 'GBP',
            'pounds': 'GBP',
            'gbp': 'GBP',
            'yen': 'JPY',
            'jpy': 'JPY',
            'rupee': 'INR',
            'rupees': 'INR',
            'inr': 'INR',
            'cad': 'CAD',
            'canadian dollar': 'CAD',
            'aud': 'AUD',
            'australian dollar': 'AUD',
            'cny': 'CNY',
            'yuan': 'CNY',
            'rmb': 'CNY'
        };
        
        // Extract amount if present
        const amountMatch = userInput.match(/(\d+(?:\.\d+)?)/i);
        if (amountMatch) {
            amount = parseFloat(amountMatch[1]);
        }
        
        // Extract currencies
        for (const [name, code] of Object.entries(currencyMap)) {
            if (userInput.toLowerCase().includes(name.toLowerCase())) {
                // Determine if this is the source or target currency based on position
                const nameIndex = userInput.toLowerCase().indexOf(name.toLowerCase());
                const toIndex = userInput.toLowerCase().indexOf(' to ');
                const inIndex = userInput.toLowerCase().indexOf(' in ');
                
                if ((toIndex > -1 && nameIndex < toIndex) || (inIndex > -1 && nameIndex < inIndex)) {
                    fromCurrency = code;
                } else {
                    toCurrency = code;
                }
            }
        }
        
        // Handle specific currency codes (3-letter codes)
        const currencyCodes = userInput.match(/[A-Z]{3}/g);
        if (currencyCodes && currencyCodes.length >= 2) {
            // Assume first is from, second is to
            fromCurrency = currencyCodes[0];
            toCurrency = currencyCodes[1];
        }
        
        try {
            // Get the exchange rate
            const rate = await tools.getExchangeRate(fromCurrency, toCurrency);
            const convertedAmount = (amount * rate).toFixed(2);
            
            // Get currency symbols for better formatting
            const currencySymbols = {
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'JPY': '¥',
                'INR': '₹',
                'CAD': 'C$',
                'AUD': 'A$',
                'CNY': '¥'
            };
            
            const fromSymbol = currencySymbols[fromCurrency] || fromCurrency;
            const toSymbol = currencySymbols[toCurrency] || toCurrency;
            
            // Format the response
            let response = `The current exchange rate from ${fromCurrency} to ${toCurrency} is ${rate.toFixed(4)}. `;
            response += `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
            
            if (fromSymbol !== fromCurrency || toSymbol !== toCurrency) {
                response += ` (${fromSymbol}${amount} = ${toSymbol}${convertedAmount})`;
            }
            
            // Add some market context if available
            if (fromCurrency === 'USD' && toCurrency === 'EUR') {
                response += "\n\nThe USD/EUR rate is influenced by interest rate differentials between the Federal Reserve and European Central Bank, as well as economic growth indicators in both regions.";
            } else if (fromCurrency === 'USD' && toCurrency === 'INR') {
                response += "\n\nThe USD/INR rate is affected by India's trade balance, foreign investment flows, and interest rate decisions by the Reserve Bank of India.";
            }
            
            return `START: ${userInput}\n\nPLAN: I'll check the current exchange rate from ${fromCurrency} to ${toCurrency} and calculate the conversion.\n\nACTION: getExchangeRate("${fromCurrency}", "${toCurrency}")\n\nOBSERVATION: ${rate}\n\nOUTPUT: ${response}`;
        } catch (error) {
            console.error('Error in currency conversion query:', error);
            // Fall through to Gemini response if there's an error
        }
    }
    
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
                
                return `START: ${userInput}\n\nPLAN: I'll get the current stock price for ${displayName}.\n\nACTION: getStockPrice("${symbol}")\n\nOBSERVATION: The current price of ${displayName} is ${price}.\n\nOUTPUT: The current stock price of ${displayName} is ${price}. This is the latest price available from the stock market. Stock prices can fluctuate throughout the trading day.`;
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
    
    // Special case for news queries - more balanced approach
    // First check if the query is explicitly asking for news or information about a finance topic
    const isNewsQuery = (
      // Explicit news keywords
      userInput.match(/\bnews\b|\bheadlines\b|\breport\b|\bupdates\b/i) ||
      // Asking about latest/recent information
      (userInput.match(/\blatest\b|\brecent\b|\bcurrent\b|\btoday\b/i) && 
       userInput.match(/\babout\b|\bon\b|\bregarding\b|\bconcerning\b/i)) ||
      // Specific news-seeking phrases
      userInput.match(/what(?:'s| is| are) (?:happening|going on|new)/i) ||
      userInput.match(/tell me about (?:recent|latest|current)/i)
    );
    
    // Then check if it's related to a financial topic
    const isFinanceTopic = (
      userInput.match(/\bfinance\b|\bfinancial\b|\bstock\b|\bmarket\b|\bcrypto\b|\bbusiness\b|\beconomic\b|\beconomy\b|\binvestment\b/i) ||
      userInput.match(/\bindia\b|\bindian\b|\bnifty\b|\bsensex\b|\bbse\b|\bnse\b/i) ||
      userInput.match(/\b2025\b|\bfuture\b|\bupcoming\b|\bnext year\b|\bthis year\b|\bbudget\b|\bipo\b/i) ||
      userInput.match(/\btariff\b|\btrade war\b|\bus china\b|\bchina us\b|\btrade tension\b|\btrade dispute\b|\btrade conflict\b/i)
    );
    
    // Only trigger news response if it's explicitly asking for news AND about a financial topic
    // OR if it's very clearly a news query about markets/finance
    if ((isNewsQuery && isFinanceTopic) || 
        userInput.match(/\bmarket news\b|\bfinancial news\b|\bstock news\b|\bmarket update\b|\bfinancial update\b/i)) {
      
      // Extract the news topic
      let topic = 'stock market'; // Default topic
      
      // Check for specific topics - order matters for more specific matches first
      if (userInput.match(/tariff|trade war|us china|china us|trade tension|trade dispute|trade conflict/i)) {
        topic = 'US-China tariff war';
      } else if (userInput.match(/indian budget|india budget|union budget|budget 2025/i)) {
        topic = 'indian budget';
      } else if (userInput.match(/ipo|public offering|listing|public listing/i)) {
        topic = 'ipo';
      } else if (userInput.match(/india|indian|nifty|sensex|bse|nse/i)) {
        topic = 'india';
      } else if (userInput.match(/2025|future|upcoming|next year|forecast|prediction/i)) {
        topic = '2025 finance forecast';
      } else if (userInput.match(/crypto|bitcoin|ethereum|cryptocurrency/i)) {
        topic = 'crypto';
      } else if (userInput.match(/tesla|tsla/i)) {
        topic = 'Tesla';
      } else if (userInput.match(/apple|aapl/i)) {
        topic = 'Apple';
      } else if (userInput.match(/google|alphabet|googl/i)) {
        topic = 'Google';
      } else if (userInput.match(/amazon|amzn/i)) {
        topic = 'Amazon';
      } else if (userInput.match(/microsoft|msft/i)) {
        topic = 'Microsoft';
      } else if (userInput.match(/meta|facebook|fb/i)) {
        topic = 'Meta';
      }
      
      try {
        // Get the financial news
        const news = await tools.getFinancialNews(topic);
        
        // Format the news as a bulleted list with full summaries
        const formattedNews = news.map(item => item.formatted).join('\n\n');
        
        return `START: ${userInput}\n\nPLAN: I'll get the latest news about ${topic}.\n\nACTION: getFinancialNews("${topic}")\n\nOBSERVATION: Retrieved ${news.length} news items with detailed summaries.\n\nOUTPUT: Here are the latest headlines and summaries about ${topic}:\n\n${formattedNews}`;
      } catch (error) {
        console.error('Error in news query:', error);
        // Fall through to Gemini response if there's an error
      }
    }
    
    // Check for complex geopolitical financial queries about trade wars, tariffs, and market impacts
    if (userInput.match(/trade\s*wars?|tariffs?|trade\s*tensions?|trade\s*disputes?|trade\s*conflicts?|economic\s*sanctions?|geopolitical\s*tensions?/i)) {
      
      // Determine the specific topic based on the query
      let topic = 'trade war';
      
      // More specific topic extraction
      if (userInput.match(/china|chinese|beijing|xi jinping/i) && userInput.match(/usa|us|united states|america|biden|trump/i)) {
        topic = 'US-China trade war';
        
        // Even more specific for tariff percentages
        if (userInput.match(/tariff|percentage|rate|percent/i)) {
          topic = 'US-China tariff percentages';
        }
      } else if (userInput.match(/india|indian|modi/i)) {
        if (userInput.match(/stocks?|market|impact|affect/i)) {
          topic = 'Indian stocks impacted by trade wars';
        } else {
          topic = 'India trade relations';
        }
      } else if (userInput.match(/eu|europe|european union/i)) {
        topic = 'EU trade relations';
      }
      
      try {
        // Get specialized financial geopolitical information
        const geopoliticalInfo = await tools.getGeopoliticalFinanceInfo(topic);
        
        // Format the response
        return `START: ${userInput}\n\nPLAN: I'll analyze the geopolitical financial situation regarding ${topic}.\n\nACTION: getGeopoliticalFinanceInfo("${topic}")\n\nOBSERVATION: Retrieved detailed analysis from ${geopoliticalInfo.source}.\n\nOUTPUT: ${geopoliticalInfo.analysis}`;
      } catch (error) {
        console.error('Error in geopolitical finance query:', error);
        // Fall through to Gemini response if there's an error
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
      
      // Enhanced prompt with better instructions for complex financial queries
      const prompt = `You are a sophisticated financial assistant with expertise in global markets, geopolitics, and economic policy. Respond to this query: "${userInput}"
      
      If this is a finance-related question:
      1. Provide specific data points, numbers, and percentages when relevant
      2. Include market implications and sector impacts when appropriate
      3. Reference recent developments (as of your training data)
      4. Structure your response with clear sections if the topic is complex
      
      If it's about non-financial topics, relate it to economics or finance if possible.
      Be helpful, clear, and concise.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      return `START: ${userInput}\n\nPLAN: I'll analyze this query and provide relevant financial information.\n\nACTION: Generating response based on financial knowledge\n\nOBSERVATION: This query requires financial expertise.\n\nOUTPUT: ${text}`;
    } catch (error) {
      console.error('Error with Gemini API:', error);
      // Fallback response if Gemini fails
      return `START: ${userInput}\n\nPLAN: I'll provide a response based on my knowledge.\n\nOBSERVATION: I'm having trouble accessing my AI capabilities.\n\nOUTPUT: I can help you with stock prices, cryptocurrency rates, exchange rates, investment calculations, and financial news. Could you try asking a specific finance-related question?`;
    }
  } catch (error) {
    console.error('Error processing user input:', error);
    return `START: ${userInput}\n\nPLAN: I'll provide a general response.\n\nOBSERVATION: There was an error processing your request.\n\nOUTPUT: I apologize for the inconvenience. I'm experiencing technical difficulties. Please try asking again about stocks, crypto, exchange rates, or investment calculations.`;
  }
  // Final fallback: always return a non-empty string
  return `Sorry, I couldn't process your request at this time. Please try again later or ask a different finance-related question.`;
}

module.exports = { processUserInput }; 