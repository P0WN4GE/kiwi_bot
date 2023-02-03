const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const levelSchema = require('../../schemas/levelSchema');
const Canvacord = require('canvacord');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rank')
		.setDescription('Gets the rank of a member of server')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('User to get rank of')
				.setRequired(false)),
	async execute(interaction) {

		const user = interaction.user;
		const guild = interaction.guild;

		await interaction.guild.members.fetch();

		const Member = interaction.options.getUser('user') || user;
		const member = interaction.guild.members.cache.get(Member.id);

		const Data = await levelSchema.findOne({ guildId: guild.id, userId: member.id });

		const embed = new EmbedBuilder()
			.setColor('Blue')
			.setDescription(`:white_check_mark: ${member} has not gained any XP yet`);

		if (!Data) return await interaction.reply({ embeds: [embed] });

		await interaction.deferReply();

		const required = Data.level * Data.level * 20 + 30;

		const rank = new Canvacord.Rank()
			.setAvatar(member.displayAvatarURL())
			.setBackground('IMAGE', 'https://discordjs.guide/assets/canvas-preview.30c4fe9e.png')
			.setCurrentXP(Data.xp)
			.setRequiredXP(required)
			.setRank(1, 'Rank', false)
			.setLevel(Data.level, 'Level')
			.setUsername(member.user.username)
			.setDiscriminator(member.user.discriminator);

		const card = await rank.build();

		const attachment = new AttachmentBuilder(card, { name: 'rank.png' });

		const embed2 = new EmbedBuilder()
			.setColor('Blue')
			.setTitle(`${member.user.username}'s Level / Rank`)
			.setImage('attachment://rank.png');

		await interaction.editReply({ embeds: [embed2], files: [attachment] });
	},
};