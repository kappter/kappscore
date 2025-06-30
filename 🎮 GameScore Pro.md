# 🎮 GameScore Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange.svg)](https://firebase.google.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**Universal score tracking for any game** - A professional, real-time multiplayer scoring application perfect for card games, board games, golf, tournaments, and any competitive activity.

## ✨ Features

### 🎯 Core Functionality
- **Real-time Score Tracking** - Instant updates across all devices
- **Session-based Gaming** - Create and join sessions with 6-character codes
- **Multi-device Support** - Works seamlessly on phones, tablets, and computers
- **Offline Capability** - Continue playing even without internet connection
- **Host-controlled Sessions** - Scorekeeper has full control over the game

### 👥 Player Management
- **1-12 Player Support** - Perfect for small groups or large tournaments
- **Custom Player Names** - Personalize your gaming experience
- **Player Color Customization** - Choose your own tile colors for easy identification
- **Smart Player Assignment** - Automatic slot assignment for joiners

### 🏆 Team Features
- **Flexible Team Creation** - Any configuration (2v2, 3v1, 4v2v2, etc.)
- **Custom Team Names & Colors** - Visual distinction with team badges
- **Automatic Team Scoring** - Individual scores + team totals
- **Dual Leaderboards** - Individual AND team rankings
- **Mixed Competition** - Individuals can compete against teams

### 👁️ Spectator Mode
- **Remote Viewing** - Watch games without participating
- **Real-time Updates** - See all score changes as they happen
- **Ranking Display** - Players sorted by current score
- **Spectator Count** - Track who's watching the game

### 📊 Advanced Features
- **Target Score Detection** - Automatic winner announcements
- **Score History Tracking** - Complete timeline of all changes
- **Decimal Score Support** - Perfect for precise scoring systems
- **Custom Score Increments** - Preset buttons plus custom amounts
- **Game Reports** - Detailed statistics and export options

### 📱 User Experience
- **Beautiful Interface** - Professional design with smooth animations
- **Responsive Design** - Optimized for all screen sizes
- **Touch-friendly Controls** - Perfect for mobile devices
- **Dark/Light Themes** - Comfortable viewing in any environment
- **Accessibility Features** - High contrast options and clear typography

## 🚀 Perfect For

### 🃏 Card Games
- **Bridge, Spades, Hearts** - Team-based card games
- **Poker Tournaments** - Track chips and eliminations
- **Rummy, Gin** - Running score games
- **Any card game** - Flexible scoring system

### 🎲 Board Games
- **Monopoly, Scrabble** - Classic board games
- **Settlers of Catan** - Resource management games
- **Risk, Axis & Allies** - Strategy games
- **Custom games** - Any scoring system

### ⛳ Sports & Activities
- **Golf Scrambles** - Team competitions and individual play
- **Bowling Leagues** - Track scores across multiple games
- **Darts Tournaments** - Professional scoring
- **Trivia Nights** - Team-based competitions

### 🏢 Corporate Events
- **Team Building** - Department vs department competitions
- **Training Games** - Educational scoring systems
- **Company Tournaments** - Multi-round competitions
- **Sales Contests** - Performance tracking

## 🛠️ Quick Setup

### 1. Firebase Configuration
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Realtime Database
3. Copy your configuration values
4. Update `firebase-config.js` with your project details:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### 2. Database Rules
Set your Firebase Realtime Database rules for public access:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### 3. Deployment Options

#### GitHub Pages (Recommended)
1. Fork or upload files to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Your app will be live at `https://username.github.io/repository-name`

#### Local Development
1. Clone or download the project files
2. Open `index.html` in a web browser
3. Or use a local server: `python -m http.server 8000`

#### Web Hosting
Upload all files to any web hosting service that supports static websites.

## 📖 How to Use

### Creating a Session
1. Click **"Create New Session"**
2. Enter session name and configure settings:
   - Number of players (1-12)
   - Starting score
   - Target score (optional)
   - Allow decimal scores
   - Continue after target reached
3. Click **"Create Session"**
4. Share the 6-character code with other players

### Joining a Session
1. Click **"Join Session"**
2. Enter the session code and your name
3. Choose **"Join as Player"** or **"Join as Spectator"**
4. Start playing!

### Team Setup (Optional)
1. After creating a session, click **"Setup Teams"**
2. Drag players into teams
3. Customize team names and colors
4. Save configuration

### Scoring
- **Scorekeeper**: Full control with +/- buttons and custom amounts
- **Players**: View all scores in real-time with "You" identification
- **Spectators**: Watch the game with ranking display

### Reports & Export
- Click **"Show Report"** for detailed game statistics
- Export as JSON for data analysis
- Export as HTML for sharing or printing
- View score progression charts and timelines

## 🎨 Customization

### Player Colors
- Each player can choose their own tile color
- Host can modify any player's color
- Color picker with preset palette
- Real-time color updates across all devices

### Team Configuration
- Create unlimited teams with custom names
- Assign team colors for visual distinction
- Drag-and-drop player assignment
- Automatic team score calculation

### Scoring Options
- Preset increment buttons (-10, -5, -1, +1, +5, +10)
- Custom amount input with +/- controls
- Decimal score support (optional)
- Individual score reset functionality
- Bulk score reset for new rounds

## 🔧 Technical Details

### Built With
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Charts**: Chart.js for score progression graphs
- **Responsive**: CSS Grid and Flexbox
- **Icons**: Unicode emojis for universal compatibility

### Browser Support
- **Chrome** 60+ ✅
- **Firefox** 55+ ✅
- **Safari** 12+ ✅
- **Edge** 79+ ✅
- **Mobile browsers** ✅

### Performance
- **Lightweight**: ~50KB total size
- **Fast loading**: CDN-hosted dependencies
- **Real-time**: Sub-second update propagation
- **Offline capable**: Local storage fallback

## 📱 Mobile Experience

### Touch Optimized
- Large, finger-friendly buttons
- Swipe gestures for navigation
- Responsive grid layouts
- Portrait and landscape support

### PWA Features
- Add to home screen capability
- Offline functionality
- Fast loading with caching
- Native app-like experience

## 🔒 Privacy & Security

### Data Handling
- **No personal data collection** - Only game scores and chosen names
- **Temporary storage** - Sessions auto-expire after inactivity
- **No tracking** - No analytics or user monitoring
- **Local first** - Works offline with local storage

### Firebase Security
- Public read/write for game sessions only
- No authentication required for ease of use
- Data automatically cleaned up
- No sensitive information stored

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Bug Reports
- Use GitHub Issues to report bugs
- Include browser version and steps to reproduce
- Screenshots are helpful for UI issues

### Feature Requests
- Suggest new features via GitHub Issues
- Explain the use case and expected behavior
- Consider backward compatibility

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase** for real-time database infrastructure
- **Chart.js** for beautiful score progression charts
- **The gaming community** for inspiration and feedback
- **Open source contributors** who make projects like this possible

## 📞 Support

### Getting Help
- **Documentation**: Check this README first
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: Contact the maintainer for urgent issues

### Common Issues
- **Firebase not connecting**: Check your configuration in `firebase-config.js`
- **Scores not syncing**: Verify internet connection and Firebase rules
- **Mobile display issues**: Ensure viewport meta tag is present
- **Session not found**: Double-check the 6-character code

---

**Made with ❤️ for the gaming community**

*GameScore Pro - Because every game deserves professional scoring*

