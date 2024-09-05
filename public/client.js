const socket = io();
const API_KEY = 'AIzaSyBRsM85ZKXGo3BhLscr8zsduGexyQj-_VM'; // Replace with your actual YouTube API key
let name;
const textarea = document.querySelector('#textarea');
const messageArea = document.querySelector('.message__area');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resultsDiv = document.getElementById('results');
const playerDiv = document.getElementById('player');
const songTitle = document.getElementById('songTitle');
const songThumbnail = document.getElementById('songThumbnail');
const playPauseButton = document.getElementById('playPauseButton');
let currentVideoId = '';
let isPlaying = false;
let player;

// Example commands
const commands = {
    'jarvis': { type: 'text', response: 'I Love You 3000' },
    'fuck you': { type: 'text', response: 'Oh Helo Yeh Chating Site Hai Kya Likh Rahe Ho Yeh Tum Haan... ' },
    'virat': { type: 'text', response: 'virat kohli indian cricketer' },
    'ironman': { type: 'image', url: 'https://wallpapercave.com/wp/wp2918167.jpg' },
    'jarvis': { type: 'text', response: 'I Love You 3000' },
    'shinchan1': { 
        type: 'text', 
        response: 'Shinchan Nohara !!',
        imageUrl: 'https://miro.medium.com/v2/resize:fit:720/0*I32LiwMMYY16sPAB.jpg' 
    },
    'virat': { 
        type: 'text', 
        response: 'Virat Kohli Indian Crickter',
        imageUrl: 'https://c.ndtvimg.com/2024-05/ceki2b5g_virat-kohli-bcci_625x300_27_May_24.jpg?im=FeatureCrop,algorithm=dnn,width=806,height=605' 
    },
};

// Prompt user for name
do {
    name = prompt('Please Enter Your name');
} while (!name);

// Handle message sending
textarea.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        const message = e.target.value;
        sendMessage(message);
        e.target.value = ''; // Clear the textarea after sending
    }
});

// Handle message sending when "Send" button is clicked
const sendButton = document.getElementById('sendButton');
sendButton.addEventListener('click', () => {
    const message = textarea.value;
    sendMessage(message);
    textarea.value = ''; // Clear the textarea after sending
});

function sendMessage(message) {
    if (message.trim() === '') return; // Prevent sending empty messages

    let msg = {
        user: name,
        message: message.trim(),
        type: 'outgoing'
    };

    // Handle specific commands
    if (commands[message.trim().toLowerCase()]) {
        const command = commands[message.trim().toLowerCase()];
        if (command.type === 'text') {
            msg = {
                user: 'System',
                message: command.response,
                imageUrl: command.imageUrl, // Include image URL if available
                type: 'incoming'
            };
            appendMessage(msg); // Append the message once
            scrollToBottom(); // Scroll to the bottom after appending the message
        }
    } else {
        // Handle regular messages
        appendMessage(msg);
        scrollToBottom();
        // Send message to server
        socket.emit('message', msg);
    }

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
        appendMessage({ user: 'System', message: 'I Love You 3000', type: 'incoming' });
        scrollToBottom();
    }
}



function appendMessage(msg) {
    let mainDiv = document.createElement('div');
    let className = msg.type === 'outgoing' ? 'outgoing' : 'incoming';
    mainDiv.classList.add(className, 'message');

    let markup = '';
    if (msg.type === 'song') {
        markup = `
            <h4>${msg.user}</h4>
            <p>${msg.message}</p>
            <div>
                <button class="controlBtn" id="pauseBtn-${msg.videoId}">Pause</button>
                <button class="controlBtn" id="resumeBtn-${msg.videoId}" style="display:none;">Resume</button>
            </div>
        `;
    } else {
        markup = `
            <h4>${msg.user}</h4>
            <p>${msg.message}</p>
            ${msg.imageUrl ? `<img src="${msg.imageUrl}" alt="Image">` : ''}
        `;
    }

    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);

    // Add event listeners for pause/resume buttons if it's a song message
    if (msg.type === 'song') {
        const pauseBtn = mainDiv.querySelector(`#pauseBtn-${msg.videoId}`);
        const resumeBtn = mainDiv.querySelector(`#resumeBtn-${msg.videoId}`);

        pauseBtn.addEventListener('click', () => {
            player.pauseVideo();
            socket.emit('pauseSong');
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'inline';
        });

        resumeBtn.addEventListener('click', () => {
            player.playVideo();
            socket.emit('resumeSong');
            pauseBtn.style.display = 'inline';
            resumeBtn.style.display = 'none';
        });
    }
}


