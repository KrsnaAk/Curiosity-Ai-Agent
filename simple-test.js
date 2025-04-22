// Very simple test script for local testing
console.log('Starting simple test...');

// Function to determine if a query is financial
function isFinancialQuery(prompt) {
  const promptLower = prompt.toLowerCase();
  
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
  
  return hasFinancialKeywords;
}

// Function to determine if a query is a general knowledge query
function isGeneralKnowledgeQuery(prompt) {
  const promptLower = prompt.toLowerCase();
  const isGeneralQuery = (
    promptLower.includes('who is') || 
    promptLower.includes('what is') || 
    promptLower.includes('how to') || 
    promptLower.includes('explain')
  );
  
  return isGeneralQuery;
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
console.log('Testing query classification...\n');
testQueries.forEach(query => {
  const isFinancial = isFinancialQuery(query);
  const isGeneral = isGeneralKnowledgeQuery(query);
  
  console.log(`Query: "${query}"`);
  console.log(`- Is Financial: ${isFinancial}`);
  console.log(`- Is General Knowledge: ${isGeneral}`);
  
  if (isGeneral && !isFinancial) {
    console.log('- Would use fallback (non-financial general query)');
  } else if (isFinancial) {
    console.log('- Would process as financial query');
  } else {
    console.log('- Would process normally');
  }
  
  console.log(''); // Empty line for readability
});

console.log('All tests completed.');
