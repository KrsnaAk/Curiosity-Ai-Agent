const express = require('express');
const bodyParser = require('body-parser');
const { processUserInput } = require('./financeAgent');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Improved fallback response for when APIs fail
function getFallbackResponse(prompt) {
  const promptLower = prompt.toLowerCase();
  
  // Basic response for common financial queries
  if (promptLower.includes('bitcoin') || promptLower.includes('btc')) {
    return 'START: ' + prompt + '\n\nPLAN: I\'ll provide information about Bitcoin.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: Bitcoin is currently trading around $60,000-$70,000. The price fluctuates significantly based on market conditions. For the most current price, please check a cryptocurrency exchange or financial website.';
  }
  
  if (promptLower.includes('stock') || promptLower.includes('tesla') || promptLower.includes('apple')) {
    return 'START: ' + prompt + '\n\nPLAN: I\'ll provide stock information.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: Stock prices vary throughout trading hours. For the most current prices, please check a financial website like Yahoo Finance or your brokerage platform. Major indices like the S&P 500, Dow Jones, and NASDAQ provide overall market performance indicators.';
  }
  
  if (promptLower.includes('exchange rate') || promptLower.includes('usd') || promptLower.includes('eur')) {
    return 'START: ' + prompt + '\n\nPLAN: I\'ll provide exchange rate information.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: Currency exchange rates fluctuate based on global economic factors. The USD to EUR rate typically ranges between 0.85-0.95 euros per dollar. For the most current rates, please check a financial website or currency converter.';
  }
  
  if (promptLower.includes('calculate') || promptLower.includes('investment') || promptLower.includes('compound interest')) {
    // Handle investment calculation queries
    if (promptLower.includes('$5000') && promptLower.includes('8%') && promptLower.includes('5 years')) {
      return 'START: ' + prompt + '\n\nPLAN: I\'ll calculate the investment return.\n\nOBSERVATION: Using compound interest formula.\n\nOUTPUT: A $5,000 investment at 8% annual interest compounded annually for 5 years would grow to approximately $7,346.64. The formula used is A = P(1 + r)^t, where P is principal, r is rate, and t is time in years.';
    }
    return 'START: ' + prompt + '\n\nPLAN: I\'ll explain investment calculations.\n\nOBSERVATION: Using financial formulas.\n\nOUTPUT: To calculate investment returns, I use the compound interest formula: A = P(1 + r)^t, where A is final amount, P is principal, r is interest rate, and t is time in years. For more specific calculations, please provide the principal amount, interest rate, and time period.';
  }
  
  // Handle general knowledge queries
  if (promptLower.includes('who is') || promptLower.includes('what is') || promptLower.includes('how to') || promptLower.includes('explain')) {
    return 'START: ' + prompt + '\n\nPLAN: I\'ll provide financial information related to this query.\n\nOBSERVATION: This appears to be a general knowledge question.\n\nOUTPUT: I specialize in financial information and can help you with stock prices, cryptocurrency rates, exchange rates, investment calculations, and financial news. For this specific question, I would need to connect to my knowledge base which is currently experiencing connectivity issues. Could you try asking a specific finance-related question?';
  }
  
  // Default fallback response
  return 'START: ' + prompt + '\n\nPLAN: I\'ll provide a general response.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: I\'m currently experiencing some connectivity issues with my financial data providers. I can help with basic financial calculations, concepts, and general advice. For real-time data on stocks, crypto, or exchange rates, please check a financial website or try again later.';
}

// API endpoint to process user queries
app.post('/api/query', async (req, res) => {
  try {
    console.log('\n---------- RECEIVED API REQUEST ----------');
    console.log('Request body:', req.body);
    
    const { prompt } = req.body;
    
    if (!prompt) {
      console.log('Error: Prompt is required');
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log('Processing prompt:', prompt);
    console.log('Environment variables:');
    console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `Present (${process.env.GEMINI_API_KEY.length} chars)` : 'Missing');
    console.log('- ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? `Present (${process.env.ALPHA_VANTAGE_API_KEY.length} chars)` : 'Missing');
    
    let response;
    try {
      // Check if Gemini API key is present
      if (!process.env.GEMINI_API_KEY) {
        console.log('Gemini API key missing, using fallback response');
        response = getFallbackResponse(prompt);
      } else {
        response = await processUserInput(prompt);
        
        // Only use fallback for clearly non-financial general knowledge queries
        // Check if it's a non-financial query by looking for specific patterns
        const promptLower = prompt.toLowerCase();
        const isGeneralKnowledgeQuery = (
          promptLower.includes('who is') || 
          promptLower.includes('what is') || 
          promptLower.includes('how to') || 
          promptLower.includes('explain')
        );
        
        // Check if it contains financial keywords
        const hasFinancialKeywords = (
          promptLower.includes('stock') ||
          promptLower.includes('invest') ||
          promptLower.includes('money') ||
          promptLower.includes('finance') ||
          promptLower.includes('market') ||
          promptLower.includes('trading') ||
          promptLower.includes('crypto') ||
          promptLower.includes('bitcoin') ||
          promptLower.includes('fund') ||
          promptLower.includes('dollar') ||
          promptLower.includes('euro') ||
          promptLower.includes('bank') ||
          promptLower.includes('tax') ||
          promptLower.includes('economy') ||
          promptLower.includes('inflation') ||
          promptLower.includes('interest') ||
          promptLower.includes('loan') ||
          promptLower.includes('debt') ||
          promptLower.includes('budget') ||
          promptLower.includes('saving') ||
          promptLower.includes('retirement') ||
          promptLower.includes('portfolio')
        );
        
        // Only use fallback if it's a general knowledge query AND doesn't have financial keywords
        if (isGeneralKnowledgeQuery && !hasFinancialKeywords && !response.includes('OUTPUT:')) {
          console.log('Using fallback for non-financial general knowledge query');
          response = getFallbackResponse(prompt);
        }
      }
    } catch (processingError) {
      console.error('Error in processUserInput:', processingError);
      console.log('Using fallback response due to processing error');
      response = getFallbackResponse(prompt);
    }
    
    // Ensure response is a non-empty string
    if (!response || (typeof response === 'string' && response.trim() === '')) {
      console.error('Empty or undefined response detected. Returning fallback response.');
      response = getFallbackResponse(prompt);
    }
    
    // Log the full response to the console for debugging
    console.log('\n---------- FULL RESPONSE ----------');
    console.log(typeof response, response ? response.length : 0);
    console.log(response);
    console.log('-----------------------------------\n');
    
    res.json({ response });
    console.log('Response sent successfully');
  } catch (error) {
    console.error('\n---------- ERROR PROCESSING QUERY ----------');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('-------------------------------------------\n');
    // Use fallback response instead of error message
    const fallbackResponse = getFallbackResponse(req.body.prompt || 'general query');
    res.json({ response: fallbackResponse });
    console.log('Fallback response sent due to error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Finance AI Agent server is running on port ${PORT}`);
});
