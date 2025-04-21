const express = require('express');
const bodyParser = require('body-parser');
const { processUserInput } = require('./financeAgent');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

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
    
    const response = await processUserInput(prompt);
    
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
    res.status(500).json({ error: `An error occurred while processing your request: ${error.message}` });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Finance AI Agent server is running on port ${PORT}`);
}); 