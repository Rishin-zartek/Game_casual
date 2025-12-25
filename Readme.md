# 🎬 Emoji Movie Guessing Game (Voice-Enabled)

A fast-paced, voice-enabled guessing game where users interpret emojis to guess movie titles and speak their answers aloud!

## 🎮 How to Play

1. **Start the Game**: Click "Start Game" on the home screen
2. **Think Phase**: Look at the emojis displayed and think of the movie they represent
3. **Speak Phase**: When prompted, speak the movie name aloud into your microphone
4. **Score Points**: Correct answers earn you 10 points!

## ✨ Features

- 🎤 **Voice Recognition**: Uses Google Cloud Speech-to-Text RPC (Streaming) for real-time speech-to-text, with Web Speech API as fallback
- ⏱️ **Timed Gameplay**: Configurable time limits for thinking and speaking phases
- 🎯 **Fuzzy Matching**: Intelligent answer matching with Levenshtein distance
- 📊 **Detailed Results**: Review your performance after each game
- 🌟 **Modern UI**: Beautiful, responsive design with smooth animations

## 🎬 Movie Questions

The game includes 10 movie questions:

| Emojis | Movie |
|--------|-------|
| 🦁👑🌍 | The Lion King |
| 🚢❄️💑💔 | Titanic |
| 🕷️🦸‍♂️🏙️ | Spider-Man |
| 🧙‍♂️💍🌋🗡️ | The Lord of the Rings |
| 👻🔫👨‍🔬🏠 | Ghostbusters |
| 🦈🏊‍♂️🩸🏖️ | Jaws |
| 🧊👸❄️⛄ | Frozen |
| 🏴‍☠️💀⚓🗺️ | Pirates of the Caribbean |
| 🤖❤️🌱🚀 | WALL-E |
| 🦇🃏🌃🦸 | The Dark Knight |

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Edge, or Safari recommended)
- Microphone access for voice input
- Google Cloud Speech-to-Text API key (get one from [Google Cloud Console](https://console.cloud.google.com/apis/credentials))

### Running the Game

1. Open `index.html` in your web browser
2. Click the settings icon (⚙️) and paste your Google Cloud API key
3. Save settings and allow microphone access when prompted
4. Configure time settings if desired
5. Click "Start Game" and enjoy!

**Quick Start with Local Server:**

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with npx)
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## ⚙️ Configuration

- **Google Cloud API Key**: Required for Google Cloud Speech-to-Text RPC (paste in settings)
- **Think Time**: How long you have to study the emojis (3-15 seconds)
- **Voice Time**: How long you have to speak your answer (3-15 seconds)
- **Speech Engine**: Choose between Google Cloud STT (RPC) or Web Speech API

## 🛠️ Technical Details

### Files

- `index.html` - Main HTML structure
- `styles.css` - Modern CSS styling with animations
- `game.js` - Game logic and speech recognition
- `ELEVENLABS_IMPLEMENTATION_GUIDE.md` - Comprehensive guide for implementing ElevenLabs Scribe v2 Realtime API
- `elevenlabs-scribe-v2-example.html` - Standalone example demonstrating microphone access, 16kHz downsampling, and WebSocket streaming

### Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Flexbox, Grid, CSS Variables, Animations
- **JavaScript (ES6+)** - Classes, Arrow functions, Template literals
- **Google Cloud Speech-to-Text RPC** - Streaming RPC API for high-quality speech recognition
- **Web Speech API** - Browser-based speech recognition (fallback option)
- **ElevenLabs Scribe v2** - Realtime streaming speech-to-text via WebSocket

## 📚 Implementation Guides

### ElevenLabs Scribe v2 Realtime API

For developers looking to implement microphone access, audio downsampling to 16kHz, and WebSocket streaming:

- **[ELEVENLABS_IMPLEMENTATION_GUIDE.md](./ELEVENLABS_IMPLEMENTATION_GUIDE.md)** - Complete implementation guide covering:
  - Microphone access and permissions
  - AudioContext configuration for 16kHz
  - Float32 to Int16 PCM conversion
  - Base64 encoding
  - WebSocket connection and authentication
  - Audio chunk streaming
  - Transcript handling
  - Common issues and solutions

- **[elevenlabs-scribe-v2-example.html](./elevenlabs-scribe-v2-example.html)** - Standalone working example demonstrating all concepts

**Key Implementation Points:**
- Browser WebSockets cannot set custom headers - use query parameter: `&xi_api_key=YOUR_KEY`
- AudioContext must be explicitly configured for 16kHz sample rate
- Convert Float32Array to Int16 PCM format
- Encode audio chunks as base64 in JSON messages

### Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full Support |
| Edge | ✅ Full Support |
| Safari | ✅ Full Support |
| Firefox | ⚠️ Limited (no speech recognition) |

## 📱 Responsive Design

The game is fully responsive and works on:
- 💻 Desktop computers
- 📱 Tablets
- 📱 Mobile phones (with microphone support)

## 🎯 Scoring

- **Correct Answer**: +10 points
- **Incorrect Answer**: 0 points
- **Timeout**: 0 points

## 🏆 Performance Ratings

| Score | Rating |
|-------|--------|
| 100% | 🎉 Movie Genius |
| 80%+ | 🌟 Excellent |
| 60%+ | 👍 Good Job |
| 40%+ | 🎬 Not Bad |
| <40% | 📺 Keep Practicing |

## 📄 License

This project is open source and available for personal and educational use.

---

Made with ❤️ and 🎬
