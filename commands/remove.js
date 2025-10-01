const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a song from queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position of song to remove (1 = next song)')
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
                .setDescription(`Position ${position} invalid है! Queue में कुल ${queue.tracks.length} songs हैं।`)
                .setColor(config.COLORS.ERROR);
            return interaction.editReply({ embeds: [embed] });
        }

        const removedSong = queue.tracks.splice(position - 1, 1)[0];

        const embed = new EmbedBuilder()
            .setTitle(`${config.EMOJIS.SUCCESS} Song Removed`)
            .setDescription(`**${removedSong.title}**\nby ${removedSong.author}\n\nQueue से remove कर दिया!`)
            .setColor(config.COLORS.SUCCESS)
            .setThumbnail(removedSong.thumbnail || null)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
