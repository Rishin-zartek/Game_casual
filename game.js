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

// ============================================
// LOGGING SYSTEM
// ============================================

class LoadingLogger {
    constructor() {
        this.logs = [];
        this.startTime = Date.now();
        this.logsPanel = null;
        this.logsContent = null;
        this.showLogsBtn = null;
        this.isExpanded = false;
    }
    
    init() {
        this.logsPanel = document.getElementById('logs-panel');
        this.logsContent = document.getElementById('logs-content');
        this.showLogsBtn = document.getElementById('show-logs-btn');
        const clearLogsBtn = document.getElementById('clear-logs-btn');
        
        if (this.showLogsBtn) {
            this.showLogsBtn.addEventListener('click', () => this.toggleLogs());
        }
        
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => this.clearLogs());
        }
        
        // Log initial browser info
        this.logBrowserInfo();
    }
    
    logBrowserInfo() {
        const ua = navigator.userAgent;
        const isAndroid = /Android/i.test(ua);
        const isChrome = /Chrome/i.test(ua);
        const isMobile = /Mobile/i.test(ua);
        const isIOS = /iPhone|iPad|iPod/i.test(ua);
        
        this.log('info', `Browser: ${navigator.userAgent.substring(0, 80)}...`);
        this.log('info', `Platform: ${isAndroid ? 'Android' : isIOS ? 'iOS' : 'Desktop'} | ${isChrome ? 'Chrome' : 'Other'} | ${isMobile ? 'Mobile' : 'Desktop'}`);
        this.log('info', `Screen: ${window.innerWidth}x${window.innerHeight}`);
    }
    
    log(type, message) {
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
        const entry = {
            time: elapsed,
            type: type, // 'info', 'success', 'warning', 'error'
            message: message
        };
        
        this.logs.push(entry);
        
        // Also log to console
        const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
        console[consoleMethod](`[${elapsed}s] ${message}`);
        
        // Update UI if panel exists
        this.renderLog(entry);
    }
    
    renderLog(entry) {
        if (!this.logsContent) return;
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        const logEl = document.createElement('div');
        logEl.className = `log-entry ${entry.type}`;
        logEl.innerHTML = `
            <span class="log-time">${entry.time}s</span>
            <span class="log-icon">${icons[entry.type] || 'ℹ️'}</span>
            <span class="log-message">${entry.message}</span>
        `;
        
        this.logsContent.appendChild(logEl);
        this.logsContent.scrollTop = this.logsContent.scrollHeight;
    }
    
    toggleLogs() {
        this.isExpanded = !this.isExpanded;
        
        if (this.logsPanel) {
            this.logsPanel.classList.toggle('active', this.isExpanded);
        }
        if (this.showLogsBtn) {
            this.showLogsBtn.classList.toggle('active', this.isExpanded);
        }
    }
    
    clearLogs() {
        this.logs = [];
        this.startTime = Date.now();
        if (this.logsContent) {
            this.logsContent.innerHTML = '';
        }
        this.logBrowserInfo();
    }
    
    getAllLogs() {
        return this.logs.map(l => `[${l.time}s] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    }
}

// Global logger instance
const loadingLogger = new LoadingLogger();

// Detect browser capabilities
function detectBrowserCapabilities() {
    const ua = navigator.userAgent;
    return {
        isAndroid: /Android/i.test(ua),
        isChrome: /Chrome/i.test(ua) && !/Edg/i.test(ua),
        isMobile: /Mobile|Android|iPhone|iPad/i.test(ua),
        isIOS: /iPhone|iPad|iPod/i.test(ua),
        isSafari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
        hasWebSpeech: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
        hasAudioWorklet: !!(window.AudioWorkletNode),
        hasWebAssembly: typeof WebAssembly !== 'undefined'
    };
}

// ============================================
// SPEECH ENGINE ABSTRACTION LAYER
// ============================================

// Speech Engine Interface - both engines implement this
class SpeechEngineInterface {
    constructor() {
        this.onResult = null;  // callback(transcript, isFinal)
        this.onError = null;   // callback(error)
        this.onStart = null;   // callback()
        this.onEnd = null;     // callback()
        this.isListening = false;
    }
    
    async initialize() { throw new Error('Not implemented'); }
    start() { throw new Error('Not implemented'); }
    stop() { throw new Error('Not implemented'); }
    destroy() { throw new Error('Not implemented'); }
    isAvailable() { return false; }
    getName() { return 'Unknown'; }
}

// ============================================
// GOOGLE CLOUD SPEECH-TO-TEXT ENGINE (Online)
// ============================================

class GoogleCloudSpeechEngine extends SpeechEngineInterface {
    constructor() {
        super();
        this.apiKey = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.processorNode = null;
        this.isInitialized = false;
        this.isLoading = false;
        this.streamingRequest = null;
        this.reader = null;
        this.audioBuffer = [];
        this.configSent = false;
        this.recognitionConfig = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
            enableAutomaticPunctuation: false,
            model: 'default',
            useEnhanced: false,
            enableInterimResults: true
        };
    }
    
    getName() { return 'Google Cloud STT (Streaming RPC)'; }
    
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }
    
    isAvailable() {
        const hasApiKey = !!this.apiKey && this.apiKey.trim().length > 0;
        loadingLogger.log('info', `Google Cloud STT API key available: ${hasApiKey}`);
        return hasApiKey;
    }
    
    async initialize(onProgress) {
        if (this.isInitialized) {
            loadingLogger.log('info', 'Google Cloud STT already initialized, skipping');
            return true;
        }
        if (this.isLoading) {
            loadingLogger.log('warning', 'Google Cloud STT initialization already in progress');
            return false;
        }
        
        this.isLoading = true;
        loadingLogger.log('info', '=== Starting Google Cloud STT Streaming RPC Initialization ===');
        
        try {
            // Step 1: Check API key
            loadingLogger.log('info', 'Step 1: Checking API key...');
            if (!this.apiKey || this.apiKey.trim().length === 0) {
                loadingLogger.log('error', 'Google Cloud API key not configured');
                throw new Error('API key required. Please configure it in settings.');
            }
            loadingLogger.log('success', 'API key found');
            
            if (onProgress) onProgress('Initializing streaming RPC...', 50);
            
            // Step 2: Streaming RPC ready
            loadingLogger.log('info', 'Step 2: Streaming RPC ready');
            
            if (onProgress) onProgress('Ready!', 100);
            
            this.isInitialized = true;
            this.isLoading = false;
            loadingLogger.log('success', '=== Google Cloud STT Streaming RPC Initialization Complete ===');
            return true;
            
        } catch (error) {
            loadingLogger.log('error', `Google Cloud STT initialization failed: ${error.message}`);
            this.isLoading = false;
            if (this.onError) this.onError(error);
            throw error;
        }
    }
    
    async start() {
        if (!this.isInitialized) {
            console.error('Google Cloud STT not initialized');
            return;
        }
        
        if (this.isListening) {
            console.log('Google Cloud STT already listening');
            return;
        }
        
        try {
            console.log('Starting Google Cloud STT streaming recognition...');
            
            // Get microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1,
                    sampleRate: 16000
                }
            });
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });
            
            // Create source node from microphone
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            // Create script processor for audio processing
            this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            this.audioBuffer = [];
            this.configSent = false;
            
            // Start streaming RPC connection
            await this.startStreamingRPC();
            
            this.processorNode.onaudioprocess = (event) => {
                if (!this.isListening) return;
                
                try {
                    const inputData = event.inputBuffer.getChannelData(0);
                    // Convert Float32Array to Int16Array for Google Cloud API
                    const int16Data = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        const s = Math.max(-1, Math.min(1, inputData[i]));
                        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }
                    
                    // Send audio chunk via streaming RPC
                    this.sendAudioChunk(int16Data);
                } catch (error) {
                    console.error('Audio processing failed', error);
                }
            };
            
            // Connect nodes
            this.sourceNode.connect(this.processorNode);
            this.processorNode.connect(this.audioContext.destination);
            
            this.isListening = true;
            if (this.onStart) this.onStart();
            console.log('Google Cloud STT streaming recognition started');
            
        } catch (error) {
            console.error('Failed to start Google Cloud STT recognition:', error);
            if (this.onError) this.onError(error);
        }
    }
    
    async startStreamingRPC() {
        try {
            // Google Cloud Speech-to-Text Streaming RPC API
            // This uses the streamingrecognize endpoint which is the RPC method (not REST)
            // It uses HTTP/2 streaming with newline-delimited JSON for low latency
            const url = `https://speech.googleapis.com/v1/speech:streamingrecognize?key=${encodeURIComponent(this.apiKey)}`;
            
            // Create a ReadableStream for sending audio data
            const stream = new ReadableStream({
                start: (controller) => {
                    this.streamController = controller;
                    
                    // Send initial config message (newline-delimited JSON)
                    const configMessage = {
                        streamingConfig: {
                            config: this.recognitionConfig,
                            interimResults: true,
                            singleUtterance: false
                        }
                    };
                    
                    const configJson = JSON.stringify(configMessage) + '\n';
                    controller.enqueue(new TextEncoder().encode(configJson));
                    this.configSent = true;
                    loadingLogger.log('info', 'Streaming RPC config sent');
                    console.log('Sent streaming config');
                }
            });
            
            // Start the streaming request with HTTP/2
            this.streamingRequest = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: stream,
                // Don't cache streaming requests
                cache: 'no-cache',
            });
            
            if (!this.streamingRequest.ok) {
                const errorText = await this.streamingRequest.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: { message: errorText || `HTTP ${this.streamingRequest.status}` } };
                }
                throw new Error(errorData.error?.message || `Streaming API error: ${this.streamingRequest.status}`);
            }
            
            // Read responses from the stream (newline-delimited JSON)
            this.reader = this.streamingRequest.body.getReader();
            this.readStream();
            
        } catch (error) {
            console.error('Failed to start streaming RPC:', error);
            loadingLogger.log('error', `Streaming RPC failed: ${error.message}`);
            if (this.onError) {
                if (error.message.includes('API key') || error.message.includes('403') || error.message.includes('401')) {
                    this.onError(new Error('Invalid API key. Please check your Google Cloud API key in settings.'));
                } else {
                    this.onError(error);
                }
            }
        }
    }
    
    async readStream() {
        let buffer = '';
        
        try {
            while (this.isListening && this.reader) {
                const { done, value } = await this.reader.read();
                
                if (done) {
                    console.log('Stream ended');
                    // Process any remaining buffer
                    if (buffer.trim()) {
                        const lines = buffer.split('\n').filter(line => line.trim());
                        for (const line of lines) {
                            try {
                                const response = JSON.parse(line);
                                this.handleStreamResponse(response);
                            } catch (e) {
                                console.error('Failed to parse final buffer:', e);
                            }
                        }
                    }
                    break;
                }
                
                // Accumulate chunks and parse newline-delimited JSON
                buffer += new TextDecoder().decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // Keep the last incomplete line in buffer
                buffer = lines.pop() || '';
                
                // Process complete lines
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const response = JSON.parse(line);
                            this.handleStreamResponse(response);
                        } catch (e) {
                            console.error('Failed to parse stream response:', e, 'Line:', line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error reading stream:', error);
            loadingLogger.log('error', `Stream read error: ${error.message}`);
            if (this.onError && this.isListening) {
                this.onError(error);
            }
        }
    }
    
    handleStreamResponse(response) {
        if (response.error) {
            console.error('Stream error:', response.error);
            loadingLogger.log('error', `Stream error: ${response.error.message || 'Unknown error'}`);
            if (this.onError) {
                this.onError(new Error(response.error.message || 'Streaming error'));
            }
            return;
        }
        
        if (response.results && response.results.length > 0) {
            for (const result of response.results) {
                if (result.alternatives && result.alternatives.length > 0) {
                    const alternative = result.alternatives[0];
                    if (alternative.transcript) {
                    const transcript = alternative.transcript.trim();
                    // Check if this is a final result
                    const isFinal = result.isFinal === true || (result.stability !== undefined && result.stability > 0.9);
                        
                        if (transcript && this.onResult) {
                            console.log(`Google Cloud STT ${isFinal ? 'final' : 'interim'} result:`, transcript);
                            loadingLogger.log('info', `Received ${isFinal ? 'final' : 'interim'} transcript: ${transcript}`);
                            this.onResult(transcript, isFinal);
                        }
                    }
                }
            }
        }
    }
    
    sendAudioChunk(audioData) {
        if (!this.streamController || !this.configSent || !this.isListening) {
            return;
        }
        
        try {
            // Convert Int16Array to base64
            const base64Audio = this.int16ToBase64(audioData);
            
            // Send audio data message (newline-delimited JSON)
            const audioMessage = {
                audioContent: base64Audio
            };
            
            const audioJson = JSON.stringify(audioMessage) + '\n';
            this.streamController.enqueue(new TextEncoder().encode(audioJson));
        } catch (error) {
            console.error('Failed to send audio chunk:', error);
            loadingLogger.log('error', `Failed to send audio chunk: ${error.message}`);
        }
    }
    
    int16ToBase64(int16Array) {
        // Convert Int16Array to ArrayBuffer, then to base64
        const buffer = new ArrayBuffer(int16Array.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < int16Array.length; i++) {
            view.setInt16(i * 2, int16Array[i], true); // littleEndian
        }
        
        // Convert to base64
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    stop() {
        if (!this.isListening) return;
        
        console.log('Stopping Google Cloud STT recognition...');
        this.isListening = false;
        
        // Close the stream
        if (this.streamController) {
            try {
                this.streamController.close();
            } catch (e) {}
            this.streamController = null;
        }
        
        if (this.reader) {
            try {
                this.reader.cancel();
            } catch (e) {}
            this.reader = null;
        }
        
        if (this.streamingRequest) {
            this.streamingRequest = null;
        }
        
        // Disconnect and clean up audio nodes
        if (this.processorNode) {
            this.processorNode.disconnect();
            this.processorNode = null;
        }
        
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }
        
        // Stop media stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        this.audioBuffer = [];
        this.configSent = false;
        
        if (this.onEnd) this.onEnd();
        console.log('Google Cloud STT recognition stopped');
    }
    
    destroy() {
        this.stop();
        this.isInitialized = false;
    }
}

// ============================================
// WEB SPEECH API ENGINE (Online)
// ============================================

class WebSpeechEngine extends SpeechEngineInterface {
    constructor() {
        super();
        this.recognition = null;
        this.isInitialized = false;
    }
    
    getName() { return 'Web Speech API (Online)'; }
    
    isAvailable() {
        const available = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        loadingLogger.log('info', `Web Speech API available: ${available}`);
        return available;
    }
    
    async initialize() {
        if (this.isInitialized) {
            loadingLogger.log('info', 'Web Speech already initialized');
            return true;
        }
        
        loadingLogger.log('info', '=== Starting Web Speech API Initialization ===');
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            loadingLogger.log('error', 'Web Speech API constructor not found');
            throw new Error('Web Speech API not supported');
        }
        
        loadingLogger.log('info', 'Creating SpeechRecognition instance...');
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        loadingLogger.log('success', 'SpeechRecognition configured (continuous, interim, en-US)');
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript + ' ';
                }
            }
            
            const text = (finalTranscript + interimTranscript).trim();
            const isFinal = finalTranscript.trim().length > 0;
            
            if (text && this.onResult) {
                this.onResult(text, isFinal);
            }
        };
        
        this.recognition.onerror = (event) => {
            loadingLogger.log('error', `Web Speech error: ${event.error}`);
            console.log('Web Speech error:', event.error);
            if (event.error === 'not-allowed' && this.onError) {
                loadingLogger.log('error', 'Microphone access was denied');
                this.onError(new Error('Microphone access denied'));
            } else if (event.error === 'network') {
                loadingLogger.log('error', 'Network error - requires internet connection');
            } else if (event.error === 'no-speech') {
                loadingLogger.log('warning', 'No speech detected');
            }
        };
        
        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStart) this.onStart();
        };
        
        this.recognition.onend = () => {
            const wasListening = this.isListening;
            this.isListening = false;
            if (this.onEnd) this.onEnd();
            
            // Auto-restart if we're supposed to be listening
            if (wasListening && this._shouldRestart) {
                try {
                    this.recognition.start();
                } catch (e) {
                    // Already started or error
                }
            }
        };
        
        this._shouldRestart = false;
        this.isInitialized = true;
        loadingLogger.log('success', '=== Web Speech API Initialization Complete ===');
        return true;
    }
    
    start() {
        if (!this.isInitialized) return;
        
        this._shouldRestart = true;
        try {
            this.recognition.start();
        } catch (e) {
            console.log('Web Speech start error (may already be running):', e.message);
        }
    }
    
    stop() {
        if (!this.isInitialized) return;
        
        this._shouldRestart = false;
        try {
            this.recognition.stop();
        } catch (e) {
            // Ignore
        }
        this.isListening = false;
    }
    
    destroy() {
        this.stop();
        this.recognition = null;
        this.isInitialized = false;
    }
}

