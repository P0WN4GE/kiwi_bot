const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { EmbedBuilder } = require('@discordjs/builders');
const moment = require('moment');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kicks user from the server')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('User to kick from server')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('Reason for kicking user')),

	async execute(interaction) {

		const timeNow = moment().format('DD/MM/YYYY, hh:mm:ss a');

		const logChannelSchema = require('../../schemas/channelSchema');
		const caseNumSchema = require('../../schemas/modCase');

		const target = interaction.options.getUser('user');
		let reason = interaction.options.getString('reason');

		const data = await logChannelSchema.findOne({
			GuildID: interaction.guild.id,
		});

		const caseNumData = await caseNumSchema.findOne({
			guildId: interaction.guild.id,
		});

		const logChannel = interaction.guild.channels.cache.get(data.ChannelID);

		if (!reason) {
			reason = 'No reason given';
		}

		const embed = new EmbedBuilder()
			.setAuthor({ name: 'Case #' + caseNumData.caseNum + ' | Kick', iconURL: target.displayAvatarURL() })
			.setColor([255, 0, 0])
			.addFields([
				{ name: 'User', value: target.toString(), inline: true },
				{ name: 'Moderator', value: interaction.user.toString(), inline: true },
				{ name: 'Reason', value: reason, inline: true },
			])
			.setFooter({ text: 'ID: ' + target.id + ' • ' + timeNow });


		await interaction.guild.members.fetch();
		const userPerms = interaction.guild.members.cache.find(user => user.id === interaction.user.id).permissions;
		const targetPerms = interaction.guild.members.cache.find(user => user.id === target.id).permissions;


		if (userPerms.has(PermissionsBitField.Flags.KickMembers)) {

			if (target.id === interaction.user.id) {
				await interaction.reply({ content: 'Cannot kick yourself', ephemeral: true });
			}

			if (targetPerms.has(PermissionsBitField.Flags.ManageMessages || targetPerms.has(PermissionsBitField.Flags.Administrator))) {
				await interaction.reply({ content: 'Cannot kick a moderator or admin', ephemeral: true });
			}
			else {
				target.send('You have been kicked from ' + interaction.guild.name + ' by ' +
                            // eslint-disable-next-line no-empty-function
                            interaction.user.tag + ' for:\n' + reason).catch(() => {});
				interaction.guild.members.kick(target, reason);
				caseNumData.caseNum++;
				caseNumData.save();
				try {
					logChannel.send({ embeds: [embed] });
				}
				catch (err) {
					console.log(err);
				}
				await interaction.reply({ content: 'User has been kicked, logs saved to ' + logChannel.toString(), ephemeral: true });
			}

		}
		else {
			await interaction.reply({ content: 'You do not have permission to run this command, if you believe this is an error please contact an Admin', ephemeral: true });
		}

	},
};