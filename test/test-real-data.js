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
        const result = await Promise.race([
            page.waitForSelector('.summoner-name', { timeout: 12000 }).then(() => 'found'),
            page.waitForSelector('.summoner-not-found', { timeout: 12000 }).then(() => 'not-found')
        ]);

        if (result === 'not-found') {
            throw new Error('Summoner not found');
        }
 // Wait for JS to load
        
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
        { name: 'khaibeoisekai', tag: 'kbngu' }, // Might not exist in VN
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