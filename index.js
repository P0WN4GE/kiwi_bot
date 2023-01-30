// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection, ActivityType, Partials } = require('discord.js');
const config = require('./config.json');

const fs = require('node:fs');
const path = require('path');

// Extensions
const TwitchMonitor = require('./twitch-monitor');
const MiniDb = require('./minidb');
const LiveEmbed = require('./live-embed');
const DiscordChannelSync = require('./discord-channel-sync');
const { connect } = require('mongoose');

const { handleLogs } = require('./helpers/modLogs');
// ! Uncomment to attempt twitter api fix
// const { tweetBot } = require('./helpers/twitterBot');

const client = new Client({ intents: [Object.keys(GatewayIntentBits)],
	partials: [Object.keys(Partials)] });

const init = async () => {


	client.commands = new Collection();

	// Command Collection initialisation

	const commandFolders = fs.readdirSync('./commands');

	for (const folder of commandFolders) {
		const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = `./commands/${folder}/${file}`;
			const command = require(`./commands/${folder}/${file}`);
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
			}
			else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}

	// Interaction handling

	// client.on(Events.InteractionCreate, async interaction => {
	// 	if (!interaction.isChatInputCommand()) return;

	// 	const command = interaction.client.commands.get(interaction.commandName);

	// 	if (!command) {
	// 		console.error(`No command matching ${interaction.commandName} was found.`);
	// 		return;
	// 	}

	// 	try {
	// 		await command.execute(interaction);
	// 	}
	// 	catch (error) {
	// 		console.error(error);
	// 		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	// 	}
	// });

	// Events initialization and handling

	const eventsPath = path.join(__dirname, 'events');
	const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const event = require(filePath);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		}
		else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
};

init();

// -- Startup ---------------------------------------------------------------------------------------------------------

console.log('[Startup] Kiwi Bot is starting...');

// -- Discord ---------------------------------------------------------------------------------------------------------

let targetChannels = [];

const syncServerList = (logMembership) => {
	targetChannels = DiscordChannelSync.getChannelList(client, config.discord_announce_channel, logMembership);
};

// Log in to Discord with your client's discord_bot_token
client.login(config.discord_bot_token);

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`[Startup] Ready! Logged in as ${c.user.tag}`);

	syncServerList(true);

	StreamActivity.init(client);

	// Load TwitchMonitor Extensions
	TwitchMonitor.start();

	connect(config.mongoDb_token).catch(console.error);

	handleLogs(client);

	// ! Not working atm do not uncomment
	// tweetBot(client);
});

// Create a new client instance


// Activity Updater

class StreamActivity {
	/**
     * Registers a channel that has come online, and updates the user activity.
     */
	static setChannelOnline(stream) {
		this.onlineChannels[stream.user_name] = stream;

		this.updateActivity();
	}

	/**
     * Marks a channel has having gone offline, and updates the user activity if needed.
     */
	static setChannelOffline(stream) {
		delete this.onlineChannels[stream.user_name];

		this.updateActivity();
	}

	/**
     * Fetches the channel that went online most recently, and is still currently online.
     */
	static getMostRecentStreamInfo() {
		let lastChannel = null;
		for (const channelName in this.onlineChannels) {
			if (typeof channelName !== 'undefined' && channelName) {
				lastChannel = this.onlineChannels[channelName];
			}
		}
		return lastChannel;
	}

	/**
     * Updates the user activity on Discord.
     * Either clears the activity if no channels are online, or sets it to "watching" if a stream is up.
     */
	static updateActivity() {
		const streamInfo = this.getMostRecentStreamInfo();

		if (streamInfo) {
			this.discordClient.user.setActivity(streamInfo.user_name, {
				'url': `https://twitch.tv/${streamInfo.user_name.toLowerCase()}`,
				type: ActivityType.Watching,
			});

			console.log('[StreamActivity]', `Update current activity: watching ${streamInfo.user_name}.`);
		}
		else {
			console.log('[StreamActivity]', 'Cleared current activity.');

			this.discordClient.user.setActivity(null);
		}
	}

	static init(discordClient) {
		this.discordClient = discordClient;
		this.onlineChannels = { };

		this.updateActivity();

		// Continue to update current stream activity every 5 minutes or so
		// We need to do this b/c Discord sometimes refuses to update for some reason
		// ...maybe this will help, hopefully
		setInterval(this.updateActivity.bind(this), 5 * 60 * 1000);
	}
}

