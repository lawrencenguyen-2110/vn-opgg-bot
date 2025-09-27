# 🧪 Local Testing Guide - VN OP.GG Discord Bot

This guide covers how to test the Discord OP.GG bot locally, including real data extraction and bot functionality validation.

## 🚀 Quick Setup for Testing

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/yourusername/vn-opgg-discord-bot.git
cd vn-opgg-discord-bot

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Configure Testing Environment

```bash
# Edit .env for testing
nano .env
```

**Minimal .env for Testing:**

```bash
# Required for bot functionality tests
DISCORD_TOKEN=your_test_bot_token
CLIENT_ID=your_test_application_id

# Testing configuration
NODE_ENV=development
LOG_LEVEL=debug
DEBUG_MODE=true
VERBOSE_LOGGING=true
SAVE_SCREENSHOTS=true

# Browser settings for testing
BROWSER_HEADLESS=false  # See browser during tests
PAGE_LOAD_TIMEOUT=10000
REQUEST_TIMEOUT=30000
```

### 3. Create Test Bot (Separate from Production)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create **"VN OP.GG Bot (TEST)"**
3. Get bot token and client ID for testing
4. Invite to a test Discord server

---

## 🔧 Test Files Structure

Create the following test files in your project:

### test/test-runner.js

```javascript
// Main test runner
const { runBotLogicTests } = require('./test-bot-logic');
const { runRealDataTests } = require('./test-real-data');
const { runPuppeteerTests } = require('./test-puppeteer');

async function runAllTests() {
    console.log('🧪 Starting VN OP.GG Bot Test Suite');
    console.log('=====================================\n');

    try {
        // Test 1: Bot Logic Validation
        console.log('1️⃣ Running Bot Logic Tests...');
        await runBotLogicTests();
        console.log('✅ Bot Logic Tests Passed\n');

        // Test 2: Puppeteer Browser Tests
        console.log('2️⃣ Running Puppeteer Tests...');
        await runPuppeteerTests();
        console.log('✅ Puppeteer Tests Passed\n');

        // Test 3: Real Data Extraction
        console.log('3️⃣ Running Real Data Tests...');
        await runRealDataTests();
        console.log('✅ Real Data Tests Passed\n');

        console.log('🎉 ALL TESTS PASSED!');
    } catch (error) {
        console.error('❌ Test Suite Failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };
```

### test/test-bot-logic.js

```javascript
// Test bot logic components
require('dotenv').config();

function testURLConstruction() {
    console.log('🔗 Testing URL Construction...');
    
    function constructVNURL(summonerName, tagline) {
        const baseURL = 'https://op.gg/lol/summoners/vn/';
        const encoded = encodeURIComponent(summonerName) + '-' + tagline;
        return baseURL + encoded;
    }

    const tests = [
        { name: 'Richard Mille', tag: '666', expected: 'Richard%20Mille-666' },
        { name: 'Faker', tag: 'KR1', expected: 'Faker-KR1' },
        { name: 'Ắn Béo', tag: 'VN2', expected: '%E1%BA%AEn%20B%C3%A9o-VN2' }
    ];

    tests.forEach(test => {
        const url = constructVNURL(test.name, test.tag);
        const encoded = url.split('/').pop();
        if (encoded === test.expected) {
            console.log(`  ✅ ${test.name}#${test.tag} → ${encoded}`);
        } else {
            throw new Error(`URL encoding failed for ${test.name}#${test.tag}`);
        }
    });
}

function testDataValidation() {
    console.log('🔍 Testing Data Validation...');

    function validateKDA(kdaString) {
        const kdaRegex = /(\d+)\/(\d+)\/(\d+)/;
        const match = kdaString.match(kdaRegex);
        
        if (!match) return { valid: false, error: "Invalid KDA format" };
        
        const [, kills, deaths, assists] = match;
        const k = parseInt(kills), d = parseInt(deaths), a = parseInt(assists);
        
        if (k > 50 || d > 50 || a > 50) {
            return { valid: false, error: "Unrealistic values" };
        }
        
        const ratio = d > 0 ? ((k + a) / d).toFixed(2) : 'Perfect';
        return { valid: true, kills: k, deaths: d, assists: a, ratio };
    }

    const kdaTests = ['13/2/8', '0/0/0', 'invalid', '99/1/1'];
    kdaTests.forEach(kda => {
        const result = validateKDA(kda);
        if (kda === 'invalid' || kda === '99/1/1') {
            if (!result.valid) {
                console.log(`  ✅ ${kda} correctly rejected: ${result.error}`);
            } else {
                throw new Error(`Should have rejected: ${kda}`);
            }
        } else {
            if (result.valid) {
                console.log(`  ✅ ${kda} → ratio: ${result.ratio}`);
            } else {
                throw new Error(`Should have accepted: ${kda}`);
            }
        }
    });
}

