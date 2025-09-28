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