const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const play = require('play-dl');
const YouTube = require('youtube-sr').default;
const { getCachedSearchResults } = require('../utils/CacheManager');
const { toUnifiedTrack, createNowPlayingEmbed } = require('../utils/TrackHelpers');
const { getGuildSettings } = require('./database');
const config = require('../config/botConfig');

// Enhanced streaming functions for reliable music playback
async function createFallbackPlayer(guildId, voiceChannel, textChannel) {
    try {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        // Wait for connection to be ready before proceeding
        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
            console.log(`✅ Voice connection ready for guild ${guildId}`);
        } catch (error) {
            console.error(`❌ Connection failed to become ready: ${error.message}`);
            connection.destroy();
            return null;
        }

        // Handle connection state changes with proper cleanup
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            console.log(`🔌 Voice connection disconnected for guild ${guildId}`);
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch (error) {
                console.log(`Connection couldn't reconnect, destroying...`);
                connection.destroy();
            }
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            console.log(`💥 Voice connection destroyed for guild ${guildId}`);
            const player = global.audioPlayers.get(guildId);
            if (player) {
                try {
                    player.stop();
                    global.audioPlayers.delete(guildId);
                } catch (error) {
                    console.log(`Player stop warning: ${error.message}`);
                }
            }
            global.connections.delete(guildId);
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        global.connections.set(guildId, connection);
        global.audioPlayers.set(guildId, player);

        player.on(AudioPlayerStatus.Idle, () => {
            console.log(`[${guildId}] 🔇 Player went idle`);
            handleFallbackTrackEnd(guildId);
        });

        player.on(AudioPlayerStatus.Playing, () => {
            console.log(`[${guildId}] ▶️ Player status: Playing`);
        });

        player.on(AudioPlayerStatus.Paused, () => {
            console.log(`[${guildId}] ⏸️ Player status: Paused`);
        });

        player.on(AudioPlayerStatus.Buffering, () => {
            console.log(`[${guildId}] 📶 Player status: Buffering`);
        });

        player.on('error', (error) => {
            console.error(`[${guildId}] ❌ Player error: ${error.message}`);
            console.error(`[${guildId}] Error stack: ${error.stack}`);
            if (error.resource) {
                console.error(`[${guildId}] Resource metadata:`, error.resource.metadata);
            }
            if (error.message.includes('403') || error.message.includes('Status code: 403')) {
                notifyStreamingError(guildId, 'youtube_blocked');
            } else {
                notifyStreamingError(guildId, 'general_error');
            }
            handleFallbackTrackEnd(guildId);
        });

        return player;
    } catch (error) {
        console.error('Failed to create fallback player:', error);
        return null;
    }
}

