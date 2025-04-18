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
    const body = JSON.parse(event.body);
    const { prompt } = body;
    
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Prompt is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    // Process the user input
    const response = await processUserInput(prompt);
    
    // Return the response
    return {
      statusCode: 200,
      body: JSON.stringify({ response }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error processing query:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while processing your request' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
