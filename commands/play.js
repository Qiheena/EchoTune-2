const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const YouTube = require('youtube-sr').default;
const fs = require('fs');

// Helper: Parse cookies.txt (Netscape format) into array for ytdl.createAgent
function parseCookiesTxt(filePath) {
    const cookies = [];
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('
').forEach(line => {
        // Ignore comments and empty lines
        if (!line || line.startsWith('#')) return;
        const parts = line.split('\t');
        if (parts.length >= 7) {
            cookies.push({
                domain: parts[0],
                path: parts[2],
                name: parts[5],
                value: parts[6],
                // Additional fields can be set if needed
            });
        }
    });
    return cookies;
}

const cookiesArray = parseCookiesTxt('cookies.txt');
const agent = ytdl.createAgent(cookiesArray);

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
                textChannel: interaction.channel,
                ytdlOptions: { agent } // cookies-enabled agent yahan set karo
            });

            return interaction.editReply(`🔍 Searching: **${query}**`);

        } catch (error) {
            console.error('Play command error:', error);
            return interaction.editReply(`❌ Error: ${error.message}
कृपया दूसरा गाना try करें।`);
        }
    },
};