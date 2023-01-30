const config = require('../config.json');
const Twit = require('node-tweet-stream');
const moment = require('moment-timezone');
const { EmbedBuilder } = require('@discordjs/builders');


function tweetBot(client) {

	const t = new Twit({
		consumer_key: config.twitterConsumerKey,
		consumer_secret: config.twitterConsumerSecret,
		token: config.twitterAccessTokenKey,
		token_secret: config.twitterAccessTokenSecret,
	});

	t.on('tweet', function(tweet) {
		const media = tweet.entities.media;

		config.followingUser.forEach(user => {
			if (tweet.user.id === user.id && tweet.user.screen_name === user.name) {
				chatPost(tweet.text, tweet.user.screen_name, `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`, moment.utc(tweet.created_at).tz('Australia/Melbourne').format('DD-MM-YYYY HH:mm:ss'), tweet.user.profile_image_url, media);
			}
		});
	});

	t.on('error', function(err) {
		console.log('[Twitter] An error has occurred');
		console.log(err);
	});

	const track = config.followingUser;

	track.forEach(user => {
		t.follow(user.id);
		console.log(`[Twitter] Following Twitter User @${user.name}`);
	});

	function chatPost(content, author, url, time, authorPfp, media) {
		const message = new EmbedBuilder()
			.setTitle('New Tweet')
			.setColor('#1A91DA')
			.setDescription(content)
			.setAuthor({ name: `@${author}`, iconURL: authorPfp, url: `http://twitter.com/${author}` })
			.setFooter({ content: `Twitter - ${time}`, iconURL: 'https://abs.twimg.com/favicons/twitter.ico' })
			.setURL(url);

		if (media) for (let j = 0; j < media.length; j++) message.setImage(media[j].media_url);
		for (const __channel of config.channelsToPost.map(x => client.channels.cache.get(x))) __channel.send({ embeds: [message] });
	}


}

module.exports = { tweetBot };