const { Client, Collection, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');
const { initDatabase, getGuildSettings, logCommand } = require('./src/database');
const { getQueue } = require('./utils/QueueManager');
const { getCachedGuildSettings, setupCacheCleanup } = require('./utils/CacheManager');
const { setupDistube } = require('./src/DistubePlayer');
// Removed Lavalink dependency for better reliability
const { handlePlayCommand, handleSkipCommand, handleStopCommand, handleQueueCommand, handleStatusCommand, handleHelpCommand, handlePauseCommand, handleResumeCommand, handleVolumeCommand, handleJoinCommand, handleLeaveCommand, handleLoopCommand, handleShuffleCommand, handleClearCommand, handleRemoveCommand, handleMoveCommand, handleNowPlayingCommand, handleAutoplayCommand } = require('./src/CommandHandlers');
const { handleButtonInteraction } = require('./src/ButtonHandlers');
const config = require('./config/botConfig');
const fs = require('fs');
const path = require('path');

// Start health check server for deployment
require('./utils/health');

// Initialize 24/7 Keep-Alive System
const KeepAliveSystem = require('./utils/KeepAlive');

// Initialize bot client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Create keep-alive instance
const keepAlive = new KeepAliveSystem(client);

// Initialize global variables
global.client = client;
global.queues = new Map();
global.players = new Map();
global.audioPlayers = new Map();
global.connections = new Map();
global.guildSettingsCache = new Map();
global.searchResultsCache = new Map();
global.lastCacheClean = Date.now();

// Initialize DisTube for reliable music playback
global.distube = setupDistube(client);

// Make getQueue globally available
global.getQueue = getQueue;

// Add missing global function that slash commands expect
global.createGuildAudioPlayer = function(guildId) {
    // Return the existing player or null if it doesn't exist
    return global.audioPlayers.get(guildId) || null;
};

global.playNext = async function(guildId) {
    const queue = global.getQueue(guildId);
    const nextTrack = queue.next();
    
    if (nextTrack) {
        const { playFallbackTrack } = require('./src/MusicPlayer');
        const { toUnifiedTrack } = require('./utils/TrackHelpers');
        
        const unifiedTrack = toUnifiedTrack(nextTrack, 'fallback');
        queue.nowPlaying = unifiedTrack;
        
        const success = await playFallbackTrack(guildId, nextTrack);
        return success;
    }
    return false;
};

// Perform startup cleanup
performStartupCleanup();

// Initialize database with error handling
try {
    initDatabase();
} catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('🔄 Bot will continue without database features...');
}

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
}

