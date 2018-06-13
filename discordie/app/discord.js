const Discordie = require("discordie");
const util = require('util');
const EventEmitter = require('events');

function Discord(bot_token, shardId, shardCount) {
    this.discord = new Discordie({
        messageCacheLimit: 10,
        autoReconnect: true,
        shardId: shardId,
        shardCount: shardCount
    });

    this.discord.connect({
        token: bot_token
    });
    
    this.emojis = ["", "", "", ""];

    this.discord.Dispatcher.on(Discordie.Events.GATEWAY_READY, e => {
        console.log("Discordie: Connected as " + this.discord.User.username);
        //this.discord.User.setStatus("online", {name: 'Bot added? Try ?bdo'});
        //this.discord.User.setUsername('BDOBot');
        //this.discord.User.setAvatar(fs.readFileSync("avatar.png"));
        this.emit('ready');
        this.emit('server-count', this.discord.Guilds.length);
    });

    this.discord.Dispatcher.on(Discordie.Events.MESSAGE_CREATE, e => {
        this.emit('message', e);
    });

    this.discord.Dispatcher.on(Discordie.Events.DISCONNECTED, e => {
        console.log("Discordie: Disconnected - " + e.error);
    });

    this.discord.Dispatcher.on(Discordie.Events.GATEWAY_RESUMED, e => {
        console.log("Discordie: Reconnected! ");
    });

    this.discord.Dispatcher.on(Discordie.Events.GUILD_MEMBER_ADD, (e) => {
        this.emit('join', e);
    });

    this.discord.Dispatcher.on(Discordie.Events.GUILD_MEMBER_REMOVE, (e) => {
        this.emit('leave', e);
    });

    this.discord.Dispatcher.on(Discordie.Events.GUILD_CREATE, (e) => {
        this.emit('server-count', this.discord.Guilds.length);
    });
    
    /*this.discord.Dispatcher.on(Discordie.Events.MESSAGE_REACTION_ADD, (e) => {
        if (e.user && e.channel && e.message) { // Check in cache
            if (e.message.author.id == this.discord.User.id && // Author is Bot
                (e.user.mention + ',') == e.message.content) { // Reacter was in reply
                if (this.emojis.indexOf(e.emoji.id) > -1 || e.emoji.name == "💍") { // Our Emoji
                    this.emit('react', e);
                }
            }
        }
    });*/
    
}

Discord.prototype.broadcast = function(message, channels, type, embed) {
    channels.forEach(function(channelid) {
        var channel = this.discord.Channels.get(channelid);
        var send_message = message;
        if (channel) {
            var cp = this.discord.User.permissionsFor(channel);
            if (cp.Text.READ_MESSAGES && cp.Text.SEND_MESSAGES) {
                switch (type) {
                    case 2:
                        send_message = "@here " + message;
                        break;
                    case 3:
                        send_message = "@everyone " + message;
                        break;
                    default:
                        break;
                }
                if (cp.Text.EMBED_LINKS) {
                    channel.sendMessage(send_message, false, embed);
                }
                else {
                    channel.sendMessage(send_message + "\n*Embed Links Permission required*");
                }
            }
        }
    }.bind(this));
};

Discord.prototype.dm = function(message) {
    if(this.discord.options.shardId !== 0) {
        return;
    }
    
    this.discord.DirectMessageChannels.getOrOpen('').then((channel, error) => {
        if (!error) {
            channel.sendMessage(message);
        }
        else {
            console.log(error);
        }
    });
};


util.inherits(Discord, EventEmitter);

module.exports = Discord;
