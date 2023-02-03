const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
	GuildID: String,
	ChannelID: String,
});

module.exports = mongoose.model('channelSchema', channelSchema);