// -- Live Event Monitor ----------------------------------------------------------------------------------------------

const liveMessageDb = new MiniDb('live-messages');
const messageHistory = liveMessageDb.get('history') || { };

TwitchMonitor.onChannelLiveUpdate((streamData) => {
	const isLive = streamData.type === 'live';

	// Refresh channel list
	try {
		syncServerList(false);
	}
	// eslint-disable-next-line no-empty
	catch (e) { }

	// Update activity
	StreamActivity.setChannelOnline(streamData);

	// Generate message
	const msgFormatted = ` ${streamData.user_name} went live on Twitch!`;
	const msgEmbed = LiveEmbed.createForStream(streamData);

	// Broadcast to all target channels
	let anySent = false;

	for (let i = 0; i < targetChannels.length; i++) {
		const discordChannel = targetChannels[i];
		const liveMsgDiscrim = `${discordChannel.guild.id}_${discordChannel.name}_${streamData.id}`;

		if (discordChannel) {
			try {
				// Either send a new message, or update an old one
				const existingMsgId = messageHistory[liveMsgDiscrim] || null;

				if (existingMsgId) {
					// Fetch existing message
					discordChannel.messages.fetch(existingMsgId)
						.then((existingMsg) => {
							existingMsg.edit({ content: msgFormatted, embeds: [msgEmbed] })
								// eslint-disable-next-line no-unused-vars
								.then((message) => {
								// Clean up entry if no longer live
									if (!isLive) {
										delete messageHistory[liveMsgDiscrim];
										liveMessageDb.put('history', messageHistory);
									}
								});
						})
						.catch((e) => {
							// Unable to retrieve message object for editing
							if (e.message === 'Unknown Message') {
								// Specific error: the message does not exist, most likely deleted.
								delete messageHistory[liveMsgDiscrim];
								liveMessageDb.put('history', messageHistory);
								// This will cause the message to be posted as new in the next update if needed.
							}
						});
				}
				else {
					// Sending a new message
					if (!isLive) {
						// We do not post "new" notifications for channels going/being offline
						continue;
					}

					// Expand the message with a @mention for "here" or "everyone"
					// We don't do this in updates because it causes some people to get spammed
					let mentionMode = (config.discord_mentions && config.discord_mentions[streamData.user_name.toLowerCase()]) || null;

					if (mentionMode) {
						mentionMode = mentionMode.toLowerCase();

						if (mentionMode === 'everyone' || mentionMode === 'here') {
							// Reserved @ keywords for discord that can be mentioned directly as text
							mentionMode = `@${mentionMode}`;
						}
						else {
							// Most likely a role that needs to be translated to <@&id> format
							const roleData = discordChannel.guild.roles.cache.find((role) => {
								return (role.name.toLowerCase() === mentionMode);
							});

							if (roleData) {
								mentionMode = `<@&${roleData.id}>`;
							}
							else {
								console.log('[Discord]', `Cannot mention role: ${mentionMode}`,
									`(does not exist on server ${discordChannel.guild.name})`);
								mentionMode = null;
							}
						}
					}

					let msgToSend = msgFormatted;

					if (mentionMode) {
						msgToSend = ` ${mentionMode}` + msgFormatted;
					}

					discordChannel.send({ content: msgToSend, embeds: [msgEmbed] })
						.then((message) => {
							console.log('[Discord]', `Sent announce msg to #${discordChannel.name} on ${discordChannel.guild.name}`);

							messageHistory[liveMsgDiscrim] = message.id;
							liveMessageDb.put('history', messageHistory);
						})
						.catch((err) => {
							console.log('[Discord]', `Could not send announce msg to #${discordChannel.name} on ${discordChannel.guild.name}:`, err.message);
						});
				}

				anySent = true;
			}
			catch (e) {
				console.warn('[Discord]', 'Message send problem:', e);
			}
		}
	}

	liveMessageDb.put('history', messageHistory);
	return anySent;
});

TwitchMonitor.onChannelOffline((streamData) => {
	// Update activity
	StreamActivity.setChannelOffline(streamData);
});


// -- Function Prototypes ---------------------------------------------------------------------------------------------

Array.prototype.hasEqualValues = function(b) {
	const a = this;

	if (a.length !== b.length) {
		return false;
	}

	a.sort();
	b.sort();

	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}

	return true;
};