// Receive message from server
socket.on('message', (msg) => {
    if (msg.type === 'song') {
        // Append song message to chat
        appendMessage({ ...msg, type: 'incoming' });
        scrollToBottom();
    } else if (msg.user !== name) { // Regular chat message
        appendMessage({ ...msg, type: 'incoming' });
        scrollToBottom();
    }
});

// Handle song play, pause, and resume events from the server
socket.on('playSong', (data) => {
    if (player) {
        player.loadVideoById(data.videoId);
        songTitle.textContent = data.title;
        songThumbnail.src = data.thumbnail;
        isPlaying = true;
        playPauseButton.textContent = 'Pause';
    }
});

socket.on('pauseSong', () => {
    if (player && isPlaying) {
        player.pauseVideo();
        isPlaying = false;
        playPauseButton.textContent = 'Play';
    }
});

socket.on('resumeSong', () => {
    if (player && !isPlaying) {
        player.playVideo();
        isPlaying = true;
        playPauseButton.textContent = 'Pause';
    }
});

// Scroll to bottom of message area
function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
}

// YouTube search functionality
searchButton.addEventListener('click', () => {
    const query = searchInput.value;
    if (query) {
        searchYouTube(query);
    } else {
        console.error('Search query is empty');
    }
});

function searchYouTube(query) {
    fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${query}&key=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            if (data.items.length === 0) {
                resultsDiv.innerHTML = '<p>No results found</p>';
            } else {
                displayResults(data.items);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            resultsDiv.innerHTML = '<p>Error fetching data. Check the console for details.</p>';
        });
}

function displayResults(videos) {
    resultsDiv.innerHTML = '';
    videos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.innerHTML = `
            <img src="${video.snippet.thumbnails.default.url}" width="100">
            <p>${video.snippet.title}</p>
            <button onclick="playSong('${video.id.videoId}', '${video.snippet.title}', '${video.snippet.thumbnails.high.url}')">Play</button>
        `;
        resultsDiv.appendChild(videoElement);
    });
}

function playSong(videoId, title, thumbnail) {
    currentVideoId = videoId;
    playerDiv.style.display = 'block';

    // Load the video and play it
    if (player) {
        player.loadVideoById(videoId);
    }

    // Send song play event to the server
    const songMessage = {
        user: name,
        message: `is playing: ${title}`,
        type: 'song',
        videoId: videoId,
        title: title,
        thumbnail: thumbnail
    };
    socket.emit('message', songMessage);
    socket.emit('playSong', { videoId, title, thumbnail });

    // Clear search results
    resultsDiv.innerHTML = '';
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0', // Hide the height
        width: '0',  // Hide the width
        videoId: '',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo(); // Auto-play the video when ready
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        // Handle video end
        playPauseButton.textContent = 'Play';
        isPlaying = false;
    }
}

playPauseButton.addEventListener('click', () => {
    if (isPlaying) {
        player.pauseVideo();
        isPlaying = false;
        playPauseButton.textContent = 'Play';
        socket.emit('pauseSong');
    } else {
        player.playVideo();
        isPlaying = true;
        playPauseButton.textContent = 'Pause';
        socket.emit('resumeSong');
    }
});

// Load the IFrame Player API code asynchronously
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
