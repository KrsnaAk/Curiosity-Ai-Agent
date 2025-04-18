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
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const response = await processUserInput(prompt);
    
    // Log the full response to the console for debugging
    console.log('\n---------- FULL RESPONSE ----------');
    console.log(response);
    console.log('-----------------------------------\n');
    
    res.json({ response });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Finance AI Agent server is running on port ${PORT}`);
}); 