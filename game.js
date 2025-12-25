/**
 * Emoji Movie Guessing Game
 * A voice-enabled game where users guess movies from emoji clues
 */

// Movie questions with emojis and acceptable answers
// Including common phonetic variations and mishearings
const MOVIE_QUESTIONS = [
    {
        emojis: "🦁👑🌍",
        answer: "The Lion King",
        acceptableAnswers: ["lion king", "the lion king", "lying king", "line king"]
    },
    {
        emojis: "🚢❄️💑💔",
        answer: "Titanic",
        acceptableAnswers: ["titanic", "titenic", "titannick", "the titanic"]
    },
    {
        emojis: "🕷️🦸‍♂️🏙️",
        answer: "Spider-Man",
        acceptableAnswers: ["spider man", "spiderman", "spider-man", "spyder man", "spider men"]
    },
    {
        emojis: "🧙‍♂️💍🌋🗡️",
        answer: "The Lord of the Rings",
        acceptableAnswers: ["lord of the rings", "the lord of the rings", "lotr", "lord of rings", "lord of the ring"]
    },
    {
        emojis: "👻🔫👨‍🔬🏠",
        answer: "Ghostbusters",
        acceptableAnswers: ["ghostbusters", "ghost busters", "ghostbuster", "ghost buster", "goes busters"]
    },
    {
        emojis: "🦈🏊‍♂️🩸🏖️",
        answer: "Jaws",
        acceptableAnswers: ["jaws", "joz", "jawz", "joss"]
    },
    {
        emojis: "🧊👸❄️⛄",
        answer: "Frozen",
        acceptableAnswers: ["frozen", "froze in", "frozen movie"]
    },
    {
        emojis: "🏴‍☠️💀⚓🗺️",
        answer: "Pirates of the Caribbean",
        acceptableAnswers: ["pirates of the caribbean", "pirates of caribbean", "pirates", "pirates caribbean", "pirate of the caribbean", "pirate caribbean"]
    },
    {
        emojis: "🤖❤️🌱🚀",
        answer: "WALL-E",
        acceptableAnswers: ["wall-e", "walle", "wall e", "wally", "walley", "wali", "wally e"]
    },
    {
        emojis: "🦇🃏🌃🦸",
        answer: "The Dark Knight",
        acceptableAnswers: ["the dark knight", "dark knight", "batman", "dark night", "the dark night"]
    }
];

// Game State
class GameState {
    constructor() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.guessTime = 3;
        this.voiceTime = 10;
        this.results = [];
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.timeoutCount = 0;
        this.isGameActive = false;
        this.currentPhase = 'guess'; // 'guess' or 'voice'
        this.timerInterval = null;
        this.recognition = null;
        this.recognizedText = '';
        this.voicePhaseStartTime = null; // Track when voice phase started
        this.answerTime = null; // Track when answer was recognized
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
        this.voicePhaseStartTime = null;
        this.answerTime = null;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}

// Phonetic matching algorithms
function soundex(str) {
    const s = str.toUpperCase().replace(/[^A-Z]/g, '');
    if (!s) return '';
    
    const codes = {
        'B': '1', 'F': '1', 'P': '1', 'V': '1',
        'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
        'D': '3', 'T': '3',
        'L': '4',
        'M': '5', 'N': '5',
        'R': '6'
    };
    
    let result = s[0];
    let prevCode = codes[s[0]] || '';
    
    for (let i = 1; i < s.length && result.length < 4; i++) {
        const code = codes[s[i]] || '';
        if (code && code !== prevCode) {
            result += code;
        }
        prevCode = code || prevCode;
    }
    
    return (result + '000').slice(0, 4);
}

