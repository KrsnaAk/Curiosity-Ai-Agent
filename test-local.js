// Simplified test script for local testing
require('dotenv').config();

// Mock processUserInput function to avoid API calls
function mockProcessUserInput(prompt) {
  // For testing purposes, return a simple response
  return `This is a mock response for: ${prompt}`;
}

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

// Function to process a query using our improved logic
function processQuery(prompt) {
  console.log('\n---------- PROCESSING QUERY ----------');
  console.log('Query:', prompt);
  console.log('Is Financial Query:', isFinancialQuery(prompt));
  console.log('Is General Knowledge Query:', isGeneralKnowledgeQuery(prompt));
  
  // Process the query
  let response = mockProcessUserInput(prompt);
  console.log('Raw Response:', response);
  
  // Check if we need to use a fallback
  const hasProperResponse = response && response.includes('OUTPUT:');
  
  if (isGeneralKnowledgeQuery(prompt) && !isFinancialQuery(prompt)) {
    console.log('Using fallback for non-financial general knowledge query');
    response = getFallbackResponse(prompt);
  } else if (isFinancialQuery(prompt)) {
    console.log('Processing financial query with full capabilities');
    // Make sure financial queries get a proper response format if they don't have one
    if (!hasProperResponse) {
      response = 'START: ' + prompt + '\n\nPLAN: I\'ll analyze this financial query.\n\nOBSERVATION: Using financial expertise.\n\nOUTPUT: ' + response;
    }
  }
  
  console.log('\n---------- FINAL RESPONSE ----------');
  console.log(response);
  console.log('----------------------------------\n');
  
  // Extract just the OUTPUT section for display
  const outputMatch = response.match(/OUTPUT:(.*?)(?:\n\n|$)/s);
  if (outputMatch && outputMatch[1]) {
    const outputText = outputMatch[1].trim();
    console.log('\n---------- EXTRACTED OUTPUT ----------');
    console.log(outputText);
    console.log('------------------------------------\n');
  }
  
  return response;
}

// Test queries
const testQueries = [
  'who is elon musk?',
  'how to become financially rich',
  'Calculate the return on $5000 invested at 8% for 5 years with compound interest',
  'how to save tax',
  'what is the current price of bitcoin?',
  'explain quantum physics'
];

// Run tests
console.log('Starting tests...\n');
testQueries.forEach(query => {
  processQuery(query);
});
console.log('All tests completed.');
