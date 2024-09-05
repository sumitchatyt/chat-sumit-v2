// Automation Commands
const automationCommands = {
    // Example commands
    "keyword1": { type: "text", content: "This is a response to keyword1" },
    "keyword2": { type: "image", content: "/path/to/image1.jpg" },
    "keyword3": { type: "text", content: "This is a response to keyword3" },
    "keyword4": { type: "image", content: "/path/to/image2.jpg" },
    // Add more commands as needed
};

// Function to handle automation commands
function handleAutomationCommand(message) {
    const command = message.trim().toLowerCase();

    if (automationCommands[command]) {
        const response = automationCommands[command];
        let msg = {
            user: 'System',
            type: 'incoming'
        };

        if (response.type === 'text') {
            msg.message = response.content;
        } else if (response.type === 'image') {
            msg.message = `<img src="${response.content}" width="200" alt="Image"/>`;
        }

        // Emit the message with the automation response
        socket.emit('message', msg);
    }
}

// Listen for messages
socket.on('message', (msg) => {
    if (msg.type === 'outgoing' && msg.user === name) {
        handleAutomationCommand(msg.message);
    }
});

// Example usage: Handle a new message and check for automation commands
function handleNewMessage(message) {
    // Process the message for automation commands
    handleAutomationCommand(message);

    // Continue with normal message handling
    sendMessage(message);
}

// Update the message sending logic to use handleNewMessage
function sendMessage(message) {
    if (message.trim() === '') return; // Prevent sending empty messages

    let msg = {
        user: name,
        message: message.trim(),
        type: 'outgoing'
    };

    // Append outgoing message
    appendMessage(msg);
    scrollToBottom();

    // Send message to server
    socket.emit('message', msg);

    // Process the message for automation commands
    handleNewMessage(message);

    // Handle pause, resume, and Jarvis commands
    if (message.trim().toLowerCase() === 'pausemusic') {
        if (isPlaying) {
            player.pauseVideo();
            isPlaying = false;
            playPauseButton.textContent = 'Play';
            socket.emit('pauseSong');
        }
    } else if (message.trim().toLowerCase() === 'resumemusic') {
        if (!isPlaying) {
            player.playVideo();
            isPlaying = true;
            playPauseButton.textContent = 'Pause';
            socket.emit('resumeSong');
        }
    } else if (message.trim().toLowerCase() === 'jarvis') {
        // Handle 'jarvis' command
        appendMessage({ user: 'System', message: 'I Love You 36000', type: 'incoming' });
        scrollToBottom();
    }
}
