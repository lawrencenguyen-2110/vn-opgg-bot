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