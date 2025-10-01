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
            handleFallbackTrackEnd(guildId);
        });

        player.on('error', (error) => {
            console.error(`Fallback player error: ${error.message}`);
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
        
        // Ensure we have a valid URL
        if (!track.url || track.url.includes('youtube.com') || track.url.includes('youtu.be')) {
            try {
                const searchQuery = track.title || track.info?.title || 'music';
                const { getCachedSearchResults } = require('../utils/CacheManager');
                const searchResults = await getCachedSearchResults(searchQuery, 1);
                
                if (searchResults && searchResults.length > 0) {
                    const video = searchResults[0];
                    track.url = video.url;
                    console.log(`[${guildId}] Found URL: ${video.title}`);
                }
            } catch (error) {
                console.log(`[${guildId}] Search fallback failed: ${error.message}`);
            }
        }

        if (!track.url) {
            console.error(`[${guildId}] ❌ No valid URL found for: ${track.title}`);
            return false;
        }

        // Method 1: Try yt-dlp (most reliable for YouTube) - Optimized for speed
        try {
            console.log(`[${guildId}] 🎵 Attempting yt-dlp for: ${track.title}`);
            
            // Use -g flag for fast URL extraction without full JSON parsing
            const { execFile } = require('child_process');
            const { promisify } = require('util');
            const execFilePromise = promisify(execFile);
            
            try {
                const { stdout } = await execFilePromise('yt-dlp', [
                    '-g',
                    '-f', 'bestaudio/best',
                    '--no-check-certificate',
                    '--no-warnings',
                    track.url
                ], { timeout: 10000 }); // 10 second timeout
                
                if (stdout && stdout.trim()) {
                    stream = stdout.trim().split('\n')[0]; // First URL is audio
                    console.log(`[${guildId}] ✅ Got stream URL from yt-dlp (fast method)`);
                }
            } catch (fastError) {
                // Fallback to JSON method if fast method fails
                console.log(`[${guildId}] Fast yt-dlp failed, trying JSON method...`);
                const streamUrl = await youtubedl(track.url, {
                    dumpSingleJson: true,
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true,
                    addHeader: [
                        'referer:youtube.com',
                        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    ]
                });

                if (streamUrl && streamUrl.url) {
                    stream = streamUrl.url;
                    console.log(`[${guildId}] ✅ Got stream URL from yt-dlp`);
                } else if (streamUrl && streamUrl.formats) {
                    const audioFormat = streamUrl.formats.find(f => 
                        f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none')
                    ) || streamUrl.formats.find(f => f.acodec && f.acodec !== 'none');
                    
                    if (audioFormat && audioFormat.url) {
                        stream = audioFormat.url;
                        console.log(`[${guildId}] ✅ Got audio stream from yt-dlp format`);
                    }
                }
            }
        } catch (error) {
            console.log(`[${guildId}] ❌ yt-dlp failed: ${error.message}`);
        }

        // Method 2: Fallback to play-dl (if yt-dlp fails)
        if (!stream) {
            try {
                const info = await play.video_info(track.url);
                if (info && info.video_details) {
                    const playStream = await play.stream(track.url, {
                        quality: 2,
                        discordPlayerCompatibility: true
                    });
                    stream = playStream;
                    console.log(`[${guildId}] ✅ Playing with play-dl: ${track.title}`);
                }
            } catch (error) {
                console.log(`[${guildId}] ❌ play-dl failed: ${error.message}`);
            }
        }

        // Method 3: Final fallback to ytdl-core
        if (!stream) {
            try {
                const info = await ytdl.getBasicInfo(track.url);
                if (info && info.videoDetails) {
                    stream = ytdl(track.url, {
                        filter: 'audioonly',
                        quality: 'highestaudio',
                        highWaterMark: 1 << 25
                    });
                    console.log(`[${guildId}] ✅ Playing with ytdl-core: ${track.title}`);
                }
            } catch (error) {
                console.log(`[${guildId}] ❌ ytdl-core failed: ${error.message}`);
            }
        }

        if (!stream) {
            console.error(`[${guildId}] ❌ All streaming methods failed for: ${track.title}`);
            cleanupGarbageFiles(guildId);
            return false;
        }

        // Create audio resource from stream URL or stream object
        const resource = typeof stream === 'string' 
            ? createAudioResource(stream, { inlineVolume: true })
            : createAudioResource(stream, { inputType: stream.type, inlineVolume: true });
        
        const queue = global.getQueue(guildId);
        if (resource.volume) {
            resource.volume.setVolume(queue.volume / 100);
        }

        player.play(resource);
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