# 🎮 GameScore Pro

**Universal score tracking for any game - Real-time, multiplayer, beautiful.**

![GamePlay](https://github.com/kappter/portfolio/blob/main/images/kapscore.png?raw=true)

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-kappter.github.io/kappscore-blue?style=for-the-badge)](https://kappter.github.io/kappscore/)
[![GitHub Pages](https://img.shields.io/badge/Deployed_on-GitHub_Pages-green?style=for-the-badge&logo=github)](https://pages.github.com/)
[![Firebase](https://img.shields.io/badge/Powered_by-Firebase-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

---

## ✨ Features

### 🎯 **Core Functionality**
- **Real-time Score Tracking** - Scores update instantly across all devices
- **Session-based Multiplayer** - Create sessions with shareable codes
- **1-12 Player Support** - Perfect for any group size
- **Mobile-First Design** - Optimized for phones and tablets
- **Offline Capable** - Works without internet, syncs when reconnected

### 🎮 **Game Management**
- **Host Controls** - Scorekeeper has full session management
- **Player Assignment** - Automatic slot assignment for joiners
- **Name Management** - Host can edit all names, players edit their own
- **Target Score Detection** - Automatic win detection and announcements
- **Score History** - Complete timeline of all game events

### 📊 **Advanced Reports**
- **Interactive Line Charts** - Multi-colored score progression graphs
- **Game Statistics** - Duration, moves, rankings, and more
- **Print-Friendly Reports** - Professional layouts for sharing
- **Real-time Timeline** - Live feed of all score changes
- **Export Functionality** - Save and share game results

### 🎨 **User Experience**
- **Beautiful Interface** - Modern, responsive design
- **Intuitive Controls** - Easy-to-use score buttons and inputs
- **Visual Feedback** - Clear indicators for winners and targets
- **Accessibility** - Works great on all devices and screen sizes

---

## 🚀 Quick Start

### For Players

1. **Visit**: [kappter.github.io/kappscore](https://kappter.github.io/kappscore/)
2. **Choose your role**:
   - **Create Session** → Be the scorekeeper
   - **Join Session** → Enter a session code

### For Scorekeepers

1. **Create Session**
   - Enter game name and settings
   - Choose number of players (1-12)
   - Set starting score and target
   - Get your unique session code

2. **Share Code**
   - Give the 6-character code to other players
   - They join by entering the code and their name

3. **Manage Game**
   - Edit player names
   - Track scores with +/- buttons
   - View real-time reports
   - Announce winners automatically

---

## 🎲 Perfect For

| Game Type | Use Case |
|-----------|----------|
| **🃏 Card Games** | Rummy, Hearts, Spades, Poker tournaments |
| **🎯 Board Games** | Monopoly, Scrabble, custom scoring games |
| **⛳ Golf** | Stroke play, match play, tournament scoring |
| **🎳 Sports** | Bowling, darts, cornhole, any point-based game |
| **🏆 Tournaments** | Multi-round competitions with leaderboards |
| **🎪 Party Games** | Trivia nights, game show formats |

---

## 📱 How It Works

### Session Creation Flow
```
Host Creates Session → Gets Session Code → Shares Code → Players Join → Real-time Scoring
```

### Player Experience
```
Enter Code + Name → Auto-assigned to Slot → See Live Scores → Get Winner Alerts
```

### Scoring Interface
```
Scorekeeper: Full Controls (Edit names, change scores, manage game)
Players: View-only with "You" identification and live updates
```

---

## 🛠️ Technical Features

### **Frontend**
- **Pure HTML/CSS/JavaScript** - No frameworks, fast loading
- **Responsive Design** - Works on phones, tablets, desktops
- **Progressive Web App** - Can be installed on devices
- **Offline Support** - Local storage with cloud sync

### **Backend**
- **Firebase Realtime Database** - Instant synchronization
- **Session Management** - Automatic cleanup and persistence
- **Real-time Listeners** - Live updates without refreshing

### **Charts & Reports**
- **Chart.js Integration** - Beautiful, interactive graphs
- **Print Optimization** - Professional report layouts
- **Data Export** - JSON and visual report formats

---

## 🎯 Use Cases & Examples

### **Golf Tournament**
- Create session for your foursome
- Track strokes per hole in real-time
- Players see live leaderboard on their phones
- Generate final scorecard with progression chart

### **Card Game Night**
- Host creates "Rummy Night" session
- 6 players join with their names
- Scores update after each hand
- Automatic winner detection at target score

### **Board Game Marathon**
- Track multiple games in one session
- Reset scores between games
- Maintain running tournament totals
- Export final results for bragging rights

---

## 🔧 Setup & Deployment

### **For Personal Use**
1. Fork this repository
2. Enable GitHub Pages in settings
3. Configure Firebase (optional for offline use)
4. Share your custom URL

### **Firebase Configuration**
```javascript
// Add your Firebase config to firebase-config.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "your-database-url",
  projectId: "your-project-id"
};
```

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/kappter/kappscore.git

# Open in browser
open index.html

# Or serve with Python
python -m http.server 8000
```

---

## 📊 Screenshots

### Landing Page
Beautiful, intuitive interface with clear options to create or join sessions.

### Scorekeeper Interface
Full control panel with player management, score tracking, and game controls.

### Player View
Clean, read-only interface showing all scores with clear "You" identification.

### Reports & Charts
Professional reports with interactive line charts showing score progression.

---

## 🎮 Game Settings

| Setting | Description | Options |
|---------|-------------|---------|
| **Players** | Number of participants | 1-12 players |
| **Starting Score** | Initial score for all players | Any number (supports decimals) |
| **Target Score** | Winning score threshold | Any number |
| **Allow Decimals** | Enable fractional scoring | Yes/No |
| **Play After Target** | Continue after someone reaches target | Yes/No |

---

## 🏆 Advanced Features

### **Host Privileges**
- ✅ Edit all player names
- ✅ Manage all scores
- ✅ Reset game state
- ✅ Generate reports
- ✅ Control game settings

### **Player Features**
- ✅ Edit own name only
- ✅ View all scores in real-time
- ✅ See game progress and winners
- ✅ Access reports and statistics
- ✅ Clear "You" identification

### **Real-time Sync**
- ✅ Instant score updates
- ✅ Live player name changes
- ✅ Automatic winner detection
- ✅ Session persistence
- ✅ Offline/online synchronization

---

## 📈 Reports & Analytics

### **Score Progression Chart**
- Multi-colored line graph for each player
- Interactive hover tooltips
- Clear visualization of game flow
- Print-friendly formatting

### **Game Statistics**
- Total game duration
- Number of score changes
- Player rankings
- Target achievement tracking

### **Timeline View**
- Chronological list of all events
- Score changes with timestamps
- Player joins and name changes
- Game milestones and winner announcements

---

## 🌟 Why GameScore Pro?

### **For Casual Gaming**
- **Simple Setup** - Create and join in seconds
- **No Apps Required** - Works in any web browser
- **Always Available** - No downloads or installations
- **Cross-Platform** - iOS, Android, desktop compatible

### **For Serious Competition**
- **Professional Reports** - Detailed analytics and charts
- **Tournament Ready** - Handles complex scoring scenarios
- **Audit Trail** - Complete history of all game events
- **Export Capabilities** - Share results and statistics

### **For Group Activities**
- **Real-time Engagement** - Everyone stays connected
- **Fair Play** - Transparent scoring for all participants
- **Easy Sharing** - Simple codes for quick joining
- **Inclusive Design** - Works for all skill levels

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues** - Found a bug? Let us know!
2. **Suggest Features** - Have ideas for improvements?
3. **Submit Pull Requests** - Code contributions welcome
4. **Share Feedback** - Tell us about your experience

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🎉 Get Started Today!

Ready to revolutionize your game scoring? 

**👉 [Try GameScore Pro Now](https://kappter.github.io/kappscore/) 👈**

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/kappter/kappscore/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kappter/kappscore/discussions)
- **Email**: [Contact the developer](mailto:your-email@example.com)

---

*Made with ❤️ for gamers, by gamers. Happy scoring! 🎮*

