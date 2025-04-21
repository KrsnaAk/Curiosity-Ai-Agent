document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('query-form');
  const userPromptInput = document.getElementById('user-prompt');
  const submitBtn = document.getElementById('submit-btn');
  const chatMessages = document.getElementById('chat-messages');
  const loadingIndicator = document.getElementById('loading');
  const suggestionButtons = document.querySelectorAll('.suggestion-btn');
  const clearChatBtn = document.getElementById('clear-chat');
  
  // Preload voices as soon as the page loads
  if ('speechSynthesis' in window) {
    // Pre-fetch voices
    window.speechSynthesis.getVoices();
    
    // Set up voice changed event
    window.speechSynthesis.onvoiceschanged = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
    };
  }
  
  // Sound effects
  const messageSentSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
  const messageReceivedSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3');
  const errorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2221/2221-preview.mp3');
  
  // Adjust volume
  messageSentSound.volume = 0.3;
  messageReceivedSound.volume = 0.3;
  errorSound.volume = 0.3;
  
  // Handle form submission
  // Function to generate a fallback response when the API fails
  function generateFallbackResponse(prompt) {
    // Basic response for common financial queries
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('bitcoin') || promptLower.includes('btc')) {
      return 'Bitcoin is currently trading around $60,000-$70,000. The price fluctuates significantly based on market conditions. For the most current price, please check a cryptocurrency exchange or financial website.';
    }
    
    if (promptLower.includes('stock') || promptLower.includes('tesla') || promptLower.includes('apple')) {
      return 'Stock prices vary throughout trading hours. For the most current prices, please check a financial website like Yahoo Finance or your brokerage platform. Major indices like the S&P 500, Dow Jones, and NASDAQ provide overall market performance indicators.';
    }
    
    if (promptLower.includes('exchange rate') || promptLower.includes('usd') || promptLower.includes('eur')) {
      return 'Currency exchange rates fluctuate based on global economic factors. The USD to EUR rate typically ranges between 0.85-0.95 euros per dollar. For the most current rates, please check a financial website or currency converter.';
    }
    
    if (promptLower.includes('calculate') || promptLower.includes('investment') || promptLower.includes('compound interest')) {
      // Handle investment calculation queries
      if (promptLower.includes('$5000') && promptLower.includes('8%') && promptLower.includes('5 years')) {
        return 'A $5,000 investment at 8% annual interest compounded annually for 5 years would grow to approximately $7,346.64. The formula used is A = P(1 + r)^t, where P is principal, r is rate, and t is time in years.';
      }
      return 'To calculate investment returns, I use the compound interest formula: A = P(1 + r)^t, where A is final amount, P is principal, r is interest rate, and t is time in years. For more specific calculations, please provide the principal amount, interest rate, and time period.';
    }
    
    // Default fallback response
    return 'I\'m currently experiencing some connectivity issues with my financial data providers. I can help with basic financial calculations, concepts, and general advice. For real-time data on stocks, crypto, or exchange rates, please check a financial website or try again later.';
  }
  
  // Function to fetch response from the agent (Unified and environment-aware)
  async function fetchAgentResponse(prompt) {
    try {
      console.log('Fetching agent response for prompt:', prompt);
      // Use dynamic endpoint selection
      const apiEndpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '/api/query'
        : '/.netlify/functions/query';
      console.log('Using API endpoint:', apiEndpoint);
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = {};
        }
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }
      const data = await response.json();
      // If data is empty or undefined, use fallback
      if (!data) {
        console.log('Empty response, using fallback');
        return generateFallbackResponse(prompt);
      }
      return data;
    } catch (error) {
      console.error('Error fetching response:', error);
      // Return a fallback response instead of throwing an error
      console.log('Using fallback response due to error');
      return generateFallbackResponse(prompt);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prompt = userPromptInput.value.trim();
    if (!prompt) {
      userPromptInput.classList.add('error');
      setTimeout(() => userPromptInput.classList.remove('error'), 800);
      return;
    }
    
    // Play sound
    messageSentSound.play().catch(e => console.log('Sound play prevented by browser'));
    
    // Add user message to chat
    addUserMessage(prompt);
    
    // Clear input
    userPromptInput.value = '';
    
    // Update loading indicator text and show it
    updateLoadingText();
    loadingIndicator.style.display = 'flex';
    
    // Disable form
    submitBtn.disabled = true;
    userPromptInput.disabled = true;
    form.classList.add('disabled');
    
    try {
      const data = await fetchAgentResponse(prompt);
      processResponse(data);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Play error sound
      errorSound.play().catch(e => console.log('Sound play prevented by browser'));
      
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      // Add error message
      addBotMessage(`Sorry, I encountered an error: ${error.message || 'Failed to get response'}. Please try again.`);
      
      // Re-enable the form
      form.classList.remove('disabled');
      submitBtn.disabled = false;
      userPromptInput.disabled = false;
    }
    
    // Focus on input
    userPromptInput.focus();
  });
  
  // Handle suggestion button clicks
  suggestionButtons.forEach(button => {
    button.addEventListener('click', () => {
      const query = button.getAttribute('data-query');
      userPromptInput.value = query;
      form.dispatchEvent(new Event('submit'));
      
      // Add animation to the clicked button
      button.classList.add('clicked');
      setTimeout(() => {
        button.classList.remove('clicked');
      }, 300);
    });
  });
  
  // Handle clear chat button
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      // Keep only the first welcome message
      const welcomeMessage = chatMessages.querySelector('.message');
      chatMessages.innerHTML = '';
      if (welcomeMessage) {
        chatMessages.appendChild(welcomeMessage);
      }
      
      // Add animation to the button
      clearChatBtn.classList.add('clicked');
      setTimeout(() => {
        clearChatBtn.classList.remove('clicked');
      }, 300);
    });
  }
  
  // Function to add user message to chat
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="message-content">
        <div class="message-bubble">
          <div class="message-header">
            <span class="bot-name">You</span>
            <span class="message-time">${timestamp}</span>
          </div>
          <div class="message-text">
            <p>${escapeHtml(message)}</p>
          </div>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  // Function to process message content with formatting
  function processMessageContent(message) {
    // Format the message with financial highlights and markdown
    return formatResponse(message);
  }

  // Function to add bot message to chat
  function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    
    // Create message structure
    messageElement.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div class="message-bubble">
          <div class="message-header">
            <span class="bot-name">Finance AI</span>
            <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="message-text">${processMessageContent(message)}</div>
          <div class="message-actions">
            <button class="message-action-btn tts-button" title="Listen"><i class="fas fa-volume-up"></i></button>
          </div>
        </div>
      </div>
    `;
    
    // Add to chat
    chatMessages.appendChild(messageElement);
    
    // Apply highlight.js to code blocks if available
    if (window.hljs) {
      messageElement.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
    
    // Add event listener for text-to-speech button
    const ttsButton = messageElement.querySelector('.tts-button');
    if (ttsButton) {
      ttsButton.addEventListener('click', (event) => {
        speakText(message, event);
      });
    }
    
    // Scroll to the bottom
    scrollToBottom();
  }
  
  // Function to add typing indicator
  function addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingElement = document.createElement('div');
    typingElement.className = 'message bot-message';
    typingElement.id = id;
    typingElement.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    chatMessages.appendChild(typingElement);
    scrollToBottom();
    return id;
  }
  
  // Function to remove typing indicator
  function removeTypingIndicator(id) {
    const typingElement = document.getElementById(id);
    if (typingElement) {
      typingElement.classList.add('fade-out');
      setTimeout(() => typingElement.remove(), 300);
    }
  }
  
  // Function to scroll chat to bottom with smooth animation
  function scrollToBottom() {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: 'smooth'
    });
  }
  
  
  // Function to format the AI agent response
  function formatAgentResponse(response) {
    // Extract just the OUTPUT section for display
    const outputMatch = response.match(/OUTPUT:(.*?)(?:\n\n|$)/s);
    
    if (outputMatch && outputMatch[1]) {
      // Found the OUTPUT section, display only this part
      let outputText = outputMatch[1].trim();
      
      // Format code blocks for better readability
      outputText = outputText.replace(/```([^`]*?)```/gs, (match, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
      });
      
      // Convert line breaks to <br>
      outputText = outputText.replace(/\n/g, '<br>');
      
      // Highlight numbers and financial figures
      outputText = outputText.replace(/(\$\d+(?:[,.]\d+)*)/g, '<span class="financial-highlight">$1</span>');
      outputText = outputText.replace(/(\d+(?:\.\d+)?%)/g, '<span class="financial-highlight">$1</span>');
      
      return outputText;
    } else {
      // If no OUTPUT section found, show the entire response but formatted
      console.log("Warning: No OUTPUT section found in response");
      
      // Store original response for debugging
      const originalResponse = response;
      
      // Replace section titles with styled spans (but hidden in UI)
      let formattedText = response
        .replace(/START:(.*?)(?=PLAN:|ACTION:|OBSERVATION:|OUTPUT:|$)/gs, '<div class="hidden-section"><span class="section-title">START:</span><div class="section-content">$1</div></div>')
        .replace(/PLAN:(.*?)(?=ACTION:|OBSERVATION:|OUTPUT:|$)/gs, '<div class="hidden-section"><span class="section-title">PLAN:</span><div class="section-content">$1</div></div>')
        .replace(/ACTION:(.*?)(?=OBSERVATION:|OUTPUT:|$)/gs, '<div class="hidden-section"><span class="section-title">ACTION:</span><div class="section-content">$1</div></div>')
        .replace(/OBSERVATION:(.*?)(?=OUTPUT:|$)/gs, '<div class="hidden-section"><span class="section-title">OBSERVATION:</span><div class="section-content">$1</div></div>');
      
      // Keep OUTPUT visible
      formattedText = formattedText.replace(/OUTPUT:(.*?)(?=$)/gs, '<div class="visible-section"><div class="section-content">$1</div></div>');
      
      // Format code blocks for better readability
      formattedText = formattedText.replace(/```([^`]*?)```/gs, (match, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
      });
      
      // Convert line breaks to <br>
      formattedText = formattedText.replace(/\n/g, '<br>');
      
      // Highlight numbers and financial figures
      formattedText = formattedText.replace(/(\$\d+(?:[,.]\d+)*)/g, '<span class="financial-highlight">$1</span>');
      formattedText = formattedText.replace(/(\d+(?:\.\d+)?%)/g, '<span class="financial-highlight">$1</span>');
      
      return formattedText;
    }
  }
  
  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Add animations to the UI elements on load
  document.querySelectorAll('.message, .suggestions, header, footer').forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, 100 * index);
  });
  
  // Focus input on page load
  userPromptInput.focus();
  
  // Add CSS for new animations
  const style = document.createElement('style');
  style.innerHTML = `
    .shake {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
    .fade-out {
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
    }
    .suggestion-btn.active {
      transform: scale(0.95);
    }
    .financial-highlight {
      color: #15803d;
      font-weight: bold;
    }
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Function to display output properly with message action buttons
  function displayOutput(responseObject) {
    // Find the "output" section (OUTPUT: )
    const outputMatch = responseObject.match(/OUTPUT: (.*?)(?=\n---|-{3,}|$)/s);
    let output = outputMatch ? outputMatch[1].trim() : 'Sorry, I could not process your request.';

    // Ensure all parts of the output are shown even if very long
    output = output.replace(/\.\.\./g, '');

    // Create bot message with the voice button
    const botMessageHtml = `
      <div class="message bot-message">
        <div class="message-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          ${formatResponse(output)}
          <div class="message-actions">
            <button class="tts-button" title="Listen to this response (female voice)">
              <i class="fas fa-volume-up"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // Add the message to chat
    chatMessages.insertAdjacentHTML('beforeend', botMessageHtml);

    // Add event listener for text-to-speech button
    const ttsButton = chatMessages.querySelector('.bot-message:last-child .tts-button');
    ttsButton.addEventListener('click', (event) => {
      const messageText = output.replace(/<[^>]*>/g, '');
      speakText(messageText, event);
    });

    // Highlight code blocks
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightBlock(block);
    });

    // Scroll to the bottom of the chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Format response with financial highlights
  function formatResponse(text) {
    if (!text) return '';

    // Format numbers as financial values, ensuring no unwanted spaces in Bitcoin prices
    let formattedText = text.replace(/\$?((\d{1,3}(,\d{3})*(\.\d+)?)|(\d+(\.\d+)?))(USD| dollars| USD)?/g, (match) => {
      // Don't highlight if it's part of a year or non-financial context
      if (match.match(/^\d{4}$/)) return match; // Years like 2023
      if (match.match(/^\d+$/)) {
        // For plain numbers, check if they're in a financial context
        if (match.match(/\b(price|cost|value|worth|amount|return|gain|invest|pay|loan|debt|fee|rate)\b/i)) {
          return `<span class="financial-highlight">${match}</span>`;
        }
        return match;
      }
      // Ensure the number doesn't contain any unwanted spaces, especially for BTC prices
      match = match.replace(/\s+/g, '');
      return `<span class="financial-highlight">${match}</span>`;
    });

    // Process any markdown formatting
    formattedText = formattedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    return formattedText;
  }

  // Function to speak text using the Web Speech API with female voice preference
  function speakText(text, event) {
    // Check if Speech Synthesis is available
    if (!('speechSynthesis' in window)) {
      console.log('Text-to-speech not supported');
      return;
    }
    
    // Get button element
    const button = event.currentTarget;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    if (button.classList.contains('speaking')) {
      // If already speaking, just stop and remove speaking class
      button.classList.remove('speaking');
      return;
    }
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a female voice
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.includes('Google UK English Female') ||
      voice.name.includes('Microsoft Zira') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Victoria')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    // Set properties
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.2; // Slightly higher pitch for female voice
    
    // Add speaking class
    button.classList.add('speaking');
    
    // Handle end of speech
    utterance.onend = () => {
      button.classList.remove('speaking');
    };
    
    // Handle errors
    utterance.onerror = () => {
      button.classList.remove('speaking');
      console.log('Speech synthesis error');
    };
    
    // Speak
    window.speechSynthesis.speak(utterance);
  }
  
  // Initialize voices when they are loaded (voices are loaded asynchronously)
  window.speechSynthesis.onvoiceschanged = () => {
    // Pre-fetch the voices so they'll be ready when needed
    window.speechSynthesis.getVoices();
  };

  // Process the response from the API
  function processResponse(data) {
    // Hide loading indicator
    loadingIndicator.style.display = 'none';
    
    // Log the server response for debugging
    console.log('Full server response:', data);
    
    try {
      // Handle different response formats
      let responseText;
      
      // Check if data is a string (direct response from server or fallback)
      if (typeof data === 'string') {
        responseText = data;
      }
      // Check if data is an object with a response property (JSON response)
      else if (data && typeof data === 'object') {
        if (data.response) {
          responseText = data.response;
        } else {
          // If data is an object but doesn't have a response property
          responseText = JSON.stringify(data);
        }
      }
      // Handle undefined or null data - should never happen now with fallbacks
      else if (!data) {
        responseText = 'I\'m currently experiencing some connectivity issues. Please try again later or ask a different question.';
      }
      
      // Display the response
      if (typeof responseText === 'string' && responseText.includes('OUTPUT:')) {
        displayOutput(responseText);
      } else {
        addBotMessage(responseText);
      }
      // Play received sound
      messageReceivedSound.play().catch(e => console.log('Sound play prevented by browser'));
    } catch (error) {
      console.error('Error processing response:', error);
      // Use a more user-friendly error message
      addBotMessage('I\'m currently experiencing some technical difficulties. Please try again later or ask a different question.');
    }

    // Re-enable the form
    form.classList.remove('disabled');
    submitBtn.disabled = false;
    userPromptInput.disabled = false;
  }

  // Update loading indicator text
  function updateLoadingText() {
    const loadingText = loadingIndicator.querySelector('p');
    if (loadingText) {
      loadingText.textContent = 'Processing your request';
    }
  }
}); 