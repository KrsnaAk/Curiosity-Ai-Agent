// Very simple test script for a single query
const query = process.argv[2] || "how to become financially rich";
console.log(`Testing query: "${query}"`);

// Function to determine if a query is financial
function isFinancialQuery(prompt) {
  const promptLower = prompt.toLowerCase();
  
  // Check for financial keywords
  if (promptLower.includes('rich') || 
      promptLower.includes('financial') || 
      promptLower.includes('tax') ||
      promptLower.includes('invest') ||
      promptLower.includes('calculate') ||
      promptLower.includes('return')) {
    return true;
  }
  
  return false;
}

// Function to determine if a query is a general knowledge query
function isGeneralKnowledgeQuery(prompt) {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('who is') || 
      promptLower.includes('what is') || 
      promptLower.includes('how to') || 
      promptLower.includes('explain')) {
    return true;
  }
  
  return false;
}

// Test the query
const isFinancial = isFinancialQuery(query);
const isGeneral = isGeneralKnowledgeQuery(query);

console.log(`Is Financial Query: ${isFinancial}`);
console.log(`Is General Knowledge Query: ${isGeneral}`);

if (isGeneral && !isFinancial) {
  console.log('Would use fallback (non-financial general query)');
} else if (isFinancial) {
  console.log('Would process as financial query');
} else {
  console.log('Would process normally');
}
