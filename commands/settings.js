const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, updateGuildPrefix, updateGuildVolume } = require('../src/database');
const { db } = require('../src/database');
const config = require('../config/botConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure bot settings for your server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current server settings')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('prefix')
                .setDescription('Change command prefix')
                .addStringOption(option =>
                    option.setName('new_prefix')
                        .setDescription('New prefix (e.g., !, ?, .)')
                        .setRequired(true)
                        .setMaxLength(5)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('volume')
                .setDescription('Set default volume')
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Default volume (0-100)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(100)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('language')
                .setDescription('Set bot language')
                .addStringOption(option =>
                    option.setName('lang')
                        .setDescription('Select language')
                        .setRequired(true)
                        .addChoices(
                            { name: 'हिन्दी (Hindi)', value: 'hi' },
                            { name: 'English', value: 'en' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('djmode')
                .setDescription('Enable/Disable DJ mode (requires DJ role for commands)')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable DJ mode?')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('djrole')
                .setDescription('Set DJ role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role that can use music commands when DJ mode is enabled')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('announcechannel')
                .setDescription('Set channel for now playing announcements')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for announcements (leave empty to disable)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset all settings to default')
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const guildSettings = getGuildSettings(interaction.guild.id);

        try {
            switch (subcommand) {
                case 'view':
                    const embed = new EmbedBuilder()
                        .setTitle(`${config.EMOJIS.SUCCESS} Server Settings - ${interaction.guild.name}`)
                        .setColor(config.COLORS.INFO)
                        .addFields(
                            { name: '🔧 Prefix', value: `\`${guildSettings.prefix}\``, inline: true },
                            { name: '🔊 Default Volume', value: `${guildSettings.volume}%`, inline: true },
                            { name: '🌐 Language', value: guildSettings.language === 'hi' ? '🇮🇳 Hindi' : '🇬🇧 English', inline: true },
                            { name: '🎧 DJ Mode', value: guildSettings.dj_mode ? '✅ Enabled' : '❌ Disabled', inline: true },
                            { name: '👑 DJ Role', value: guildSettings.dj_role_id ? `<@&${guildSettings.dj_role_id}>` : 'Not set', inline: true },
                            { name: '📢 Announce Channel', value: guildSettings.announce_channel_id ? `<#${guildSettings.announce_channel_id}>` : 'Disabled', inline: true },
                            { name: '🔂 24/7 Mode', value: guildSettings.twentyfour_seven ? '✅ Enabled' : '❌ Disabled', inline: true }
                        )
                        .setThumbnail(interaction.guild.iconURL())
                        .setFooter({ text: `Use /settings <option> to change settings` })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;

                case 'prefix':
                    const newPrefix = interaction.options.getString('new_prefix');
                    
                    if (newPrefix.length > 5) {
                        return interaction.editReply('❌ Prefix must be 5 characters or less!');
                    }

                    updateGuildPrefix(interaction.guild.id, newPrefix);

                    const prefixEmbed = new EmbedBuilder()
                        .setTitle(`${config.EMOJIS.SUCCESS} Prefix Updated`)
                        .setDescription(`Server prefix changed to: \`${newPrefix}\`\n\nExample: \`${newPrefix}play Tum Hi Ho\``)
                        .setColor(config.COLORS.SUCCESS)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [prefixEmbed] });
                    break;

                case 'volume':
                    const volume = interaction.options.getInteger('level');
                    updateGuildVolume(interaction.guild.id, volume);

                    const volumeEmbed = new EmbedBuilder()
                        .setTitle(`${config.EMOJIS.SUCCESS} Default Volume Set`)
                        .setDescription(`Default volume set to: **${volume}%**\n\nThis will be the starting volume for new music sessions.`)
                        .setColor(config.COLORS.SUCCESS)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [volumeEmbed] });
                    break;

                case 'language':
                    const lang = interaction.options.getString('lang');
                    
                    const updateLangStmt = db.prepare('UPDATE guild_settings SET language = ? WHERE guild_id = ?');
                    updateLangStmt.run(lang, interaction.guild.id);

                    const langName = lang === 'hi' ? '🇮🇳 हिन्दी (Hindi)' : '🇬🇧 English';
                    const langEmbed = new EmbedBuilder()
                        .setTitle(`${config.EMOJIS.SUCCESS} Language Updated`)
                        .setDescription(`Bot language set to: ${langName}`)
                        .setColor(config.COLORS.SUCCESS)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [langEmbed] });
                    break;

                case 'djmode':
                    const djEnabled = interaction.options.getBoolean('enabled');
                    
                    const updateDJStmt = db.prepare('UPDATE guild_settings SET dj_mode = ? WHERE guild_id = ?');
                    updateDJStmt.run(djEnabled ? 1 : 0, interaction.guild.id);

                    const djEmbed = new EmbedBuilder()
                        .setTitle(`${config.EMOJIS.SUCCESS} DJ Mode ${djEnabled ? 'Enabled' : 'Disabled'}`)
                        .setDescription(djEnabled 
                            ? '🎧 DJ Mode is now **enabled**!\nOnly users with the DJ role can use music commands.\n\nSet DJ role with `/settings djrole`'
                            : '🎧 DJ Mode is now **disabled**!\nEveryone can use music commands.')
                        .setColor(config.COLORS.SUCCESS)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [djEmbed] });
                    break;

                case 'djrole':
                    const djRole = interaction.options.getRole('role');
                    
                    const updateDJRoleStmt = db.prepare('UPDATE guild_settings SET dj_role_id = ? WHERE guild_id = ?');
                    updateDJRoleStmt.run(djRole.id, interaction.guild.id);

                    const djRoleEmbed = new EmbedBuilder()
                        .setTitle(`${config.EMOJIS.SUCCESS} DJ Role Set`)
                        .setDescription(`DJ role set to: ${djRole}\n\nUsers with this role can use music commands when DJ mode is enabled.`)
                        .setColor(config.COLORS.SUCCESS)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [djRoleEmbed] });
                    break;

                case 'announcechannel':
                    const channel = interaction.options.getChannel('channel');
                    
                    const updateChannelStmt = db.prepare('UPDATE guild_settings SET announce_channel_id = ? WHERE guild_id = ?');
                    updateChannelStmt.run(channel ? channel.id : null, interaction.guild.id);

                    const channelEmbed = new EmbedBuilder()
                        .setTitle(`${config.EMOJIS.SUCCESS} Announce Channel ${channel ? 'Set' : 'Disabled'}`)
                        .setDescription(channel 
                            ? `Now playing announcements will be sent to: ${channel}`
                            : 'Now playing announcements are now disabled.')
                        .setColor(config.COLORS.SUCCESS)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [channelEmbed] });
                    break;

                case 'reset':
                    const resetStmt = db.prepare(`
                        UPDATE guild_settings 
                        SET prefix = '!', volume = 50, language = 'hi', 
                            dj_mode = 0, dj_role_id = NULL, announce_channel_id = NULL,
                            twentyfour_seven = 0
                        WHERE guild_id = ?
                    `);
                    resetStmt.run(interaction.guild.id);

                    const resetEmbed = new EmbedBuilder()
                        .setTitle(`${config.EMOJIS.SUCCESS} Settings Reset`)
                        .setDescription('All server settings have been reset to default values!')
                        .addFields(
                            { name: 'Prefix', value: '`!`', inline: true },
                            { name: 'Volume', value: '50%', inline: true },
                            { name: 'Language', value: '🇮🇳 Hindi', inline: true }
                        )
                        .setColor(config.COLORS.SUCCESS)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [resetEmbed] });
                    break;

                default:
                    await interaction.editReply('❌ Unknown subcommand!');
            }
        } catch (error) {
            console.error('Settings command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle(`${config.EMOJIS.ERROR} Error`)
                .setDescription(`Failed to update settings: ${error.message}`)
                .setColor(config.COLORS.ERROR);

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
