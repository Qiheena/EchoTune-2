const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('मौजूदा या specified गाने के lyrics प्राप्त करें')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('गाने का नाम (optional - current song के लिए खाली छोड़ें)')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const queue = global.getQueue(interaction.guild.id);
        let songName = interaction.options.getString('song');

        if (!songName) {
            if (!queue.nowPlaying) {
                return interaction.editReply('❌ कोई गाना नहीं चल रहा है! गाने का नाम specify करें।');
            }
            songName = queue.nowPlaying.info?.title || queue.nowPlaying.title;
        }

        try {
            const axios = require('axios');
            
            const cleanSongName = songName
                .replace(/\(.*?\)/g, '')
                .replace(/\[.*?\]/g, '')
                .replace(/official|video|audio|music|lyric/gi, '')
                .trim();

            const searchUrl = `https://api.lyrics.ovh/suggest/${encodeURIComponent(cleanSongName)}`;
            const searchResponse = await axios.get(searchUrl, { timeout: 5000 });

            if (!searchResponse.data || !searchResponse.data.data || searchResponse.data.data.length === 0) {
                return interaction.editReply('❌ इस गाने के lyrics नहीं मिले!');
            }

            const song = searchResponse.data.data[0];
            const lyricsUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(song.artist.name)}/${encodeURIComponent(song.title)}`;
            const lyricsResponse = await axios.get(lyricsUrl, { timeout: 10000 });

            if (!lyricsResponse.data || !lyricsResponse.data.lyrics) {
                return interaction.editReply('❌ इस गाने के lyrics नहीं मिले!');
            }

            let lyrics = lyricsResponse.data.lyrics;
            
            if (lyrics.length > 4000) {
                lyrics = lyrics.substring(0, 3950) + '...\n\n_[Lyrics truncated]_';
            }

            const embed = new EmbedBuilder()
                .setTitle(`🎤 ${song.title}`)
                .setDescription(lyrics)
                .setColor(config.COLORS.INFO)
                .setThumbnail(song.album?.cover_medium || song.artist?.picture_medium)
                .addFields(
                    { name: '👤 Artist', value: song.artist?.name || 'Unknown', inline: true },
                    { name: '💿 Album', value: song.album?.title || 'Unknown', inline: true }
                )
                .setFooter({ text: 'Powered by lyrics.ovh' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Lyrics error:', error.message);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Lyrics नहीं मिले')
                .setDescription(`**${songName}** के lyrics खोजने में असमर्थ।\n\nआप manually यहां search कर सकते हैं:\n[Genius](https://genius.com)\n[AZLyrics](https://www.azlyrics.com)`)
                .setColor(config.COLORS.ERROR);

            return interaction.editReply({ embeds: [embed] });
        }
    },
};
