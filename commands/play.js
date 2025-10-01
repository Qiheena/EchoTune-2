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
            const distube = global.distube;
            
            await distube.play(voiceChannel, query, {
                member: member,
                textChannel: interaction.channel
            });
            
            return interaction.editReply(`🔍 Searching: **${query}**`);

        } catch (error) {
            console.error('Play command error:', error);
            return interaction.editReply(`❌ Error: ${error.message}\nकृपया दूसरा गाना try करें।`);
        }
    },
};