/**
 * Emoji Movie Guessing Game
 * A voice-enabled game where users guess movies from emoji clues
 */

// Movie questions with emojis and acceptable answers
const MOVIE_QUESTIONS = [
    {
        emojis: "🦁👑🌍",
        answer: "The Lion King",
        acceptableAnswers: ["lion king", "the lion king"]
    },
    {
        emojis: "🚢❄️💑💔",
        answer: "Titanic",
        acceptableAnswers: ["titanic"]
    },
    {
        emojis: "🕷️🦸‍♂️🏙️",
        answer: "Spider-Man",
        acceptableAnswers: ["spider man", "spiderman", "spider-man"]
    },
    {
        emojis: "🧙‍♂️💍🌋🗡️",
        answer: "The Lord of the Rings",
        acceptableAnswers: ["lord of the rings", "the lord of the rings", "lotr"]
    },
    {
        emojis: "👻🔫👨‍🔬🏠",
        answer: "Ghostbusters",
        acceptableAnswers: ["ghostbusters", "ghost busters"]
    },
    {
        emojis: "🦈🏊‍♂️🩸🏖️",
        answer: "Jaws",
        acceptableAnswers: ["jaws"]
    },
    {
        emojis: "🧊👸❄️⛄",
        answer: "Frozen",
        acceptableAnswers: ["frozen"]
    },
    {
        emojis: "🏴‍☠️💀⚓🗺️",
        answer: "Pirates of the Caribbean",
        acceptableAnswers: ["pirates of the caribbean", "pirates of caribbean", "pirates"]
    },
    {
        emojis: "🤖❤️🌱🚀",
        answer: "WALL-E",
        acceptableAnswers: ["wall-e", "walle", "wall e"]
    },
    {
        emojis: "🦇🃏🌃🦸",
        answer: "The Dark Knight",
        acceptableAnswers: ["the dark knight", "dark knight", "batman"]
    }
];

// Game State
class GameState {
    constructor() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.guessTime = 5;
        this.voiceTime = 5;
        this.results = [];
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.timeoutCount = 0;
        this.isGameActive = false;
        this.currentPhase = 'guess'; // 'guess' or 'voice'
        this.timerInterval = null;
        this.recognition = null;
        this.recognizedText = '';
    }

    reset() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.results = [];
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.timeoutCount = 0;
        this.isGameActive = false;
        this.currentPhase = 'guess';
        this.recognizedText = '';
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}

const gameState = new GameState();

// DOM Elements
const elements = {
    // Screens
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultsScreen: document.getElementById('results-screen'),
    
    // Start screen
    guessTimeInput: document.getElementById('guess-time'),
    voiceTimeInput: document.getElementById('voice-time'),
    startBtn: document.getElementById('start-btn'),
    
    // Game screen
    score: document.getElementById('score'),
    currentQuestion: document.getElementById('current-question'),
    totalQuestions: document.getElementById('total-questions'),
    timer: document.getElementById('timer'),
    phaseLabel: document.getElementById('phase-label'),
    emojis: document.getElementById('emojis'),
    phaseIcon: document.getElementById('phase-icon'),
    phaseText: document.getElementById('phase-text'),
    micIndicator: document.getElementById('mic-indicator'),
    recognizedText: document.getElementById('recognized-text'),
    feedback: document.getElementById('feedback'),
    
    // Results screen
    finalScore: document.getElementById('final-score'),
    maxScore: document.getElementById('max-score'),
    correctCount: document.getElementById('correct-count'),
    incorrectCount: document.getElementById('incorrect-count'),
    timeoutCount: document.getElementById('timeout-count'),
    performanceMessage: document.getElementById('performance-message'),
    answersList: document.getElementById('answers-list'),
    playAgainBtn: document.getElementById('play-again-btn')
};

// Initialize Speech Recognition
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showBrowserWarning();
        return false;
    }
    
    gameState.recognition = new SpeechRecognition();
    gameState.recognition.continuous = true;
    gameState.recognition.interimResults = true;
    gameState.recognition.lang = 'en-US';
    
    gameState.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        gameState.recognizedText = finalTranscript || interimTranscript;
        elements.recognizedText.textContent = `"${gameState.recognizedText}"`;
    };
    
    gameState.recognition.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access to play the game.');
        }
    };
    
    gameState.recognition.onend = () => {
        // Restart if still in voice phase
        if (gameState.isGameActive && gameState.currentPhase === 'voice') {
            try {
                gameState.recognition.start();
            } catch (e) {
                // Already started
            }
        }
    };
    
    return true;
}

