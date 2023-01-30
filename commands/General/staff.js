const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('staff')
		.setDescription('Provides list of staff'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run

		await interaction.guild.members.fetch();
		const administrators = interaction.guild.members.cache.filter((m) => m.permissions.has(PermissionsBitField.Flags.Administrator) && !m.user.bot);
		console.log(administrators);
		const moderators = interaction.guild.members.cache.filter((m) => !administrators.has(m.id) && m.permissions.has(PermissionsBitField.Flags.ManageMessages) && !m.user.bot);
		console.log(moderators);

		const embed = new EmbedBuilder()
			.setColor('#85e69f')
			.setTitle(interaction.guild.name + ' Staff List')
			.addFields([
				{ name: 'ADMINS', value: administrators.map((a) => ` <@${a.user.id}>`).join('\n'), inline: false },
				{ name: 'MODS', value: moderators.map((a) => ` <@${a.user.id}>`).join('\n'), inline: false },
			]);

		await interaction.reply({ embeds: [embed] });

	},
};
