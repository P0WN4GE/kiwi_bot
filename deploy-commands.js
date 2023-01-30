const { REST, Routes } = require('discord.js');
const { discord_clientId, discord_bot_token, guildId } = require('./config.json');
const fs = require('node:fs');

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFolders = fs.readdirSync('./commands');

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment


for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		commands.push(command.data.toJSON());
	}
}


// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(discord_bot_token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		console.log('Clearing all commands before deployment:');
		rest.put(Routes.applicationGuildCommands(discord_clientId, guildId), { body: [] })
			.then(() => console.log('Successfully deleted all guild commands.'))
			.catch(console.error);

		rest.put(Routes.applicationCommands(discord_clientId), { body: [] })
			.then(() => console.log('Successfully deleted all application commands.'))
			.catch(console.error);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(discord_clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();