// Bot Events
client.on('ready', async () => {
    console.log(`🎵 ${client.user.username} music bot is online!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);

    // Using enhanced streaming methods with anti-detection for maximum reliability
    console.log('🎵 Using enhanced streaming methods with anti-detection...');

    // Register slash commands
    try {
        await registerSlashCommands();
    } catch (error) {
        console.error('⚠️ Slash command registration failed:', error.message);
    }

    // Setup cache cleanup and idle cleanup
    setupCacheCleanup();
    setupIdleCleanup();

    // Start 24/7 keep-alive system
    keepAlive.start24_7Mode();
    keepAlive.setupGracefulShutdown();
});

// Handle prefix and slash commands
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const guildSettings = getCachedGuildSettings(message.guild.id);
    const prefix = guildSettings.prefix;

    // Check for prefix command or @bot mention
    const isMention = message.mentions.has(client.user);
    const isPrefix = message.content.startsWith(prefix);
    
    if (!isPrefix && !isMention) return;

    let args, commandName;
    
    if (isMention) {
        const cleanContent = message.content.replace(`<@${client.user.id}>`, '').replace(`<@!${client.user.id}>`, '').trim();
        args = cleanContent.split(/ +/);
        commandName = args.shift()?.toLowerCase();
        
        if (!commandName) {
            commandName = 'help';
            args = [];
        }
    } else {
        args = message.content.slice(prefix.length).trim().split(/ +/);
        commandName = args.shift().toLowerCase();
    }

    // Check for command aliases
    const actualCommand = config.ALIASES[commandName] || commandName;

    // Log command usage
    try {
        logCommand(message.guild.id, message.author.id, actualCommand);
    } catch (error) {
        console.log('Command logging failed:', error.message);
    }

    try {
        await handleCommand(actualCommand, message, args, guildSettings);
    } catch (error) {
        console.error('Command execution error:', error);
        
        const embed = new EmbedBuilder()
            .setTitle(`${config.EMOJIS.ERROR} Error`)
            .setDescription(config.MESSAGES[guildSettings.language || 'hi'].ERROR_OCCURRED)
            .setColor(config.COLORS.ERROR);

        await message.reply({ embeds: [embed] });
    }
});

// Handle slash commands and button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    const guildSettings = getCachedGuildSettings(interaction.guild.id);

    try {
        if (interaction.isChatInputCommand()) {
            // Log command usage
            try {
                logCommand(interaction.guild.id, interaction.user.id, interaction.commandName);
            } catch (error) {
                console.log('Command logging failed:', error.message);
            }
            await handleSlashCommand(interaction, guildSettings);
        } else if (interaction.isButton()) {
            await handleButtonInteraction(interaction, guildSettings);
        }
    } catch (error) {
        console.error('Interaction error:', error);
        
        const embed = new EmbedBuilder()
            .setTitle(`${config.EMOJIS.ERROR} Error`)
            .setDescription(config.MESSAGES[guildSettings.language || 'hi'].ERROR_OCCURRED)
            .setColor(config.COLORS.ERROR);

        const replyOptions = { embeds: [embed], ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    }
});

// Command handler router
async function handleCommand(command, message, args, guildSettings) {
    switch (command) {
        case 'play':
        case 'p':
            await handlePlayCommand(message, args, guildSettings);
            break;
        
        case 'skip':
        case 's':
            await handleSkipCommand(message, guildSettings);
            break;
        
        case 'stop':
        case 'st':
        case 'stp':
            await handleStopCommand(message, guildSettings);
            break;
        
        case 'status':
            await handleStatusCommand(message, guildSettings);
            break;
        
        case 'queue':
        case 'q':
            await handleQueueCommand(message, guildSettings);
            break;
        
        case 'help':
        case 'h':
            await handleHelpCommand(message, guildSettings);
            break;
            
        case 'pause':
        case 'ps':
            await handlePauseCommand(message, guildSettings);
            break;
            
        case 'resume':
        case 'r':
            await handleResumeCommand(message, guildSettings);
            break;
            
        case 'volume':
        case 'v':
            await handleVolumeCommand(message, args, guildSettings);
            break;
            
        case 'join':
        case 'j':
            await handleJoinCommand(message, guildSettings);
            break;
            
        case 'leave':
        case 'lv':
            await handleLeaveCommand(message, guildSettings);
            break;
            
        case 'loop':
        case 'l':
            await handleLoopCommand(message, args, guildSettings);
            break;
            
        case 'shuffle':
        case 'sh':
            await handleShuffleCommand(message, guildSettings);
            break;
            
        case 'clear':
        case 'cl':
            await handleClearCommand(message, guildSettings);
            break;
            
        case 'remove':
        case 'rm':
            await handleRemoveCommand(message, args, guildSettings);
            break;
            
        case 'move':
        case 'mv':
            await handleMoveCommand(message, args, guildSettings);
            break;
            
        case 'nowplaying':
        case 'np':
        case 'current':
            await handleNowPlayingCommand(message, guildSettings);
            break;
            
        case 'autoplay':
        case 'ap':
            await handleAutoplayCommand(message, guildSettings);
            break;
        
        default:
            const embed = new EmbedBuilder()
                .setTitle(`${config.EMOJIS.ERROR} Unknown Command`)
                .setDescription(`Command \`${command}\` not found! Use \`${guildSettings.prefix}help\` for available commands.`)
                .setColor(config.COLORS.ERROR);
            await message.reply({ embeds: [embed] });
    }
}

