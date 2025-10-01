const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const YouTube = require('youtube-sr').default;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('YouTube URL या गाने का नाम से play करें')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('YouTube URL या गाने का नाम')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const member = interaction.member;
        if (!member) {
            return interaction.editReply('❌ Member information not available. Please try again.');
        }
        
        const voiceChannel = member.voice?.channel;
        const query = interaction.options.getString('query');

        if (!voiceChannel) {
            return interaction.editReply('❌ आपको पहले किसी voice channel में join करना होगा!');
        }

        try {
            let videoUrl, title, duration, thumbnail;

            // Always use search for more reliable results (bypasses bot detection)
            let searchResults;
            
            if (ytdl.validateURL(query)) {
                // If it's a URL, extract video ID and search by title for reliability
                try {
                    const videoId = ytdl.getVideoID(query);
                    searchResults = await YouTube.search(`site:youtube.com watch?v=${videoId}`, { limit: 1 });
                    
                    // If search fails, try direct URL as fallback
                    if (!searchResults || searchResults.length === 0) {
                        const info = await ytdl.getInfo(query, {
                            requestOptions: {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                                }
                            }
                        });
                        videoUrl = query;
                        title = info.videoDetails.title;
                        duration = parseInt(info.videoDetails.lengthSeconds);
                        thumbnail = info.videoDetails.thumbnails[0]?.url;
                    } else {
                        const video = searchResults[0];
                        videoUrl = video.url;
                        title = video.title;
                        duration = video.durationInSec || 0;
                        thumbnail = video.thumbnail?.url;
                    }
                } catch (urlError) {
                    return interaction.editReply('❌ Invalid YouTube URL या server issue! गाने का नाम try करें।');
                }
            } else {
                // It's a search query
                searchResults = await YouTube.search(query, { limit: 1 });
                if (!searchResults || searchResults.length === 0) {
                    return interaction.editReply('❌ कोई गाना नहीं मिला! दूसरा नाम try करें।');
                }
                
                const video = searchResults[0];
                videoUrl = video.url;
                title = video.title;
                duration = video.durationInSec || 0;
                thumbnail = video.thumbnail?.url;
            }

            const song = {
                title,
                url: videoUrl,
                duration,
                thumbnail,
                requestedBy: interaction.user,
            };

            // Use the enhanced music player system for consistency
            const { createFallbackPlayer, playFallbackTrack } = require('../src/MusicPlayer');
            const { toUnifiedTrack } = require('../utils/TrackHelpers');
            
            const queue = global.getQueue(interaction.guild.id);
            queue.textChannel = interaction.channel;
            queue.voiceChannel = voiceChannel;

            let player = global.audioPlayers.get(interaction.guild.id);
            if (!player) {
                player = await createFallbackPlayer(interaction.guild.id, voiceChannel, interaction.channel);
                if (!player) {
                    return interaction.editReply('❌ Voice channel join नहीं हो सका! Permission check करें।');
                }
            }

            if (queue.nowPlaying) {
                // Add to queue
                queue.add(song);
                return interaction.editReply(`📋 **${title}** को queue में add कर दिया! Position: ${queue.songs.length}`);
            } else {
                // Play immediately using enhanced streaming system
                const unifiedTrack = toUnifiedTrack(song, 'fallback');
                queue.nowPlaying = unifiedTrack;
                const success = await playFallbackTrack(interaction.guild.id, song);
                
                if (success) {
                    return interaction.editReply(`🎵 अब play हो रहा है: **${title}**`);
                } else {
                    return interaction.editReply('❌ गाना play करने में error हुई! दूसरा गाना try करें।');
                }
            }

        } catch (error) {
            console.error('Play command error:', error);
            return interaction.editReply('❌ गाना play करने में error हुई! दूसरा गाना try करें।');
        }
    },
};