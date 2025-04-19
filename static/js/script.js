document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const initialSearch = document.getElementById('initial-search');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    const chatContainer = document.getElementById('chat-container');
    const chatHistory = document.getElementById('chat-history');
    
    const followUpSearch = document.getElementById('follow-up-search');
    const followUpInput = document.getElementById('follow-up-input');
    const followUpButton = document.getElementById('follow-up-button');
    
    const resetButton = document.getElementById('reset-button');
    const themeButton = document.getElementById('theme-button');

    // Theme initialization
    initTheme();

    // Initial search submission
    searchButton.addEventListener('click', startChat);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startChat();
        }
    });

    // Follow-up search submission
    followUpButton.addEventListener('click', submitFollowUp);
    followUpInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitFollowUp();
        }
    });

    // Reset button
    resetButton.addEventListener('click', resetChat);
    
    // Theme toggle
    themeButton.addEventListener('click', toggleTheme);

    function startChat() {
        const userInput = searchInput.value.trim();
        if (!userInput) return;

        // Switch UI to chat mode
        initialSearch.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        resetButton.classList.remove('hidden');

        // Add user message to the chat
        addUserMessage(userInput);
        
        // Process the message (this simulates the start of your while loop)
        processMessage(userInput);
    }

    function submitFollowUp() {
        const userInput = followUpInput.value.trim();
        if (!userInput) return;

        followUpInput.value = '';
        followUpSearch.classList.add('hidden');
        
        addUserMessage(userInput);
        processMessage(userInput);
    }

    function processMessage(message) {
        // Send the message to the server
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        })
        .then(response => response.json())
        .then(data => {
            // Add the AI's response to the chat
            addAIMessage(data.response);
            
            // Show the follow-up input
            followUpSearch.classList.remove('hidden');
            followUpInput.focus();
        })
        .catch(error => {
            console.error('Error:', error);
            addAIMessage('Sorry, an error occurred while processing your request.');
            followUpSearch.classList.remove('hidden');
        });
    }

    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user-message';
        
        const header = document.createElement('div');
        header.className = 'message-header';
        header.textContent = 'You';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message;
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(content);
        chatHistory.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function addAIMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ai-message';
        
        const header = document.createElement('div');
        header.className = 'message-header';
        header.textContent = 'AI Assistant';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message;
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(content);
        chatHistory.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function resetChat() {
        // Clear all chat history
        chatHistory.innerHTML = '';
        
        // Reset the input fields
        searchInput.value = '';
        followUpInput.value = '';
        
        // Switch back to initial UI
        chatContainer.classList.add('hidden');
        followUpSearch.classList.add('hidden');
        resetButton.classList.add('hidden');
        initialSearch.classList.remove('hidden');
        
        // Focus on the search input
        searchInput.focus();
    }
    
    function initTheme() {
        // Check for saved theme preference or use preferred color scheme
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Check if user prefers dark mode
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDarkMode ? 'dark' : 'light');
        }
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
});
