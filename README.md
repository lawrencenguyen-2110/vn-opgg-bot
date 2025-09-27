# 🇻🇳 Vietnam OP.GG Discord Bot

A comprehensive Discord bot for tracking League of Legends statistics from OP.GG, specifically optimized for Vietnam region players. Get detailed match statistics, OP scores, player profiles, and performance analysis directly in your Discord server.

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Features

- 🎮 **Vietnam Region Focused** - Optimized for VN server players
- 📊 **Detailed Statistics** - OP scores, KDA, CS, damage, vision scores
- 🏆 **Performance Badges** - MVP/ACE detection and tracking
- 📈 **Timeline Analysis** - Game progression and performance trends
- 🐲 **Objective Tracking** - Dragons, barons, turrets, epic steals
- 🛡️ **Build Analysis** - Items, runes, summoner spells
- 👥 **Player Comparison** - Side-by-side stat comparisons
- ⚡ **Smart Caching** - Fast responses with intelligent data caching
- 🔄 **Auto-retry Logic** - Robust error handling and recovery

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- Discord account
- Git

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/vn-opgg-discord-bot.git
cd vn-opgg-discord-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

### 4. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application: **"VN OP.GG Bot"**
3. Go to **Bot** section → **Add Bot**
4. Copy **Bot Token** → Add to `.env` as `DISCORD_TOKEN`
5. Copy **Application ID** → Add to `.env` as `CLIENT_ID`
6. Enable **Message Content Intent**

### 5. Register Commands & Start

```bash
# Register slash commands
npm run deploy:register

# Start development server
npm run dev
```

### 6. Invite Bot to Server

Generate invite link with required permissions:

- Bot scope + Application commands
- Send Messages, Use Slash Commands, Embed Links

## 📋 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal | ✅ Yes | - |
| `CLIENT_ID` | Application ID from Discord Developer Portal | ✅ Yes | - |
| `NODE_ENV` | Environment (development/production) | ⚠️ Recommended | development |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | ⚠️ Recommended | debug |
| `DEFAULT_REGION` | Default region for searches | No | vn |
| `CACHE_TIMEOUT` | Cache duration in milliseconds | No | 300000 |
| `REQUEST_TIMEOUT` | OP.GG request timeout | No | 30000 |
| `PORT` | Health check server port | No | 3000 |

## 🎮 Bot Commands

### Profile Commands

```bash
/vnprofile summoner:PlayerName
```

Shows complete player profile with rank, LP, win rate, and ladder position.

### Match History

```bash
/vnmatches summoner:PlayerName count:5
```

Displays recent match history with OP scores and performance badges.

### Detailed Match Analysis

```bash
/vnmatch summoner:PlayerName match_index:1
```

Shows comprehensive match details including timeline, objectives, and build.

### Performance Analysis

```bash
/vnstats summoner:PlayerName
```

Provides detailed performance analysis with trends and statistics.

### Player Comparison

```bash
/vncompare player1:Name1 player2:Name2
```

Compare two Vietnam region players side-by-side.

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Specific Components

```bash
# Test bot logic validation
npm run test:bot

# Test real OP.GG data extraction
npm run test:real

# Test Puppeteer functionality
npm run test:puppeteer
```

### Manual Testing

```bash
# Test with a real VN player
node test/manual-test.js "Richard Mille" "666"
```

## 🔧 Development

### Development Mode

```bash
# Start with auto-reload
npm run dev

# With verbose logging
DEBUG=* npm run dev
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npx prettier --write src/
```

### Debugging

```bash
# View logs
npm run logs

# Monitor in real-time
tail -f logs/combined.log

# Debug specific issues
DEBUG=puppeteer* npm run dev
```

## 🚀 Deployment

### Quick Deploy (Railway - Recommended)

1. Push to GitHub
2. Connect Railway to repository
3. Add environment variables
4. Deploy automatically!

### VPS Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
npm run pm2:start

# Monitor
npm run pm2:logs
```

### Docker Deployment

```bash
# Build image
npm run docker:build

