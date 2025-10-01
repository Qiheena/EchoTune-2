const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

function setupDistube(client) {
    const distube = new DisTube(client, {
        emitNewSongOnly: false,
        plugins: [
            new YtDlpPlugin({
                update: false
            })
        ]
    });

    distube.on('playSong', (queue, song) => {
        const guildId = queue.textChannel.guild.id;
        console.log(`[${guildId}] ▶️ Now playing: ${song.name}`);
        
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const config = require('../config/botConfig');
        
        const embed = new EmbedBuilder()
            .setTitle('🎵 अब play हो रहा है')
            .setDescription(`**[${song.name}](${song.url})**`)
            .addFields(
                { name: '⏱️ Duration', value: song.formattedDuration || 'Live', inline: true },
                { name: '👤 Requested by', value: song.user.toString(), inline: true },
                { name: '🔊 Volume', value: `${queue.volume}%`, inline: true }
            )
            .setThumbnail(song.thumbnail)
            .setColor(config.COLORS.SUCCESS);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('pause_resume')
                .setEmoji('⏯️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('skip')
                .setEmoji('⏭️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('stop')
                .setEmoji('⏹️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('loop')
                .setEmoji('🔁')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('queue')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Secondary)
        );

        queue.textChannel.send({ embeds: [embed], components: [row] }).catch(console.error);
    });

    distube.on('addSong', (queue, song) => {
        const guildId = queue.textChannel.guild.id;
        console.log(`[${guildId}] ➕ Added to queue: ${song.name}`);
        queue.textChannel.send(`✅ **${song.name}** को queue में add कर दिया! Position: ${queue.songs.length}`).catch(console.error);
    });

    distube.on('error', (channel, error) => {
        console.error('DisTube error:', error);
        if (channel) {
            channel.send(`❌ Error हुई: ${error.message.slice(0, 100)}`).catch(console.error);
        }
    });

    distube.on('finish', (queue) => {
        console.log(`[${queue.textChannel.guild.id}] 🏁 Queue finished`);
    });

    distube.on('disconnect', (queue) => {
        console.log(`[${queue.textChannel.guild.id}] 👋 Bot disconnected from voice`);
    });

    distube.on('empty', (queue) => {
        console.log(`[${queue.textChannel.guild.id}] 🔇 Voice channel is empty`);
    });

    return distube;
}

module.exports = { setupDistube };