async function playFallbackTrack(guildId, track) {
    const player = global.audioPlayers.get(guildId);
    if (!player) return false;

    try {
        let stream = null;
        const youtubedl = require('youtube-dl-exec');
        
        // Convert non-YouTube URLs to YouTube (for Spotify, SoundCloud, etc.)
        if (!track.url || (!track.url.includes('youtube.com') && !track.url.includes('youtu.be'))) {
            try {
                const searchQuery = track.title || track.info?.title || 'music';
                const { getCachedSearchResults } = require('../utils/CacheManager');
                const searchResults = await getCachedSearchResults(searchQuery, 1);
                
                if (searchResults && searchResults.length > 0) {
                    const video = searchResults[0];
                    track.url = video.url;
                    console.log(`[${guildId}] Converted to YouTube: ${video.title}`);
                }
            } catch (error) {
                console.log(`[${guildId}] Search fallback failed: ${error.message}`);
            }
        }

        if (!track.url) {
            console.error(`[${guildId}] ❌ No valid URL found for: ${track.title}`);
            return false;
        }

        // Method 1: Try yt-dlp to get direct URL (bypasses YouTube blocks)
        try {
            console.log(`[${guildId}] 🎵 Attempting yt-dlp for: ${track.title}`);
            
            const info = await Promise.race([
                youtubedl(track.url, {
                    dumpSingleJson: true,
                    format: 'bestaudio',
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true,
                    addHeader: [
                        'referer:youtube.com',
                        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    ]
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('yt-dlp timeout')), 15000))
            ]);
            
            let directUrl = null;
            
            if (info && info.url) {
                directUrl = info.url;
            } else if (info && info.formats && info.formats.length > 0) {
                const audioFormat = info.formats.find(f => f.acodec !== 'none' && f.vcodec === 'none') || info.formats[0];
                directUrl = audioFormat.url;
            }
            
            if (directUrl) {
                console.log(`[${guildId}] 📥 Got direct URL from yt-dlp, streaming...`);
                const axios = require('axios');
                const response = await axios({
                    method: 'get',
                    url: directUrl,
                    responseType: 'stream',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                stream = response.data;
                console.log(`[${guildId}] ✅ Got stream from yt-dlp`);
            }
        } catch (error) {
            console.log(`[${guildId}] ❌ yt-dlp failed: ${error.message}`);
        }

        // Method 2: Try play-dl as backup
        if (!stream) {
            try {
                console.log(`[${guildId}] 🎵 Attempting play-dl for: ${track.title}`);
                
                const playStream = await Promise.race([
                    play.stream(track.url, { quality: 2 }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('play-dl timeout')), 8000))
                ]);
                
                stream = playStream.stream;
                stream.type = playStream.type;
                console.log(`[${guildId}] ✅ Got stream from play-dl`);
            } catch (error) {
                console.log(`[${guildId}] ❌ play-dl failed: ${error.message}`);
            }
        }

        // Method 3: Last resort - ytdl-core
        if (!stream) {
            try {
                console.log(`[${guildId}] 🎵 Attempting ytdl-core for: ${track.title}`);
                stream = ytdl(track.url, {
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25,
                    dlChunkSize: 0,
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept-Language': 'en-US,en;q=0.9',
                        }
                    }
                });
                console.log(`[${guildId}] ✅ Got stream from ytdl-core`);
            } catch (error) {
                console.log(`[${guildId}] ❌ ytdl-core failed: ${error.message}`);
            }
        }

        if (!stream) {
            console.error(`[${guildId}] ❌ All streaming methods failed for: ${track.title}`);
            cleanupGarbageFiles(guildId);
            return false;
        }

        // Create audio resource from stream object
        let resource;
        try {
            if (stream.type) {
                // play-dl stream
                resource = createAudioResource(stream, { 
                    inputType: stream.type, 
                    inlineVolume: true,
                    metadata: {
                        title: track.title,
                        url: track.url
                    }
                });
                console.log(`[${guildId}] ✅ Audio resource created from play-dl stream`);
            } else {
                // yt-dlp or ytdl-core stream
                resource = createAudioResource(stream, { 
                    inlineVolume: true,
                    metadata: {
                        title: track.title,
                        url: track.url
                    }
                });
                console.log(`[${guildId}] ✅ Audio resource created successfully`);
            }
            
        } catch (resourceError) {
            console.error(`[${guildId}] ❌ Failed to create audio resource: ${resourceError.message}`);
            console.error(`[${guildId}] Stack: ${resourceError.stack}`);
            cleanupGarbageFiles(guildId);
            return false;
        }
        
        const queue = global.getQueue(guildId);
        if (resource.volume) {
            resource.volume.setVolume(queue.volume / 100);
        }

        player.play(resource);
        console.log(`[${guildId}] ▶️ Playing now!`);
        
        return true;

    } catch (error) {
        console.error(`[${guildId}] Playback error:`, error.message);
        cleanupGarbageFiles(guildId);
        return false;
    }
}

// Helper function to clean up garbage files
function cleanupGarbageFiles(guildId) {
    try {
        const fs = require('fs');
        const files = fs.readdirSync('.').filter(f => 
            (f.includes('watch') && f.endsWith('.html')) || 
            (f.includes('player-script') && f.endsWith('.js'))
        );
        files.forEach(file => {
            try { fs.unlinkSync(file); } catch (e) {}
        });
        if (files.length > 0) {
            console.log(`[${guildId}] 🧹 Cleaned ${files.length} garbage files`);
        }
    } catch (e) {
        console.log(`[${guildId}] Cleanup warning: ${e.message}`);
    }
}

