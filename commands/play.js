const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const YouTube = require('youtube-sr').default;
const fs = require('fs');

// Helper function to parse cookies.txt with debug logs
function parseCookiesTxt(filePath) {
    const cookies = [];
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`[DEBUG] Reading cookies from: ${filePath}`);
        content.split('
').forEach((line, index) => {
            if (!line || line.startsWith('#')) {
                console.log(`[DEBUG] Skipping line ${index + 1}: Comment or empty`);
                return;
            }
            const parts = line.split('\t');
            if (parts.length >= 7) {
                cookies.push({
                    domain: parts[0],
                    path: parts[2],
                    name: parts[5],
                    value: parts[6],
                });
                console.log(`[DEBUG] Parsed cookie: ${parts[5]}=${parts[6]} at line ${index + 1}`);
            } else {
                console.log(`[DEBUG] Invalid cookie line ${index + 1}: ${line}`);
            }
        });
    } catch (err) {
        console.error(`[ERROR] Failed to read cookies.txt: ${err.message}`);
    }
    console.log(`[DEBUG] Total cookies parsed: ${cookies.length}`);
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
            console.log('[DEBUG] Member info not available');
            return interaction.editReply('❌ Member information not available. Please try again.');
        }

        const voiceChannel = member.voice?.channel;
        if (!voiceChannel) {
            console.log('[DEBUG] Member not in voice channel');
            return interaction.editReply('❌ आपको पहले किसी voice channel में join करना होगा!');
        }

        const query = interaction.options.getString('query');
        console.log(`[DEBUG] Play command query: ${query}`);

        try {
            const distube = global.distube;

            console.log('[DEBUG] Starting distube.play');
            await distube.play(voiceChannel, query, {
                member: member,
                textChannel: interaction.channel,
                ytdlOptions: { agent }
            });
            console.log('[DEBUG] distube.play successful');

            return interaction.editReply(`🔍 Searching: **${query}**`);
        } catch (error) {
            console.error('[ERROR] Play command error:', error);
            return interaction.editReply(`❌ Error: ${error.message}
कृपया दूसरा गाना try करें।`);
        }
    },
};