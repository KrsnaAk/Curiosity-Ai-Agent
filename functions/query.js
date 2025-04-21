const { processUserInput } = require('../financeAgent');
require('dotenv').config();

// Check if environment variables are loaded
console.log('Netlify Function Environment Check:');
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('- ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? 'Present' : 'Missing');
console.log('- CMC_API_KEY:', process.env.CMC_API_KEY ? 'Present' : 'Missing');

// Simplified fallback response for when APIs fail
function getFallbackResponse(prompt) {
  // Basic response for common financial queries
  if (prompt.toLowerCase().includes('bitcoin') || prompt.toLowerCase().includes('btc')) {
    return 'START: ' + prompt + '\n\nPLAN: I\'ll provide information about Bitcoin.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: Bitcoin is currently trading around $60,000-$70,000. The price fluctuates significantly based on market conditions. For the most current price, please check a cryptocurrency exchange or financial website.';
  }
  
  if (prompt.toLowerCase().includes('stock') || prompt.toLowerCase().includes('tesla') || prompt.toLowerCase().includes('apple')) {
    return 'START: ' + prompt + '\n\nPLAN: I\'ll provide stock information.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: Stock prices vary throughout trading hours. For the most current prices, please check a financial website like Yahoo Finance or your brokerage platform. Major indices like the S&P 500, Dow Jones, and NASDAQ provide overall market performance indicators.';
  }
  
  if (prompt.toLowerCase().includes('exchange rate') || prompt.toLowerCase().includes('usd') || prompt.toLowerCase().includes('eur')) {
    return 'START: ' + prompt + '\n\nPLAN: I\'ll provide exchange rate information.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: Currency exchange rates fluctuate based on global economic factors. The USD to EUR rate typically ranges between 0.85-0.95 euros per dollar. For the most current rates, please check a financial website or currency converter.';
  }
  
  // Default fallback response
  return 'START: ' + prompt + '\n\nPLAN: I\'ll provide a general response.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: I\'m currently experiencing some connectivity issues with my financial data providers. I can help with basic financial calculations, concepts, and general advice. For real-time data on stocks, crypto, or exchange rates, please check a financial website or try again later.';
}

exports.handler = async function(event, context) {
  // Set function timeout to prevent Netlify 502 errors
  context.callbackWaitsForEmptyEventLoop = false;
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Parse the request body
    console.log('Received Netlify function request');
    const body = JSON.parse(event.body);
    const { prompt } = body;
    
    console.log('Request body:', body);
    
    if (!prompt) {
      console.log('Error: Prompt is required');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Prompt is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    console.log('Processing prompt:', prompt);
    console.log('Environment variables:');
    console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `Present (${process.env.GEMINI_API_KEY.length} chars)` : 'Missing');
    console.log('- ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? `Present (${process.env.ALPHA_VANTAGE_API_KEY.length} chars)` : 'Missing');
    
    // Process the user input with timeout protection
    let response;
    try {
      // Set a timeout for the processUserInput function to prevent Netlify function timeouts
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timed out')), 8000); // 8 second timeout
      });
      
      // Race between the actual function and the timeout
      response = await Promise.race([
        processUserInput(prompt),
        timeoutPromise
      ]);
      
      console.log('Response generated successfully');
      console.log('Response type:', typeof response);
      console.log('Response length:', response ? response.length : 0);
    } catch (processingError) {
      console.error('Error or timeout in processUserInput:', processingError);
      // Use fallback response instead of failing
      response = getFallbackResponse(prompt);
      console.log('Using fallback response');
    }
    
    // Make sure the response is properly formatted for the frontend
    // The frontend expects a string, not an object with a response property
    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error processing query in Netlify function:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An error occurred while processing your request: ${error.message}` }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
