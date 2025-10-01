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
                    value: `\`/play\` \`/p\` - Play song from URL or search\n` +
                          `\`/skip\` \`/s\` - Skip current song\n` +
                          `\`/stop\` \`/st\` - Stop music & disconnect\n` +
                          `\`/pause\` - Pause current song\n` +
                          `\`/resume\` - Resume paused song\n` +
                          `\`/replay\` - Restart current song`,
                    inline: true
                },
                {
                    name: `${config.EMOJIS.VOLUME} Audio Control`,
                    value: `\`/volume\` \`/v\` - Set volume (0-100)\n` +
                          `\`/loop\` \`/l\` - Toggle loop mode\n` +
                          `\`/playlist\` \`/pl\` - Load playlists\n` +
                          `\`/leave\` \`/lv\` - Disconnect bot`,
                    inline: true
                },
                {
                    name: `${config.EMOJIS.QUEUE} Queue Management`,
                    value: `\`/queue\` \`/q\` - Show current queue\n` +
                          `\`/nowplaying\` \`/np\` - Current song info\n` +
                          `\`/search\` - Search for songs\n` +
                          `\`/join\` - Join your voice channel\n` +
                          `\`/status\` - Show bot status`,
                    inline: true
                },
                {
                    name: `🎤 Lyrics & Favorites`,
                    value: `\`/lyrics\` - Get song lyrics\n` +
                          `\`/favorite add\` - Save to favorites\n` +
                          `\`/favorite list\` - View favorites\n` +
                          `\`/favorite play\` - Play from favorites\n` +
                          `\`/favorite remove\` - Remove favorite`,
                    inline: true
                },
                {
                    name: `${config.EMOJIS.MUSIC} Supported Sources`,
                    value: `🎬 **YouTube** - URLs & searches\n` +
                          `🎵 **Spotify** - Tracks & playlists (via integration)\n` +
                          `🔊 **Direct Streams** - Audio URLs\n` +
                          `📻 **High Quality** - Best audio via yt-dlp`,
                    inline: true
                },
                {
                    name: `⚡ Pro Tips`,
                    value: `• Use \`/p\` for quick play\n` +
                          `• \`/lyrics\` shows current song lyrics\n` +
                          `• \`/replay\` to restart song\n` +
                          `• \`/favorite add\` to save favorites\n` +
                          `• All commands support slash (/) format\n` +
                          `• yt-dlp ensures high quality audio`,
                    inline: true
                }
            )
            .setFooter({ 
                text: '🎵 Use interactive buttons on now playing messages for quick controls!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Add premium features note if applicable
        const premiumEmbed = new EmbedBuilder()
            .setTitle(`${config.EMOJIS.SUCCESS} What's New? 🎉`)
            .setDescription(
                `**नए Commands:**\n` +
                `🎤 \`/lyrics\` - अब गाने के lyrics देखें!\n` +
                `💖 \`/favorite\` - अपने favorite गाने save करें\n` +
                `🔄 \`/replay\` - गाना शुरू से चलाएं\n\n` +
                `**Key Fixes:**\n` +
                `✅ yt-dlp से high quality audio\n` +
                `✅ बेहतर error handling और messages\n` +
                `✅ Fast और reliable playback\n` +
                `✅ कोई auto-disconnect नहीं (fixed!)\n` +
                `✅ Improved streaming stability`
            )
            .setColor(config.COLORS.SUCCESS);

        await interaction.reply({ 
            embeds: [embed, premiumEmbed],
            ephemeral: false 
        });
    },
};