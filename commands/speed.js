const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('speed')
        .setDescription('Change playback speed')
        .addNumberOption(option =>
            option.setName('rate')
                .setDescription('Playback speed (0.5 = slow, 1.0 = normal, 2.0 = fast)')
                .setRequired(true)
                .setMinValue(0.5)
                .setMaxValue(2.0)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const queue = global.getQueue(interaction.guild.id);
        
        if (!queue.nowPlaying) {
            const embed = new EmbedBuilder()
                .setTitle(`${config.EMOJIS.ERROR} Error`)
                .setDescription('कोई गाना play नहीं हो रहा है!')
                .setColor(config.COLORS.ERROR);
            return interaction.editReply({ embeds: [embed] });
        }

        const speed = interaction.options.getNumber('rate');
        queue.speed = speed;

        let speedEmoji = '▶️';
        if (speed < 1.0) speedEmoji = '🐌';
        else if (speed > 1.0) speedEmoji = '⚡';

        const embed = new EmbedBuilder()
            .setTitle(`${speedEmoji} Speed Changed`)
            .setDescription(`Playback speed set to: **${speed}x**\n\n⚠️ Note: Speed change will apply to next track. Current track को restart करने के लिए \`/replay\` use करें।`)
            .setColor(config.COLORS.SUCCESS)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
