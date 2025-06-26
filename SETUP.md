# 🚀 GameScore Pro - Setup Guide

This guide will help you get GameScore Pro up and running in just a few minutes!

## 📋 Prerequisites

- A Firebase account (free)
- A web hosting solution (GitHub Pages recommended - also free)
- Basic text editing capability

## 🔥 Firebase Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `gamescore-pro` (or your preferred name)
4. Disable Google Analytics (not needed)
5. Click **"Create project"**

### Step 2: Enable Realtime Database
1. In your Firebase project, click **"Realtime Database"** in the left sidebar
2. Click **"Create Database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select your preferred location
5. Click **"Done"**

### Step 3: Get Configuration
1. Click the gear icon ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **"Web"** icon `</>`
5. Enter app nickname: `GameScore Pro`
6. Click **"Register app"**
7. **Copy the configuration object** - you'll need this!

### Step 4: Set Database Rules
1. Go back to **"Realtime Database"**
2. Click the **"Rules"** tab
3. Replace the rules with:
```json
{
  "rules": {
    "sessions": {
      ".read": true,
      ".write": true,
      "$sessionId": {
        ".validate": "newData.hasChildren(['code', 'name', 'players'])"
      }
    }
  }
}
```
4. Click **"Publish"**

## 📝 Configure Your App

### Update Firebase Configuration
1. Open `firebase-config.js` in a text editor
2. Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

**Important**: Replace ALL the placeholder values with your actual Firebase configuration!

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended - Free)

1. **Create GitHub Repository**
   - Go to [GitHub.com](https://github.com)
   - Click **"New repository"**
   - Name it `gamescore-pro`
   - Make it **Public**
   - Click **"Create repository"**

2. **Upload Files**
   - Click **"uploading an existing file"**
   - Drag and drop all project files:
     - `index.html`
     - `style.css`
     - `script.js`
     - `firebase-config.js`
     - `README.md`
     - `LICENSE`
   - Commit the files

3. **Enable GitHub Pages**
   - Go to repository **Settings**
   - Scroll to **"Pages"** section
   - Source: **"Deploy from a branch"**
   - Branch: **"main"**
   - Folder: **"/ (root)"**
   - Click **"Save"**

4. **Access Your App**
   - Your app will be live at: `https://yourusername.github.io/gamescore-pro`
   - It may take a few minutes to deploy

### Option 2: Local Testing

1. **Simple Method**
   - Open `index.html` directly in your web browser
   - Note: Some features may be limited due to CORS restrictions

2. **Local Server Method**
   ```bash
   # Using Python (if installed)
   python -m http.server 8000
   
   # Using Node.js (if installed)
   npx http-server
   
   # Using PHP (if installed)
   php -S localhost:8000
   ```
   - Open `http://localhost:8000` in your browser

### Option 3: Other Hosting Services

Upload all files to any of these services:
- **Netlify** (drag & drop deployment)
- **Vercel** (GitHub integration)
- **Firebase Hosting** (same project)
- **Any web hosting provider**

## ✅ Testing Your Setup

### 1. Basic Functionality Test
1. Open your deployed app
2. Check that you see "Online" status in the top-right
3. Click **"Create New Session"**
4. Fill in the form and create a session
5. You should see a 6-character session code

### 2. Multi-Device Test
1. Open the app on a second device/browser
2. Click **"Join Session"**
3. Enter the session code from step 1
4. Enter a player name and join
5. Both devices should show the same session

### 3. Real-time Updates Test
1. On the host device, start scoring
2. Change a player's score
3. The score should update immediately on the second device

## 🔧 Troubleshooting

### "Offline" Status
- **Check Firebase configuration** in `firebase-config.js`
- **Verify database rules** allow read/write access
- **Check browser console** for error messages

### Session Not Found
- **Verify the 6-character code** is entered correctly
- **Check that Firebase is connected** (Online status)
- **Try creating a new session** to test

### Scores Not Syncing
- **Check internet connection** on all devices
- **Verify Firebase database rules** allow writing
- **Look for error messages** in browser console

### Mobile Display Issues
- **Clear browser cache** and reload
- **Try different browsers** (Chrome, Safari, Firefox)
- **Check responsive design** by resizing browser window

## 🎯 Quick Start Checklist

- [ ] Firebase project created
- [ ] Realtime Database enabled
- [ ] Database rules configured
- [ ] Firebase configuration copied to `firebase-config.js`
- [ ] Files uploaded to hosting service
- [ ] App accessible via URL
- [ ] "Online" status showing
- [ ] Can create and join sessions
- [ ] Real-time updates working

## 🆘 Getting Help

If you encounter issues:

1. **Check the browser console** (F12 → Console tab) for error messages
2. **Verify your Firebase configuration** matches exactly
3. **Test with a simple session** creation first
4. **Try different browsers/devices** to isolate the issue

## 🎉 You're Ready!

Once you see the "Online" status and can create/join sessions, your GameScore Pro is ready for action!

**Share your app URL with friends and start tracking scores like a pro!**

---

*Need more help? Check the main README.md for detailed documentation.*

