const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, AttachmentBuilder } = require('discord.js');
const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

class VNOPGGBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
        
        this.browser = null;
        this.cache = new Map(); // Cache for recent lookups
        this.setupBot();
    }

    async setupBot() {
        await this.registerCommands();
        
        this.client.once('ready', () => {
            console.log(`🇻🇳 VN OP.GG Bot ready! Logged in as ${this.client.user.tag}`);
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
                await this.sendError(interaction, 'An error occurred while processing your request.');
            }
        });

        this.client.login(process.env.DISCORD_TOKEN);
    }

    async initializeBrowser() {
        try {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            console.log('🌐 Browser initialized for VN region');
        } catch (error) {
            console.error('Failed to initialize browser:', error);
        }
    }

    async registerCommands() {
        const commands = [
            new SlashCommandBuilder()
                .setName('vnprofile')
                .setDescription('🇻🇳 Get Vietnam region player profile with rank and stats')
                .addStringOption(option =>
                    option.setName('summoner')
                        .setDescription('Summoner name (Vietnam server)')
                        .setRequired(true)),

            new SlashCommandBuilder()
                .setName('vnmatches')
                .setDescription('🇻🇳 Get recent match history with OP Scores')
                .addStringOption(option =>
                    option.setName('summoner')
                        .setDescription('Summoner name (Vietnam server)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of matches to show (1-10)')
                        .setMinValue(1)
                        .setMaxValue(10)),

            new SlashCommandBuilder()
                .setName('vnmatch')
                .setDescription('🇻🇳 Get detailed match information with full statistics')
                .addStringOption(option =>
                    option.setName('summoner')
                        .setDescription('Summoner name (Vietnam server)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('match_index')
                        .setDescription('Match index (1 for most recent)')
                        .setMinValue(1)
                        .setMaxValue(20)),

            new SlashCommandBuilder()
                .setName('vnstats')
                .setDescription('🇻🇳 Get comprehensive performance analysis')
                .addStringOption(option =>
                    option.setName('summoner')
                        .setDescription('Summoner name (Vietnam server)')
                        .setRequired(true)),

            new SlashCommandBuilder()
                .setName('vncompare')
                .setDescription('🇻🇳 Compare two Vietnam region players')
                .addStringOption(option =>
                    option.setName('player1')
                        .setDescription('First player name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('player2')
                        .setDescription('Second player name')
                        .setRequired(true))
        ];

        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        try {
            console.log('🔄 Registering VN OP.GG commands...');
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log('✅ VN OP.GG commands registered successfully.');
        } catch (error) {
            console.error('Error registering commands:', error);
        }
    }

    async handleVNProfileCommand(interaction) {
        await interaction.deferReply();

        const summoner = interaction.options.getString('summoner');
        const cacheKey = `profile_vn_${summoner}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cachedData = this.cache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < 300000) { // 5 minutes
                return await interaction.editReply({ embeds: [cachedData.embed] });
            }
        }

        const profileData = await this.scrapeVNProfile(summoner);

        if (!profileData.success) {
            return await this.sendError(interaction, `Could not find profile for **${summoner}** in Vietnam region`);
        }

        const embed = new EmbedBuilder()
            .setColor('#ff6b35') // Vietnam flag red-orange
            .setTitle(`🇻🇳 ${profileData.summonerName}`)
            .setURL(profileData.profileUrl)
            .setThumbnail(profileData.profileIcon)
            .addFields(
                { name: '🏆 Rank', value: profileData.rank || 'Unranked', inline: true },
                { name: '📈 LP', value: profileData.lp || 'N/A', inline: true },
                { name: '🎯 Win Rate', value: profileData.winRate || 'N/A', inline: true },
                { name: '📊 Record', value: `${profileData.wins || 0}W / ${profileData.losses || 0}L`, inline: true },
                { name: '⭐ Level', value: profileData.level || 'N/A', inline: true },
                { name: '🥇 Ladder Rank', value: profileData.ladderRank ? `#${profileData.ladderRank}` : 'N/A', inline: true },
                { name: '🏅 Most Played', value: profileData.mostPlayed || 'N/A', inline: true },
                { name: '📈 Recent Form', value: profileData.recentForm || 'N/A', inline: true },
                { name: '🎮 Server', value: 'Vietnam', inline: true }
            )
            .setFooter({ text: 'VN Region • Data from OP.GG' })
            .setTimestamp();

        // Cache the result
        this.cache.set(cacheKey, { embed, timestamp: Date.now() });

        await interaction.editReply({ embeds: [embed] });
    }

    async handleVNMatchesCommand(interaction) {
        await interaction.deferReply();

        const summoner = interaction.options.getString('summoner');
        const count = interaction.options.getInteger('count') || 5;

        const matchData = await this.scrapeVNMatches(summoner);

        if (!matchData.success) {
            return await this.sendError(interaction, `Could not find matches for **${summoner}** in Vietnam region`);
        }

        const embed = new EmbedBuilder()
            .setColor('#da020e') // Vietnam flag red
            .setTitle(`🇻🇳 Recent Matches - ${matchData.summonerName}`)
            .setURL(matchData.profileUrl)
            .setDescription(`Showing last ${Math.min(matchData.matches.length, count)} matches`);

        matchData.matches.slice(0, count).forEach((match, index) => {
            const result = match.result === 'Win' ? '🏆' : '💀';
            const badge = match.badge ? ` ${match.badge === 'MVP' ? '👑' : '⭐'}` : '';
            const kda = `${match.kills}/${match.deaths}/${match.assists}`;
            const opScore = match.opScore ? ` | OP: ${match.opScore}/10` : '';
            const damage = match.damageDealt ? ` | DMG: ${match.damageDealt}` : '';
            
            embed.addFields({
                name: `${result} Match ${index + 1}${badge}`,
                value: `**${match.champion}** (${match.gameMode})\nKDA: ${kda}${opScore}\n${damage}\n*${match.timeAgo}* | ${match.duration}`,
                inline: false
            });
        });

        // Add summary statistics
        const avgOpScore = this.calculateAverageOpScore(matchData.matches.slice(0, count));
        const mvpCount = matchData.matches.slice(0, count).filter(m => m.badge === 'MVP').length;
        const winRate = Math.round((matchData.matches.slice(0, count).filter(m => m.result === 'Win').length / count) * 100);

        embed.addFields({
            name: '📊 Recent Performance Summary',
            value: `Win Rate: ${winRate}% | Avg OP Score: ${avgOpScore}/10 | MVP Games: ${mvpCount}`,
            inline: false
        });

        embed.setFooter({ text: `VN Region • ${matchData.matches.length} total matches tracked` });

        await interaction.editReply({ embeds: [embed] });
    }

    async handleVNMatchCommand(interaction) {
        await interaction.deferReply();

        const summoner = interaction.options.getString('summoner');
        const matchIndex = interaction.options.getInteger('match_index') || 1;

        const matchData = await this.scrapeVNMatches(summoner);

        if (!matchData.success || !matchData.matches[matchIndex - 1]) {
            return await this.sendError(interaction, `Could not find match #${matchIndex} for **${summoner}**`);
        }

        const match = matchData.matches[matchIndex - 1];
        await this.sendDetailedMatch(interaction, match, matchData.summonerName, matchIndex);
    }

    async handleVNStatsCommand(interaction) {
        await interaction.deferReply();

        const summoner = interaction.options.getString('summoner');
        
        const profileData = await this.scrapeVNProfile(summoner);
        const matchData = await this.scrapeVNMatches(summoner);

        if (!profileData.success || !matchData.success) {
            return await this.sendError(interaction, `Could not analyze stats for **${summoner}**`);
        }

        const stats = this.calculateComprehensiveStats(matchData.matches, profileData);
        await this.sendStatsAnalysis(interaction, stats, profileData);
    }

    async handleVNCompareCommand(interaction) {
        await interaction.deferReply();

        const player1 = interaction.options.getString('player1');
        const player2 = interaction.options.getString('player2');

        const [data1, data2] = await Promise.all([
            this.scrapeVNProfile(player1),
            this.scrapeVNProfile(player2)
        ]);

        if (!data1.success || !data2.success) {
            return await this.sendError(interaction, 'Could not find one or both players');
        }

        await this.sendPlayerComparison(interaction, data1, data2);
    }

    async scrapeVNProfile(summonerName) {
        if (!this.browser) {
            return { success: false, error: 'Browser not initialized' };
        }

        const page = await this.browser.newPage();
        
        try {
            // VN region specific URL
            const url = `https://op.gg/lol/summoners/vn/${encodeURIComponent(summonerName)}`;
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Wait for content to load
            await page.waitForTimeout(5000);

            // Enhanced profile data extraction for VN region
            const profileData = await page.evaluate(() => {
                const data = {};

                // Multiple selectors for robustness
                const nameSelectors = ['.summoner-name', '.profile-name', '[data-testid="summoner-name"]'];
                const nameElement = nameSelectors.map(s => document.querySelector(s)).find(e => e);
                data.summonerName = nameElement ? nameElement.textContent.trim() : '';

                // Profile icon with fallbacks
                const iconSelectors = ['.profile-icon img', '.summoner-icon img', '.player-icon img'];
                const iconElement = iconSelectors.map(s => document.querySelector(s)).find(e => e);
                data.profileIcon = iconElement ? iconElement.src : '';

                // Level extraction
                const levelSelectors = ['.level', '.summoner-level', '.player-level'];
                const levelElement = levelSelectors.map(s => document.querySelector(s)).find(e => e);
                data.level = levelElement ? levelElement.textContent.trim() : '';

                // Rank information with multiple approaches
                const tierElement = document.querySelector('.tier');
                const rankElement = document.querySelector('.rank');
                if (tierElement && rankElement) {
                    data.rank = `${tierElement.textContent.trim()} ${rankElement.textContent.trim()}`;
                } else {
                    // Fallback rank detection
                    const rankText = document.querySelector('.rank-info, .tier-info');
                    data.rank = rankText ? rankText.textContent.trim() : 'Unranked';
                }

                // LP extraction
                const lpSelectors = ['.lp', '.league-points', '.rank-lp'];
                const lpElement = lpSelectors.map(s => document.querySelector(s)).find(e => e);
                data.lp = lpElement ? lpElement.textContent.trim() : '';

                // Win rate
                const winRateSelectors = ['.win-rate', '.winrate', '.win-ratio'];
                const winRateElement = winRateSelectors.map(s => document.querySelector(s)).find(e => e);
                data.winRate = winRateElement ? winRateElement.textContent.trim() : '';

                // Wins and losses with regex extraction
                const winsElement = document.querySelector('.wins');
                const lossesElement = document.querySelector('.losses');
                data.wins = winsElement ? winsElement.textContent.match(/\d+/)?.[0] : '0';
                data.losses = lossesElement ? lossesElement.textContent.match(/\d+/)?.[0] : '0';

                // Ladder rank (VN specific)
                const ladderElement = document.querySelector('.ladder-rank');
                if (ladderElement) {
                    data.ladderRank = ladderElement.textContent.match(/[\d,]+/)?.[0];
                }

                // Most played champion
                const championSelectors = ['.champion-name', '.most-champion', '.main-champion'];
                const championElement = championSelectors.map(s => document.querySelector(s)).find(e => e);
                data.mostPlayed = championElement ? championElement.textContent.trim() : '';

                // Recent form (W/L streak)
                const formElements = document.querySelectorAll('.game-result');
                if (formElements.length > 0) {
                    const recentResults = Array.from(formElements).slice(0, 5).map(el => 
                        el.classList.contains('win') ? 'W' : 'L'
                    );
                    data.recentForm = recentResults.join('');
                }

                return data;
            });

            profileData.success = true;
            profileData.profileUrl = url;

            return profileData;

        } catch (error) {
            console.error('VN Profile scraping error:', error);
            return { success: false, error: error.message };
        } finally {
            await page.close();
        }
    }

    async scrapeVNMatches(summonerName) {
        if (!this.browser) {
            return { success: false, error: 'Browser not initialized' };
        }

        const page = await this.browser.newPage();
        
        try {
            const url = `https://op.gg/lol/summoners/vn/${encodeURIComponent(summonerName)}`;
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            await page.waitForTimeout(5000);

            const matchData = await page.evaluate(() => {
                const data = { matches: [] };

                const nameElement = document.querySelector('.summoner-name');
                data.summonerName = nameElement ? nameElement.textContent.trim() : '';

                const matchElements = document.querySelectorAll('.game-item, .match-item, .game-history-item');
                
                matchElements.forEach(match => {
                    const matchInfo = {};

                    // Win/Loss detection
                    matchInfo.result = match.classList.contains('win') ? 'Win' : 'Loss';

                    // Champion information
                    const championElement = match.querySelector('.champion-name, .champ-name');
                    matchInfo.champion = championElement ? championElement.textContent.trim() : '';

                    const championIconElement = match.querySelector('.champion-image img, .champ-img img');
                    matchInfo.championIcon = championIconElement ? championIconElement.src : '';

                    // KDA parsing with enhanced regex
                    const kdaElement = match.querySelector('.kda, .match-kda, .score');
                    if (kdaElement) {
                        const kdaText = kdaElement.textContent.trim();
                        const kdaMatch = kdaText.match(/(\d+)[\/\s]*(\d+)[\/\s]*(\d+)/);
                        if (kdaMatch) {
                            matchInfo.kills = kdaMatch[1];
                            matchInfo.deaths = kdaMatch[2];
                            matchInfo.assists = kdaMatch[3];
                            
                            // Calculate KDA ratio
                            const deaths = parseInt(matchInfo.deaths) || 1;
                            matchInfo.kda_ratio = ((parseInt(matchInfo.kills) + parseInt(matchInfo.assists)) / deaths).toFixed(2);
                        }
                    }

                    // OP Score extraction (0-10 scale)
                    const opScoreElement = match.querySelector('.op-score, .match-score, .performance-score');
                    if (opScoreElement) {
                        const scoreText = opScoreElement.textContent.trim();
                        const scoreMatch = scoreText.match(/(\d+\.?\d*)/);
                        if (scoreMatch) {
                            matchInfo.opScore = parseFloat(scoreMatch[1]).toFixed(1);
                        }
                    }

                    // Badge detection (MVP/ACE)
                    const badgeElement = match.querySelector('.mvp, .ace, .badge');
                    if (badgeElement) {
                        if (badgeElement.classList.contains('mvp') || badgeElement.textContent.includes('MVP')) {
                            matchInfo.badge = 'MVP';
                        } else if (badgeElement.classList.contains('ace') || badgeElement.textContent.includes('ACE')) {
                            matchInfo.badge = 'ACE';
                        }
                    }

                    // Game mode
                    const gameModeElement = match.querySelector('.game-mode, .queue-type');
                    matchInfo.gameMode = gameModeElement ? gameModeElement.textContent.trim() : 'Unknown';

                    // Duration
                    const durationElement = match.querySelector('.game-length, .match-duration, .game-time');
                    matchInfo.duration = durationElement ? durationElement.textContent.trim() : '';

                    // Time ago
                    const timeElement = match.querySelector('.game-time, .match-time, .time-ago');
                    matchInfo.timeAgo = timeElement ? timeElement.textContent.trim() : '';

                    // Individual statistics
                    const csElement = match.querySelector('.cs, .minion-kill');
                    if (csElement) {
                        matchInfo.cs = csElement.textContent.match(/\d+/)?.[0] || '0';
                    }

                    const visionElement = match.querySelector('.vision-score, .ward-score');
                    if (visionElement) {
                        matchInfo.visionScore = visionElement.textContent.match(/\d+/)?.[0] || '0';
                    }

                    // Damage dealt
                    const damageElement = match.querySelector('.damage, .total-damage');
                    if (damageElement) {
                        matchInfo.damageDealt = damageElement.textContent.trim();
                    }

                    // Items
                    const itemElements = match.querySelectorAll('.item img, .build-item img');
                    const items = Array.from(itemElements)
                        .map(img => img.alt || img.title)
                        .filter(Boolean)
                        .slice(0, 6);
                    matchInfo.items = items.length > 0 ? items.join(', ') : '';

                    // Only add matches with valid data
                    if (matchInfo.champion) {
                        data.matches.push(matchInfo);
                    }
                });

                return data;
            });

            matchData.success = true;
            matchData.profileUrl = url;

            return matchData;

        } catch (error) {
            console.error('VN Match scraping error:', error);
            return { success: false, error: error.message };
        } finally {
            await page.close();
        }
    }

    async sendDetailedMatch(interaction, match, summonerName, matchIndex) {
        const result = match.result === 'Win' ? '🏆' : '💀';
        const color = match.result === 'Win' ? '#00ff00' : '#ff6347';
        const badge = match.badge ? (match.badge === 'MVP' ? '👑 MVP' : '⭐ ACE') : '';

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`🇻🇳 ${result} ${match.champion} - Match ${matchIndex} ${badge}`)
            .setThumbnail(match.championIcon)
            .setURL(`https://op.gg/lol/summoners/vn/${encodeURIComponent(summonerName)}`)
            .addFields(
                { name: '📊 KDA', value: `${match.kills}/${match.deaths}/${match.assists} (${match.kda_ratio} ratio)`, inline: true },
                { name: '🎯 OP Score', value: match.opScore ? `${match.opScore}/10` : 'N/A', inline: true },
                { name: '🎮 Mode', value: match.gameMode, inline: true },
                { name: '⏱️ Duration', value: match.duration, inline: true },
                { name: '⏰ Played', value: match.timeAgo, inline: true },
                { name: '🌾 CS', value: match.cs || 'N/A', inline: true }
            );

        if (match.visionScore) {
            embed.addFields({ name: '👁️ Vision Score', value: match.visionScore, inline: true });
        }

        if (match.damageDealt) {
            embed.addFields({ name: '⚔️ Damage', value: match.damageDealt, inline: true });
        }

        if (match.items) {
            embed.addFields({ name: '🗡️ Items', value: match.items, inline: false });
        }

        embed.setFooter({ text: `VN Region • Match ${matchIndex} for ${summonerName}` });

        await interaction.editReply({ embeds: [embed] });
    }

    calculateAverageOpScore(matches) {
        const validScores = matches.filter(m => m.opScore).map(m => parseFloat(m.opScore));
        if (validScores.length === 0) return 'N/A';
        return (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1);
    }

    calculateComprehensiveStats(matches, profileData) {
        const recentMatches = matches.slice(0, 20);
        
        return {
            totalMatches: recentMatches.length,
            winRate: Math.round((recentMatches.filter(m => m.result === 'Win').length / recentMatches.length) * 100),
            averageOpScore: this.calculateAverageOpScore(recentMatches),
            mvpCount: recentMatches.filter(m => m.badge === 'MVP').length,
            aceCount: recentMatches.filter(m => m.badge === 'ACE').length,
            mostPlayedChamps: this.getMostPlayedChampions(recentMatches),
            bestPerformances: recentMatches
                .filter(m => m.opScore)
                .sort((a, b) => parseFloat(b.opScore) - parseFloat(a.opScore))
                .slice(0, 3),
            profileData
        };
    }

    getMostPlayedChampions(matches) {
        const champCounts = {};
        matches.forEach(match => {
            if (match.champion) {
                champCounts[match.champion] = (champCounts[match.champion] || 0) + 1;
            }
        });

        return Object.entries(champCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([champ, count]) => `${champ} (${count})`);
    }

    async sendStatsAnalysis(interaction, stats, profileData) {
        const embed = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle(`🇻🇳 Performance Analysis - ${profileData.summonerName}`)
            .setThumbnail(profileData.profileIcon)
            .addFields(
                { name: '📈 Recent Form', value: `${stats.winRate}% WR in ${stats.totalMatches} games`, inline: true },
                { name: '🎯 Avg OP Score', value: stats.averageOpScore + '/10', inline: true },
                { name: '🏆 Awards', value: `${stats.mvpCount} MVP, ${stats.aceCount} ACE`, inline: true },
                { name: '🏅 Current Rank', value: profileData.rank || 'Unranked', inline: true },
                { name: '📊 LP', value: profileData.lp || 'N/A', inline: true },
                { name: '🎮 Server', value: 'Vietnam', inline: true },
                { name: '👑 Most Played', value: stats.mostPlayedChamps.join('\n') || 'N/A', inline: true },
                { name: '⭐ Best Performances', value: stats.bestPerformances.map(m => 
                    `${m.champion}: ${m.opScore}/10`).join('\n') || 'N/A', inline: true },
                { name: '🔄 Recent Form', value: profileData.recentForm ? 
                    profileData.recentForm.split('').map(r => r === 'W' ? '🟢' : '🔴').join('') : 'N/A', inline: true }
            )
            .setFooter({ text: 'VN Region • Comprehensive Analysis' });

        await interaction.editReply({ embeds: [embed] });
    }

    async sendPlayerComparison(interaction, player1, player2) {
        const embed = new EmbedBuilder()
            .setColor('#da020e')
            .setTitle(`🇻🇳 Player Comparison`)
            .addFields(
                { name: '👤 Player 1', value: player1.summonerName, inline: true },
                { name: '👤 Player 2', value: player2.summonerName, inline: true },
                { name: '━━━━━━━━━━', value: '​', inline: false },
                { name: '🏆 Rank', value: player1.rank || 'Unranked', inline: true },
                { name: '🏆 Rank', value: player2.rank || 'Unranked', inline: true },
                { name: '━━━━━━━━━━', value: '​', inline: false },
                { name: '📈 LP', value: player1.lp || 'N/A', inline: true },
                { name: '📈 LP', value: player2.lp || 'N/A', inline: true },
                { name: '━━━━━━━━━━', value: '​', inline: false },
                { name: '🎯 Win Rate', value: player1.winRate || 'N/A', inline: true },
                { name: '🎯 Win Rate', value: player2.winRate || 'N/A', inline: true }
            )
            .setFooter({ text: 'VN Region • Player Comparison' });

        await interaction.editReply({ embeds: [embed] });
    }

    async sendError(interaction, message) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Error')
            .setDescription(message)
            .setFooter({ text: 'VN Region OP.GG Bot' });
        
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

// Initialize the VN OP.GG bot
const vnBot = new VNOPGGBot();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down VN OP.GG bot...');
    await vnBot.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down VN OP.GG bot...');
    await vnBot.shutdown();
    process.exit(0);
});