function showBrowserWarning() {
    const warning = document.createElement('div');
    warning.className = 'browser-warning';
    warning.innerHTML = '⚠️ Your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari for the full experience.';
    document.body.prepend(warning);
}

// Screen Management
function showScreen(screen) {
    elements.startScreen.classList.remove('active');
    elements.gameScreen.classList.remove('active');
    elements.resultsScreen.classList.remove('active');
    screen.classList.add('active');
}

// Game Flow
function startGame() {
    gameState.reset();
    gameState.guessTime = parseInt(elements.guessTimeInput.value) || 5;
    gameState.voiceTime = parseInt(elements.voiceTimeInput.value) || 5;
    gameState.isGameActive = true;
    
    elements.totalQuestions.textContent = MOVIE_QUESTIONS.length;
    elements.maxScore.textContent = MOVIE_QUESTIONS.length * 10;
    
    showScreen(elements.gameScreen);
    showQuestion();
}

function showQuestion() {
    const question = MOVIE_QUESTIONS[gameState.currentQuestionIndex];
    
    // Reset UI
    elements.emojis.textContent = question.emojis;
    elements.currentQuestion.textContent = gameState.currentQuestionIndex + 1;
    elements.score.textContent = gameState.score;
    elements.recognizedText.textContent = '';
    elements.feedback.className = 'feedback';
    elements.feedback.textContent = '';
    gameState.recognizedText = '';
    
    // Start guess phase
    startGuessPhase();
}

function startGuessPhase() {
    gameState.currentPhase = 'guess';
    let timeLeft = gameState.guessTime;
    
    // Update UI for guess phase
    elements.phaseLabel.textContent = 'Think';
    elements.phaseIcon.textContent = '🧠';
    elements.phaseIcon.className = 'phase-icon thinking';
    elements.phaseText.textContent = 'Study the emojis...';
    elements.micIndicator.classList.remove('active');
    elements.timer.textContent = timeLeft;
    elements.timer.className = 'timer-value';
    
    // Start countdown
    gameState.timerInterval = setInterval(() => {
        timeLeft--;
        elements.timer.textContent = timeLeft;
        
        // Add warning classes
        if (timeLeft <= 3) {
            elements.timer.classList.add('warning');
        }
        if (timeLeft <= 1) {
            elements.timer.classList.remove('warning');
            elements.timer.classList.add('danger');
        }
        
        if (timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            startVoicePhase();
        }
    }, 1000);
}

function startVoicePhase() {
    gameState.currentPhase = 'voice';
    let timeLeft = gameState.voiceTime;
    
    // Update UI for voice phase
    elements.phaseLabel.textContent = 'Speak';
    elements.phaseIcon.textContent = '🎤';
    elements.phaseIcon.className = 'phase-icon speaking';
    elements.phaseText.textContent = 'Say the movie name now!';
    elements.micIndicator.classList.add('active');
    elements.timer.textContent = timeLeft;
    elements.timer.className = 'timer-value';
    
    // Start speech recognition
    try {
        gameState.recognition.start();
    } catch (e) {
        console.log('Recognition already started');
    }
    
    // Start countdown
    gameState.timerInterval = setInterval(() => {
        timeLeft--;
        elements.timer.textContent = timeLeft;
        
        // Add warning classes
        if (timeLeft <= 3) {
            elements.timer.classList.add('warning');
        }
        if (timeLeft <= 1) {
            elements.timer.classList.remove('warning');
            elements.timer.classList.add('danger');
        }
        
        if (timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            evaluateAnswer();
        }
    }, 1000);
}

