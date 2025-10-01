const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('गाने में किसी specific time पर जाएं')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('समय (जैसे: 1:30 या 90 seconds के लिए)')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const queue = global.getQueue(interaction.guild.id);
        const player = global.audioPlayers.get(interaction.guild.id);
        
        if (!queue.nowPlaying || !player) {
            return interaction.editReply('❌ कोई गाना नहीं चल रहा है!');
        }

        const timeStr = interaction.options.getString('time');
        let seconds;

        if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            } else if (parts.length === 3) {
                seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
            }
        } else {
            seconds = parseInt(timeStr);
        }

        if (isNaN(seconds) || seconds < 0) {
            return interaction.editReply('❌ Invalid time format! उदाहरण: 1:30 या 90');
        }

        const duration = queue.nowPlaying.info?.length || 0;
        if (duration > 0 && seconds > duration / 1000) {
            return interaction.editReply(`❌ Time गाने की duration से ज्यादा है! (Max: ${Math.floor(duration / 60000)}:${Math.floor((duration % 60000) / 1000)})`);
        }

        try {
            return interaction.editReply(`⚠️ Seek feature coming soon! अभी के लिए \`/replay\` से गाना restart करें।\n\nNote: Seeking को implement करने के लिए live stream restart की जरूरत होती है जो currently Discord voice API में proper support नहीं है।`);
            
        } catch (error) {
            console.error('Seek error:', error);
            return interaction.editReply('❌ Seek करने में error हुई!');
        }
    },
};
