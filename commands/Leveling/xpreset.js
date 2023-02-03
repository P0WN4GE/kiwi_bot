const { SlashCommandBuilder } = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const levelSchema = require('../../schemas/levelSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('xpreset')
		.setDescription('Resets the xp of a member of server')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('User to clear xp of')
				.setRequired(true)),
	async execute(interaction) {

		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
			return await interaction.reply(
				{ content: 'You do not have permission to run this command, if you believe this is an error please contact an Admin', ephemeral: true });
		}

		const target = interaction.options.getUser('user');

		// eslint-disable-next-line no-unused-vars
		levelSchema.deleteOne({ userId: target.id }, async (err, data) => {
			await interaction.reply({ content: 'User\'s xp has been reset', ephemeral: true });
		});
	},
};