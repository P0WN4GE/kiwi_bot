const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Purges x number of messages')
		.addIntegerOption(option =>
			option
				.setName('message_count')
				.setDescription('Numer of messages to purge')
				.setRequired(true)),
	async execute(interaction) {
		const message_count = interaction.options.getInteger('message_count');

		await interaction.guild.members.fetch();

		if (interaction.guild.members.cache.find(u => u.id === interaction.user.id).permissions.has(PermissionsBitField.Flags.ManageMessages)) {
			if (message_count < 1 || message_count > 100) {
				await interaction.reply({ content:'Invalid input', ephemeral: true });
			}
			else {
				let messages = await interaction.channel.messages.fetch({ limit:message_count });
				messages = messages.filter((m) => !m.pinned);

				await interaction.channel.bulkDelete(messages, true);
				await interaction.reply({ content: message_count + ' messages successfully deleted', ephemeral: true });
			}
		}
		else {await interaction.reply({ content: 'Insufficient Permissions', ephemeral: true });}
	},
};