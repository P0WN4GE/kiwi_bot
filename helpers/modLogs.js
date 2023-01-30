const { Events, EmbedBuilder } = require('discord.js');

function handleLogs(client) {
	const logChannelSchema = require('../schemas/channelSchema');

	async function sendLog(guildID, embed) {
		const data = await logChannelSchema.findOne({
			GuildID: guildID,
		});

		const channel = client.channels.cache.get(data.ChannelID);

		embed.setTimestamp();

		try {
			channel.send({ embeds: [embed] });
		}
		catch (err) {
			console.log(err);
		}
	}

	client.on(Events.MessageUpdate, async (oldContent, newContent) => {
		if (oldContent.partial) oldContent = await oldContent.fetch();
		if (newContent.partial) newContent = await newContent.fetch();

		if (oldContent.author.bot) return;
		const embed = new EmbedBuilder()
			.setTitle('Message Edited')
			.setColor('Grey')
			.setDescription(`Message Edited from \`${oldContent}\` to \`${newContent}\` by ${oldContent.author}`);

		return sendLog(oldContent.guild.id, embed);

	});

	client.on(Events.MessageDelete, async (message) => {
		if (message.partial) message = message.fetch();

		if (message.author.bot) return;

		const embed = new EmbedBuilder()
			.setTitle('Message Deleted')
			.setColor('Red')
			.setDescription(`
            **Author : ** <@${message.author.id}> - *${message.author.tag}*
            **Date : ** ${message.createdAt}
            **Channel : ** <#${message.channel.id}> - *${message.channel.name}*
            **Deleted Message : **\`${message.content.replace(/`/g, '\'')}\`
         `);

		return sendLog(message.guild.id, embed);
	});
}

module.exports = { handleLogs };