// Double Metaphone simplified implementation for better phonetic matching
function metaphone(str) {
    if (!str) return '';
    
    let word = str.toUpperCase().replace(/[^A-Z]/g, '');
    if (!word) return '';
    
    // Common phonetic transformations
    const transforms = [
        [/^KN|^GN|^PN|^WR|^PS/, ''],
        [/^X/, 'S'],
        [/^WH/, 'W'],
        [/MB$/, 'M'],
        [/PH/g, 'F'],
        [/GH/g, ''],
        [/KN/g, 'N'],
        [/WR/g, 'R'],
        [/CK/g, 'K'],
        [/SCH/g, 'SK'],
        [/TCH/g, 'CH'],
        [/SH/g, 'X'],
        [/CH/g, 'X'],
        [/TH/g, '0'],
        [/DG/g, 'J'],
        [/C(?=[EIY])/g, 'S'],
        [/C/g, 'K'],
        [/Q/g, 'K'],
        [/X/g, 'KS'],
        [/Z/g, 'S'],
        [/V/g, 'F'],
        [/Y(?=[AEIOU])/g, ''],
        [/Y/g, ''],
        [/W(?=[AEIOU])/g, 'W'],
        [/W/g, ''],
        [/([AEIOU])\1+/g, '$1'],
        [/[AEIOU]/g, '']
    ];
    
    for (const [pattern, replacement] of transforms) {
        word = word.replace(pattern, replacement);
    }
    
    return word.slice(0, 6);
}

// Check if two strings sound similar
function soundsLike(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Direct match
    if (s1 === s2) return true;
    
    // Soundex match
    if (soundex(s1) === soundex(s2)) return true;
    
    // Metaphone match
    if (metaphone(s1) === metaphone(s2)) return true;
    
    // Check individual words for multi-word strings
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    // For single words, check phonetic similarity
    if (words1.length === 1 && words2.length === 1) {
        return soundex(s1) === soundex(s2) || metaphone(s1) === metaphone(s2);
    }
    
    // For multi-word, check if key words match phonetically
    const matchingWords = words1.filter(w1 => 
        words2.some(w2 => 
            soundex(w1) === soundex(w2) || 
            metaphone(w1) === metaphone(w2) ||
            w1 === w2
        )
    );
    
    // Consider a match if at least 60% of words match phonetically
    return matchingWords.length >= Math.ceil(words1.length * 0.6);
}

