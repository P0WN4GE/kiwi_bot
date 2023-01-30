const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('Provides information about the server.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run

		await interaction.guild.members.fetch();

		const embed = new EmbedBuilder()
			.setColor('#85e69f')
			.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
			.addFields([
				{ name: 'Name', value: interaction.guild.name, inline: true },
				{ name: '📅 Creation Date', value: interaction.guild.createdAt.toString(), inline: true },
				{ name: 'Member Count', value: '🧑‍🤝‍🧑 Members: ' + interaction.guild.members.cache.filter(m => !m.user.bot).size +
				'\n🤖 Bots: ' + interaction.guild.members.cache.filter(m => m.user.bot).size, inline: true },
				{ name: '👑 Owner', value: `<@${interaction.guild.ownerId}>`, inline: true },
				{ name: '🚀 Boosts', value: String(interaction.guild.premiumSubscriptionCount), inline: true },
				{ name: 'Invite URL', value: 'https://discord.gg/kiwiipeach', inline: true },
			]);

		await interaction.reply({ embeds: [embed] });

	},
};
