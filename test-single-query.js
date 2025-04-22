// Simple test script to check a single query
require('dotenv').config();
const { processUserInput } = require('./financeAgent');

// Get the query from command line arguments
const query = process.argv[2] || 'how to become financially rich';

// Function to determine if a query is financial
function isFinancialQuery(prompt) {
  const promptLower = prompt.toLowerCase();
  
  // Check if it contains financial keywords
  return (
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
}

// Function to determine if a query is a general knowledge query
function isGeneralKnowledgeQuery(prompt) {
  const promptLower = prompt.toLowerCase();
  return (
    promptLower.includes('who is') || 
    promptLower.includes('what is') || 
    promptLower.includes('how to') || 
    promptLower.includes('explain')
  );
}

// Improved fallback response for when APIs fail
function getFallbackResponse(prompt) {
  const promptLower = prompt.toLowerCase();
  
  // Handle general knowledge queries
  if (isGeneralKnowledgeQuery(prompt) && !isFinancialQuery(prompt)) {
    return 'START: ' + prompt + '\n\nPLAN: I\'ll provide financial information related to this query.\n\nOBSERVATION: This appears to be a general knowledge question.\n\nOUTPUT: I specialize in financial information and can help you with stock prices, cryptocurrency rates, exchange rates, investment calculations, and financial news. For this specific question, I would need to connect to my knowledge base which is currently experiencing connectivity issues. Could you try asking a specific finance-related question?';
  }
  
  // Default fallback response
  return 'START: ' + prompt + '\n\nPLAN: I\'ll provide a general response.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: I\'m currently experiencing some connectivity issues with my financial data providers. I can help with basic financial calculations, concepts, and general advice. For real-time data on stocks, crypto, or exchange rates, please check a financial website or try again later.';
}

// Test the query
async function testQuery() {
  console.log('\n---------- TESTING QUERY ----------');
  console.log('Query:', query);
  console.log('Is Financial Query:', isFinancialQuery(query));
  console.log('Is General Knowledge Query:', isGeneralKnowledgeQuery(query));
  
  try {
    // Process the query
    let response;
    
    try {
      response = await processUserInput(query);
      console.log('Raw Response:', response ? 'Response received' : 'No response');
      console.log('Response Length:', response ? response.length : 0);
      console.log('Contains OUTPUT:', response ? response.includes('OUTPUT:') : false);
      
      // Check if we need to use a fallback
      const hasProperResponse = response && response.includes('OUTPUT:');
      
      if (isGeneralKnowledgeQuery(query) && !isFinancialQuery(query) && !hasProperResponse) {
        console.log('Using fallback for non-financial general knowledge query');
        response = getFallbackResponse(query);
      } else if (isFinancialQuery(query)) {
        console.log('Processing financial query with full capabilities');
        // Make sure financial queries get a proper response format if they don't have one
        if (!hasProperResponse && response) {
          response = 'START: ' + query + '\n\nPLAN: I\'ll analyze this financial query.\n\nOBSERVATION: Using financial expertise.\n\nOUTPUT: ' + response;
        }
      }
    } catch (processingError) {
      console.error('Error in processUserInput:', processingError);
      console.log('Using fallback response due to processing error');
      response = getFallbackResponse(query);
    }
    
    // Ensure response is a non-empty string
    if (!response || (typeof response === 'string' && response.trim() === '')) {
      console.error('Empty or undefined response detected. Returning fallback response.');
      response = getFallbackResponse(query);
    }
    
    console.log('\n---------- RESPONSE ----------');
    console.log(response);
    console.log('-------------------------------\n');
    
    // Extract just the OUTPUT section for display
    const outputMatch = response.match(/OUTPUT:(.*?)(?:\n\n|$)/s);
    if (outputMatch && outputMatch[1]) {
      const outputText = outputMatch[1].trim();
      console.log('\n---------- EXTRACTED OUTPUT ----------');
      console.log(outputText);
      console.log('------------------------------------\n');
    }
    
    return response;
  } catch (error) {
    console.error('Error processing query:', error);
    const fallbackResponse = getFallbackResponse(query);
    console.log('\n---------- FALLBACK RESPONSE ----------');
    console.log(fallbackResponse);
    console.log('--------------------------------------\n');
    return fallbackResponse;
  }
}

// Run the test
testQuery().catch(console.error);
