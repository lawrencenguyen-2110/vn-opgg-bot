const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const StealthPuppeteer = require('../puppeteer-config');
require('dotenv').config();

class VNOPGGBotEnhanced {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
        
        this.stealth = null;
        this.browser = null;
        this.cache = new Map();
        this.setupBot();
    }

    async setupBot() {
        await this.registerCommands();
        
        this.client.once('ready', () => {
            console.log(`🇻🇳 VN OP.GG Bot (Enhanced) ready! Logged in as ${this.client.user.tag}`);
            this.initializeBrowser();
        });

        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isChatInputCommand()) return;

            const { commandName } = interaction;

            try {
                switch (commandName) {
                    case 'vnprofile':
                        await this.handleVNProfileCommand(interaction);
                        break;
                    case 'vnmatches':
                        await this.handleVNMatchesCommand(interaction);
                        break;
                    case 'vnmatch':
                        await this.handleVNMatchCommand(interaction);
                        break;
                    case 'vnstats':
                        await this.handleVNStatsCommand(interaction);
                        break;
                    case 'vncompare':
                        await this.handleVNCompareCommand(interaction);
                        break;
                }
            } catch (error) {
                console.error('Command error:', error);
                await this.sendError(interaction, 'An error occurred. The site might be blocking requests. Please try again later.');
            }
        });

        this.client.login(process.env.DISCORD_TOKEN);
    }

    async initializeBrowser() {
        try {
            console.log('🚀 Initializing enhanced stealth browser...');
            
            this.stealth = new StealthPuppeteer({
                headless: process.env.BROWSER_HEADLESS === 'true', // Default to visible
                slowMo: 50,
                userDataDir: './browser_profile'
            });
            
            this.browser = await this.stealth.launch();
            console.log('✅ Enhanced browser initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize browser:', error);
            console.log('⚠️  Running in fallback mode');
        }
    }

    async registerCommands() {
        const commands = [
            new SlashCommandBuilder()
                .setName('vnprofile')
                .setDescription('🇻🇳 Get Vietnam region player profile')
                .addStringOption(option =>
                    option.setName('summoner')
                        .setDescription('Summoner name#TAG (e.g., RichardMille#666)')
                        .setRequired(true)),

            new SlashCommandBuilder()
                .setName('vnmatches')
                .setDescription('🇻🇳 Get recent match history')
                .addStringOption(option =>
                    option.setName('summoner')
                        .setDescription('Summoner name#TAG')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of matches (1-10)')
                        .setMinValue(1)
                        .setMaxValue(10)),

            new SlashCommandBuilder()
                .setName('vnmatch')
                .setDescription('🇻🇳 Get detailed match information')
                .addStringOption(option =>
                    option.setName('summoner')
                        .setDescription('Summoner name#TAG')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('match_index')
                        .setDescription('Match index (1 = most recent)')
                        .setMinValue(1)
                        .setMaxValue(20)),

            new SlashCommandBuilder()
                .setName('vnstats')
                .setDescription('🇻🇳 Get performance analysis')
                .addStringOption(option =>
                    option.setName('summoner')
                        .setDescription('Summoner name#TAG')
                        .setRequired(true)),

            new SlashCommandBuilder()
                .setName('vncompare')
                .setDescription('🇻🇳 Compare two players')
                .addStringOption(option =>
                    option.setName('player1')
                        .setDescription('First player name#TAG')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('player2')
                        .setDescription('Second player name#TAG')
                        .setRequired(true))
        ];

        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        try {
            console.log('🔄 Registering commands...');
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log('✅ Commands registered');
        } catch (error) {
            console.error('Error registering commands:', error);
        }
    }

    parseSummonerInput(input) {
        // Parse "Name#TAG" format
        const parts = input.split('#');
        return {
            name: parts[0] || input,
            tag: parts[1] || '666' // Default tag
        };
    }

    async handleVNProfileCommand(interaction) {
        await interaction.deferReply();

        const summonerInput = interaction.options.getString('summoner');
        const { name, tag } = this.parseSummonerInput(summonerInput);
        
        const cacheKey = `profile_vn_${name}_${tag}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const cachedData = this.cache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < 300000) {
                return await interaction.editReply({ embeds: [cachedData.embed] });
            }
        }

        const profileData = await this.scrapeVNProfileEnhanced(name, tag);

        if (!profileData.success) {
            return await this.sendError(interaction, 
                `Could not find **${name}#${tag}**\n` +
                `This might be due to:\n` +
                `• Player doesn't exist\n` +
                `• OP.GG is blocking requests (try again later)\n` +
                `• Network issues`
            );
        }

        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle(`🇻🇳 ${profileData.summonerName}`)
            .setURL(profileData.profileUrl)
            .setThumbnail(profileData.profileIcon || 'https://opgg-static.akamaized.net/images/profile_icons/profileIcon29.jpg')
            .addFields(
                { name: '🏆 Rank', value: profileData.rank || 'Unranked', inline: true },
                { name: '📈 LP', value: profileData.lp || 'N/A', inline: true },
                { name: '🎯 Win Rate', value: profileData.winRate || 'N/A', inline: true },
                { name: '📊 Record', value: `${profileData.wins || 0}W / ${profileData.losses || 0}L`, inline: true },
                { name: '⭐ Level', value: profileData.level || 'N/A', inline: true },
                { name: '🎮 Server', value: 'Vietnam', inline: true }
            )
            .setFooter({ text: 'VN Region • Data from OP.GG' })
            .setTimestamp();

        this.cache.set(cacheKey, { embed, timestamp: Date.now() });
        await interaction.editReply({ embeds: [embed] });
    }

    async scrapeVNProfileEnhanced(summonerName, tagline) {
        if (!this.browser) {
            // Try to reinitialize
            await this.initializeBrowser();
            if (!this.browser) {
                return { success: false, error: 'Browser not available' };
            }
        }

        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const page = await this.browser.newPage();
            
            try {
                // Configure page with stealth
                await this.stealth.configurePage(page);
                
                const url = `https://op.gg/lol/summoners/vn/${encodeURIComponent(summonerName)}-${tagline}`;
                console.log(`Attempt ${attempt}: Loading ${url}`);
                
                // Navigate with human behavior
                const response = await this.stealth.navigateHuman(page, url, {
                    retries: 2,
                    waitTime: 3000
                });

                if (!response || response.status() !== 200) {
                    throw new Error(`HTTP ${response?.status() || 'unknown'}`);
                }

                // Wait for content
                await page.waitForTimeout(2000);

                // Check if summoner exists
                const exists = await page.evaluate(() => {
                    return !document.body.textContent.includes('Summoner Not Found') &&
                           document.querySelector('.summoner-name, [data-testid="summoner-name"]') !== null;
                });

                if (!exists) {
                    throw new Error('Summoner not found');
                }

                // Extract data with multiple selector attempts
                const profileData = await page.evaluate(() => {
                    const data = {};

                    // Helper function to try multiple selectors
                    const getText = (selectors) => {
                        for (const selector of selectors) {
                            const element = document.querySelector(selector);
                            if (element && element.textContent) {
                                return element.textContent.trim();
                            }
                        }
                        return null;
                    };

                    const getAttr = (selectors, attr) => {
                        for (const selector of selectors) {
                            const element = document.querySelector(selector);
                            if (element) {
                                return element.getAttribute(attr);
                            }
                        }
                        return null;
                    };

                    // Extract data with fallbacks
                    data.summonerName = getText([
                        '.summoner-name',
                        '[data-testid="summoner-name"]',
                        '.profile-name',
                        'h1'
                    ]);

                    data.level = getText([
                        '.level',
                        '.summoner-level',
                        '[class*="level"]'
                    ]);

                    data.rank = getText([
                        '.tier-rank',
                        '.tier',
                        '[class*="tier"]'
                    ]);

                    data.lp = getText([
                        '.lp',
                        '.league-points',
                        '[class*="lp"]'
                    ]);

                    data.winRate = getText([
                        '.win-rate',
                        '.winrate',
                        '[class*="win-rate"]'
                    ]);

                    // Try to extract wins/losses
                    const winsText = getText(['.wins', '[class*="win"]']);
                    const lossesText = getText(['.losses', '[class*="loss"]']);
                    
                    data.wins = winsText ? winsText.match(/\d+/)?.[0] : null;
                    data.losses = lossesText ? lossesText.match(/\d+/)?.[0] : null;

                    // Profile icon
                    data.profileIcon = getAttr([
                        '.profile-icon img',
                        '.summoner-icon img',
                        '[class*="profile"] img'
                    ], 'src');

                    return data;
                });

                profileData.success = true;
                profileData.profileUrl = url;

                console.log(`✅ Successfully scraped data for ${summonerName}#${tagline}`);
                return profileData;

            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error.message);
                lastError = error;
                
                if (attempt < maxRetries) {
                    // Wait before retry with exponential backoff
                    await page.waitForTimeout(2000 * attempt);
                }
                
            } finally {
                await page.close();
            }
        }

        console.error(`Failed after ${maxRetries} attempts:`, lastError?.message);
        return { success: false, error: lastError?.message };
    }

    // ... (rest of the methods remain similar but use the enhanced scraping approach)

    async sendError(interaction, message) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Error')
            .setDescription(message)
            .setFooter({ text: 'Try using a VPN or wait a few minutes' });
        
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }

    async shutdown() {
        if (this.browser) {
            await this.browser.close();
        }
        this.client.destroy();
    }
}

// Initialize bot
const vnBot = new VNOPGGBotEnhanced();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down...');
    await vnBot.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down...');
    await vnBot.shutdown();
    process.exit(0);
});