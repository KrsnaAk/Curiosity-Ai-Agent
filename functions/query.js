const { processUserInput } = require('../financeAgent');
require('dotenv').config();

exports.handler = async function(event, context) {
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
    
    // Process the user input
    const response = await processUserInput(prompt);
    
    console.log('Response generated successfully');
    console.log('Response type:', typeof response);
    console.log('Response length:', response ? response.length : 0);
    
    // Return the response
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
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An error occurred while processing your request: ${error.message}` }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