// ============================================
// SPEECH ENGINE MANAGER
// ============================================

class SpeechEngineManager {
    constructor() {
        this.engines = {
            googlecloud: new GoogleCloudSpeechEngine(),
            webspeech: new WebSpeechEngine()
        };
        this.currentEngine = null;
        this.currentEngineName = 'googlecloud';  // Default to Google Cloud STT
        this.onResult = null;
        this.onError = null;
    }
    
    setApiKey(apiKey) {
        if (this.engines.googlecloud) {
            this.engines.googlecloud.setApiKey(apiKey);
        }
    }
    
    async setEngine(engineName, onProgress) {
        // Stop current engine if running
        if (this.currentEngine) {
            this.currentEngine.stop();
        }
        
        const engine = this.engines[engineName];
        if (!engine) {
            throw new Error(`Unknown engine: ${engineName}`);
        }
        
        if (!engine.isAvailable()) {
            throw new Error(`Engine ${engineName} is not available`);
        }
        
        // Initialize the engine
        await engine.initialize(onProgress);
        
        this.currentEngine = engine;
        this.currentEngineName = engineName;
        
        // Wire up callbacks
        engine.onResult = (transcript, isFinal) => {
            if (this.onResult) this.onResult(transcript, isFinal);
        };
        
        engine.onError = (error) => {
            if (this.onError) this.onError(error);
        };
        
        console.log(`Switched to speech engine: ${engine.getName()}`);
        return engine;
    }
    
