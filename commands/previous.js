const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('previous')
        .setDescription('Play previous song from history'),

    async execute(interaction) {
        await interaction.deferReply();

        const queue = global.getQueue(interaction.guild.id);
        
        if (!queue.history || queue.history.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${config.EMOJIS.ERROR} Error`)
                .setDescription('कोई previous song नहीं है!')
                .setColor(config.COLORS.ERROR);
            return interaction.editReply({ embeds: [embed] });
        }

        const previousSong = queue.history[queue.history.length - 1];
        
        if (queue.nowPlaying) {
            queue.addToFront(queue.nowPlaying);
        }

        queue.nowPlaying = previousSong;
        queue.history.pop();

        const { playFallbackTrack } = require('../src/MusicPlayer');
        const player = global.audioPlayers.get(interaction.guild.id);
        
        if (player) {
            player.stop();
            await playFallbackTrack(interaction.guild.id, previousSong);
        }

        const embed = new EmbedBuilder()
            .setTitle(`${config.EMOJIS.PREVIOUS} Playing Previous Song`)
            .setDescription(`**${previousSong.title}**\nby ${previousSong.author}`)
            .setColor(config.COLORS.SUCCESS)
            .setThumbnail(previousSong.thumbnail || null)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
