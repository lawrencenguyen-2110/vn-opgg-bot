#!/usr/bin/env node

/**
 * Manual Test Script for VN OP.GG Discord Bot
 * 
 * Usage:
 * node manual-test.js
 * node manual-test.js "Richard Mille" "666"
 * node manual-test.js "Player Name" "TAG" --debug
 * node manual-test.js --help
 */

require('dotenv').config();
const puppeteer = require('puppeteer');

class ManualTester {
    constructor(options = {}) {
        this.debug = options.debug || process.argv.includes('--debug');
        this.headless = !process.argv.includes('--visible');
        this.saveScreenshots = process.argv.includes('--screenshots');
    }

    async testPlayer(summonerName, tagline) {
        console.log(`\n🧪 MANUAL TEST: ${summonerName}#${tagline}`);
        console.log('='.repeat(50));

        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            const url = `https://op.gg/lol/summoners/vn/${encodeURIComponent(summonerName)}-${tagline}`;
            console.log(`🌐 URL: ${url}`);

            // Navigate to profile
            console.log('⏳ Loading profile...');
            await page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });

            // Wait for content to load
            const result = await Promise.race([
                page.waitForSelector('.summoner-name', { timeout: 12000 }).then(() => 'found'),
                page.waitForSelector('.summoner-not-found', { timeout: 12000 }).then(() => 'not-found')
            ]);

            if (result === 'not-found') {
                throw new Error('Summoner not found');
            }


            // Check if profile exists
            const profileCheck = await this.checkProfileExists(page);
            if (!profileCheck.exists) {
                console.log(`❌ Profile not found: ${profileCheck.reason}`);
                return false;
            }

            console.log('✅ Profile found! Extracting data...');

            // Extract profile data
            const profileData = await this.extractProfileData(page);
            this.displayProfileData(profileData);

            // Extract match data
            const matchData = await this.extractMatchData(page);
            this.displayMatchData(matchData);

            // Take screenshot if requested
            if (this.saveScreenshots) {
                await this.takeScreenshot(page, summonerName, tagline);
            }

            // Test bot command simulation
            this.simulateBotCommands(profileData, matchData, summonerName, tagline);

            return true;

        } catch (error) {
            console.error(`❌ Test failed: ${error.message}`);
            if (this.debug) {
                console.error('Stack trace:', error.stack);
            }
            return false;
        } finally {
            await browser.close();
        }
    }

    async initBrowser() {
        console.log('🚀 Initializing browser...');
        
        const browser = await puppeteer.launch({
            headless: this.headless ? 'new' : false,
            devtools: !this.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        console.log(`📱 Browser mode: ${this.headless ? 'Headless' : 'Visible'}`);
        return browser;
    }

    async checkProfileExists(page) {
        return await page.evaluate(() => {
            const indicators = {
                notFound: document.body.textContent.includes('Summoner Not Found'),
                error404: document.body.textContent.includes('404'),
                validTitle: document.title.includes('Summoner Stats'),
                hasContent: document.body.textContent.length > 1000
            };

            if (indicators.notFound) {
                return { exists: false, reason: 'Summoner Not Found message detected' };
            }
            if (indicators.error404) {
                return { exists: false, reason: '404 error page detected' };
            }
            if (!indicators.validTitle) {
                return { exists: false, reason: 'Invalid page title' };
            }
            if (!indicators.hasContent) {
                return { exists: false, reason: 'Page content too short' };
            }

            return { exists: true, reason: 'Profile validation passed' };
        });
    }

    async extractProfileData(page) {
        return await page.evaluate(() => {
            const data = { extractionLog: [] };

            const selectors = {
                summonerName: ['.summoner-name', '[data-testid="summoner-name"]', '.profile-name'],
                level: ['.level', '.summoner-level', '.player-level'],
                tier: ['.tier', '.rank-tier', '.current-tier'],
                rank: ['.rank', '.rank-division', '.tier-division'],
                lp: ['.lp', '.league-points', '.rank-lp'],
                winRate: ['.win-rate', '.winrate', '.win-ratio'],
                wins: ['.wins', '.win-count'],
                losses: ['.losses', '.loss-count']
            };

            Object.entries(selectors).forEach(([field, selectorList]) => {
                for (const selector of selectorList) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        data[field] = element.textContent.trim();
                        data.extractionLog.push(`✅ ${field}: "${data[field]}" (${selector})`);
                        break;
                    }
                }
                if (!data[field]) {
                    data.extractionLog.push(`❌ ${field}: Not found with any selector`);
                }
            });

            // Combined rank
            if (data.tier && data.rank) {
                data.fullRank = `${data.tier} ${data.rank}`;
            } else if (data.tier) {
                data.fullRank = data.tier;
            }

            // Extract W/L numbers
            if (data.wins) {
                data.winsNumber = data.wins.match(/\d+/)?.[0] || '0';
            }
            if (data.losses) {
                data.lossesNumber = data.losses.match(/\d+/)?.[0] || '0';
            }

            return data;
        });
    }

    async extractMatchData(page) {
        return await page.evaluate(() => {
            const data = { matches: [], extractionLog: [] };

            const matchSelectors = ['.game-item', '.match-item', '.game-history-item'];
            let matchElements = [];

            for (const selector of matchSelectors) {
                matchElements = document.querySelectorAll(selector);
                if (matchElements.length > 0) {
                    data.extractionLog.push(`✅ Found ${matchElements.length} matches with "${selector}"`);
                    break;
                }
            }

            if (matchElements.length === 0) {
                data.extractionLog.push('❌ No match elements found');
                return data;
            }

            // Extract first 3 matches
            Array.from(matchElements).slice(0, 3).forEach((match, index) => {
                const matchInfo = { index: index + 1 };

                // Win/Loss detection
                if (match.classList.contains('win') || match.querySelector('.win')) {
                    matchInfo.result = 'Win';
                } else if (match.classList.contains('loss') || match.querySelector('.loss')) {
                    matchInfo.result = 'Loss';
                } else {
                    matchInfo.result = 'Unknown';
                }

                // Champion
                const championSelectors = ['.champion-name', '.champ-name'];
                for (const selector of championSelectors) {
                    const element = match.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        matchInfo.champion = element.textContent.trim();
                        break;
                    }
                }

                // KDA
                const kdaSelectors = ['.kda', '.match-kda', '.score'];
                for (const selector of kdaSelectors) {
                    const element = match.querySelector(selector);
                    if (element) {
                        const kdaText = element.textContent.trim();
                        const kdaMatch = kdaText.match(/(\d+)[\/\s]*(\d+)[\/\s]*(\d+)/);
                        if (kdaMatch) {
                            matchInfo.kills = kdaMatch[1];
                            matchInfo.deaths = kdaMatch[2];
                            matchInfo.assists = kdaMatch[3];
                            matchInfo.kda = `${kdaMatch[1]}/${kdaMatch[2]}/${kdaMatch[3]}`;
                        }
                        break;
                    }
                }

                // OP Score
                const opScoreSelectors = ['.op-score', '.match-score', '.performance-score'];
                for (const selector of opScoreSelectors) {
                    const element = match.querySelector(selector);
                    if (element) {
                        const scoreText = element.textContent.trim();
                        const scoreMatch = scoreText.match(/(\d+\.?\d*)/);
                        if (scoreMatch) {
                            matchInfo.opScore = scoreMatch[1];
                        }
                        break;
                    }
                }

                // Duration
                const durationSelectors = ['.game-length', '.match-duration', '.duration'];
                for (const selector of durationSelectors) {
                    const element = match.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        matchInfo.duration = element.textContent.trim();
                        break;
                    }
                }

                data.matches.push(matchInfo);
            });

            return data;
        });
    }

    displayProfileData(data) {
        console.log('\n📊 PROFILE DATA EXTRACTION:');
        console.log('-'.repeat(30));

        const displayFields = [
            'summonerName', 'level', 'fullRank', 'lp', 
            'winRate', 'winsNumber', 'lossesNumber'
        ];

        displayFields.forEach(field => {
            if (data[field]) {
                console.log(`  ✅ ${field}: ${data[field]}`);
            } else {
                console.log(`  ❌ ${field}: Not found`);
            }
        });

        if (this.debug) {
            console.log('\n🔍 EXTRACTION LOG:');
            data.extractionLog.forEach(log => console.log(`    ${log}`));
        }
    }

    displayMatchData(data) {
        console.log('\n🎮 MATCH DATA EXTRACTION:');
        console.log('-'.repeat(30));

        if (data.matches.length === 0) {
            console.log('  ❌ No matches found');
            if (this.debug && data.extractionLog) {
                data.extractionLog.forEach(log => console.log(`    ${log}`));
            }
            return;
        }

        console.log(`  ✅ Found ${data.matches.length} matches:`);
        data.matches.forEach(match => {
            console.log(`\n    Match ${match.index}:`);
            console.log(`      Result: ${match.result || 'Unknown'}`);
            console.log(`      Champion: ${match.champion || 'Not found'}`);
            console.log(`      KDA: ${match.kda || 'Not found'}`);
            console.log(`      OP Score: ${match.opScore || 'Not found'}`);
            console.log(`      Duration: ${match.duration || 'Not found'}`);
        });
    }

    async takeScreenshot(page, summonerName, tagline) {
        const fs = require('fs');
        if (!fs.existsSync('screenshots')) {
            fs.mkdirSync('screenshots');
        }

        const filename = `screenshots/manual-test-${summonerName}-${tagline}-${Date.now()}.png`;
        await page.screenshot({ 
            path: filename,
            fullPage: true 
        });
        console.log(`\n📸 Screenshot saved: ${filename}`);
    }

    simulateBotCommands(profileData, matchData, summonerName, tagline) {
        console.log('\n🤖 BOT COMMAND SIMULATION:');
        console.log('-'.repeat(30));

        // Simulate /vnprofile command
        console.log('Command: /vnprofile summoner:' + summonerName + ' #' + tagline);
        console.log('Response:');
        console.log(`  🇻🇳 **${profileData.summonerName || summonerName}**`);
        if (profileData.fullRank) console.log(`  🏆 Rank: ${profileData.fullRank}${profileData.lp ? ' (' + profileData.lp + ')' : ''}`);
        if (profileData.winRate) console.log(`  🎯 Win Rate: ${profileData.winRate}`);
        if (profileData.winsNumber && profileData.lossesNumber) {
            console.log(`  📊 Record: ${profileData.winsNumber}W / ${profileData.lossesNumber}L`);
        }
        if (profileData.level) console.log(`  ⭐ Level: ${profileData.level}`);

        // Simulate /vnmatch command
        if (matchData.matches.length > 0) {
            const latestMatch = matchData.matches[0];
            console.log('\nCommand: /vnmatch summoner:' + summonerName + ' #' + tagline + ' match_index:1');
            console.log('Response:');
            console.log(`  🇻🇳 ${latestMatch.result === 'Win' ? '🏆' : '💀'} ${latestMatch.champion || 'Unknown'} - Match 1`);
            if (latestMatch.kda) console.log(`  📊 KDA: ${latestMatch.kda}`);
            if (latestMatch.opScore) console.log(`  🎯 OP Score: ${latestMatch.opScore}/10`);
            if (latestMatch.duration) console.log(`  ⏱️ Duration: ${latestMatch.duration}`);
        }
    }

    showHelp() {
        console.log(`
🧪 VN OP.GG Bot Manual Test Script

Usage:
  node manual-test.js [summoner] [tagline] [options]

Examples:
  node manual-test.js
  node manual-test.js "Richard Mille" "666"
  node manual-test.js "Player Name" "TAG" --debug
  
Options:
  --debug         Show detailed extraction logs
  --visible       Show browser window (non-headless)
  --screenshots   Save screenshots of pages
  --help          Show this help message

Default player: Richard Mille #666 (if no arguments provided)
        `);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        const tester = new ManualTester();
        tester.showHelp();
        return;
    }

    const summonerName = args[0] || 'Richard Mille';
    const tagline = args[1] || '666';
    const debug = args.includes('--debug');

    const tester = new ManualTester({ debug });

    console.log('🚀 Starting Manual Test...');
    console.log(`🎯 Target: ${summonerName}#${tagline}`);
    console.log(`🔍 Debug mode: ${debug ? 'ON' : 'OFF'}`);

    try {
        const success = await tester.testPlayer(summonerName, tagline);
        
        if (success) {
            console.log('\n✅ Manual test completed successfully!');
            console.log('🎉 Your bot should work with this player data.');
        } else {
            console.log('\n❌ Manual test failed.');
            console.log('🔧 Check the issues above and adjust your bot logic accordingly.');
        }
    } catch (error) {
        console.error('\n💥 Manual test crashed:', error.message);
        if (debug) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Manual test interrupted by user');
    process.exit(0);
});

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { ManualTester };