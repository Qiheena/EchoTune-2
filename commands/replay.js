const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('replay')
        .setDescription('मौजूदा गाने को शुरू से फिर से चलाएं'),

    async execute(interaction) {
        await interaction.deferReply();

        const queue = global.getQueue(interaction.guild.id);
        const player = global.audioPlayers.get(interaction.guild.id);

        if (!queue.nowPlaying || !player) {
            return interaction.editReply('❌ कोई गाना नहीं चल रहा है!');
        }

        try {
            const { playFallbackTrack } = require('../src/MusicPlayer');
            const currentTrack = queue.nowPlaying;
            
            player.stop();
            
            setTimeout(async () => {
                const success = await playFallbackTrack(interaction.guild.id, currentTrack);
                if (success) {
                    queue.lastActivity = Date.now();
                    return interaction.editReply(`🔄 **${currentTrack.info?.title || 'गाना'}** को restart कर दिया!`);
                } else {
                    return interaction.editReply('❌ Replay करने में error हुई!');
                }
            }, 500);

        } catch (error) {
            console.error('Replay error:', error);
            return interaction.editReply('❌ Replay करने में error हुई!');
        }
    },
};