// Slash command handler with proper routing
async function handleSlashCommand(interaction, guildSettings) {
    const commandName = interaction.commandName;
    const commandsPath = path.join(__dirname, 'commands');
    const commandFile = path.join(commandsPath, `${commandName}.js`);
    
    try {
        // Check if command file exists
        if (fs.existsSync(commandFile)) {
            const command = require(commandFile);
            
            // Validate command structure
            if (!command.execute || typeof command.execute !== 'function') {
                throw new Error(`Command ${commandName} is missing execute function`);
            }
            
            // Execute command
            await command.execute(interaction);
        } else {
            // Fallback for commands that don't have slash command files
            await interaction.reply({ 
                content: `⚠️ Slash command \`/${commandName}\` is not fully implemented yet.\n\nPlease use prefix command: \`${guildSettings.prefix}${commandName}\``,
                ephemeral: true 
            });
        }
    } catch (error) {
        console.error(`❌ Error executing slash command ${commandName}:`, error);
        const errorMsg = error.message?.slice(0, 200) || 'Unknown error occurred';
        
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ 
                    content: `❌ Error: ${errorMsg}`,
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: `❌ Error: ${errorMsg}`,
                    ephemeral: true 
                });
            }
        } catch (e) {
            console.error('❌ Failed to send error reply:', e.message);
        }
    }
}

// Register slash commands
async function registerSlashCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    const commands = [];
    let registeredCount = 0;
    let failedCount = 0;
    
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    console.log(`📂 Found ${commandFiles.length} command files`);
    
    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsPath, file));
            
            // Validate command structure
            if (command.data && typeof command.data.toJSON === 'function') {
                commands.push(command.data.toJSON());
                registeredCount++;
                console.log(`  ✅ ${command.data.name}`);
            } else {
                console.log(`  ⏭️ ${file} - No slash command data`);
            }
        } catch (error) {
            failedCount++;
            console.error(`  ❌ ${file} - ${error.message}`);
        }
    }
    
    console.log(`\n📊 Summary: ${registeredCount} registered, ${failedCount} failed, ${commandFiles.length - registeredCount - failedCount} skipped`);

    try {
        console.log('🔄 Refreshing application commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Application commands registered successfully!');
    } catch (error) {
        console.error('❌ Failed to register application commands:', error);
    }
}

// Setup idle cleanup for inactive players
function setupIdleCleanup() {
    setInterval(() => {
        const now = Date.now();
        const idleTimeout = 5 * 60 * 1000; // 5 minutes
        
        for (const [guildId, queue] of global.queues.entries()) {
            if (now - queue.lastActivity > idleTimeout && queue.isEmpty() && !queue.nowPlaying) {
                console.log(`🧹 Cleaning up idle queue for guild ${guildId}`);
                
                // Cleanup audio player
                const player = global.audioPlayers.get(guildId);
                if (player) {
                    try {
                        player.stop();
                        global.audioPlayers.delete(guildId);
                    } catch (error) {
                        console.log(`Idle cleanup player warning: ${error.message}`);
                    }
                }
                
                // Cleanup connection
                const connection = global.connections.get(guildId);
                if (connection) {
                    try {
                        connection.destroy();
                        global.connections.delete(guildId);
                    } catch (error) {
                        console.log(`Idle cleanup connection warning: ${error.message}`);
                    }
                }
                
                // Remove queue
                global.queues.delete(guildId);
            }
        }
    }, 60000); // Check every minute
    
    console.log('🧹 Idle cleanup scheduler initialized');
}

// Startup cleanup function
function performStartupCleanup() {
    try {
        const fs = require('fs');
        
        // Clean up any existing HTML garbage files
        const files = fs.readdirSync('.');
        const htmlFiles = files.filter(f => f.includes('watch') && f.endsWith('.html'));
        
        if (htmlFiles.length > 0) {
            htmlFiles.forEach(file => {
                try {
                    fs.unlinkSync(file);
                    console.log(`🧹 Startup cleanup: removed ${file}`);
                } catch (err) {
                    console.log(`Warning: Could not delete ${file}`);
                }
            });
            console.log(`🧹 Startup cleanup completed: removed ${htmlFiles.length} garbage files`);
        }
    } catch (error) {
        console.log('Startup cleanup warning:', error.message);
    }
}

// Enhanced Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    if (error.message && error.message.includes('Lavalink')) {
        console.log('🎵 Switching to fallback mode due to Lavalink error');
    }
});

// Login
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is required! Please set it in your environment variables.');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);