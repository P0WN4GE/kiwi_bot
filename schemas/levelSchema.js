const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
	guildId: String,
	userId: String,
	xp: Number,
	level: Number,
});

module.exports = mongoose.model('levelSchema', levelSchema);