# 🎬 Emoji Movie Guessing Game (Voice-Enabled)

A fast-paced, voice-enabled guessing game where users interpret emojis to guess movie titles and speak their answers aloud!

## 🎮 How to Play

1. **Start the Game**: Click "Start Game" on the home screen
2. **Think Phase**: Look at the emojis displayed and think of the movie they represent
3. **Speak Phase**: When prompted, speak the movie name aloud into your microphone
4. **Score Points**: Correct answers earn you 10 points!

## ✨ Features

- 🎤 **Voice Recognition**: Uses Web Speech API for real-time speech-to-text
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

### Running the Game

1. Open `index.html` in your web browser
2. Allow microphone access when prompted
3. Configure time settings if desired
4. Click "Start Game" and enjoy!

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

- **Think Time**: How long you have to study the emojis (3-15 seconds)
- **Voice Time**: How long you have to speak your answer (3-15 seconds)

## 🛠️ Technical Details

### Files

- `index.html` - Main HTML structure
- `styles.css` - Modern CSS styling with animations
- `game.js` - Game logic and speech recognition

### Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Flexbox, Grid, CSS Variables, Animations
- **JavaScript (ES6+)** - Classes, Arrow functions, Template literals
- **Web Speech API** - Speech recognition for voice input

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
