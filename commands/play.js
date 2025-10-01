const { SlashCommandBuilder } = require('discord.js');
const playdl = require('play-dl');
const spotifyUtil = require('./spotify'); // Adjust the path accordingly

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song by Spotify best match or from YouTube link via Spotify')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Spotify song name or YouTube URL')
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
      // Detect if input is YouTube playlist link
      if (playdl.yt_validate(query) === 'playlist') {
        return interaction.editReply('⏳ YouTube playlists are currently not supported. Please try a single video or song name.');
      }

      let searchTitle;

      if (playdl.yt_validate(query) === 'video') {
        // YouTube video URL case: fetch title from play-dl
        const info = await playdl.video_basic_info(query);
        searchTitle = info.video_details.title;
      } else {
        // Assume direct song name or Spotify URL input - try to extract or use as is
        searchTitle = query;
      }

      // Get Spotify client
      const spotify = await spotifyUtil.getUncachableSpotifyClient();

      // Spotify search track, limit 1 for best match
      const searchResults = await spotify.search.searchTracks(searchTitle, { limit: 1 });

      if (searchResults.tracks.items.length === 0) {
        return interaction.editReply(`❌ No matching Spotify track found for "${searchTitle}". Try another query.`);
      }

      // Play best matched Spotify track URL using Distube
      const track = searchResults.tracks.items[0];
      await distube.play(voiceChannel, track.external_urls.spotify, {
        member,
        textChannel: interaction.channel
      });

      return interaction.editReply(`🎶 Playing from Spotify: **${track.name}** by **${track.artists[0].name}**`);

    } catch (error) {
      console.error('[ERROR] Play command:', error);
      return interaction.editReply(`❌ Error playing track: ${error.message}`);
    }
  }
};