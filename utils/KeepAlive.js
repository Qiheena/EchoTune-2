const http = require('http');
const config = require('../config/botConfig');

class KeepAliveSystem {
    constructor(client) {
        this.client = client;
        this.server = null;
        this.checkInterval = null;
    }

    // Start HTTP server for health checks
    startServer() {
        const PORT = config.DEPLOYMENT.PORT || 3000;

        this.server = http.createServer((req, res) => {
            if (req.url === '/health' || req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    uptime: process.uptime(),
                    bot: {
                        username: this.client.user?.tag || 'Not ready',
                        guilds: this.client.guilds.cache.size,
                        users: this.client.users.cache.size,
                        status: this.client.ws.status === 0 ? 'Ready' : 'Not Ready'
                    },
                    timestamp: new Date().toISOString()
                }));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });

        this.server.listen(PORT, () => {
            console.log(`✅ Health check server running on port ${PORT}`);
        });
    }

    // Start 24/7 monitoring
    start24_7Mode() {
        if (!config.FEATURES.ENABLE_24_7_MODE) return;

        console.log('🔄 Starting 24/7 mode...');

        // Check for guilds with 24/7 mode enabled
        this.checkInterval = setInterval(() => {
            this.check24_7Guilds();
        }, config.TWENTYFOUR_SEVEN.CHECK_INTERVAL);

        console.log('✅ 24/7 mode monitoring started');
    }

    // Check guilds with 24/7 mode and rejoin if needed
    async check24_7Guilds() {
        try {
            const { db } = require('../src/database');
            const { getVoiceConnection } = require('@discordjs/voice');
            
            // Get all guilds with 24/7 mode enabled
            const guilds = db.prepare('SELECT * FROM guild_settings WHERE twentyfour_seven = 1').all();

            for (const guildData of guilds) {
                const guild = this.client.guilds.cache.get(guildData.guild_id);
                if (!guild) continue;

                const queue = global.queues?.get(guild.id);
                const voiceConnection = getVoiceConnection(guild.id) || global.connections?.get(guild.id);

                // If bot is not in voice but 24/7 mode is on, try to rejoin with backoff
                if (!voiceConnection && config.TWENTYFOUR_SEVEN.ENABLE_AUTO_REJOIN) {
                    // Check if we recently attempted to join (prevent runaway reconnections)
                    const lastAttempt = this.lastJoinAttempt?.get(guild.id) || 0;
                    const now = Date.now();
                    if (now - lastAttempt < 60000) continue; // Backoff: wait 1 minute between attempts

                    // Try to find a suitable voice channel
                    const voiceChannel = guild.channels.cache.find(
                        ch => ch.type === 2 && ch.members.size > 0 // Type 2 = GUILD_VOICE
                    );

                    if (voiceChannel) {
                        try {
                            const { joinVoiceChannel } = require('@discordjs/voice');
                            
                            const connection = joinVoiceChannel({
                                channelId: voiceChannel.id,
                                guildId: guild.id,
                                adapterCreator: guild.voiceAdapterCreator,
                            });

                            global.connections?.set(guild.id, connection);
                            this.lastJoinAttempt = this.lastJoinAttempt || new Map();
                            this.lastJoinAttempt.set(guild.id, now);
                            console.log(`🔄 Rejoined 24/7 voice channel in ${guild.name}`);

                        } catch (error) {
                            this.lastJoinAttempt = this.lastJoinAttempt || new Map();
                            this.lastJoinAttempt.set(guild.id, now);
                            console.error(`❌ Failed to rejoin 24/7 channel in ${guild.name}:`, error.message);
                        }
                    }
                }

                // Check if queue is empty and autoplay is enabled
                if (queue && queue.isEmpty() && queue.autoplay && voiceConnection) {
                    console.log(`🤖 24/7 autoplay triggered for ${guild.name}`);
                    // Autoplay logic will be handled by the music player
                }
            }

        } catch (error) {
            console.error('❌ 24/7 check error:', error);
        }
    }

    // Handle process signals for graceful shutdown
    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

            try {
                // Clear intervals
                if (this.checkInterval) {
                    clearInterval(this.checkInterval);
                }

                // Close HTTP server
                if (this.server) {
                    this.server.close(() => {
                        console.log('✅ HTTP server closed');
                    });
                }

                // Disconnect from all voice channels
                if (global.voiceConnections) {
                    for (const [guildId, connection] of global.voiceConnections.entries()) {
                        try {
                            connection.destroy();
                            console.log(`✅ Disconnected from guild: ${guildId}`);
                        } catch (e) {
                            console.error(`❌ Error disconnecting from ${guildId}:`, e.message);
                        }
                    }
                }

                // Destroy Discord client
                await this.client.destroy();
                console.log('✅ Discord client destroyed');

                console.log('✅ Graceful shutdown complete');
                process.exit(0);

            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };

        // Handle different termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            if (config.DEPLOYMENT.RESTART_ON_CRASH) {
                console.log('🔄 Attempting to recover...');
            } else {
                gracefulShutdown('UNCAUGHT_EXCEPTION');
            }
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        });

        console.log('✅ Graceful shutdown handlers registered');
    }

    // Stop keep-alive system
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        if (this.server) {
            this.server.close();
            this.server = null;
        }

        console.log('✅ Keep-alive system stopped');
    }
}

module.exports = KeepAliveSystem;
