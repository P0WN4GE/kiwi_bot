const { SlashCommandBuilder } = require('discord.js');
const channelSchema = require('../../schemas/channelSchema');
const caseNumSchema = require('../../schemas/modCase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setchannel')
		.setDescription('Sets the channel for mod logs')
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('Channel to set modlog to')
				.setRequired(true)),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');

		const content = await channelSchema.findOne({
			GuildID: interaction.guild.id,
		});

		const caseCount = await caseNumSchema.findOne({
			guildId: interaction.guild.id,
		});

		if (!content) {
			const content = new channelSchema({
				GuildID: interaction.guild.id,
				ChannelID: channel.id,
			});
			content.save();
			interaction.channel.send('ok saved');
		}
		else {
			await channelSchema.deleteOne({
				GuildID: interaction.guild.id,
			});

			const content = new channelSchema({
				GuildID: interaction.guild.id,
				ChannelID: channel.id,
			});
			content.save();
			interaction.channel.send('ok saved');
		}

		if (!caseCount) {
			console.log('No case count schema found, creating new....');
			const caseCount = new caseNumSchema({
				guildId: interaction.guild.id,
				caseNum: 1,
			});
			caseCount.save();
			interaction.channel.send('casecount created');
		}

		await interaction.reply('success!');
	},
};