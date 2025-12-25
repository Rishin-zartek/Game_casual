# ElevenLabs Scribe v2 Realtime Implementation Guide

This guide explains how to implement microphone access, audio downsampling to 16kHz, and WebSocket streaming for ElevenLabs Scribe v2 Realtime Speech-to-Text API.

## Table of Contents

1. [Overview](#overview)
2. [Key Requirements](#key-requirements)
3. [Implementation Steps](#implementation-steps)
4. [Code Examples](#code-examples)
5. [Common Issues & Solutions](#common-issues--solutions)

## Overview

ElevenLabs Scribe v2 Realtime API requires:
- **Audio Format**: PCM 16-bit, 16kHz sample rate
- **Transport**: WebSocket connection
- **Authentication**: API key via query parameter (browser WebSockets don't support custom headers)
- **Message Format**: JSON with base64-encoded audio chunks

## Key Requirements

### 1. Audio Specifications
- **Sample Rate**: 16kHz (16000 Hz)
- **Bit Depth**: 16-bit PCM
- **Channels**: Mono (1 channel)
- **Encoding**: Base64-encoded in JSON payloads

### 2. WebSocket Endpoint
```
wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&audio_format=pcm_16000&xi_api_key=YOUR_API_KEY
```

### 3. Browser Limitations
- Browser WebSocket API **cannot set custom headers** (like `xi-api-key`)
- Authentication must be done via query parameter: `&xi_api_key=YOUR_KEY`
- AudioContext must be explicitly configured for 16kHz

## Implementation Steps

### Step 1: Request Microphone Access

```javascript
async function requestMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                channelCount: 1,        // Mono
                sampleRate: 16000       // Request 16kHz (may not be honored by browser)
            }
        });
        return stream;
    } catch (error) {
        console.error('Microphone access denied:', error);
        throw error;
    }
}
```

**Important Notes:**
- The browser may ignore the `sampleRate` constraint
- Always create AudioContext with explicit 16kHz sample rate
- Handle permission denial gracefully

### Step 2: Create AudioContext at 16kHz

```javascript
const SAMPLE_RATE = 16000;

// Create AudioContext with explicit 16kHz sample rate
const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: SAMPLE_RATE
});

// Verify the actual sample rate (may differ from requested)
console.log('Actual sample rate:', audioContext.sampleRate);
```

**Why This Matters:**
- Browsers typically record at 44.1kHz or 48kHz
- AudioContext must be configured for 16kHz to avoid resampling issues
- If browser doesn't support 16kHz, you'll need manual resampling

### Step 3: Set Up Audio Processing Pipeline

```javascript
// Create source from microphone stream
const source = audioContext.createMediaStreamSource(stream);

// Create ScriptProcessorNode for real-time audio capture
// Buffer size: 4096 samples (good balance between latency and performance)
const processor = audioContext.createScriptProcessor(4096, 1, 1);

// Connect the audio pipeline
source.connect(processor);
processor.connect(audioContext.destination); // Required to activate the processor

// Process audio chunks
processor.onaudioprocess = (event) => {
    if (!isRecording || socket.readyState !== WebSocket.OPEN) return;
    
    const inputData = event.inputBuffer.getChannelData(0);
    
    // Convert Float32 to Int16 PCM
    const pcmData = floatTo16BitPCM(inputData);
    
    // Send to WebSocket
    sendAudioChunk(pcmData);
};
```

### Step 4: Convert Float32 to Int16 PCM

Browsers provide audio as Float32Array (values between -1.0 and 1.0). ElevenLabs requires Int16 PCM.

```javascript
function floatTo16BitPCM(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
        // Clamp value between -1 and 1
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        
        // Convert to 16-bit integer
        // Negative values: multiply by 0x8000 (32768)
        // Positive values: multiply by 0x7FFF (32767)
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    return int16Array.buffer; // Return ArrayBuffer
}
```

**Conversion Formula:**
- **Negative values**: `value * 32768` (0x8000)
- **Positive values**: `value * 32767` (0x7FFF)
- **Clamping**: Ensure values stay within [-1, 1] range

### Step 5: Encode Audio to Base64

```javascript
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
}
```

### Step 6: Connect to WebSocket

```javascript
async function connectWebSocket(apiKey) {
    const wsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&audio_format=pcm_16000&xi_api_key=${encodeURIComponent(apiKey)}`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
        console.log('✅ Connected to Scribe v2');
        // Connection is ready, start sending audio
    };
    
    socket.onmessage = (event) => {
        const response = JSON.parse(event.data);
        handleTranscript(response);
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    socket.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
    };
    
    return socket;
}
```

**Authentication:**
- Browser WebSockets cannot set `xi-api-key` header
- Must append `&xi_api_key=YOUR_KEY` to the URL
- Always URL-encode the API key: `encodeURIComponent(apiKey)`

### Step 7: Send Audio Chunks

```javascript
function sendAudioChunk(pcmBuffer, socket) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
    }
    
    // Convert ArrayBuffer to base64
    const base64Audio = arrayBufferToBase64(pcmBuffer);
    
    // Scribe v2 expects JSON format
    const message = {
        message_type: "input_audio_chunk",
        audio_base_64: base64Audio,
        commit: false  // Set to true to force commit, usually false for streaming
    };
    
    socket.send(JSON.stringify(message));
}
```

**Message Format:**
```json
{
    "message_type": "input_audio_chunk",
    "audio_base_64": "base64-encoded-pcm-data",
    "commit": false
}
```

### Step 8: Handle Transcripts

```javascript
function handleTranscript(response) {
    // Handle partial transcripts
    if (response.type === "partial_transcript") {
        const partialText = response.text || "";
        updatePartialTranscript(partialText);
    }
    
    // Handle final/committed transcripts
    if (response.type === "word" || response.message_type === "committed_transcript_with_timestamps") {
        const finalText = response.text || "";
        if (finalText) {
            appendFinalTranscript(finalText);
        }
    }
    
    // Log all messages for debugging
    console.log("Received:", response);
}
```

## Complete Example

Here's a complete working example:

```javascript
class ElevenLabsScribeV2 {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.socket = null;
        this.audioContext = null;
        this.processor = null;
        this.source = null;
        this.isRecording = false;
        this.SAMPLE_RATE = 16000;
    }
    
    async start() {
        try {
            // 1. Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1,
                    sampleRate: this.SAMPLE_RATE
                }
            });
            
            // 2. Create AudioContext at 16kHz
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.SAMPLE_RATE
            });
            
            // 3. Set up audio processing
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            
            // 4. Connect WebSocket
            await this.connectWebSocket();
            
            // 5. Start processing audio
            this.processor.onaudioprocess = (event) => {
                if (!this.isRecording || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
                    return;
                }
                
                const inputData = event.inputBuffer.getChannelData(0);
                const pcmData = this.floatTo16BitPCM(inputData);
                this.sendAudioChunk(pcmData);
            };
            
            this.isRecording = true;
            console.log('✅ Recording started');
            
        } catch (error) {
            console.error('Failed to start:', error);
            throw error;
        }
    }
    
    async connectWebSocket() {
        const wsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&audio_format=pcm_16000&xi_api_key=${encodeURIComponent(this.apiKey)}`;
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, 10000);
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                clearTimeout(timeout);
                console.log('✅ WebSocket connected');
                resolve();
            };
            
            this.socket.onmessage = (event) => {
                const response = JSON.parse(event.data);
                this.handleTranscript(response);
            };
            
            this.socket.onerror = (error) => {
                clearTimeout(timeout);
                reject(error);
            };
            
            this.socket.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
            };
        });
    }
    
    floatTo16BitPCM(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array.buffer;
    }
    
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
    
    sendAudioChunk(pcmBuffer) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }
        
        const base64Audio = this.arrayBufferToBase64(pcmBuffer);
        const message = {
            message_type: "input_audio_chunk",
            audio_base_64: base64Audio,
            commit: false
        };
        
        this.socket.send(JSON.stringify(message));
    }
    
    handleTranscript(response) {
        if (response.type === "partial_transcript") {
            console.log("Partial:", response.text);
            // Update UI with partial transcript
        } else if (response.type === "word" || response.message_type === "committed_transcript_with_timestamps") {
            console.log("Final:", response.text);
            // Update UI with final transcript
        }
    }
    
    stop() {
        this.isRecording = false;
        
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

// Usage
const scribe = new ElevenLabsScribeV2('YOUR_API_KEY');
scribe.start();
```

## Common Issues & Solutions

### Issue 1: AudioContext sample rate mismatch

**Problem:** Browser creates AudioContext at 44.1kHz or 48kHz instead of 16kHz.

**Solution:**
```javascript
// Always check actual sample rate
console.log('Actual sample rate:', audioContext.sampleRate);

// If not 16kHz, you need to resample manually
// Use OfflineAudioContext or implement resampling algorithm
```

### Issue 2: WebSocket authentication fails

**Problem:** `xi-api-key` header not working in browser.

**Solution:**
- Use query parameter: `&xi_api_key=YOUR_KEY`
- Always URL-encode: `encodeURIComponent(apiKey)`
- Never expose API key in client-side code for production (use backend proxy)

### Issue 3: Audio format errors

**Problem:** API rejects audio chunks.

**Solution:**
- Verify sample rate is exactly 16kHz
- Ensure PCM is 16-bit signed integers
- Check base64 encoding is correct
- Verify JSON message format matches API spec

### Issue 4: High latency

**Problem:** Audio processing causes delays.

**Solution:**
- Reduce buffer size (e.g., 2048 instead of 4096)
- Send audio chunks more frequently
- Use Web Audio API's `AudioWorklet` instead of deprecated `ScriptProcessorNode`

### Issue 5: Browser compatibility

**Problem:** Some browsers don't support required features.

**Solution:**
- Check `navigator.mediaDevices.getUserMedia` support
- Check `WebSocket` support
- Check `AudioContext` support
- Provide fallback or error messages

## Best Practices

1. **Error Handling**: Always handle microphone permission denial
2. **Resource Cleanup**: Properly disconnect audio nodes and close WebSocket
3. **Security**: Never expose API keys in client-side code (use backend proxy)
4. **Performance**: Use appropriate buffer sizes for your use case
5. **User Feedback**: Show connection status and transcript updates in real-time

## References

- [ElevenLabs Scribe v2 Documentation](https://elevenlabs.io/docs/api-reference/speech-to-text)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
