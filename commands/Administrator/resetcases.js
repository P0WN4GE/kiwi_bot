const { SlashCommandBuilder } = require('discord.js');
const caseNumSchema = require('../../schemas/modCase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resetcases')
		.setDescription('Resets case counter for this server'),
	async execute(interaction) {

		const data = await caseNumSchema.findOne({
			guildId: interaction.guild.id,
		});

		if (!data) {await interaction.reply({ content: 'No case counter found, contact dev for more info', ephermeral: true });}
		else {
			data.caseNum = 1;
			data.save();
			await interaction.reply({ content: 'Case counter has been reset', ephermeral: true });
		}
	},
};