function evaluateAnswer() {
    // Stop speech recognition
    try {
        gameState.recognition.stop();
    } catch (e) {
        // Already stopped
    }
    
    const question = MOVIE_QUESTIONS[gameState.currentQuestionIndex];
    const userAnswer = gameState.recognizedText.toLowerCase().trim();
    
    let result = {
        emojis: question.emojis,
        correctAnswer: question.answer,
        userAnswer: gameState.recognizedText || '(no response)',
        status: 'timeout'
    };
    
    if (userAnswer) {
        // Check if answer matches any acceptable answer
        const isCorrect = question.acceptableAnswers.some(acceptable => 
            userAnswer.includes(acceptable) || 
            acceptable.includes(userAnswer) ||
            levenshteinSimilarity(userAnswer, acceptable) > 0.7
        );
        
        if (isCorrect) {
            result.status = 'correct';
            gameState.score += 10;
            gameState.correctCount++;
            showFeedback('correct', '✅ Correct! +10 points');
        } else {
            result.status = 'incorrect';
            gameState.incorrectCount++;
            showFeedback('incorrect', `❌ Incorrect! It was "${question.answer}"`);
        }
    } else {
        gameState.timeoutCount++;
        showFeedback('timeout', `⏱️ Time's up! It was "${question.answer}"`);
    }
    
    gameState.results.push(result);
    elements.score.textContent = gameState.score;
    
    // Move to next question after delay
    setTimeout(() => {
        gameState.currentQuestionIndex++;
        
        if (gameState.currentQuestionIndex >= MOVIE_QUESTIONS.length) {
            endGame();
        } else {
            showQuestion();
        }
    }, 2000);
}

// Levenshtein distance for fuzzy matching
function levenshteinSimilarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    
    return (longer.length - costs[s2.length]) / longer.length;
}

function showFeedback(type, message) {
    elements.feedback.className = `feedback show ${type}`;
    elements.feedback.textContent = message;
}

function endGame() {
    gameState.isGameActive = false;
    
    // Update results screen
    elements.finalScore.textContent = gameState.score;
    elements.correctCount.textContent = gameState.correctCount;
    elements.incorrectCount.textContent = gameState.incorrectCount;
    elements.timeoutCount.textContent = gameState.timeoutCount;
    
    // Performance message
    const percentage = (gameState.correctCount / MOVIE_QUESTIONS.length) * 100;
    let message = '';
    if (percentage === 100) {
        message = '🎉 Perfect score! You\'re a movie genius!';
    } else if (percentage >= 80) {
        message = '🌟 Excellent! You really know your movies!';
    } else if (percentage >= 60) {
        message = '👍 Good job! Keep watching those movies!';
    } else if (percentage >= 40) {
        message = '🎬 Not bad! Time for a movie marathon?';
    } else {
        message = '📺 Keep practicing! Watch more movies!';
    }
    elements.performanceMessage.textContent = message;
    
    // Build answers list
    elements.answersList.innerHTML = gameState.results.map((result, index) => `
        <div class="answer-item ${result.status}">
            <span class="answer-emoji">${result.emojis}</span>
            <div class="answer-details">
                <div class="answer-movie">${result.correctAnswer}</div>
                <div class="answer-given">Your answer: ${result.userAnswer}</div>
            </div>
            <span class="answer-status">${
                result.status === 'correct' ? '✅' : 
                result.status === 'incorrect' ? '❌' : '⏱️'
            }</span>
        </div>
    `).join('');
    
    showScreen(elements.resultsScreen);
}

// Event Listeners
elements.startBtn.addEventListener('click', () => {
    if (initSpeechRecognition()) {
        startGame();
    }
});

elements.playAgainBtn.addEventListener('click', () => {
    showScreen(elements.startScreen);
});

// Input validation
elements.guessTimeInput.addEventListener('change', () => {
    let value = parseInt(elements.guessTimeInput.value);
    if (value < 3) elements.guessTimeInput.value = 3;
    if (value > 15) elements.guessTimeInput.value = 15;
});

elements.voiceTimeInput.addEventListener('change', () => {
    let value = parseInt(elements.voiceTimeInput.value);
    if (value < 3) elements.voiceTimeInput.value = 3;
    if (value > 15) elements.voiceTimeInput.value = 15;
});

// Prevent leaving page during game
window.addEventListener('beforeunload', (e) => {
    if (gameState.isGameActive) {
        e.preventDefault();
        e.returnValue = '';
    }
});

console.log('🎬 Emoji Movie Guessing Game loaded!');