# Run with docker-compose
npm run docker:compose
```

### Cloud Platforms

- **Railway**: Zero-config deployment
- **Heroku**: Add Puppeteer buildpack
- **DigitalOcean**: App Platform ready
- **Google Cloud**: Cloud Run compatible

## 📊 Monitoring

### Health Checks

```bash
# Check bot health
npm run health

# View performance metrics
curl http://localhost:3000/health
```

### Logs

```bash
# Application logs
npm run logs

# PM2 process logs
npm run pm2:logs

# Error logs only
tail -f logs/error.log
```

### Performance Monitoring

- Memory usage tracking
- Response time monitoring  
- Error rate alerts
- Cache hit ratios

## 🛠️ Configuration

### Cache Settings

```javascript
// Adjust cache timeout for different environments
CACHE_TIMEOUT=300000  // 5 minutes (production)
CACHE_TIMEOUT=60000   // 1 minute (development)
```

### Rate Limiting

```javascript
// Prevent OP.GG rate limiting
RATE_LIMIT_REQUESTS=5   // Max requests per user
RATE_LIMIT_WINDOW=60000 // Per 1 minute window
```

### Browser Settings

```javascript
// Puppeteer configuration
BROWSER_HEADLESS=new    // Production
BROWSER_HEADLESS=false  // Development (visible browser)
```

## 🐛 Troubleshooting

### Common Issues

#### Bot Not Responding

```bash
# Check if bot is online
pm2 list

# Restart if needed
npm run pm2:restart

# Check logs for errors
npm run pm2:logs
```

#### Puppeteer/Chrome Errors

```bash
# Install Chrome dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Test Chrome
node -e "const puppeteer = require('puppeteer'); (async () => { const browser = await puppeteer.launch(); console.log('✅ Chrome working!'); await browser.close(); })();"
```

#### Memory Issues

```bash
# Monitor memory usage
pm2 monit

# Adjust memory limits in ecosystem.config.js
max_memory_restart: '1G'
```

#### OP.GG Access Issues

```bash
# Test OP.GG accessibility
curl -I https://op.gg/lol/summoners/vn/

# Check if IP is rate limited
node test/test-opgg-access.js
```

### Debug Mode

```bash
# Enable debug logging
DEBUG_MODE=true npm run dev

# Save screenshots for debugging
SAVE_SCREENSHOTS=true npm run dev

# Verbose Puppeteer logs
DEBUG=puppeteer* npm run dev
```

## 📁 Project Structure

```plaintext
vn-opgg-discord-bot/
├── src/
│   ├── bot.js              # Main bot file
│   ├── commands/           # Slash command handlers
│   ├── utils/              # Utility functions
│   ├── scrapers/           # OP.GG data extraction
│   └── config/             # Configuration files
├── test/
│   ├── test-runner.js      # Test suite runner
│   ├── test-real-data.js   # Real data testing
│   └── test-bot-logic.js   # Logic validation
├── logs/                   # Application logs
├── screenshots/            # Debug screenshots
├── .env                    # Environment variables
├── .env.example            # Environment template
├── package.json            # Dependencies and scripts
├── ecosystem.config.js     # PM2 configuration
├── Dockerfile              # Docker configuration
└── README.md               # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow ESLint configuration
- Add tests for new features
- Update documentation
- Test with real VN region data

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [Puppeteer](https://puppeteer.github.io/) - Browser automation
- [OP.GG](https://op.gg/) - League of Legends statistics
- Vietnam League of Legends community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/vn-opgg-discord-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/vn-opgg-discord-bot/discussions)
- **Discord**: [Support Server](https://discord.gg/your-server)

## 🚨 Disclaimer

This bot is not affiliated with Riot Games or OP.GG. It's a community tool that scrapes publicly available data for educational and informational purposes. Please respect OP.GG's terms of service and rate limits.

---

**Made with ❤️ for the Vietnam League of Legends community** 🇻🇳
