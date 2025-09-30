// Test real OP.GG data extraction
const puppeteer = require('puppeteer');

async function testRealPlayerData(summonerName = 'Richard Mille', tagline = '666') {
    console.log(`🎯 Testing Real Data for ${summonerName}#${tagline}...`);
    
    const browser = await puppeteer.launch({
        headless: process.env.BROWSER_HEADLESS !== 'false',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    const page = await browser.newPage();
    
    try {
        // Set realistic user agent and headers to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        });

        // Remove webdriver property to avoid detection
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        const url = `https://op.gg/lol/summoners/vn/${encodeURIComponent(summonerName)}-${tagline}`;
        console.log(`  🌐 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for page to load and check for blocking
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Make API call to get PUUID from response
        let apiPuuid = null;
        try {
            const response = await page.evaluate(async (url) => {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'rsc': '1',
                        'sec-fetch-mode': 'cors'
                    }
                });
                return {
                    text: await response.text(),
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries())
                };
            }, url);

            // Extract PUUID from API response (RSC format)
            let jsonPuuids = [];
            
            // Try to extract PUUIDs from JSON-like structures in RSC response
            const jsonPuuidPattern = /"puuid":"([^"]+)"/gi;
            let match;
            while ((match = jsonPuuidPattern.exec(response.text)) !== null) {
                jsonPuuids.push(match[1]);
            }
            
            // Also try the standard UUID pattern as fallback
            const puuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;
            const standardPuuids = response.text.match(puuidPattern) || [];
            
            // Combine and deduplicate PUUIDs
            const allPuuids = [...new Set([...jsonPuuids, ...standardPuuids])];
            
            if (allPuuids.length > 0) {
                apiPuuid = allPuuids[0]; // Get first PUUID
                console.log(`  ✅ API PUUID extracted: ${apiPuuid}`);
                if (allPuuids.length > 1) {
                    console.log(`  📋 Found ${allPuuids.length} total PUUIDs in API response`);
                }
            } else {
                console.log('  ⚠️ No PUUID found in API response');
                console.log(`  📊 Response status: ${response.status}`);
            }
        } catch (error) {
            console.log(`  ❌ API call failed: ${error.message}`);
        }

        // Get matches data using the extracted PUUID
        let matchesData = null;
        if (apiPuuid) {
            try {
                const matchesResponse = await page.evaluate(async (url, puuid) => {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'next-action': '409a2b9ca50d15e50a4dace93552e3a40113dc2753',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify([{
                            "locale": "en",
                            "region": "vn",
                            "puuid": puuid,
                            "gameType": "TOTAL",
                            "endedAt": "",
                            "champion": ""
                        }])
                    });
                    return {
                        text: await response.text(),
                        status: response.status,
                        headers: Object.fromEntries(response.headers.entries())
                    };
                }, url, apiPuuid);

                if (matchesResponse.status === 200) {
                    matchesData = matchesResponse.text;
                    console.log(`  📊 Matches response length: ${matchesData.length} characters`);
                } else {
                    console.log(`  ⚠️ Matches API call failed with status: ${matchesResponse.status}`);
                }
            } catch (error) {
                console.log(`  ❌ Matches API call failed: ${error.message}`);
            }
        } else {
            console.log('  ⚠️ No PUUID available for matches API call');
        }
        
        const pageContent = await page.content();
        if (pageContent.includes('ERROR: The request could not be satisfied') || 
            pageContent.includes('Cloudflare') ||
            pageContent.includes('Access denied')) {
            console.log('  ⚠️ Page blocked by Cloudflare - skipping data extraction');
            return false;
        }

        // Try multiple selectors for summoner name
        const summonerSelectors = [
            '.summoner-name',
            '[data-testid="summoner-name"]',
            '.profile-summary__name',
            '.summoner-summary__name',
            'h1',
            '.title'
        ];

        let summonerFound = false;
        for (const selector of summonerSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                summonerFound = true;
                break;
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!summonerFound) {
            console.log('  ⚠️ No summoner name selector found - checking page content');
            const title = await page.title();
            console.log(`  📄 Page title: "${title}"`);
            
            // Check if it's a 404 or not found page
            if (title.includes('404') || title.includes('Not Found') || 
                pageContent.includes('Summoner Not Found')) {
                console.log('  ❌ Summoner not found');
                return false;
            }
        }
        
        // Extract real data with improved selectors
        const realData = await page.evaluate((apiPuuid, matchesData) => {
            const data = { found: {} };

            // Test various selectors for different data points
            const selectors = {
                summonerName: [
                    '.summoner-name', 
                    '[data-testid="summoner-name"]',
                    '.profile-summary__name',
                    '.summoner-summary__name',
                    'h1',
                    '.title',
                    '.summoner-header__name'
                ],
                level: [
                    '.level', 
                    '.summoner-level',
                    '.profile-summary__level',
                    '.summoner-header__level',
                    '[data-testid="summoner-level"]'
                ],
                rank: [
                    '.tier', 
                    '.rank',
                    '.profile-summary__tier',
                    '.summoner-header__tier',
                    '.tier-rank',
                    '[data-testid="tier-rank"]'
                ],
                winRate: [
                    '.win-rate', 
                    '.winrate',
                    '.profile-summary__winrate',
                    '.summoner-header__winrate',
                    '[data-testid="winrate"]'
                ],
                lp: [
                    '.lp',
                    '.profile-summary__lp',
                    '.summoner-header__lp',
                    '[data-testid="lp"]'
                ]
            };

            // Try to extract data using multiple selectors
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

            // Check for match elements with more selectors
            const matchSelectors = [
                '.game-item', 
                '.match-item', 
                '.game-history-item',
                '.match-history-item',
                '.game-list-item',
                '[data-testid="match-item"]'
            ];
            let matchCount = 0;
            
            for (const selector of matchSelectors) {
                const matches = document.querySelectorAll(selector);
                if (matches.length > 0) {
                    matchCount = matches.length;
                    break;
                }
            }

            // Get page metadata
            data.matchCount = matchCount;
            data.pageTitle = document.title;
            data.bodyLength = document.body.textContent.length;
            data.bodyTextContent = document.body.textContent;
            data.url = window.location.href;
            data.apiPuuid = apiPuuid; // API PUUID from outer scope
            data.matchesData = matchesData; // Matches data from API call
            
            // Check for common page indicators
            data.hasProfileData = document.body.textContent.includes('League of Legends') ||
                                 document.body.textContent.includes('Summoner') ||
                                 document.body.textContent.includes('Rank') ||
                                 document.body.textContent.includes('Level');

            return data;
        }, apiPuuid, matchesData);

        // Parse matches data if available (RSC format)
        let matchesInfo = null;
        if (realData.matchesData) {
            try {
                // Parse RSC format: find line starting with "1:{" and extract the data array
                const lines = realData.matchesData.split('\n');
                let matchesArray = null;
                
                for (const line of lines) {
                    if (line.startsWith('1:{"data":[')) {
                        // Extract the JSON part after "1:"
                        const jsonPart = line.substring(2); // Remove "1:" prefix
                        const rscData = JSON.parse(jsonPart);
                        if (rscData.data && Array.isArray(rscData.data)) {
                            matchesArray = rscData.data;
                            break;
                        }
                    }
                }
                
                if (matchesArray) {
                    matchesInfo = {
                        hasData: true,
                        rawLength: realData.matchesData.length,
                        parsed: matchesArray,
                        matchCount: matchesArray.length
                    };
                } else {
                    // Fallback: try to parse as regular JSON
                    const matchesJson = JSON.parse(realData.matchesData);
                    matchesInfo = {
                        hasData: true,
                        rawLength: realData.matchesData.length,
                        parsed: matchesJson
                    };
                }
            } catch (error) {
                matchesInfo = {
                    hasData: false,
                    error: 'Failed to parse RSC/JSON format',
                    rawLength: realData.matchesData.length
                };
            }
        }

        console.log('  📊 Real Data Extraction Results:');
        console.log(`    Page Title: ${realData.pageTitle}`);
        console.log(`    PUUID: ${realData.apiPuuid || 'Not found'}`);
        
        if (matchesInfo) {
            if (matchesInfo.hasData) {
                console.log(`    🎮 Matches Data: ✅ Successfully fetched (${matchesInfo.rawLength} chars)`);
                if (matchesInfo.matchCount) {
                    console.log(`    📋 Matches Count: ${matchesInfo.matchCount}`);
                } else if (matchesInfo.parsed && Array.isArray(matchesInfo.parsed)) {
                    console.log(`    📋 Matches Count: ${matchesInfo.parsed.length}`);
                } else if (matchesInfo.parsed && matchesInfo.parsed.data) {
                    console.log(`    📋 Matches Count: ${matchesInfo.parsed.data.length || 'Unknown'}`);
                }
            } else {
                console.log(`    🎮 Matches Data: ❌ ${matchesInfo.error} (${matchesInfo.rawLength} chars)`);
            }
        } else {
            console.log(`    🎮 Matches Data: ⚠️ Not available`);
        }
        
        if (Object.keys(realData.found).length > 0) {
            console.log('    ✅ Successfully extracted:');
            Object.entries(realData.found).forEach(([field, info]) => {
                console.log(`      ${field}: "${info.value}" (${info.selector})`);
            });
        } else {
            console.log('    ⚠️ No profile data extracted - may need selector updates');
            if (realData.hasProfileData) {
                console.log('    💡 Page appears to have profile data but selectors need updating');
            } else {
                console.log('    💡 Page may not contain profile data or is blocked');
            }
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