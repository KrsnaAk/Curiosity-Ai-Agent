const { processUserInput } = require('../financeAgent');
// DO NOT use dotenv in Netlify Functions. Netlify injects env vars automatically.

// Log environment variables for debugging (visible in Netlify function logs)
exports.handler = async function(event, context) {
  console.log('--- Netlify Function Environment Check ---');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  console.log('ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? 'Present' : 'Missing');
  console.log('CMC_API_KEY:', process.env.CMC_API_KEY ? 'Present' : 'Missing');
  console.log('Prompt received:', event.body);


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
    let body;
    let prompt;
    try {
      body = JSON.parse(event.body);
      prompt = body.prompt;
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return {
        statusCode: 200,
        body: JSON.stringify({ response: 'Sorry, there was a problem understanding your request. Please try again.' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    console.log('Request body:', body);
    
    if (!prompt) {
      console.log('Error: Prompt is required');
      return {
        statusCode: 200,
        body: JSON.stringify({ response: 'Prompt is required. Please enter your question.' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    console.log('Processing prompt:', prompt);
    console.log('Environment variables:');
    console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `Present (${process.env.GEMINI_API_KEY.length} chars)` : 'Missing');
    console.log('- ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? `Present (${process.env.ALPHA_VANTAGE_API_KEY.length} chars)` : 'Missing');
    
    // Process the user input
    let response;
    try {
      response = await processUserInput(prompt);
      console.log('Response generated successfully');
      console.log('Response type:', typeof response);
      console.log('Response value:', response);
      console.log('Response length:', response ? response.length : 0);
    } catch (processingError) {
      console.error('Error in processUserInput:', processingError);
      response = `Sorry, there was an error processing your request. Please try again later.`;
    }

    // Ensure response is a non-empty string
    if (!response || (typeof response === 'string' && response.trim() === '')) {
      console.error('Empty or undefined response detected. Returning fallback error message.');
      response = 'Sorry, I could not process your request. Please try again later or ask a different finance-related question.';
    }

    // Always return a JSON object with a 'response' property
    return {
      statusCode: 200,
      body: JSON.stringify({ response }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error processing query in Netlify function:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    // Always return a 200 with a response property to prevent Netlify 502
    return {
      statusCode: 200,
      body: JSON.stringify({ response: 'Sorry, an unexpected error occurred. Please try again later.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
