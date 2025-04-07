document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const micButton = document.getElementById('mic-button');
  const voiceStatus = document.getElementById('voice-status');
  const voiceTranscript = document.getElementById('voice-transcript');
  const chatMessages = document.getElementById('chat-messages');
  const loadingIndicator = document.getElementById('loading');
  const voiceExampleButtons = document.querySelectorAll('.voice-example-btn');
  
  // Voice settings controls
  const voiceSpeedControl = document.getElementById('voice-speed');
  const voicePitchControl = document.getElementById('voice-pitch');
  const autoSpeakControl = document.getElementById('auto-speak');
  const speedValueDisplay = document.getElementById('speed-value');
  const pitchValueDisplay = document.getElementById('pitch-value');
  
  // Sound effects
  const startListeningSound = new Audio('../sounds/start-listening.mp3');
  const stopListeningSound = new Audio('../sounds/stop-listening.mp3');
  const messageReceivedSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3');
  const errorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2221/2221-preview.mp3');
  
  // Adjust volume
  startListeningSound.volume = 0.3;
  stopListeningSound.volume = 0.3;
  messageReceivedSound.volume = 0.3;
  errorSound.volume = 0.3;
  
  // Speech Recognition Setup
  let recognition = null;
  let isListening = false;
  let finalTranscript = '';
  
  // Add CSS for the pulse effect
  const style = document.createElement('style');
  style.textContent = `
    .mic-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: rgba(255, 0, 0, 0.3);
      opacity: 0;
      transform: scale(1);
      pointer-events: none;
      display: none;
    }
    
    #mic-button.listening .mic-pulse {
      display: block;
      animation: pulse 1.5s ease-out infinite;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 0.5;
      }
      100% {
        transform: scale(1.8);
        opacity: 0;
      }
    }
    
    #voice-status.listening {
      color: #ff0000;
      font-weight: bold;
      animation: blink 1.5s infinite;
    }
    
    @keyframes blink {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    #mic-button.starting {
      background-color: #ffcc00;
      transform: scale(1.1);
      transition: all 0.2s ease;
    }
    
    #mic-button.stopping {
      background-color: #ff6666;
      transform: scale(0.9);
      transition: all 0.2s ease;
    }
    
    #mic-button.listening {
      background-color: #ff3333;
      box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
    }
  `;
  document.head.appendChild(style);
  
  // Check microphone permissions
  async function checkMicrophonePermission() {
    try {
      // Try to access the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      
      // Stop all tracks to release the microphone
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  }
  
  // Initialize Speech Recognition with permission check
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    console.log('Speech recognition is supported in this browser');
    
    // First check if we have microphone permission
    checkMicrophonePermission().then(hasPermission => {
      if (!hasPermission) {
        voiceStatus.textContent = 'Microphone permission denied. Please allow microphone access.';
        voiceStatus.style.color = '#ff3333';
        micButton.innerHTML = `
          <i class="fas fa-microphone-slash"></i>
          <span>Permission Denied</span>
        `;
        micButton.style.backgroundColor = '#ff6666';
        micButton.addEventListener('click', async () => {
          const permission = await checkMicrophonePermission();
          if (permission) {
            location.reload(); // Reload page after permission granted
          } else {
            alert('Please allow microphone access in your browser settings.');
          }
        });
        return;
      }
      
      // We have permission, initialize recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      
      // Configure recognition settings
      recognition.continuous = false; // Changed to false to improve restart behavior
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3; // Get multiple alternatives
      
      // Set a longer speechRecognitionTimeout
      recognition.maxSpeechTime = 10000; // Some browsers support this
      
      // Log configuration details
      console.log('Speech recognition configured with:', {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang
      });
      
      // Add some visual feedback when listening is active
      micButton.innerHTML = `
        <i class="fas fa-microphone"></i>
        <span class="mic-pulse"></span>
      `;
      
      setupSpeechRecognition();
    });
  } else {
    // Speech recognition not supported
    console.error('Speech Recognition API is not supported in this browser');
    voiceStatus.textContent = 'Speech recognition not supported in this browser. Try using Chrome, Edge, or Safari.';
    micButton.disabled = true;
    micButton.style.backgroundColor = '#d1d5db';
  }
  
  // Setup Speech Recognition Event Handlers
  function setupSpeechRecognition() {
    recognition.onstart = function() {
      isListening = true;
      micButton.classList.add('listening');
      voiceStatus.textContent = 'Listening... (speak now)';
      voiceStatus.classList.add('listening');
      voiceTranscript.textContent = '';
      startListeningSound.play().catch(e => console.log('Sound play prevented by browser'));
      
      // Add a visual cue that updates while listening
      let dots = 0;
      const statusUpdateInterval = setInterval(() => {
        if (!isListening) {
          clearInterval(statusUpdateInterval);
          return;
        }
        
        dots = (dots + 1) % 4;
        const dotStr = '.'.repeat(dots);
        voiceStatus.textContent = `Listening${dotStr} (speak now)`;
      }, 500);
    };
    
    recognition.onresult = function(event) {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update the transcript display
      voiceTranscript.textContent = finalTranscript + interimTranscript;
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      voiceStatus.textContent = `Error: ${event.error}`;
      stopListening();
    };
    
    // Modified to handle speech recognition better
    recognition.onend = function() {
      console.log('Speech recognition ended');
      
      // If we're still in listening mode but recognition ended, restart it
      if (isListening) {
        // Don't immediately stop if we have a transcript - give the user a chance to continue
        if (finalTranscript.trim() !== '') {
          console.log('We have a transcript, waiting before considering complete');
          
          // Update the status to show we're waiting
          voiceStatus.textContent = 'Pause detected... still listening';
          
          // Create a pause timer - if no more speech for 2 seconds, consider it done
          const pauseTimer = setTimeout(() => {
            if (isListening) {
              console.log('Pause timer expired, stopping listening');
              stopListening();
            }
          }, 2000);
          
          // Try to restart recognition to continue capturing
          try {
            setTimeout(() => {
              if (isListening) {
                try {
                  recognition.start();
                  console.log('Recognition restarted after pause');
                  clearTimeout(pauseTimer); // Clear the pause timer if we successfully restart
                } catch (error) {
                  console.error('Failed to restart recognition after pause:', error);
                  // If we can't restart, process what we have
                  clearTimeout(pauseTimer);
                  stopListening();
                }
              }
            }, 300);
          } catch (error) {
            console.error('Error scheduling recognition restart:', error);
            clearTimeout(pauseTimer);
            stopListening();
          }
        } else {
          // No transcript yet, just restart immediately
          try {
            console.log('No transcript yet, restarting recognition immediately');
            setTimeout(() => {
              if (isListening) {
                try {
                  recognition.start();
                  console.log('Recognition restarted');
                } catch (error) {
                  console.error('Failed to restart empty recognition:', error);
                  stopListening();
                }
              }
            }, 300);
          } catch (error) {
            console.error('Error scheduling empty recognition restart:', error);
            stopListening();
          }
        }
      } else {
        // We explicitly stopped listening, process the transcript
        processTranscript();
      }
    };
  }
  
  // Start Listening - modified to handle errors better
  function startListening() {
    if (isListening) {
      console.log('Already listening');
      return;
    }
    
    finalTranscript = '';
    isListening = true;
    
    try {
      recognition.start();
      console.log('Recognition started');
    } catch (error) {
      console.error('Speech recognition error:', error);
      isListening = false;
      voiceStatus.textContent = `Error starting speech recognition. Try again.`;
    }
  }
  
  // Stop Listening - ensure we properly clean up
  function stopListening() {
    console.log('Stopping listening');
    isListening = false;
    
    // Clear any active timers
    if (window.listeningTimeout) clearTimeout(window.listeningTimeout);
    if (window.pauseTimer) clearTimeout(window.pauseTimer);
    
    // Remove all special classes
    micButton.classList.remove('listening', 'starting', 'stopping');
    voiceStatus.classList.remove('listening');
    
    // Update UI
    updateUIForStoppedListening();
    
    try {
      recognition.stop();
      console.log('Recognition stopped');
    } catch (error) {
      console.error('Speech recognition error when stopping:', error);
      // Still process transcript even if there was an error stopping
      setTimeout(processTranscript, 100);
    }
  }
  
  // Helper to update UI when listening stops
  function updateUIForStoppedListening() {
    // Remove all button classes first
    micButton.classList.remove('listening', 'starting', 'stopping');
    voiceStatus.classList.remove('listening');
    
    if (finalTranscript.trim() !== '') {
      // If we have text, show processing
      voiceStatus.textContent = 'Processing...';
      voiceStatus.classList.add('processing');
      stopListeningSound.play().catch(e => console.log('Sound play prevented by browser'));
    } else {
      // If no text was captured
      voiceStatus.textContent = 'Ready to listen';
      voiceStatus.classList.remove('processing');
    }
  }
  
  // Add a more reliable button click handler with clear feedback
  micButton.addEventListener('click', () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    // Toggle listening state
    if (isListening) {
      console.log('User clicked to stop listening');
      // Clear any existing timeouts
      if (window.listeningTimeout) clearTimeout(window.listeningTimeout);
      if (window.pauseTimer) clearTimeout(window.pauseTimer);
      
      // Update UI immediately to provide feedback
      micButton.classList.add('stopping');
      voiceStatus.textContent = 'Stopping...';
      
      // Then stop the recognition
      stopListening();
    } else {
      console.log('User clicked to start listening');
      // Clear transcript before starting
      finalTranscript = '';
      voiceTranscript.textContent = '';
      
      // Update UI immediately for feedback
      micButton.classList.add('starting');
      voiceStatus.textContent = 'Starting...';
      
      // Start listening after a short delay
      setTimeout(() => {
        micButton.classList.remove('starting');
        startListening();
        
        // Set a timeout to stop listening if nothing is heard
        window.listeningTimeout = setTimeout(() => {
          if (isListening && finalTranscript.trim() === '') {
            console.log('No speech detected after 10 seconds');
            voiceStatus.textContent = 'No speech detected. Please try again.';
            stopListening();
          }
        }, 10000);
      }, 100);
    }
  });
  
  // Process the voice command
  function processTranscript() {
    const transcript = finalTranscript.trim();
    
    if (!transcript) {
      voiceStatus.textContent = 'Ready to listen';
      voiceStatus.classList.remove('processing');
      return;
    }
    
    // Add user message to chat
    addUserMessage(transcript);
    
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    
    // Send the transcript to the server and get a response
    fetchAgentResponse(transcript);
  }
  
  // Function to add user message to chat
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.innerHTML = `
      <div class="message-content">
        <p>${escapeHtml(message)}</p>
      </div>
      <div class="message-avatar">
        <i class="fas fa-user"></i>
      </div>
    `;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  // Function to fetch response from the server
  async function fetchAgentResponse(prompt) {
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the response
      processResponse(data);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Play error sound
      errorSound.play().catch(e => console.log('Sound play prevented by browser'));
      
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      // Add error message
      addBotMessage(`Sorry, I encountered an error: ${error.message || 'Failed to get response'}. Please try again.`);
      
      // Reset status
      voiceStatus.textContent = 'Ready to listen';
      voiceStatus.classList.remove('processing');
    }
  }
  
  // Process the response from the API
  function processResponse(data) {
    // Hide loading indicator
    loadingIndicator.style.display = 'none';
    
    // Display the response
    displayOutput(data.response);
    
    // Reset voice status
    voiceStatus.textContent = 'Ready to listen';
    voiceStatus.classList.remove('processing');
    
    // Play received sound
    messageReceivedSound.play().catch(e => console.log('Sound play prevented by browser'));
  }
  
  // Function to display the AI output with voice
  function displayOutput(responseObject) {
    // Find the "output" section (OUTPUT: )
    const outputMatch = responseObject.match(/OUTPUT: (.*?)(?=\n---|-{3,}|$)/s);
    let output = outputMatch ? outputMatch[1].trim() : 'Sorry, I could not process your request.';
    
    // Ensure all parts of the output are shown
    output = output.replace(/\.\.\./g, '');
    
    // Add bot message to chat
    const botMessageElement = document.createElement('div');
    botMessageElement.className = 'message bot-message';
    
    botMessageElement.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        ${formatResponse(output)}
        <div class="message-actions">
          <button class="tts-button" title="Listen to this response">
            <i class="fas fa-volume-up"></i>
          </button>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(botMessageElement);
    
    // Highlight code blocks
    if (window.hljs) {
      botMessageElement.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
    
    // Scroll to the bottom of the chat
    scrollToBottom();
    
    // Add event listener for text-to-speech button
    const ttsButton = botMessageElement.querySelector('.tts-button');
    ttsButton.addEventListener('click', (event) => {
      speakText(output.replace(/<[^>]*>/g, ''), botMessageElement, event);
    });
    
    // Auto-speak the response if enabled
    if (autoSpeakControl.checked) {
      ttsButton.click();
    }
  }
  
  // Format response with financial highlights
  function formatResponse(text) {
    if (!text) return '';
    
    // Format numbers as financial values
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
  
  // Function to speak text using Web Speech API
  function speakText(text, messageElement, event) {
    if (!('speechSynthesis' in window)) {
      console.log('Text-to-speech not supported');
      return;
    }
    
    const button = event.currentTarget;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Remove speaking class from all messages
    document.querySelectorAll('.bot-message').forEach(msg => {
      msg.classList.remove('speaking');
    });
    
    if (button.classList.contains('speaking')) {
      // If already speaking, just stop
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
    
    // Set properties from voice controls
    utterance.rate = parseFloat(voiceSpeedControl.value);
    utterance.pitch = parseFloat(voicePitchControl.value);
    
    // Add speaking class
    button.classList.add('speaking');
    messageElement.classList.add('speaking');
    
    // Handle end of speech
    utterance.onend = () => {
      button.classList.remove('speaking');
      messageElement.classList.remove('speaking');
    };
    
    // Handle errors
    utterance.onerror = () => {
      button.classList.remove('speaking');
      messageElement.classList.remove('speaking');
      console.log('Speech synthesis error');
    };
    
    // Speak
    window.speechSynthesis.speak(utterance);
  }
  
  // Function to scroll chat to bottom
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Voice example buttons
  voiceExampleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const exampleText = button.dataset.text;
      
      // Set the text in the transcript
      voiceTranscript.textContent = exampleText;
      finalTranscript = exampleText;
      
      // Process the example text
      addUserMessage(exampleText);
      
      // Show loading indicator
      loadingIndicator.style.display = 'flex';
      
      // Send request
      fetchAgentResponse(exampleText);
    });
  });
  
  // Voice settings event listeners
  voiceSpeedControl.addEventListener('input', () => {
    speedValueDisplay.textContent = `${voiceSpeedControl.value}×`;
  });
  
  voicePitchControl.addEventListener('input', () => {
    pitchValueDisplay.textContent = voicePitchControl.value;
  });
  
  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Initialize voices when they are loaded (voices are loaded asynchronously)
  window.speechSynthesis.onvoiceschanged = () => {
    // Pre-fetch the voices so they'll be ready when needed
    window.speechSynthesis.getVoices();
  };
  
  // Create placeholder sound files folder if they don't exist
  try {
    // Create mock sounds first time
    // In a real implementation, you would include these sound files in your project
    startListeningSound.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    stopListeningSound.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
  } catch (e) {
    console.log('Could not create placeholder sounds:', e);
  }
}); 