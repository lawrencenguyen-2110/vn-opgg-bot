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