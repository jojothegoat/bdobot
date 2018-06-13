const util = require('util');
const EventEmitter = require('events');

function Admin() {
    this.discord = null;
    this.mysql = null;
}

Admin.prototype.handle = function(e, channel, args, discord, mysql) {
    this.discord = discord;
    this.mysql = mysql;
    var cmd = args.shift();
    switch (cmd) {
        case 'guilds':
            this.list_guilds(e);
            break;
        case 'channels':
            this.check_channels(e, mysql);
            break;
        case 'reload':
            this.emit('reload-bot_channels');
            break;
        case 'broadcast':
            this.broadcast(e, channel, args, discord.discord.User);
            break;
        default:
            e.message.reply("Available Commands: guilds, reload, broadcast, channels");
    }
};

Admin.prototype.check_channels = function(e) {
	this.discord.discord.Channels.forEach((ch) => {
		this.mysql.pool.getConnection(function(err, connection) {
			if (err) throw err;
			connection.query('UPDATE bot_channels SET last_check = NOW() WHERE channel_id = ? AND guild_id = ?', [ch.id, ch.guild_id], function(err) {
				connection.release();
				if (err) throw err;
			});
		});
	});
	e.message.reply("DONE");
};

Admin.prototype.list_guilds = function(e) {
    var list = "__Guilds (" + this.discord.discord.Guilds.length + ")__";
    this.discord.discord.Guilds.forEach((guild) => {
        list += `\n**${guild.name}**: *${guild.member_count}* Members, Owner *${guild.owner.mention} (${guild.owner.username}#${guild.owner.discriminator})*`;
        if(list.length > 1000) {
            e.message.reply(list);
            list = "";
        }
    });
    e.message.reply(list);
};

Admin.prototype.broadcast = function(e, channel, args, bot) {
    if(args.length) {
        this.discord.discord.Guilds.forEach((guild) => {
            var general = guild.generalChannel;
            if(general && general.name == "general") {
                var cp = bot.permissionsFor(general);
                if (cp.Text.READ_MESSAGES && cp.Text.SEND_MESSAGES) {
                    general.sendMessage(args.join(' ')).then((m) => {
                        console.log("Broadcast received:", guild.name);
                    });
                }
            }
        });
    } else {
        e.message.reply("Message required!");
    }
};

util.inherits(Admin, EventEmitter);

module.exports = new Admin();