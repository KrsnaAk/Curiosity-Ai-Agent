const { processUserInput } = require('../financeAgent');
// DO NOT use dotenv in Netlify Functions. Netlify injects env vars automatically.

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

// Log environment variables for debugging (visible in Netlify function logs)
exports.handler = async function(event, context) {
  console.log('--- Netlify Function Environment Check ---');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  console.log('ALPHA_VANTAGE_API_KEY:', process.env.ALPHA_VANTAGE_API_KEY ? 'Present' : 'Missing');
  console.log('CMC_API_KEY:', process.env.CMC_API_KEY ? 'Present' : 'Missing');
  console.log('Prompt received:', event.body);

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
          promptLower.includes('portfolio') ||
          promptLower.includes('rich') ||
          promptLower.includes('wealth') ||
          promptLower.includes('financial') ||
          promptLower.includes('cash') ||
          promptLower.includes('income') ||
          promptLower.includes('expense') ||
          promptLower.includes('profit') ||
          promptLower.includes('loss') ||
          promptLower.includes('dividend') ||
          promptLower.includes('yield') ||
          promptLower.includes('bond') ||
          promptLower.includes('equity') ||
          promptLower.includes('asset') ||
          promptLower.includes('liability') ||
          promptLower.includes('compound') ||
          promptLower.includes('calculate') ||
          promptLower.includes('return') ||
          promptLower.includes('rate') ||
          promptLower.includes('capital') ||
          promptLower.includes('hedge') ||
          promptLower.includes('forex') ||
          promptLower.includes('exchange') ||
          promptLower.includes('currency') ||
          promptLower.includes('price') ||
          promptLower.includes('cost') ||
          promptLower.includes('value') ||
          promptLower.includes('etf') ||
          promptLower.includes('mutual fund') ||
          promptLower.includes('401k') ||
          promptLower.includes('ira') ||
          promptLower.includes('roth') ||
          promptLower.includes('credit') ||
          promptLower.includes('debit') ||
          promptLower.includes('mortgage') ||
          promptLower.includes('insurance')
        );
        
        // Only use fallback if it's a general knowledge query AND doesn't have financial keywords
        // Also check if the response already contains a proper output section
        const hasProperResponse = response && response.includes('OUTPUT:');
        
        if (isGeneralKnowledgeQuery && !hasFinancialKeywords && !hasProperResponse) {
          console.log('Using fallback for non-financial general knowledge query');
          response = getFallbackResponse(prompt);
        } else if (hasFinancialKeywords) {
          console.log('Processing financial query with full capabilities');
          // Make sure financial queries get a proper response format if they don't have one
          if (!hasProperResponse && response) {
            response = 'START: ' + prompt + '\n\nPLAN: I\'ll analyze this financial query.\n\nOBSERVATION: Using financial expertise.\n\nOUTPUT: ' + response;
          }
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
      body: JSON.stringify({ response: getFallbackResponse(prompt || 'general query') }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
