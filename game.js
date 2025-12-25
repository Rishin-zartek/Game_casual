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

// LocalStorage keys
const STORAGE_KEYS = {
    SETTINGS: 'emojiQuiz_settings',
    SCORES: 'emojiQuiz_scores'
};

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
        this.voicePhaseStartTime = null;
        this.answerTime = null;
        this.correctAnswerDetected = false;
        this.isEvaluating = false;
        this.waitingForFinalResult = false;
        this.hasReceivedFinalConfirmation = false;
        this.lastSpeechTime = null;
        this.isProcessingAudio = false;
        this.timerEnded = false;
        this.processingCheckInterval = null;
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
        this.correctAnswerDetected = false;
        this.isEvaluating = false;
        this.waitingForFinalResult = false;
        this.hasReceivedFinalConfirmation = false;
        this.lastSpeechTime = null;
        this.isProcessingAudio = false;
        this.timerEnded = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.processingCheckInterval) {
            clearInterval(this.processingCheckInterval);
            this.processingCheckInterval = null;
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
    
    if (s1 === s2) return true;
    if (soundex(s1) === soundex(s2)) return true;
    if (metaphone(s1) === metaphone(s2)) return true;
    
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    if (words1.length === 1 && words2.length === 1) {
        return soundex(s1) === soundex(s2) || metaphone(s1) === metaphone(s2);
    }
    
    const matchingWords = words1.filter(w1 => 
        words2.some(w2 => 
            soundex(w1) === soundex(w2) || 
            metaphone(w1) === metaphone(w2) ||
            w1 === w2
        )
    );
    
    return matchingWords.length >= Math.ceil(words1.length * 0.6);
}

// Calculate time bonus based on reaction time
function calculateTimeBonus(reactionTimeMs, maxTimeMs) {
    if (reactionTimeMs === null) return 0;
    
    const reactionTimeSec = reactionTimeMs / 1000;
    const maxTimeSec = maxTimeMs / 1000;
    const timeRatio = reactionTimeSec / maxTimeSec;
    
    if (timeRatio <= 0.25) {
        return 5;
    } else if (timeRatio <= 0.5) {
        return 4;
    } else if (timeRatio <= 0.75) {
        return 2;
    } else {
        return 1;
    }
}

const gameState = new GameState();

// DOM Elements
const elements = {
    // Screens
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultsScreen: document.getElementById('results-screen'),
    countdownScreen: document.getElementById('countdown-screen'),
    
    // Settings
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    saveSettings: document.getElementById('save-settings'),
    clearDataBtn: document.getElementById('clear-data-btn'),
    guessTimeInput: document.getElementById('guess-time'),
    voiceTimeInput: document.getElementById('voice-time'),
    
    // Start screen
    startBtn: document.getElementById('start-btn'),
    
    // Countdown
    countdownNumber: document.getElementById('countdown-number'),
    
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
    previousScores: document.getElementById('previous-scores'),
    answersList: document.getElementById('answers-list'),
    playAgainBtn: document.getElementById('play-again-btn')
};

// ============================================
// LOCAL STORAGE FUNCTIONS
// ============================================

function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (saved) {
            const settings = JSON.parse(saved);
            elements.guessTimeInput.value = settings.guessTime || 3;
            elements.voiceTimeInput.value = settings.voiceTime || 10;
        }
    } catch (e) {
        console.log('Could not load settings:', e);
    }
}

function saveSettingsToStorage() {
    try {
        const settings = {
            guessTime: parseInt(elements.guessTimeInput.value) || 3,
            voiceTime: parseInt(elements.voiceTimeInput.value) || 10
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.log('Could not save settings:', e);
    }
}

function loadScoreHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SCORES);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.log('Could not load scores:', e);
        return [];
    }
}

