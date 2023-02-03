const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const levelSchema = require('../../schemas/levelSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Displays the server\'s xp leaderboard'),
	async execute(interaction) {
		const { guild, client } = interaction;

		let text = '';

		const embed1 = new EmbedBuilder()
			.setColor('Blue')
			.setDescription(':x: No one is on the leaderboard yet...');

		const Data = await levelSchema.find({ guildId: guild.id })
			.sort({
				xp: -1,
				level: -1,
			})
			.limit(10);

		if (!Data) return await interaction.reply({ embed: [embed1] });

		await interaction.deferReply();

		for (let counter = 0; counter < Data.length; ++counter) {
			const { userId, xp, level } = Data[counter];

			const value = await client.users.fetch(userId) || 'Unknown Member';

			const member = value.tag;

			text += `${counter + 1}. ${member} | XP: ${xp} | Level: ${level} \n`;

			const embed = new EmbedBuilder()
				.setColor('Blue')
				.setTitle(`${interaction.guild.name}'s XP Leaderboard`)
				.setDescription(`\`\`\`${text}\`\`\``)
				.setTimestamp()
				.setFooter({ text: 'XP Leaderboard' });

			interaction.editReply({ embeds: [embed] });

		}
	},
};