    start() {
        if (this.currentEngine) {
            this.currentEngine.start();
        }
    }
    
    stop() {
        if (this.currentEngine) {
            this.currentEngine.stop();
        }
    }
    
    isListening() {
        return this.currentEngine ? this.currentEngine.isListening : false;
    }
    
    isInitialized() {
        return this.currentEngine ? this.currentEngine.isInitialized : false;
    }
    
    getCurrentEngineName() {
        return this.currentEngineName;
    }
}

// Global speech engine manager
const speechEngine = new SpeechEngineManager();

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
        // Note: recognition is now handled by speechEngine manager
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
    
    // Loading overlay
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingStatus: document.getElementById('loading-status'),
    loadingProgressBar: document.getElementById('loading-progress-bar'),
    
    // Settings
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    saveSettings: document.getElementById('save-settings'),
    clearDataBtn: document.getElementById('clear-data-btn'),
    guessTimeInput: document.getElementById('guess-time'),
    voiceTimeInput: document.getElementById('voice-time'),
    speechEngineInput: document.getElementById('speech-engine'),
    engineStatus: document.getElementById('engine-status'),
    engineBtns: document.querySelectorAll('.engine-btn'),
    
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
            
            // Load speech engine setting (default to googlecloud)
            const engine = settings.speechEngine || 'googlecloud';
            elements.speechEngineInput.value = engine;
            updateEngineButtonsUI(engine);
            
            // Load API key if available
            if (settings.googleCloudApiKey) {
                const apiKeyInput = document.getElementById('google-cloud-api-key');
                if (apiKeyInput) {
                    apiKeyInput.value = settings.googleCloudApiKey;
                }
                // Set API key in engine
                speechEngine.setApiKey(settings.googleCloudApiKey);
            }
        }
    } catch (e) {
        console.log('Could not load settings:', e);
    }
}

