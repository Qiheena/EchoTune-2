const { AudioPlayerStatus } = require('@discordjs/voice');
const { getQueue } = require('../utils/QueueManager');
const { playFallbackTrack, cleanupFallbackPlayer } = require('./MusicPlayer');
const { toUnifiedTrack } = require('../utils/TrackHelpers');
const config = require('../config/botConfig');

// Handle button interactions
async function handleButtonInteraction(interaction, guildSettings) {
    const lang = guildSettings.language || 'hi';
    const queue = getQueue(interaction.guild.id);

    try {
        await interaction.deferReply({ ephemeral: true });

        if (!queue || !queue.nowPlaying) {
            return await interaction.editReply({
                content: lang === 'hi' 
                    ? '📭 कोई गाना play नहीं हो रहा है!'
                    : '📭 No music is currently playing!',
                ephemeral: true
            });
        }

        // Handle button actions
        switch (interaction.customId) {
            case 'pause_resume':
            case 'music_pause':
                const audioPlayer = global.audioPlayers?.get(interaction.guild.id);
                if (audioPlayer) {
                    if (audioPlayer.state.status === AudioPlayerStatus.Paused) {
                        audioPlayer.unpause();
                        await interaction.editReply({ 
                            content: '▶️ Resumed!',
                            ephemeral: true 
                        });
                    } else {
                        audioPlayer.pause();
                        await interaction.editReply({ 
                            content: '⏸️ Paused!',
                            ephemeral: true 
                        });
                    }
                } else {
                    await interaction.editReply({ 
                        content: '❌ Player not found!',
                        ephemeral: true 
                    });
                }
                break;

            case 'skip':
            case 'music_skip':
                const player = global.audioPlayers?.get(interaction.guild.id);
                if (player) {
                    player.stop(); // This will trigger the Idle event and play next
                    await interaction.editReply({ 
                        content: '⏭️ Skipped!',
                        ephemeral: true 
                    });
                } else {
                    await interaction.editReply({ 
                        content: '❌ No music playing!',
                        ephemeral: true 
                    });
                }
                break;

            case 'stop':
            case 'music_stop':
                const stopPlayer = global.audioPlayers?.get(interaction.guild.id);
                if (stopPlayer) {
                    try {
                        stopPlayer.stop();
                    } catch (e) {
                        console.error('Stop player error:', e.message);
                    }
                }
                try {
                    cleanupFallbackPlayer(interaction.guild.id);
                } catch (e) {
                    console.error('Cleanup error:', e.message);
                }
                queue.clear();
                queue.nowPlaying = null;
                await interaction.editReply({ 
                    content: '⏹️ Stopped and cleared queue!',
                    ephemeral: true 
                });
                break;

            case 'shuffle':
            case 'music_shuffle':
                if (queue.isEmpty()) {
                    await interaction.editReply({ 
                        content: '📭 Queue is empty!',
                        ephemeral: true 
                    });
                } else {
                    queue.shuffle();
                    await interaction.editReply({ 
                        content: '🔀 Queue shuffled!',
                        ephemeral: true 
                    });
                }
                break;

            case 'loop':
            case 'music_loop':
                queue.loop = !queue.loop;
                await interaction.editReply({ 
                    content: `🔁 Loop ${queue.loop ? 'ON' : 'OFF'}!`,
                    ephemeral: true 
                });
                break;

            case 'autoplay':
            case 'music_autoplay':
                queue.autoplay = !queue.autoplay;
                await interaction.editReply({ 
                    content: `🎵 Autoplay ${queue.autoplay ? 'ON' : 'OFF'}!`,
                    ephemeral: true 
                });
                break;

            case 'queue':
            case 'music_queue':
                let queueText = '';
                if (queue.nowPlaying) {
                    const title = queue.nowPlaying.info?.title || queue.nowPlaying.title;
                    const author = queue.nowPlaying.info?.author || queue.nowPlaying.author;
                    queueText += `**Now Playing:**\n${title} - ${author}\n\n`;
                }
                if (queue.songs.length > 0) {
                    queueText += '**Up Next:**\n';
                    for (let i = 0; i < Math.min(queue.songs.length, 5); i++) {
                        const track = queue.songs[i];
                        const title = track.info?.title || track.title;
                        const author = track.info?.author || track.author;
                        queueText += `${i + 1}. ${title} - ${author}\n`;
                    }
                    if (queue.songs.length > 5) {
                        queueText += `\n...and ${queue.songs.length - 5} more songs`;
                    }
                } else {
                    queueText += 'Queue is empty!';
                }
                await interaction.editReply({ 
                    content: queueText,
                    ephemeral: true 
                });
                break;

            case 'music_previous':
                const prevTrack = queue.previous();
                if (prevTrack) {
                    const unifiedTrack = toUnifiedTrack(prevTrack, 'fallback');
                    queue.nowPlaying = unifiedTrack;
                    await playFallbackTrack(interaction.guild.id, prevTrack);
                    await interaction.editReply({ 
                        content: `⏮️ Playing previous: **${prevTrack.info?.title || prevTrack.title}**`,
                        ephemeral: true 
                    });
                } else {
                    await interaction.editReply({ 
                        content: 'No previous song available!',
                        ephemeral: true 
                    });
                }
                break;

            case 'music_replay':
                const replayPlayer = global.audioPlayers.get(interaction.guild.id);
                if (replayPlayer && queue.nowPlaying) {
                    replayPlayer.stop();
                    await playFallbackTrack(interaction.guild.id, queue.nowPlaying);
                    await interaction.editReply({ 
                        content: `🔄 Replaying: **${queue.nowPlaying.info?.title || queue.nowPlaying.title}**`,
                        ephemeral: true 
                    });
                } else {
                    await interaction.editReply({ 
                        content: '❌ No song to replay!',
                        ephemeral: true 
                    });
                }
                break;

            case 'music_volume_up':
                const currentVolumeUp = queue.volume || 0.5;
                const newVolumeUp = Math.min(currentVolumeUp + 0.1, 1.0);
                queue.volume = newVolumeUp;
                const volumePlayerUp = global.audioPlayers.get(interaction.guild.id);
                if (volumePlayerUp && volumePlayerUp.state.resource) {
                    volumePlayerUp.state.resource.volume?.setVolume(newVolumeUp);
                }
                await interaction.editReply({ 
                    content: `🔊 Volume increased to ${Math.round(newVolumeUp * 100)}%`,
                    ephemeral: true 
                });
                break;

            case 'music_volume_down':
                const currentVolumeDown = queue.volume || 0.5;
                const newVolumeDown = Math.max(currentVolumeDown - 0.1, 0);
                queue.volume = newVolumeDown;
                const volumePlayerDown = global.audioPlayers.get(interaction.guild.id);
                if (volumePlayerDown && volumePlayerDown.state.resource) {
                    volumePlayerDown.state.resource.volume?.setVolume(newVolumeDown);
                }
                await interaction.editReply({ 
                    content: `🔉 Volume decreased to ${Math.round(newVolumeDown * 100)}%`,
                    ephemeral: true 
                });
                break;

            case 'music_clear_queue':
                if (!queue.isEmpty()) {
                    const clearedCount = queue.songs.length;
                    queue.clear();
                    await interaction.editReply({ 
                        content: `🗑️ Cleared ${clearedCount} songs from queue!`,
                        ephemeral: true 
                    });
                } else {
                    await interaction.editReply({ 
                        content: '📭 Queue is already empty!',
                        ephemeral: true 
                    });
                }
                break;

            default:
                await interaction.editReply({ 
                    content: '❌ Unknown button action!',
                    ephemeral: true 
                });
        }

    } catch (error) {
        console.error('❌ Button interaction error:', error);
        const errorMsg = error.message || 'Unknown error occurred';
        try {
            await interaction.editReply({ 
                content: `❌ Error: ${errorMsg}\n\nPlease try again or use slash commands instead.`,
                ephemeral: true 
            });
        } catch (e) {
            console.error('❌ Error sending error reply:', e);
        }
    }
}

module.exports = {
    handleButtonInteraction
};