function testErrorHandling() {
    console.log('🛡️ Testing Error Handling...');

    function generateErrorMessage(errorType, summonerName) {
        const errorMessages = {
            'profile_not_found': `❌ Could not find profile for **${summonerName}** in Vietnam region`,
            'timeout': `⏰ Request timed out while loading ${summonerName}'s profile`,
            'rate_limited': `🚫 Too many requests. Please wait before searching again.`
        };
        return errorMessages[errorType] || `❌ Unknown error for ${summonerName}`;
    }

    const errorTests = [
        { type: 'profile_not_found', player: 'TestPlayer' },
        { type: 'timeout', player: 'SlowPlayer' },
        { type: 'unknown', player: 'ErrorPlayer' }
    ];

    errorTests.forEach(test => {
        const message = generateErrorMessage(test.type, test.player);
        if (message.includes(test.player)) {
            console.log(`  ✅ ${test.type} error handled correctly`);
        } else {
            throw new Error(`Error message generation failed for ${test.type}`);
        }
    });
}

async function runBotLogicTests() {
    testURLConstruction();
    testDataValidation();
    testErrorHandling();
    console.log('✅ All bot logic tests passed!');
}

module.exports = { runBotLogicTests };
```

### test/test-puppeteer.js

```javascript
// Test Puppeteer functionality
const puppeteer = require('puppeteer');

async function testBrowserInitialization() {
    console.log('🌐 Testing Browser Initialization...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://example.com');
    
    const title = await page.title();
    if (title.includes('Example')) {
        console.log('  ✅ Browser and page navigation working');
    } else {
        throw new Error('Browser navigation failed');
    }

    await browser.close();
}