function saveSettingsToStorage() {
    try {
        const apiKeyInput = document.getElementById('google-cloud-api-key');
        const settings = {
            guessTime: parseInt(elements.guessTimeInput.value) || 3,
            voiceTime: parseInt(elements.voiceTimeInput.value) || 10,
            speechEngine: elements.speechEngineInput.value || 'googlecloud',
            googleCloudApiKey: apiKeyInput ? apiKeyInput.value.trim() : ''
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        
        // Update API key in engine
        if (settings.googleCloudApiKey) {
            speechEngine.setApiKey(settings.googleCloudApiKey);
        }
    } catch (e) {
        console.log('Could not save settings:', e);
    }
}

// Update engine button UI state
function updateEngineButtonsUI(selectedEngine) {
    elements.engineBtns.forEach(btn => {
        const engine = btn.dataset.engine;
        if (engine === selectedEngine) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Update engine status display
function updateEngineStatus(status, message) {
    const statusEl = elements.engineStatus;
    statusEl.className = 'engine-status ' + status;
    
    let icon = '⏳';
    if (status === 'ready') icon = '✅';
    else if (status === 'loading') icon = '⏳';
    else if (status === 'error') icon = '❌';
    
    statusEl.innerHTML = `
        <span class="status-icon">${icon}</span>
        <span class="status-text">${message}</span>
    `;
}

// Show/hide loading overlay
function showLoadingOverlay(show, status = '', progress = 0) {
    if (show) {
        elements.loadingOverlay.classList.add('active');
        if (status) {
            elements.loadingStatus.textContent = status;
            // Also log to our logging system
            if (loadingLogger && loadingLogger.log) {
                loadingLogger.log('info', status);
            }
        }
        elements.loadingProgressBar.style.width = progress + '%';
    } else {
        elements.loadingOverlay.classList.remove('active');
        // Reset the logs panel state when overlay closes
        const logsPanel = document.getElementById('logs-panel');
        const showLogsBtn = document.getElementById('show-logs-btn');
        if (logsPanel) logsPanel.classList.remove('active');
        if (showLogsBtn) showLogsBtn.classList.remove('active');
    }
}

// Initialize the selected speech engine
async function initializeSelectedEngine() {
    const selectedEngine = elements.speechEngineInput.value || 'googlecloud';
    const browser = detectBrowserCapabilities();
    
    loadingLogger.log('info', '=== Initializing Speech Engine ===');
    loadingLogger.log('info', `Selected engine: ${selectedEngine}`);
    loadingLogger.log('info', `Android: ${browser.isAndroid}, Chrome: ${browser.isChrome}, Mobile: ${browser.isMobile}`);
    
    try {
        if (selectedEngine === 'googlecloud') {
            // Check if API key is configured
            loadingLogger.log('info', 'Checking Google Cloud STT configuration...');
            const apiKeyInput = document.getElementById('google-cloud-api-key');
            const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
            
            if (!apiKey) {
                loadingLogger.log('error', 'Google Cloud API key not configured');
                updateEngineStatus('error', 'API key required in settings');
                alert('Please configure your Google Cloud API key in settings before starting the game.');
                return false;
            }
            
            // Set API key in engine
            speechEngine.setApiKey(apiKey);
            
            if (!speechEngine.engines.googlecloud.isAvailable()) {
                loadingLogger.log('error', 'Google Cloud STT not available - API key missing');
                updateEngineStatus('error', 'API key required');
                return false;
            }
            
            // Show loading overlay
            loadingLogger.log('info', 'Starting Google Cloud STT initialization...');
            showLoadingOverlay(true, 'Initializing Google Cloud STT...', 5);
            updateEngineStatus('loading', 'Connecting to Google Cloud...');
            
            try {
                await speechEngine.setEngine('googlecloud', (status, progress) => {
                    showLoadingOverlay(true, status, progress);
                    loadingLogger.log('info', `Progress: ${progress}% - ${status}`);
                });
                
                showLoadingOverlay(false);
                updateEngineStatus('ready', 'Google Cloud STT ready');
                loadingLogger.log('success', 'Google Cloud STT engine ready');
                
            } catch (googleError) {
                throw googleError;
            }
            
        } else {
            // Web Speech API
            loadingLogger.log('info', 'Initializing Web Speech API...');
            if (!speechEngine.engines.webspeech.isAvailable()) {
                loadingLogger.log('error', 'Web Speech API not supported in this browser');
                updateEngineStatus('error', 'Web Speech not supported');
                showBrowserWarning();
                return false;
            }
            
            await speechEngine.setEngine('webspeech');
            updateEngineStatus('ready', 'Web Speech ready (online)');
            loadingLogger.log('success', 'Web Speech API ready');
        }
        
        // Set up callbacks
        speechEngine.onResult = handleSpeechResult;
        speechEngine.onError = handleSpeechError;
        loadingLogger.log('success', 'Speech engine callbacks configured');
        
        return true;
        
    } catch (error) {
        loadingLogger.log('error', `Engine initialization failed: ${error.message}`);
        showLoadingOverlay(false);
        updateEngineStatus('error', 'Failed to initialize: ' + error.message);
        
        // Try to fall back to Web Speech
        if (selectedEngine === 'googlecloud' && speechEngine.engines.webspeech.isAvailable()) {
            loadingLogger.log('info', 'Attempting fallback to Web Speech API...');
            elements.speechEngineInput.value = 'webspeech';
            updateEngineButtonsUI('webspeech');
            try {
                await speechEngine.setEngine('webspeech');
                speechEngine.onResult = handleSpeechResult;
                speechEngine.onError = handleSpeechError;
                updateEngineStatus('ready', 'Fell back to Web Speech (online)');
                loadingLogger.log('success', 'Fallback to Web Speech successful');
                return true;
            } catch (e) {
                loadingLogger.log('error', `Fallback also failed: ${e.message}`);
            }
        }
        
        return false;
    }
}

// Handle speech recognition results
function handleSpeechResult(transcript, isFinal) {
    gameState.lastSpeechTime = Date.now();
    gameState.isProcessingAudio = !isFinal;
    
    if (transcript) {
        gameState.recognizedText = transcript;
        elements.recognizedText.textContent = `"${gameState.recognizedText}"`;
    }
    
    console.log(`Speech result - Text: "${transcript}", Final: ${isFinal}`);
    
    // Check for correct answer
    if (transcript && gameState.voicePhaseStartTime && !gameState.correctAnswerDetected) {
        const question = MOVIE_QUESTIONS[gameState.currentQuestionIndex];
        if (checkAnswerMatch(transcript, question)) {
            gameState.answerTime = Date.now() - gameState.voicePhaseStartTime;
            gameState.correctAnswerDetected = true;
            console.log(`Correct answer detected at ${gameState.answerTime}ms`);
            gameState.hasReceivedFinalConfirmation = true;
        }
    }
}

// Handle speech recognition errors
function handleSpeechError(error) {
    console.error('Speech recognition error:', error);
    if (error.message === 'Microphone access denied') {
        alert('Microphone access denied. Please allow microphone access to play the game.');
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
        elements.speechEngineInput.value = 'googlecloud';
        updateEngineButtonsUI('googlecloud');
        const apiKeyInput = document.getElementById('google-cloud-api-key');
        if (apiKeyInput) {
            apiKeyInput.value = '';
        }
        alert('All scores and settings have been cleared!');
    } catch (e) {
        console.log('Could not clear data:', e);
    }
}

// ============================================
// SPEECH RECOGNITION (Legacy wrapper for compatibility)
// ============================================

// This function is kept for backward compatibility but now uses the engine manager
function initSpeechRecognition() {
    // Check if we have any speech engine available
    const hasWebSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const apiKeyInput = document.getElementById('google-cloud-api-key');
    const hasGoogleCloud = apiKeyInput && apiKeyInput.value.trim().length > 0;
    
    if (!hasGoogleCloud && !hasWebSpeech) {
        showBrowserWarning();
        return false;
    }
    
    // The actual initialization happens in initializeSelectedEngine()
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

async function startGame() {
    gameState.reset();
    gameState.guessTime = parseInt(elements.guessTimeInput.value) || 3;
    gameState.voiceTime = parseInt(elements.voiceTimeInput.value) || 10;
    
    elements.totalQuestions.textContent = MOVIE_QUESTIONS.length;
    elements.maxScore.textContent = MOVIE_QUESTIONS.length * 15;
    
    // Initialize the selected speech engine
    const engineReady = await initializeSelectedEngine();
    if (!engineReady) {
        alert('Failed to initialize speech recognition. Please check your settings.');
        return;
    }
    
    gameState.isGameActive = true;
    
    // Run countdown then start
    runCountdown(() => {
        showScreen(elements.gameScreen);
        showQuestion();
    });
}

// Pre-warm the speech recognition engine to reduce initial latency
function prewarmSpeechRecognition() {
    // With the new engine manager, pre-warming is handled during initialization
    // This function is kept for compatibility but does nothing now
    console.log('Speech engine pre-warming (handled by engine manager)');
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
            
            // Pre-start recognition 1 second before voice phase
            // This allows the audio pipeline to be ready immediately
            preStartRecognition();
        }
        
        if (timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            startVoicePhase();
        }
    }, 1000);
}

// Pre-start recognition before voice phase to eliminate startup latency
function preStartRecognition() {
    if (!speechEngine.isInitialized()) return;
    
    // Stop any existing session
    speechEngine.stop();
    
    // Small delay then start fresh
    setTimeout(() => {
        try {
            speechEngine.start();
            console.log('Recognition pre-started for immediate voice phase');
        } catch (e) {
            console.log('Could not pre-start recognition:', e.message);
        }
    }, 100);
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
    
    // Recognition may already be running from preStartRecognition()
    // Only start if not already active
    if (!speechEngine.isListening()) {
        speechEngine.start();
        console.log('Started recognition in voice phase');
    } else {
        console.log('Recognition already running (pre-started for lower latency)');
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
            
            // Reduced from 2000ms to 1000ms for faster finalization
            if (!gameState.isProcessingAudio && timeSinceSpeech >= 1000) {
                clearInterval(gameState.processingCheckInterval);
                gameState.processingCheckInterval = null;
                
                speechEngine.stop();
                
                // Reduced from 500ms to 200ms
                setTimeout(() => {
                    if (!gameState.isEvaluating) {
                        finalizeAndEvaluate();
                    }
                }, 200);
            }
        }, 200);
        
        // Reduced safety timeout from 10s to 3s for faster response
        setTimeout(() => {
            if (!gameState.isEvaluating && gameState.processingCheckInterval) {
                console.log('Safety timeout - forcing evaluation');
                clearInterval(gameState.processingCheckInterval);
                gameState.processingCheckInterval = null;
                speechEngine.stop();
                setTimeout(() => {
                    if (!gameState.isEvaluating) {
                        finalizeAndEvaluate();
                    }
                }, 300);
            }
        }, 3000);
    } else {
        console.log('No recent audio activity - stopping recognition');
        speechEngine.stop();
        
        // Reduced from 1500ms to 500ms for faster response
        setTimeout(() => {
            if (!gameState.isEvaluating) {
                finalizeAndEvaluate();
            }
        }, 500);
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
    
    speechEngine.stop();
    
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
elements.startBtn.addEventListener('click', async () => {
    // Check if speech recognition is available
    if (initSpeechRecognition()) {
        await startGame();
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

// Engine button clicks
elements.engineBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const engine = btn.dataset.engine;
        elements.speechEngineInput.value = engine;
        updateEngineButtonsUI(engine);
        
        // Update status to show engine needs to be initialized
        if (engine === 'googlecloud') {
            const apiKeyInput = document.getElementById('google-cloud-api-key');
            const hasApiKey = apiKeyInput && apiKeyInput.value.trim().length > 0;
            if (hasApiKey) {
                if (speechEngine.engines.googlecloud.isInitialized) {
                    updateEngineStatus('ready', 'Google Cloud STT ready');
                } else {
                    updateEngineStatus('', 'Google Cloud STT will initialize when you start');
                }
            } else {
                updateEngineStatus('error', 'API key required in settings');
            }
        } else {
            updateEngineStatus('ready', 'Web Speech ready (online)');
        }
    });
});

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

// Initialize the loading logger
loadingLogger.init();

// Check available engines and update status on page load
function checkEnginesOnLoad() {
    const hasWebSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const browser = detectBrowserCapabilities();
    const apiKeyInput = document.getElementById('google-cloud-api-key');
    const hasGoogleCloudApiKey = apiKeyInput && apiKeyInput.value.trim().length > 0;
    
    loadingLogger.log('info', '=== Checking Available Engines ===');
    loadingLogger.log('info', `Google Cloud API key configured: ${hasGoogleCloudApiKey}`);
    loadingLogger.log('info', `Web Speech API available: ${hasWebSpeech}`);
    
    const selectedEngine = elements.speechEngineInput.value || 'googlecloud';
    
    if (selectedEngine === 'googlecloud') {
        if (hasGoogleCloudApiKey) {
            updateEngineStatus('', 'Google Cloud STT will initialize when you start');
            loadingLogger.log('info', 'Google Cloud STT selected - will initialize on game start');
        } else {
            updateEngineStatus('error', 'API key required in settings');
            loadingLogger.log('warning', 'Google Cloud API key not configured');
        }
    } else {
        if (hasWebSpeech) {
            updateEngineStatus('ready', 'Web Speech ready (online)');
            loadingLogger.log('success', 'Web Speech API ready');
        } else {
            updateEngineStatus('error', 'Web Speech not supported');
            loadingLogger.log('error', 'Web Speech API not supported');
        }
    }
    
    loadingLogger.log('info', '=== Engine Check Complete ===');
}

// Run initial check after a short delay
setTimeout(checkEnginesOnLoad, 500);

console.log('🎬 Emoji Movie Guessing Game loaded!');
