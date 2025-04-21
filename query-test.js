// Simple test script to simulate the Netlify function
console.log('Finance AI Query Test\n');

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

// Function to get a fallback response
function getFallbackResponse(prompt) {
  const promptLower = prompt.toLowerCase();
  
  // Handle general knowledge queries
  if (isGeneralKnowledgeQuery(prompt) && !isFinancialQuery(prompt)) {
    return 'START: ' + prompt + '\n\nPLAN: I\'ll provide financial information related to this query.\n\nOBSERVATION: This appears to be a general knowledge question.\n\nOUTPUT: I specialize in financial information and can help you with stock prices, cryptocurrency rates, exchange rates, investment calculations, and financial news. For this specific question, I would need to connect to my knowledge base which is currently experiencing connectivity issues. Could you try asking a specific finance-related question?';
  }
  
  // Default fallback response
  return 'START: ' + prompt + '\n\nPLAN: I\'ll provide a general response.\n\nOBSERVATION: Using fallback response due to API limitations.\n\nOUTPUT: I\'m currently experiencing some connectivity issues with my financial data providers. I can help with basic financial calculations, concepts, and general advice. For real-time data on stocks, crypto, or exchange rates, please check a financial website or try again later.';
}

// Function to simulate the Netlify function's response
function simulateResponse(prompt) {
  console.log(`\n===== TESTING: "${prompt}" =====`);
  console.log(`Is Financial Query: ${isFinancialQuery(prompt)}`);
  console.log(`Is General Knowledge Query: ${isGeneralKnowledgeQuery(prompt)}`);
  
  let response;
  
  // Simulate API response
  if (isFinancialQuery(prompt)) {
    console.log('Classification: Financial query - using full capabilities');
    
    // Mock responses for different financial queries
    if (prompt.toLowerCase().includes('rich') || prompt.toLowerCase().includes('wealth')) {
      response = 'START: ' + prompt + '\n\nPLAN: I\'ll analyze strategies for building wealth.\n\nOBSERVATION: This is a financial planning question.\n\nOUTPUT: Building wealth requires a combination of consistent saving, smart investing, and long-term planning. Here are key strategies:\n\n1. Create a budget and stick to it\n2. Pay off high-interest debt\n3. Build an emergency fund\n4. Invest regularly in diversified assets\n5. Take advantage of compound interest\n6. Maximize retirement accounts\n7. Develop multiple income streams\n8. Continuously educate yourself about finance\n\nConsistency and patience are crucial - wealth building is typically a long-term process.';
    } else if (prompt.toLowerCase().includes('tax')) {
      response = 'START: ' + prompt + '\n\nPLAN: I\'ll provide tax-saving strategies.\n\nOBSERVATION: This is a tax planning question.\n\nOUTPUT: Here are effective tax-saving strategies:\n\n1. Maximize retirement account contributions (401(k), IRA)\n2. Take advantage of tax-advantaged accounts like HSAs\n3. Harvest investment losses to offset gains\n4. Consider municipal bonds for tax-free income\n5. Explore qualified business income deductions\n6. Time your income and deductions strategically\n7. Donate appreciated assets to charity\n8. Investigate education tax credits\n\nConsult with a tax professional for personalized advice based on your specific situation.';
    } else if (prompt.toLowerCase().includes('calculate') || prompt.toLowerCase().includes('return') || prompt.toLowerCase().includes('invest')) {
      response = 'START: ' + prompt + '\n\nPLAN: I\'ll calculate investment returns.\n\nOBSERVATION: This is an investment calculation question.\n\nOUTPUT: For a $5,000 investment at 8% annual interest compounded annually for 5 years:\n\nFuture Value = $5,000 × (1 + 0.08)^5\nFuture Value = $5,000 × 1.4693\nFuture Value = $7,346.64\n\nYour investment would grow to $7,346.64, earning $2,346.64 in interest over the 5-year period. This calculation uses the compound interest formula: A = P(1 + r)^t, where P is principal, r is rate, and t is time in years.';
    } else {
      response = 'START: ' + prompt + '\n\nPLAN: I\'ll analyze this financial query.\n\nOBSERVATION: Using financial expertise.\n\nOUTPUT: This is a simulated response for your financial query. In a real environment with API access, I would provide specific financial information, data, or advice related to your question.';
    }
  } else if (isGeneralKnowledgeQuery(prompt) && !isFinancialQuery(prompt)) {
    console.log('Classification: Non-financial general knowledge query - using fallback');
    response = getFallbackResponse(prompt);
  } else {
    console.log('Classification: Other query - processing normally');
    response = 'START: ' + prompt + '\n\nPLAN: I\'ll provide a general response.\n\nOBSERVATION: This is a general query.\n\nOUTPUT: This is a simulated response for your query. In a real environment with API access, I would provide information related to your question.';
  }
  
  // Extract just the OUTPUT section
  const outputMatch = response.match(/OUTPUT:(.*?)(?:\n\n|$)/s);
  if (outputMatch && outputMatch[1]) {
    const outputText = outputMatch[1].trim();
    console.log('\nFINAL OUTPUT:');
    console.log(outputText);
  } else {
    console.log('\nFINAL RESPONSE:');
    console.log(response);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
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
  simulateResponse(query);
});
console.log('All tests completed.');
