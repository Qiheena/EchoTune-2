const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Apply audio filters to music')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Filter type')
                .setRequired(true)
                .addChoices(
                    { name: '🎵 Normal (No Filter)', value: 'normal' },
                    { name: '🔊 Bass Boost', value: 'bassboost' },
                    { name: '🎤 Nightcore', value: 'nightcore' },
                    { name: '🐌 Slowed + Reverb', value: 'slowed' },
                    { name: '🎧 8D Audio', value: '8d' },
                    { name: '🎸 Vaporwave', value: 'vaporwave' },
                    { name: '🎹 Soft', value: 'soft' },
                    { name: '📢 Loud', value: 'loud' }
                )
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

        const filterType = interaction.options.getString('type');
        queue.filter = filterType;

        const filterNames = {
            'normal': '🎵 Normal',
            'bassboost': '🔊 Bass Boost',
            'nightcore': '🎤 Nightcore',
            'slowed': '🐌 Slowed + Reverb',
            '8d': '🎧 8D Audio',
            'vaporwave': '🎸 Vaporwave',
            'soft': '🎹 Soft',
            'loud': '📢 Loud'
        };

        const embed = new EmbedBuilder()
            .setTitle(`${config.EMOJIS.SUCCESS} Filter Applied`)
            .setDescription(`Filter set to: **${filterNames[filterType]}**\n\n⚠️ Note: Filters will be applied to next track. Current track को restart करने के लिए \`/replay\` use करें।`)
            .setColor(config.COLORS.SUCCESS)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
