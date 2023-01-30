const mongoose = require('mongoose');

module.exports = mongoose.model(
	'cases',
	new mongoose.Schema({
		guildId: String,
		caseNum: Number,
	}),
);