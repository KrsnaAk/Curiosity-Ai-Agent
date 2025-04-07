// Script to test Finance AI Agent setup and API keys

const axios = require('axios');
require('dotenv').config();

async function testSetup() {
  console.log('\n🔍 Testing Finance AI Agent Setup\n');
  
  // Check Node.js environment
  const nodeVersion = process.versions.node;
  const majorVersion = parseInt(nodeVersion.split('.')[0]);
  
  console.log(`Node.js version: ${nodeVersion}`);
  if (majorVersion < 14) {
    console.log('⚠️ Warning: Node.js version is lower than recommended (v14+)');
  } else {
    console.log('✅ Node.js version is compatible');
  }
  
  // Check required packages
  try {
    require('express');
    console.log('✅ Express is installed');
  } catch (error) {
    console.log('❌ Express is not installed. Run npm install first.');
  }
  
  try {
    require('@google/generative-ai');
    console.log('✅ Google Generative AI SDK is installed');
  } catch (error) {
    console.log('❌ Google Generative AI SDK is not installed. Run npm install first.');
  }
  
  // Check API keys
  console.log('\n📋 Checking API Keys:');
  
  // Check Gemini API key
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.log('❌ Gemini API key is missing. This is required.');
  } else if (geminiKey === 'your_gemini_api_key_here') {
    console.log('❌ Gemini API key has not been updated from default placeholder.');
  } else {
    console.log('✅ Gemini API key is configured');
    // Test API key validity (optional)
    try {
      console.log('   Testing Gemini API key...');
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      await model.generateContent("Hello, this is a test");
      console.log('✅ Gemini API key is valid');
    } catch (error) {
      console.log(`❌ Gemini API key test failed: ${error.message}`);
    }
  }
  
  // Check Alpha Vantage API key
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!alphaVantageKey) {
    console.log('⚠️ Alpha Vantage API key is missing. Stock price tool will use mock data.');
  } else if (alphaVantageKey === 'your_alpha_vantage_api_key_here') {
    console.log('⚠️ Alpha Vantage API key has not been updated from default placeholder.');
  } else {
    console.log('✅ Alpha Vantage API key is configured');
    // Test API key validity
    try {
      console.log('   Testing Alpha Vantage API key...');
      const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${alphaVantageKey}`);
      if (response.data && response.data['Global Quote']) {
        console.log('✅ Alpha Vantage API key is valid');
      } else if (response.data && response.data.Note && response.data.Note.includes('API call frequency')) {
        console.log('⚠️ Alpha Vantage API call frequency limit hit, but key appears valid');
      } else {
        console.log('❌ Alpha Vantage API key seems invalid. Check the key and try again.');
      }
    } catch (error) {
      console.log(`❌ Alpha Vantage API key test failed: ${error.message}`);
    }
  }
  
  // Check News API key
  const newsApiKey = process.env.NEWS_API_KEY;
  if (!newsApiKey) {
    console.log('⚠️ News API key is missing. Financial news tool will use mock data.');
  } else if (newsApiKey === 'your_news_api_key_here') {
    console.log('⚠️ News API key has not been updated from default placeholder.');
  } else {
    console.log('✅ News API key is configured (not testing to save API calls)');
  }
  
  // Check Exchange Rate API key
  const exchangeRateKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!exchangeRateKey) {
    console.log('⚠️ Exchange Rate API key is missing. Exchange rate tool will use mock data.');
  } else if (exchangeRateKey === 'your_exchange_rate_api_key_here') {
    console.log('⚠️ Exchange Rate API key has not been updated from default placeholder.');
  } else {
    console.log('✅ Exchange Rate API key is configured (not testing to save API calls)');
  }
  
  // Check CoinMarketCap API key
  const cmcApiKey = process.env.CMC_API_KEY;
  if (!cmcApiKey) {
    console.log('⚠️ CoinMarketCap API key is missing. Crypto price tool will fallback to CoinGecko.');
  } else if (cmcApiKey === 'your_cmc_api_key_here') {
    console.log('⚠️ CoinMarketCap API key has not been updated from default placeholder.');
  } else {
    console.log('✅ CoinMarketCap API key is configured');
    // Test API key validity
    try {
      console.log('   Testing CoinMarketCap API key...');
      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': cmcApiKey
        },
        params: {
          symbol: 'BTC'
        }
      });
      if (response.data && response.data.data && response.data.data.BTC) {
        console.log('✅ CoinMarketCap API key is valid');
      } else {
        console.log('❌ CoinMarketCap API key seems invalid. Check the key and try again.');
      }
    } catch (error) {
      console.log(`❌ CoinMarketCap API key test failed: ${error.message}`);
    }
  }
  
  // Overall status
  console.log('\n�� Setup Status:');
  if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
    console.log('❌ Setup incomplete: Gemini API key is required');
  } else {
    console.log('✅ Basic setup is complete. You can run the server with: npm start');
    if (
      (!alphaVantageKey || alphaVantageKey === 'your_alpha_vantage_api_key_here') ||
      (!newsApiKey || newsApiKey === 'your_news_api_key_here') ||
      (!exchangeRateKey || exchangeRateKey === 'your_exchange_rate_api_key_here') ||
      (!cmcApiKey || cmcApiKey === 'your_cmc_api_key_here')
    ) {
      console.log('⚠️ Some API keys are missing. The agent will use fallback methods for these services.');
    } else {
      console.log('✅ All API keys are configured. Full functionality is available.');
    }
  }
  
  console.log('\n🏁 Test complete\n');
}

testSetup().catch(err => {
  console.error('Error during test:', err);
}); 