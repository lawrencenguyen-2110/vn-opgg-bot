# 📁 VN OP.GG Discord Bot - Complete File Structure

## 🎯 Essential Files Created

| File | Purpose | Priority |
|------|---------|----------|
| `.env` | Environment variables and configuration | 🔴 Critical |
| `.env.example` | Template for environment setup | 🟡 Important |
| `package.json` | Dependencies and scripts | 🔴 Critical |
| `README.md` | Complete setup and usage guide | 🟡 Important |
| `ecosystem.config.js` | PM2 process manager configuration | 🟠 Production |
| `manual-test.js` | Manual testing script | 🟢 Development |
| `setup.sh` | Quick setup script | 🟢 Convenience |

## 🚀 Quick Start (3 Minutes)

### 1. Copy Files to Your Project

```bash
mkdir vn-opgg-bot
cd vn-opgg-bot

# Copy all the provided files into this directory
# - .env.example → copy and rename to .env
# - package.json
# - README.md
# - ecosystem.config.js
# - manual-test.js
# - setup.sh
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your Discord credentials
nano .env  # or use your preferred editor
```

**Required values in .env:**

```bash
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_id_here
```

### 3. Install and Test

```bash
# Install dependencies
npm install

# Test the setup
npm test

# Test with real VN player
node manual-test.js "Richard Mille" "666"
```

---

## 🔧 Development Workflow

### Daily Development

```bash
# Start development mode (auto-restart)
npm run dev

# Run tests
npm test

# Test specific player
node manual-test.js "Player Name" "TAG" --debug --visible
```

### Testing Commands

```bash
# Test bot logic only
npm run test:bot

# Test real OP.GG data extraction
npm run test:real

# Test Puppeteer functionality  
npm run test:puppeteer

# Manual testing with browser visible
node manual-test.js "Richard Mille" "666" --visible --screenshots
```

### Production Deployment

```bash
# Register Discord commands
npm run deploy:register

# Start with PM2
npm run pm2:start

# Monitor logs
npm run pm2:logs

# Restart if needed
npm run pm2:restart
```

---

## 📁 Complete Project Structure

``` plaintext
vn-opgg-bot/
├── 📄 .env                    # Your environment variables
├── 📄 .env.example           # Environment template
├── 📄 package.json           # Dependencies and scripts
├── 📄 README.md              # Complete documentation
├── 📄 ecosystem.config.js    # PM2 configuration
├── 📄 manual-test.js         # Manual testing script
├── 📄 setup.sh              # Quick setup script
├── 📁 src/                   # Your bot source code
│   ├── 📄 bot.js            # Main bot file (you create this)
│   ├── 📁 commands/         # Slash command handlers
│   ├── 📁 utils/            # Utility functions
│   └── 📁 scrapers/         # OP.GG data extraction
├── 📁 test/                  # Test files
│   ├── 📄 test-runner.js    # Test suite runner
│   ├── 📄 test-real-data.js # Real data testing
│   └── 📄 test-bot-logic.js # Logic validation
├── 📁 logs/                  # Application logs
└── 📁 screenshots/          # Debug screenshots
```

---

## 🎯 File Explanations

### `.env` - Environment Configuration

- **Discord credentials** (bot token, client ID)
- **Bot settings** (region, cache timeout, rate limits)
- **Debug options** (logging, screenshots, browser mode)
- **Performance tuning** (memory limits, timeouts)

### `package.json` - Project Management

- **Dependencies**: discord.js, puppeteer, dotenv, etc.
- **Scripts**: dev, test, deploy, monitoring commands
- **Configuration**: ESLint, nodemon, Jest settings
- **Metadata**: project info, repository, license

### `README.md` - Complete Documentation

- **Setup instructions** with Discord bot creation
- **Command examples** for all bot features
- **Deployment guides** for multiple platforms
- **Troubleshooting** for common issues
- **Configuration options** and customization

### `ecosystem.config.js` - Production Manager

- **PM2 configuration** for process management
- **Auto-restart** settings and memory limits
- **Logging** configuration and file paths
- **Environment** variables for production

### `manual-test.js` - Testing Tool

- **Real data extraction** testing
- **Browser automation** validation
- **Discord command simulation**
- **Debug and screenshot** capabilities

---

## 🚨 Important Setup Notes

### 1. Discord Bot Setup (Required)

```bash
# Go to: https://discord.com/developers/applications
# 1. Create application → "VN OP.GG Bot"
# 2. Bot section → Add Bot → Copy token
# 3. General Information → Copy Application ID
# 4. OAuth2 → URL Generator → Bot + Applications.commands
# 5. Bot Permissions: Send Messages, Use Slash Commands, Embed Links
```

### 2. Environment Variables (Critical)

```bash
# Minimum required in .env:
DISCORD_TOKEN=your_actual_bot_token
CLIENT_ID=your_actual_application_id

# Optional but recommended:
NODE_ENV=development
DEBUG_MODE=true
BROWSER_HEADLESS=false  # See browser during development
```

### 3. Chrome Dependencies (Linux)

```bash
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

---

## ✅ Validation Checklist

- [ ] **Files copied** to project directory
- [ ] **Environment configured** (.env with Discord credentials)
- [ ] **Dependencies installed** (`npm install`)
- [ ] **Chrome working** (Puppeteer test passes)
- [ ] **Discord bot created** and invited to server
- [ ] **Basic test passes** (`npm test`)
- [ ] **Real data test works** (`node manual-test.js "Richard Mille" "666"`)
- [ ] **Bot responds** to commands in Discord

---

## 🎉 You're Ready

Once all files are set up and configured:

1. **Development**: `npm run dev`
2. **Testing**: `node manual-test.js "Player Name" "TAG"`
3. **Production**: `npm run pm2:start`

Your VN OP.GG Discord Bot is ready to track Vietnam region League of Legends players! 🇻🇳✨

**Need help?** Check README.md for detailed instructions and troubleshooting.
