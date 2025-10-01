const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jump')
        .setDescription('Jump to a specific song in queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Queue position to jump to')
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const queue = global.getQueue(interaction.guild.id);
        const position = interaction.options.getInteger('position');
        
        if (queue.tracks.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${config.EMOJIS.ERROR} Error`)
                .setDescription('Queue empty है!')
                .setColor(config.COLORS.ERROR);
            return interaction.editReply({ embeds: [embed] });
        }

        if (position > queue.tracks.length) {
            const embed = new EmbedBuilder()
                .setTitle(`${config.EMOJIS.ERROR} Invalid Position`)
                .setDescription(`Position ${position} से ज्यादा है queue में! Queue में कुल ${queue.tracks.length} songs हैं।`)
                .setColor(config.COLORS.ERROR);
            return interaction.editReply({ embeds: [embed] });
        }

        const skippedSongs = [];
        for (let i = 0; i < position - 1; i++) {
            const skipped = queue.next();
            if (skipped) skippedSongs.push(skipped);
        }

        const nextSong = queue.next();
        
        if (nextSong) {
            if (queue.nowPlaying && !queue.loop) {
                if (!queue.history) queue.history = [];
                queue.history.push(queue.nowPlaying);
            }
            
            queue.nowPlaying = nextSong;

            const { playFallbackTrack } = require('../src/MusicPlayer');
            const player = global.audioPlayers.get(interaction.guild.id);
            
            if (player) {
                player.stop();
                await playFallbackTrack(interaction.guild.id, nextSong);
            }

            const embed = new EmbedBuilder()
                .setTitle(`${config.EMOJIS.SKIP} Jumped to Song`)
                .setDescription(`Skipped ${skippedSongs.length + 1} songs!\n\n**Now Playing:**\n**${nextSong.title}**\nby ${nextSong.author}`)
                .setColor(config.COLORS.SUCCESS)
                .setThumbnail(nextSong.thumbnail || null)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