function saveScore(score) {
    try {
        const scores = loadScoreHistory();
        scores.unshift({
            score: score,
            date: new Date().toISOString(),
            maxScore: MOVIE_QUESTIONS.length * 15
        });
        // Keep only last 10 scores
        const trimmedScores = scores.slice(0, 10);
        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(trimmedScores));
        return trimmedScores;
    } catch (e) {
        console.log('Could not save score:', e);
        return [];
    }
}

function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.SCORES);
        elements.guessTimeInput.value = 3;
        elements.voiceTimeInput.value = 10;
        alert('All scores and settings have been cleared!');
    } catch (e) {
        console.log('Could not clear data:', e);
    }
}

// ============================================
// SPEECH RECOGNITION
// ============================================

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
        let hasInterim = false;
        
        for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript + ' ';
                hasInterim = true;
            }
        }
        
        gameState.lastSpeechTime = Date.now();
        gameState.isProcessingAudio = hasInterim;
        
        const newText = (finalTranscript + interimTranscript).trim();
        if (newText) {
            gameState.recognizedText = newText;
            elements.recognizedText.textContent = `"${gameState.recognizedText}"`;
        }
        
        console.log(`Speech result - Final: "${finalTranscript.trim()}", Interim: "${interimTranscript.trim()}"`);
        
        if (newText && gameState.voicePhaseStartTime && !gameState.correctAnswerDetected) {
            const question = MOVIE_QUESTIONS[gameState.currentQuestionIndex];
            if (checkAnswerMatch(newText, question)) {
                gameState.answerTime = Date.now() - gameState.voicePhaseStartTime;
                gameState.correctAnswerDetected = true;
                console.log(`Correct answer detected at ${gameState.answerTime}ms`);
                gameState.hasReceivedFinalConfirmation = true;
            }
        }
    };
    
    gameState.recognition.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access to play the game.');
        }
    };
    
    gameState.recognition.onspeechstart = () => {
        console.log('Speech started');
        gameState.isProcessingAudio = true;
        gameState.lastSpeechTime = Date.now();
    };
    
    gameState.recognition.onspeechend = () => {
        console.log('Speech ended');
        gameState.lastSpeechTime = Date.now();
    };
    
    gameState.recognition.onaudiostart = () => {
        console.log('Audio capture started');
    };
    
    gameState.recognition.onaudioend = () => {
        console.log('Audio capture ended');
        gameState.lastSpeechTime = Date.now();
    };
    
    gameState.recognition.onend = () => {
        console.log('Speech recognition ended. Timer ended:', gameState.timerEnded, 'Evaluating:', gameState.isEvaluating);
        
        gameState.isProcessingAudio = false;
        
        if (gameState.timerEnded && !gameState.isEvaluating) {
            console.log('Recognition ended after timer - triggering final evaluation');
            setTimeout(() => {
                if (!gameState.isEvaluating) {
                    finalizeAndEvaluate();
                }
            }, 500);
            return;
        }
        
        if (gameState.isGameActive && gameState.currentPhase === 'voice' && 
            !gameState.timerEnded && !gameState.isEvaluating) {
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

// ============================================
// SCREEN MANAGEMENT
// ============================================

function showScreen(screen) {
    elements.startScreen.classList.remove('active');
    elements.gameScreen.classList.remove('active');
    elements.resultsScreen.classList.remove('active');
    elements.countdownScreen.classList.remove('active');
    screen.classList.add('active');
}

// ============================================
// SETTINGS MODAL
// ============================================

function openSettings() {
    elements.settingsModal.classList.add('active');
}

function closeSettingsModal() {
    elements.settingsModal.classList.remove('active');
}

// ============================================
// COUNTDOWN ANIMATION
// ============================================

function runCountdown(callback) {
    showScreen(elements.countdownScreen);
    let count = 3;
    elements.countdownNumber.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            elements.countdownNumber.textContent = count;
            // Add animation effect
            elements.countdownNumber.style.transform = 'scale(1.2)';
            setTimeout(() => {
                elements.countdownNumber.style.transform = 'scale(1)';
            }, 200);
        } else if (count === 0) {
            elements.countdownNumber.textContent = 'GO!';
            elements.countdownNumber.style.color = '#10b981';
        } else {
            clearInterval(countdownInterval);
            elements.countdownNumber.style.color = '';
            callback();
        }
    }, 1000);
}

