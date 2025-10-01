const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
// const ytdl = require('ytdl-core');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');

// Helper function to parse cookies.txt
function parseCookiesTxt(filePath) {
    const cookies = [];
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split(/\r?\n/).forEach((line, index) => {
            if (!line || line.startsWith('#')) return;
            const parts = line.split('\t');
            if (parts.length >= 7) {
                cookies.push(`${parts[5]}=${parts[6]}`);
            }
        });
    } catch (err) {
        console.error(`[ERROR] Failed to read cookies.txt: ${err.message}`);
    }
    return cookies.join('; '); // ytdl-core expects cookies as a single string
}

const cookies = parseCookiesTxt('cookies.txt'); // Make sure cookies.txt is in the same folder

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube URL or by name')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('YouTube URL or song name')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const member = interaction.member;
        if (!member) return interaction.editReply('❌ Member info not available.');

        const voiceChannel = member.voice?.channel;
        if (!voiceChannel) return interaction.editReply('❌ Join a voice channel first!');

        const query = interaction.options.getString('query');
        const distube = global.distube;

        if (!distube) return interaction.editReply('❌ Bot not ready. Try again later.');

        try {
            await distube.play(voiceChannel, query, {
                member: member,
                textChannel: interaction.channel,
                ytdlOptions: {
                    quality: 'highestaudio',
                    filter: 'audioonly',
                    highWaterMark: 1 << 25,
                    requestOptions: {
                        headers: {
                            cookie: cookies // Pass cookies here
                        }
                    }
                }
            });

            return interaction.editReply(`🔍 Searching and playing: **${query}**`);
        } catch (error) {
            console.error('[ERROR] Play command:', error);
            return interaction.editReply(`❌ Error: ${error.message}`);
        }
    }
};