var Twit = require('twit');
const util = require('util');
const EventEmitter = require('events');

function Twitter() {
    this.T = new Twit({
        consumer_key: '',
        consumer_secret: '',
        access_token: '',
        access_token_secret: '',
        timeout_ms: 60 * 1000,
    });

    this.T.get('statuses/user_timeline', {
        user_id: 3317470338,
        count: 10,
        include_rts: 0,
        exclude_replies: 1
    }, function(err, data, response) {
        if (err) throw err;
        if(data.length > 0) {
	        var tweet = data[0];
	        console.log('Twitter: ' + tweet.user.screen_name + " - " + tweet.text);
        // this.emit('tweet', tweet.text);
        }
    }.bind(this));

    this.stream = this.T.stream('statuses/filter', {
        follow: [3317470338]
    });

    this.stream.on('tweet', function(tweet) {
        console.log(tweet.user.screen_name + ": " + tweet.text);
        if (tweet.in_reply_to_user_id === null && tweet.retweeted_status === undefined) {
            var twitlink = "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str;
            this.emit('tweet', twitlink);
        }
    }.bind(this));
}

Twitter.prototype.get_tweet = function(e, channel, args) {
    var params = {
        user_id: 3317470338,
        count: 10,
        exclude_replies: true,
        include_rts: false
    };
    this.T.get('statuses/user_timeline', params, function(error, tweets, response) {
        var tweet = false;
        if (!error && tweets.length) {
            tweet = "https://twitter.com/" + tweets[0].user.screen_name + "/status/" + tweets[0].id_str;
        }
        e.message.reply(tweet?tweet:'Unable to receive last Tweet!');
    });
};

util.inherits(Twitter, EventEmitter);

module.exports = Twitter;