// ============================================
// GAME FLOW
// ============================================

function startGame() {
    gameState.reset();
    gameState.guessTime = parseInt(elements.guessTimeInput.value) || 3;
    gameState.voiceTime = parseInt(elements.voiceTimeInput.value) || 10;
    gameState.isGameActive = true;
    
    elements.totalQuestions.textContent = MOVIE_QUESTIONS.length;
    elements.maxScore.textContent = MOVIE_QUESTIONS.length * 15;
    
    // Run countdown then start
    runCountdown(() => {
        showScreen(elements.gameScreen);
        showQuestion();
    });
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
    
    // Reset state for this question
    gameState.recognizedText = '';
    gameState.answerTime = null;
    gameState.correctAnswerDetected = false;
    gameState.isEvaluating = false;
    gameState.waitingForFinalResult = false;
    gameState.hasReceivedFinalConfirmation = false;
    gameState.lastSpeechTime = null;
    gameState.isProcessingAudio = false;
    gameState.timerEnded = false;
    if (gameState.processingCheckInterval) {
        clearInterval(gameState.processingCheckInterval);
        gameState.processingCheckInterval = null;
    }
    
    startGuessPhase();
}

function startGuessPhase() {
    gameState.currentPhase = 'guess';
    let timeLeft = gameState.guessTime;
    
    elements.phaseLabel.textContent = 'Think';
    elements.phaseIcon.textContent = '🧠';
    elements.phaseIcon.className = 'phase-icon thinking';
    elements.phaseText.textContent = 'Study the emojis...';
    elements.micIndicator.classList.remove('active');
    elements.timer.textContent = timeLeft;
    elements.timer.className = 'timer-value';
    
    gameState.timerInterval = setInterval(() => {
        timeLeft--;
        elements.timer.textContent = timeLeft;
        
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
    gameState.correctAnswerDetected = false;
    gameState.isEvaluating = false;
    gameState.waitingForFinalResult = false;
    gameState.hasReceivedFinalConfirmation = false;
    gameState.lastSpeechTime = null;
    gameState.isProcessingAudio = false;
    gameState.timerEnded = false;
    if (gameState.processingCheckInterval) {
        clearInterval(gameState.processingCheckInterval);
        gameState.processingCheckInterval = null;
    }
    let timeLeft = gameState.voiceTime;
    
    elements.phaseLabel.textContent = 'Speak';
    elements.phaseIcon.textContent = '🎤';
    elements.phaseIcon.className = 'phase-icon speaking';
    elements.phaseText.textContent = 'Say the movie name now!';
    elements.micIndicator.classList.add('active');
    elements.timer.textContent = timeLeft;
    elements.timer.className = 'timer-value';
    
    try {
        gameState.recognition.start();
    } catch (e) {
        console.log('Recognition already started');
    }
    
    gameState.timerInterval = setInterval(() => {
        timeLeft--;
        elements.timer.textContent = timeLeft;
        
        if (timeLeft <= 3) {
            elements.timer.classList.add('warning');
        }
        if (timeLeft <= 1) {
            elements.timer.classList.remove('warning');
            elements.timer.classList.add('danger');
        }
        
        if (timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            handleTimerEnd();
        }
    }, 1000);
}

function handleTimerEnd() {
    console.log('Timer ended. Processing audio:', gameState.isProcessingAudio, 'Last speech:', gameState.lastSpeechTime);
    
    gameState.timerEnded = true;
    gameState.waitingForFinalResult = true;
    elements.phaseText.textContent = 'Processing your answer...';
    
    const timeSinceLastSpeech = gameState.lastSpeechTime ? (Date.now() - gameState.lastSpeechTime) : Infinity;
    const isRecentlyActive = timeSinceLastSpeech < 3000;
    
    console.log('Time since last speech:', timeSinceLastSpeech, 'Recently active:', isRecentlyActive);
    
    if (gameState.isProcessingAudio || isRecentlyActive) {
        console.log('Audio still being processed - waiting for recognition to complete');
        
        if (gameState.processingCheckInterval) {
            clearInterval(gameState.processingCheckInterval);
        }
        
        gameState.processingCheckInterval = setInterval(() => {
            const now = Date.now();
            const timeSinceSpeech = gameState.lastSpeechTime ? (now - gameState.lastSpeechTime) : Infinity;
            
            console.log('Checking processing status - isProcessing:', gameState.isProcessingAudio, 'timeSinceSpeech:', timeSinceSpeech);
            
            if (!gameState.isProcessingAudio && timeSinceSpeech >= 2000) {
                clearInterval(gameState.processingCheckInterval);
                gameState.processingCheckInterval = null;
                
                try {
                    gameState.recognition.stop();
                } catch (e) {}
                
                setTimeout(() => {
                    if (!gameState.isEvaluating) {
                        finalizeAndEvaluate();
                    }
                }, 500);
            }
        }, 200);
        
        setTimeout(() => {
            if (!gameState.isEvaluating && gameState.processingCheckInterval) {
                console.log('Safety timeout - forcing evaluation');
                clearInterval(gameState.processingCheckInterval);
                gameState.processingCheckInterval = null;
                try {
                    gameState.recognition.stop();
                } catch (e) {}
                setTimeout(() => {
                    if (!gameState.isEvaluating) {
                        finalizeAndEvaluate();
                    }
                }, 500);
            }
        }, 10000);
    } else {
        console.log('No recent audio activity - stopping recognition');
        try {
            gameState.recognition.stop();
        } catch (e) {}
        
        setTimeout(() => {
            if (!gameState.isEvaluating) {
                finalizeAndEvaluate();
            }
        }, 1500);
    }
}

function finalizeAndEvaluate() {
    if (gameState.isEvaluating) return;
    
    console.log('Finalizing evaluation with text:', gameState.recognizedText);
    gameState.waitingForFinalResult = false;
    
    if (gameState.processingCheckInterval) {
        clearInterval(gameState.processingCheckInterval);
        gameState.processingCheckInterval = null;
    }
    
    evaluateAnswer();
}

function evaluateAnswer() {
    if (gameState.isEvaluating) {
        return;
    }
    gameState.isEvaluating = true;
    
    console.log('=== EVALUATING ANSWER ===');
    console.log('Recognized text:', gameState.recognizedText);
    console.log('Correct answer detected:', gameState.correctAnswerDetected);
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    if (gameState.processingCheckInterval) {
        clearInterval(gameState.processingCheckInterval);
        gameState.processingCheckInterval = null;
    }
    
    try {
        gameState.recognition.stop();
    } catch (e) {}
    
    const question = MOVIE_QUESTIONS[gameState.currentQuestionIndex];
    const userAnswer = gameState.recognizedText.toLowerCase().trim();
    const maxTimeMs = gameState.voiceTime * 1000;
    
    const reactionTime = gameState.correctAnswerDetected ? gameState.answerTime : null;
    
    let result = {
        emojis: question.emojis,
        correctAnswer: question.answer,
        userAnswer: gameState.recognizedText || '(no response)',
        status: 'timeout',
        basePoints: 0,
        timeBonus: 0,
        totalPoints: 0,
        reactionTime: reactionTime
    };
    
    if (userAnswer) {
        const isCorrect = checkAnswerMatch(userAnswer, question);
        
        if (isCorrect) {
            result.status = 'correct';
            result.basePoints = 10;
            result.timeBonus = calculateTimeBonus(reactionTime, maxTimeMs);
            result.totalPoints = result.basePoints + result.timeBonus;
            
            gameState.score += result.totalPoints;
            gameState.correctCount++;
            
            console.log('Triggering confetti for correct answer!');
            setTimeout(() => triggerConfetti(), 100);
            
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
    
    setTimeout(() => {
        gameState.currentQuestionIndex++;
        
        if (gameState.currentQuestionIndex >= MOVIE_QUESTIONS.length) {
            endGame();
        } else {
            showQuestion();
        }
    }, 2500);
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

function checkAnswerMatch(userAnswer, question) {
    const answer = userAnswer.toLowerCase().trim();
    if (!answer) return false;
    
    return question.acceptableAnswers.some(acceptable => {
        if (answer.includes(acceptable) || acceptable.includes(answer)) {
            return true;
        }
        
        if (levenshteinSimilarity(answer, acceptable) > 0.7) {
            return true;
        }
        
        if (soundsLike(answer, acceptable)) {
            return true;
        }
        
        return false;
    });
}

function showFeedback(type, message) {
    elements.feedback.className = `feedback show ${type}`;
    elements.feedback.textContent = message;
}

function endGame() {
    gameState.isGameActive = false;
    
    // Save score to history
    const scores = saveScore(gameState.score);
    
    const maxPossibleScore = MOVIE_QUESTIONS.length * 15;
    
    // Update results screen
    elements.finalScore.textContent = gameState.score;
    elements.maxScore.textContent = maxPossibleScore;
    elements.correctCount.textContent = gameState.correctCount;
    elements.incorrectCount.textContent = gameState.incorrectCount;
    elements.timeoutCount.textContent = gameState.timeoutCount;
    
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
    
    // Display previous scores
    displayPreviousScores(scores);
    
    // Build answers list
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
    
    // Trigger confetti for good scores
    if (percentage >= 70) {
        setTimeout(() => triggerConfetti(), 500);
    }
}

function displayPreviousScores(scores) {
    if (!scores || scores.length === 0) {
        elements.previousScores.innerHTML = '<p class="no-previous-scores">No previous scores yet</p>';
        return;
    }
    
    elements.previousScores.innerHTML = scores.slice(0, 5).map((s, index) => {
        const date = new Date(s.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const isCurrent = index === 0;
        
        return `
            <div class="previous-score-item ${isCurrent ? 'current' : ''}">
                <span class="previous-score-value">${s.score}</span>
                <span class="previous-score-date">${isCurrent ? 'Now' : dateStr}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// EVENT LISTENERS
// ============================================

// Start button
elements.startBtn.addEventListener('click', () => {
    if (initSpeechRecognition()) {
        startGame();
    }
});

// Play again button - goes back to home
elements.playAgainBtn.addEventListener('click', () => {
    showScreen(elements.startScreen);
});

// Settings button
elements.settingsBtn.addEventListener('click', openSettings);

// Close settings
elements.closeSettings.addEventListener('click', closeSettingsModal);

// Close modal on backdrop click
elements.settingsModal.querySelector('.modal-backdrop').addEventListener('click', closeSettingsModal);

// Save settings
elements.saveSettings.addEventListener('click', () => {
    saveSettingsToStorage();
    closeSettingsModal();
});

// Clear data
elements.clearDataBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all scores and settings?')) {
        clearAllData();
    }
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

// Prevent leaving page during game
window.addEventListener('beforeunload', (e) => {
    if (gameState.isGameActive) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ============================================
// CONFETTI SYSTEM
// ============================================

class ConfettiSystem {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) {
            console.error('Confetti canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isAnimating = false;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        console.log('Confetti system initialized');
    }

    resizeCanvas() {
        if (!this.canvas) return;
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
        if (!this.canvas || !this.ctx) {
            console.error('Cannot burst confetti - canvas not ready');
            return;
        }
        console.log(`Bursting ${count} confetti particles`);
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
            p.speedY += 0.1;
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

function triggerConfetti() {
    confetti.burst(80);
}

// ============================================
// INITIALIZATION
// ============================================

// Load saved settings on page load
loadSettings();

console.log('🎬 Emoji Movie Guessing Game loaded!');