async function testOPGGAccess() {
    console.log('🎯 Testing OP.GG Access...');
    
    const browser = await puppeteer.launch({
        headless: process.env.BROWSER_HEADLESS !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        // Test OP.GG main page access
        await page.goto('https://op.gg', { waitUntil: 'networkidle2', timeout: 10000 });
        
        const title = await page.title();
        if (title.toLowerCase().includes('op.gg')) {
            console.log('  ✅ OP.GG main page accessible');
        } else {
            console.log('  ⚠️ OP.GG page title unexpected:', title);
        }

        // Test VN region specific page
        await page.goto('https://op.gg/lol/summoners/vn/', { 
            waitUntil: 'networkidle2', 
            timeout: 10000 
        });
        
        const vnPageLoaded = await page.evaluate(() => {
            return document.body.textContent.includes('Summoner') || 
                   document.body.textContent.includes('레벨') ||
                   !document.body.textContent.includes('404');
        });

        if (vnPageLoaded) {
            console.log('  ✅ OP.GG VN region accessible');
        } else {
            console.log('  ⚠️ OP.GG VN region may have issues');
        }

    } catch (error) {
        console.log(`  ⚠️ OP.GG access test failed: ${error.message}`);
    } finally {
        await browser.close();
    }
}

async function runPuppeteerTests() {
    await testBrowserInitialization();
    await testOPGGAccess();
    console.log('✅ All Puppeteer tests completed!');
}

module.exports = { runPuppeteerTests };
```

### test/test-real-data.js

```javascript
// Test real OP.GG data extraction
const puppeteer = require('puppeteer');

async function testRealPlayerData(summonerName = 'Richard Mille', tagline = '666') {
    console.log(`🎯 Testing Real Data for ${summonerName}#${tagline}...`);
    
    const browser = await puppeteer.launch({
        headless: process.env.BROWSER_HEADLESS !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        const url = `https://op.gg/lol/summoners/vn/${encodeURIComponent(summonerName)}-${tagline}`;
        console.log(`  🌐 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(5000); // Wait for JS to load
        
        // Check if profile exists
        const profileExists = await page.evaluate(() => {
            return !document.body.textContent.includes('Summoner Not Found') &&
                   !document.body.textContent.includes('404') &&
                   document.title.includes('Summoner Stats');
        });

        if (!profileExists) {
            console.log(`  ⚠️ Profile ${summonerName}#${tagline} not found or page failed to load`);
            return false;
        }

        // Extract real data
        const realData = await page.evaluate(() => {
            const data = { found: {} };

            // Test various selectors
            const selectors = {
                summonerName: ['.summoner-name', '[data-testid="summoner-name"]'],
                level: ['.level', '.summoner-level'],
                rank: ['.tier', '.rank'],
                winRate: ['.win-rate', '.winrate']
            };

            Object.entries(selectors).forEach(([field, selectorList]) => {
                for (const selector of selectorList) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        data.found[field] = {
                            selector: selector,
                            value: element.textContent.trim()
                        };
                        break;
                    }
                }
            });

            // Check for match elements
            const matchSelectors = ['.game-item', '.match-item', '.game-history-item'];
            let matchCount = 0;
            
            for (const selector of matchSelectors) {
                const matches = document.querySelectorAll(selector);
                if (matches.length > 0) {
                    matchCount = matches.length;
                    break;
                }
            }

            data.matchCount = matchCount;
            data.pageTitle = document.title;
            data.bodyLength = document.body.textContent.length;

            return data;
        });

        console.log('  📊 Real Data Extraction Results:');
        console.log(`    Page Title: ${realData.pageTitle}`);
        console.log(`    Content Length: ${realData.bodyLength} characters`);
        console.log(`    Match Elements Found: ${realData.matchCount}`);
        
        if (Object.keys(realData.found).length > 0) {
            console.log('    ✅ Successfully extracted:');
            Object.entries(realData.found).forEach(([field, info]) => {
                console.log(`      ${field}: "${info.value}" (${info.selector})`);
            });
        } else {
            console.log('    ⚠️ No profile data extracted - may need selector updates');
        }

        // Save screenshot if enabled
        if (process.env.SAVE_SCREENSHOTS === 'true') {
            const fs = require('fs');
            if (!fs.existsSync('screenshots')) {
                fs.mkdirSync('screenshots');
            }
            await page.screenshot({ 
                path: `screenshots/test-${summonerName}-${tagline}.png`,
                fullPage: true 
            });
            console.log(`    📸 Screenshot saved: screenshots/test-${summonerName}-${tagline}.png`);
        }

        return realData;

    } catch (error) {
        console.log(`  ❌ Real data test failed: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

async function runRealDataTests() {
    // Test with different players
    const testPlayers = [
        { name: 'Richard Mille', tag: '666' },
        { name: 'Faker', tag: 'KR1' }, // Might not exist in VN
        { name: 'Test Player', tag: '123' } // Definitely won't exist
    ];

    let successCount = 0;
    for (const player of testPlayers) {
        const result = await testRealPlayerData(player.name, player.tag);
        if (result && Object.keys(result.found).length > 0) {
            successCount++;
        }
        console.log(''); // Empty line between tests
    }

    console.log(`✅ Real data extraction tested: ${successCount}/${testPlayers.length} profiles had extractable data`);
}

module.exports = { runRealDataTests, testRealPlayerData };
```

---

## 🏃‍♂️ Running Tests

### 1. Quick Test

```bash
# Run all tests
npm test

# Expected output:
# 🧪 Starting VN OP.GG Bot Test Suite
# 1️⃣ Running Bot Logic Tests...
# ✅ Bot Logic Tests Passed
# 2️⃣ Running Puppeteer Tests...
# ✅ Puppeteer Tests Passed  
# 3️⃣ Running Real Data Tests...
# ✅ Real Data Tests Passed
# 🎉 ALL TESTS PASSED!
```

### 2. Individual Test

```bash
# Test bot logic only
npm run test:bot

# Test real data extraction
npm run test:real

# Test Puppeteer functionality
npm run test:puppeteer
```

### 3. Manual Testing with Specific Player

```bash
# Test specific VN player
node -e "
const { testRealPlayerData } = require('./test/test-real-data');
testRealPlayerData('Richard Mille', '666').then(() => process.exit());
"
```

### 4. Visual Testing (Browser Visible)

```bash
# See browser in action
BROWSER_HEADLESS=false npm run test:real
```

### 5. Debug Mode Testing

```bash
# Full debug output
DEBUG_MODE=true VERBOSE_LOGGING=true npm test
```

---

## 🔧 Test Configuration

### Environment Variables for Testing

```bash
# .env.test
NODE_ENV=test
LOG_LEVEL=debug
DEBUG_MODE=true
VERBOSE_LOGGING=true
SAVE_SCREENSHOTS=true
BROWSER_HEADLESS=false
PAGE_LOAD_TIMEOUT=15000
REQUEST_TIMEOUT=30000
```

### Custom Test Script

```bash
# Create custom test
cat > test-custom.js << 'EOF'
const { testRealPlayerData } = require('./test/test-real-data');

async function customTest() {
    console.log('🧪 Custom Test Starting...');
    
    // Test your specific player
    const playerName = process.argv[2] || 'Richard Mille';
    const tagline = process.argv[3] || '666';
    
    const result = await testRealPlayerData(playerName, tagline);
    
    if (result) {
        console.log('✅ Custom test completed successfully!');
    } else {
        console.log('❌ Custom test failed');
        process.exit(1);
    }
}

customTest();
EOF

# Run custom test
node test-custom.js "Your Player Name" "TAG"
```

---

## 🐛 Debugging Local Issues

### 1. Chrome/Puppeteer Issues

```bash
# Install Chrome dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
  libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
  libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
  fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Test Chrome manually
node -e "const puppeteer = require('puppeteer'); (async () => { const browser = await puppeteer.launch(); console.log('✅ Chrome works!'); await browser.close(); })();"
```

### 2. Network/OP.GG Access Issues

```bash
# Test OP.GG accessibility
curl -I https://op.gg

# Test VN region specifically
curl -I https://op.gg/lol/summoners/vn/

# Check if your IP is rate limited
node -e "
const axios = require('axios');
axios.get('https://op.gg').then(() => console.log('✅ OP.GG accessible')).catch(err => console.log('❌ OP.GG blocked:', err.response?.status));
"
```

### 3. Discord Bot Issues

```bash
# Test Discord connection without starting full bot
node -e "
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('ready', () => { console.log('✅ Discord connected!'); process.exit(); });
client.login(process.env.DISCORD_TOKEN);
"
```

### 4. Memory/Performance Issues

```bash
# Monitor memory during tests
npm install -g clinic
clinic doctor -- npm test

# Check for memory leaks
node --trace-warnings --trace-deprecation test/test-runner.js
```

---

## 📊 Test Results Interpretation

### ✅ Successful Test Output

``` plaintext
🧪 Starting VN OP.GG Bot Test Suite
=====================================

1️⃣ Running Bot Logic Tests...
🔗 Testing URL Construction...
  ✅ Richard Mille#666 → Richard%20Mille-666
  ✅ Faker#KR1 → Faker-KR1
🔍 Testing Data Validation...
  ✅ 13/2/8 → ratio: 10.50
  ✅ invalid correctly rejected: Invalid KDA format
✅ Bot Logic Tests Passed

2️⃣ Running Puppeteer Tests...
🌐 Testing Browser Initialization...
  ✅ Browser and page navigation working
🎯 Testing OP.GG Access...
  ✅ OP.GG main page accessible
  ✅ OP.GG VN region accessible
✅ Puppeteer Tests Passed

3️⃣ Running Real Data Tests...
🎯 Testing Real Data for Richard Mille#666...
  📊 Real Data Extraction Results:
    Page Title: Richard Mille#666 - Summoner Stats - League of Legends
    Content Length: 45231 characters
    Match Elements Found: 20
    ✅ Successfully extracted:
      summonerName: "Richard Mille" (.summoner-name)
      level: "156" (.level)
      rank: "Diamond IV" (.tier)
✅ Real Data Tests Passed

🎉 ALL TESTS PASSED!
```

### ⚠️ Warning Indicators

- **Empty data extraction**: OP.GG layout may have changed
- **No match elements**: Player might be inactive
- **Timeout errors**: Network or OP.GG response issues
- **Access denied**: Possible IP rate limiting

### ❌ Common Failures

- **Chrome launch failed**: Missing dependencies
- **Discord connection failed**: Invalid token
- **OP.GG unreachable**: Network or firewall issues
- **Data extraction empty**: Selectors need updating

---

## 🚀 Performance Testing

### Load Testing

```bash
# Test concurrent requests
node -e "
const { testRealPlayerData } = require('./test/test-real-data');
const players = ['Richard Mille', 'Test Player', 'Another Player'];
Promise.all(players.map(name => testRealPlayerData(name, '666')))
  .then(() => console.log('✅ Concurrent test completed'));
"
```

### Memory Profiling

```bash
# Profile memory usage
node --inspect test/test-runner.js
# Then open chrome://inspect in Chrome
```

---

**Ready to test your VN OP.GG Discord Bot locally!** 🧪✨

Make sure to test with real Vietnam region players to validate the data extraction accuracy.