// Calculate time bonus based on reaction time
function calculateTimeBonus(reactionTimeMs, maxTimeMs) {
    // No answer given
    if (reactionTimeMs === null) return 0;
    
    const reactionTimeSec = reactionTimeMs / 1000;
    const maxTimeSec = maxTimeMs / 1000;
    
    // If answered within first 25% of time, give max bonus (5 points)
    // Linear decrease to 0 bonus at full time
    const timeRatio = reactionTimeSec / maxTimeSec;
    
    if (timeRatio <= 0.25) {
        return 5; // Max bonus for very fast answers
    } else if (timeRatio <= 0.5) {
        return 4; // Good bonus
    } else if (timeRatio <= 0.75) {
        return 2; // Small bonus
    } else {
        return 1; // Minimal bonus for answering at all
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
        
        const newText = finalTranscript || interimTranscript;
        
        // Track when the first valid answer was detected
        if (newText && !gameState.recognizedText && gameState.voicePhaseStartTime) {
            gameState.answerTime = Date.now() - gameState.voicePhaseStartTime;
        }
        
        gameState.recognizedText = newText;
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
    gameState.guessTime = parseInt(elements.guessTimeInput.value) || 3;
    gameState.voiceTime = parseInt(elements.voiceTimeInput.value) || 10;
    gameState.isGameActive = true;
    
    elements.totalQuestions.textContent = MOVIE_QUESTIONS.length;
    // Max score = 10 base + 5 max bonus per question
    elements.maxScore.textContent = MOVIE_QUESTIONS.length * 15;
    
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
    gameState.voicePhaseStartTime = Date.now();
    gameState.answerTime = null;
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
    const maxTimeMs = gameState.voiceTime * 1000;
    
    let result = {
        emojis: question.emojis,
        correctAnswer: question.answer,
        userAnswer: gameState.recognizedText || '(no response)',
        status: 'timeout',
        basePoints: 0,
        timeBonus: 0,
        totalPoints: 0,
        reactionTime: gameState.answerTime
    };
    
    if (userAnswer) {
        // Check if answer matches any acceptable answer using multiple methods
        const isCorrect = question.acceptableAnswers.some(acceptable => {
            // Direct match or partial match
            if (userAnswer.includes(acceptable) || acceptable.includes(userAnswer)) {
                return true;
            }
            
            // Levenshtein similarity (fuzzy text matching)
            if (levenshteinSimilarity(userAnswer, acceptable) > 0.7) {
                return true;
            }
            
            // Phonetic matching (sounds similar)
            if (soundsLike(userAnswer, acceptable)) {
                return true;
            }
            
            return false;
        });
        
        if (isCorrect) {
            result.status = 'correct';
            result.basePoints = 10;
            result.timeBonus = calculateTimeBonus(gameState.answerTime, maxTimeMs);
            result.totalPoints = result.basePoints + result.timeBonus;
            
            gameState.score += result.totalPoints;
            gameState.correctCount++;
            
            // Trigger confetti celebration!
            triggerConfetti();
            
            if (result.timeBonus > 0) {
                showFeedback('correct', `✅ Correct! +${result.basePoints} pts (+${result.timeBonus} speed bonus!)`);
            } else {
                showFeedback('correct', `✅ Correct! +${result.basePoints} points`);
            }
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
    
    // Calculate max possible score (10 base + 5 max bonus per question)
    const maxPossibleScore = MOVIE_QUESTIONS.length * 15;
    
    // Update results screen
    elements.finalScore.textContent = gameState.score;
    elements.maxScore.textContent = maxPossibleScore;
    elements.correctCount.textContent = gameState.correctCount;
    elements.incorrectCount.textContent = gameState.incorrectCount;
    elements.timeoutCount.textContent = gameState.timeoutCount;
    
    // Calculate total time bonus earned
    const totalTimeBonus = gameState.results.reduce((sum, r) => sum + (r.timeBonus || 0), 0);
    
    // Performance message
    const percentage = (gameState.correctCount / MOVIE_QUESTIONS.length) * 100;
    let message = '';
    if (percentage === 100) {
        message = '🎉 Perfect score! You\'re a movie genius!';
        if (totalTimeBonus >= MOVIE_QUESTIONS.length * 4) {
            message += ' ⚡ Lightning fast too!';
        }
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
    
    // Build answers list with time bonus info
    elements.answersList.innerHTML = gameState.results.map((result, index) => {
        const timeDisplay = result.reactionTime 
            ? `${(result.reactionTime / 1000).toFixed(1)}s` 
            : '-';
        
        const scoreDisplay = result.status === 'correct'
            ? `<span class="answer-score">+${result.totalPoints} pts${result.timeBonus > 0 ? ` (⚡+${result.timeBonus})` : ''}</span>`
            : '';
        
        const timeInfo = result.status === 'correct' && result.reactionTime
            ? `<span class="answer-time">⏱️ ${timeDisplay}</span>`
            : '';
        
        return `
            <div class="answer-item ${result.status}">
                <span class="answer-emoji">${result.emojis}</span>
                <div class="answer-details">
                    <div class="answer-movie">${result.correctAnswer}</div>
                    <div class="answer-given">Your answer: ${result.userAnswer}</div>
                    ${scoreDisplay} ${timeInfo}
                </div>
                <span class="answer-status">${
                    result.status === 'correct' ? '✅' : 
                    result.status === 'incorrect' ? '❌' : '⏱️'
                }</span>
            </div>
        `;
    }).join('');
    
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

// Confetti System
class ConfettiSystem {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isAnimating = false;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#6c5ce7', '#00b894', '#e17055'];
        return {
            x: Math.random() * this.canvas.width,
            y: -20,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 4 - 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
            shape: Math.random() > 0.5 ? 'rect' : 'circle',
            opacity: 1
        };
    }

    burst(count = 100) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.particles.push(this.createParticle());
            }, i * 15);
        }
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            p.speedY += 0.1; // gravity
            p.opacity -= 0.005;

            if (p.y > this.canvas.height || p.opacity <= 0) return false;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
            return true;
        });

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.isAnimating = false;
        }
    }
}

const confetti = new ConfettiSystem();

// Trigger confetti on correct answer
function triggerConfetti() {
    confetti.burst(80);
}

// Settings input buttons functionality
document.querySelectorAll('.input-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const currentValue = parseInt(input.value) || 3;
        const min = parseInt(input.min) || 3;
        const max = parseInt(input.max) || 15;
        
        if (btn.classList.contains('plus')) {
            input.value = Math.min(currentValue + 1, max);
        } else {
            input.value = Math.max(currentValue - 1, min);
        }
    });
});

console.log('🎬 Emoji Movie Guessing Game loaded!');
