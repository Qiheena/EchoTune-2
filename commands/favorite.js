const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');
const { getDb } = require('../src/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favorite')
        .setDescription('मौजूदा गाने को favorites में save करें या favorites list देखें')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('मौजूदा गाने को favorites में add करें')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('अपनी favorites list देखें')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Favorites से एक गाना चलाएं')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Favorite का number')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Favorites से एक गाना हटाएं')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Favorite का number')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        const db = getDb();
        
        db.exec(`CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        if (subcommand === 'add') {
            const queue = global.getQueue(interaction.guild.id);
            if (!queue.nowPlaying) {
                return interaction.editReply('❌ कोई गाना नहीं चल रहा है!');
            }

            const title = queue.nowPlaying.info?.title || queue.nowPlaying.title;
            const url = queue.nowPlaying.url || queue.nowPlaying.info?.uri;

            const existing = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND url = ?').get(userId, url);
            if (existing) {
                return interaction.editReply('❌ यह गाना पहले से आपके favorites में है!');
            }

            db.prepare('INSERT INTO favorites (user_id, title, url) VALUES (?, ?, ?)').run(userId, title, url);

            const embed = new EmbedBuilder()
                .setTitle('💖 Favorite Added!')
                .setDescription(`**${title}** को आपके favorites में add कर दिया गया!`)
                .setColor(config.COLORS.SUCCESS)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'list') {
            const favorites = db.prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC').all(userId);

            if (favorites.length === 0) {
                return interaction.editReply('❌ आपकी favorites list खाली है! `/favorite add` से गाने add करें।');
            }

            const embed = new EmbedBuilder()
                .setTitle(`💖 ${interaction.user.username} की Favorites`)
                .setDescription(favorites.map((fav, index) => `**${index + 1}.** ${fav.title}`).join('\n'))
                .setColor(config.COLORS.INFO)
                .setFooter({ text: `कुल ${favorites.length} favorite गाने` })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'play') {
            const number = interaction.options.getInteger('number');
            const favorites = db.prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC').all(userId);

            if (number < 1 || number > favorites.length) {
                return interaction.editReply(`❌ Invalid number! आपके पास ${favorites.length} favorites हैं।`);
            }

            const favorite = favorites[number - 1];

            const playCommand = require('./play.js');
            interaction.options.getString = () => favorite.url;
            
            return playCommand.execute(interaction);

        } else if (subcommand === 'remove') {
            const number = interaction.options.getInteger('number');
            const favorites = db.prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC').all(userId);

            if (number < 1 || number > favorites.length) {
                return interaction.editReply(`❌ Invalid number! आपके पास ${favorites.length} favorites हैं।`);
            }

            const favorite = favorites[number - 1];
            db.prepare('DELETE FROM favorites WHERE id = ?').run(favorite.id);

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Favorite Removed')
                .setDescription(`**${favorite.title}** को favorites से हटा दिया गया!`)
                .setColor(config.COLORS.ERROR)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }
    },
};
