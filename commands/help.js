const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');
const { getGuildSettings } = require('../src/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands and their usage'),

    async execute(interaction) {
        const guildSettings = getGuildSettings(interaction.guild.id);
        const prefix = guildSettings.prefix;
        
        const embed = new EmbedBuilder()
            .setTitle(`${config.EMOJIS.MUSIC} RagaBot Help & Commands`)
            .setColor(config.COLORS.INFO)
            .setDescription(`**Current Prefix:** \`${prefix}\`\n**Pro Tip:** Use short forms like \`${prefix}p\` instead of \`${prefix}play\` for faster commands!`)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                {
                    name: `${config.EMOJIS.PLAY} Music Playback`,
                    value: `\`/play\` \`${prefix}p\` - Play song from URL or search\n` +
                          `\`/skip\` \`${prefix}s\` - Skip current song\n` +
                          `\`/stop\` \`${prefix}st\` - Stop music & disconnect\n` +
                          `\`/pause\` - Pause current song\n` +
                          `\`/resume\` - Resume paused song\n` +
                          `\`/previous\` - Play previous song`,
                    inline: true
                },
                {
                    name: `${config.EMOJIS.VOLUME} Audio Control`,
                    value: `\`/volume <0-100>\` - Set volume\n` +
                          `\`/loop\` - Toggle loop mode\n` +
                          `\`/autoplay\` - Toggle autoplay\n` +
                          `\`/speed <0.5-2.0>\` - Change speed\n` +
                          `\`/filter <name>\` - Apply audio filter`,
                    inline: true
                },
                {
                    name: `${config.EMOJIS.QUEUE} Queue Management`,
                    value: `\`/queue\` \`${prefix}q\` - Show current queue\n` +
                          `\`/nowplaying\` \`${prefix}np\` - Current song\n` +
                          `\`/shuffle\` - Shuffle queue\n` +
                          `\`/jump <number>\` - Jump to position\n` +
                          `\`/remove <number>\` - Remove from queue\n` +
                          `\`/clear\` - Clear entire queue`,
                    inline: true
                },
                {
                    name: `🎛️ Audio Filters`,
                    value: `\`bassboost\` - Enhanced bass\n` +
                          `\`nightcore\` - Faster + higher pitch\n` +
                          `\`slowed\` - Slowed + reverb\n` +
                          `\`8d\` - 8D audio effect\n` +
                          `\`vaporwave\` - Retro vaporwave\n` +
                          `\`normal\` - Reset filters`,
                    inline: true
                },
                {
                    name: `🎤 Lyrics & Favorites`,
                    value: `\`/lyrics\` - Get song lyrics\n` +
                          `\`/favorite add\` - Save to favorites\n` +
                          `\`/favorite list\` - View favorites\n` +
                          `\`/favorite play\` - Play favorite\n` +
                          `\`/favorite remove\` - Remove`,
                    inline: true
                },
                {
                    name: `⚙️ Server Settings (Admin Only)`,
                    value: `\`/settings view\` - View settings\n` +
                          `\`/settings prefix\` - Change prefix\n` +
                          `\`/settings volume\` - Default volume\n` +
                          `\`/settings language\` - Set language\n` +
                          `\`/settings djmode\` - DJ mode toggle\n` +
                          `\`/settings djrole\` - Set DJ role`,
                    inline: true
                },
                {
                    name: `${config.EMOJIS.MUSIC} Supported Sources`,
                    value: `🎬 **YouTube** - URLs & searches\n` +
                          `🎵 **Spotify** - Tracks & playlists\n` +
                          `🔊 **SoundCloud** - Tracks & sets\n` +
                          `📻 **High Quality** - yt-dlp powered`,
                    inline: true
                },
                {
                    name: `🎮 Interactive Buttons`,
                    value: `**Row 1:** Previous | Pause/Resume | Skip | Stop\n` +
                          `**Row 2:** Loop | Autoplay | Shuffle | Queue\n` +
                          `**Row 3:** Vol- | Replay | Vol+ | Clear Queue`,
                    inline: true
                }
            )
            .setFooter({ 
                text: '🎵 Click buttons on now playing messages for quick controls! | 24/7 Mode Available',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Add advanced features note
        const premiumEmbed = new EmbedBuilder()
            .setTitle(`${config.EMOJIS.SUCCESS} Advanced Features 🎉`)
            .setDescription(
                `**🎛️ Audio Filters:**\n` +
                `• Bass Boost, Nightcore, Slowed+Reverb\n` +
                `• 8D Audio, Vaporwave, and more!\n` +
                `• Use \`/filter <name>\` to apply\n\n` +
                `**🎮 Interactive Controls:**\n` +
                `• 3 rows of quick control buttons\n` +
                `• Volume controls, replay, queue clear\n` +
                `• Previous track, shuffle, loop modes\n\n` +
                `**⚙️ Server Settings:**\n` +
                `• Custom prefix & default volume\n` +
                `• DJ mode with role restrictions\n` +
                `• Hindi/English language support\n` +
                `• 24/7 mode for continuous playback\n\n` +
                `**🎵 Enhanced Playback:**\n` +
                `• Speed control (0.5x - 2.0x)\n` +
                `• Queue management (jump, remove, shuffle)\n` +
                `• Spotify integration with auto-conversion\n` +
                `• yt-dlp for highest quality audio`
            )
            .setColor(config.COLORS.SUCCESS);

        await interaction.reply({ 
            embeds: [embed, premiumEmbed],
            ephemeral: false 
        });
    },
};