// Handle track end for fallback player
async function handleFallbackTrackEnd(guildId) {
    const queue = global.getQueue(guildId);
    
    if (queue.loop && queue.nowPlaying) {
        // Loop current song
        await playFallbackTrack(guildId, queue.nowPlaying);
        return;
    }

    const nextTrack = queue.next();
    
    if (nextTrack) {
        const unifiedTrack = toUnifiedTrack(nextTrack, 'fallback');
        queue.nowPlaying = unifiedTrack;
        
        const success = await playFallbackTrack(guildId, nextTrack);
        if (success && queue.textChannel) {
            try {
                const guildSettings = getGuildSettings(guildId);
                const nowPlayingMessage = createNowPlayingEmbed(unifiedTrack, queue, guildSettings);
                await queue.textChannel.send(nowPlayingMessage);
            } catch (error) {
                console.log('Could not send now playing message:', error.message);
            }
        }
    } else if (queue.autoplay && queue.nowPlaying) {
        // Try autoplay
        const suggestion = await getAutoPlaySuggestion(queue.nowPlaying);
        if (suggestion) {
            queue.add(suggestion);
            const nextSong = queue.next();
            if (nextSong) {
                const unifiedTrack = toUnifiedTrack(nextSong, 'fallback');
                queue.nowPlaying = unifiedTrack;
                await playFallbackTrack(guildId, nextSong);
                
                // Send now playing message for autoplay
                if (queue.textChannel) {
                    try {
                        const guildSettings = getGuildSettings(guildId);
                        const nowPlayingMessage = createNowPlayingEmbed(unifiedTrack, queue, guildSettings);
                        await queue.textChannel.send(nowPlayingMessage);
                    } catch (error) {
                        console.log('Could not send autoplay now playing message:', error.message);
                    }
                }
            }
        } else {
            queue.clear();
            cleanupFallbackPlayer(guildId);
        }
    } else {
        queue.clear();
        cleanupFallbackPlayer(guildId);
    }
}

// Auto play suggestions
async function getAutoPlaySuggestion(lastTrack) {
    try {
        const searchQuery = `${lastTrack.info.author} similar songs`;
        const results = await getCachedSearchResults(searchQuery, 5);
        
        if (results.length > 1) {
            const randomIndex = Math.floor(Math.random() * Math.min(results.length - 1, 4)) + 1;
            const video = results[randomIndex];
            
            return {
                info: {
                    title: video.title,
                    author: video.channel?.name || video.author || 'Unknown',
                    length: (video.duration || 0) * 1000,
                    artworkUrl: video.thumbnail?.url,
                    thumbnail: video.thumbnail?.url
                },
                requester: lastTrack.requester,
                url: video.url,
                source: 'youtube'
            };
        }
    } catch (error) {
        console.log('Autoplay suggestion failed:', error.message);
    }
    return null;
}

// Cleanup fallback player
function cleanupFallbackPlayer(guildId) {
    try {
        const player = global.audioPlayers.get(guildId);
        const connection = global.connections.get(guildId);
        
        if (player) {
            try {
                player.stop();
                global.audioPlayers.delete(guildId);
            } catch (error) {
                console.log(`Player cleanup warning: ${error.message}`);
            }
        }
        
        if (connection) {
            try {
                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                }
                global.connections.delete(guildId);
            } catch (error) {
                console.log(`Connection cleanup warning: ${error.message}`);
                global.connections.delete(guildId);
            }
        }
        
        const queue = global.getQueue(guildId);
        if (queue) {
            queue.clear();
            global.queues.delete(guildId);
        }
        
        console.log(`🧹 Cleaned up player resources for guild ${guildId}`);
    } catch (error) {
        console.error('Cleanup error:', error.message);
    }
}

// Error notification
function notifyStreamingError(guildId, errorType) {
    const queue = global.getQueue(guildId);
    if (!queue || !queue.textChannel) return;
    
    const errorMessages = {
        'youtube_blocked': '⚠️ YouTube blocked the request. Trying alternative method...',
        'general_error': '⚠️ Streaming error occurred. Trying next song...'
    };
    
    const message = errorMessages[errorType] || errorMessages['general_error'];
    
    try {
        queue.textChannel.send(message).catch(() => {});
    } catch (error) {
        console.log('Could not send error notification:', error.message);
    }
}

// All events are handled by the enhanced streaming system above

module.exports = {
    createFallbackPlayer,
    playFallbackTrack,
    handleFallbackTrackEnd,
    cleanupFallbackPlayer,
    getAutoPlaySuggestion
};