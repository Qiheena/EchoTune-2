const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the queue'),

    async execute(interaction) {
        await interaction.deferReply();

        const queue = global.getQueue(interaction.guild.id);
        
        if (queue.tracks.length < 2) {
            const embed = new EmbedBuilder()
                .setTitle(`${config.EMOJIS.ERROR} Error`)
                .setDescription('Queue में कम से कम 2 songs होने चाहिए shuffle करने के लिए!')
                .setColor(config.COLORS.ERROR);
            return interaction.editReply({ embeds: [embed] });
        }

        for (let i = queue.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
        }

        const embed = new EmbedBuilder()
            .setTitle(`${config.EMOJIS.SHUFFLE} Queue Shuffled`)
            .setDescription(`${queue.tracks.length} songs को shuffle कर दिया!`)
            .setColor(config.COLORS.SUCCESS)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
