const Discordie = require("discordie");
var Discord = require('./discord');
var Redis = require('./redis');
var MySQL = require('./mysql');
var Twitter = require('./twitter');
//var Bots = require('./bots');
var _ = require("underscore");

var bddb_gametips = require('./gametips');
var bddb_horsecalc = require('./horsecalc');
var bddb_game = require('./game');
var bddb_botconfig = require('./botconfig');
var bddb_forum = require('./forum');
var bddb_youtube = require('./youtube');
var bddb_admin = require('./admin');
var bddb_feedback = require('./feedback');
/*var bddb_ranking = require('./ranking');
var bddb_guildsearch = require('./guildsearch');
var bddb_guild = require('./guild');*/
var bddb_timer = require('./timer');
var bddb_failstacks = require('./failstacks');
// var bddb_nodewars = require('./nodewars');
var bddb_search = require('./search');

var BDDB = function() {
    this.bot_channels = null;
    this.mysql = new MySQL();
    this.admins = [''];
    this.blacklist = [''];
};

BDDB.prototype.start = function(bot_token, shardId, shardCount) {
    console.log("BDDB: Starting ...");
    this.load_bot_channels(this);
    this.discord = new Discord(bot_token, shardId, shardCount);
    this.redis = new Redis();

    this.discord.once("ready", function() {
        //this.bots = new Bots(this.discord.discord.User.id);
        this.twitter = new Twitter();
        var _parent = this;
        
        bddb_timer.setStatus(this.discord.discord.User, this);
        setInterval(() => { bddb_timer.setStatus(this.discord.discord.User, this); }, 60000);

        this.twitter.on("tweet", function(link) {
            _parent.mysql.pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query(
                    'SELECT channel_id, notify_twitter FROM bot_channels WHERE notify_twitter > 0',
                    function(err, rows) {
                        connection.release();
                        if (err) throw err;
                        for (var i in rows) {
                            _parent.discord.broadcast(link, [rows[i]['channel_id']], rows[i]['notify_twitter']);
                        }
                    }
                );
            });
        });
    }.bind(this));

    this.redis.on("discord", function(json) {
        var data = JSON.parse(json);
        console.log("BDDB: Message - " + data.message);
        this.discord.broadcast(data.message, data.channels, data.type, data.embed);
    }.bind(this));

    this.redis.on("alert", function(message) {
        console.log("BDDB: Alert - " + message);
        this.discord.dm(message);
    }.bind(this));
    

    this.redis.on("cleanup", function(message) {
    	if(message === '1') {
	        console.log("BDDB: Channel check");
			this.discord.discord.Channels.forEach((ch) => {
				this.mysql.pool.getConnection(function(err, connection) {
					if (err) throw err;
					connection.query('UPDATE bot_channels SET last_check = NOW() WHERE channel_id = ? AND guild_id = ?', [ch.id, ch.guild_id], function(err) {
						connection.release();
						if (err) throw err;
					});
				});
			});
	        this.discord.dm("Channel check started");
	    }
    	if(message === '2') {
	        console.log("BDDB: Leaving Guilds");
			this.discord.discord.Guilds.forEach((g) => {
				this.mysql.pool.getConnection(function(err, connection) {
					if (err) throw err;
					connection.query('SELECT COUNT(1) AS count FROM bot_channels WHERE guild_id = ?', [g.id], function(err, rows) {
						connection.release();
						if (err) throw err;
						if(rows[0]['count'] == 0) {
							g.leave().then(() => {
								console.log(g.name, "left! (cleanup)");
							});
						}
					});
				});
			});
	        this.discord.dm("Leaving Guilds started");
	    }
    }.bind(this));

    this.discord.on("message", function(e) {
        if (e.message.isPrivate) return;
        if (this.blacklist.indexOf(e.message.author.id) > -1) return;
        
        var channel = _.findWhere(this.bot_channels, {
            channel_id: e.message.channel_id
        });
        var content = e.message.resolveContent();
        var mention = e.message.content.startsWith(this.discord.discord.User.mention);
        if (channel) {
            var author = e.message.author;
            var full_nick = author.username + "#" + author.discriminator;
            var channel_name = e.message.guild.name + "#" + e.message.channel.name;
            if (content.startsWith(channel.prefix.trimRight()) || mention) {
                console.log("[" + channel_name + "] " + full_nick + ": " + content);
                var cp = this.discord.discord.User.permissionsFor(e.message.channel);
                if(cp.Text.READ_MESSAGES && cp.Text.SEND_MESSAGES) {
                    this.parse_command(e, channel);
                } else {
                    author.openDM().then((dmchannel) => {
                        dmchannel.sendMessage("Sorry, but I have no permission to send messages & embed links in " + e.message.channel.mention + "!");
                    });
                }
            }
        }
        else if (!channel && (content.startsWith('?bdo') || mention)) {
            this.add_channel(e).then((v) => {
                this.load_bot_channels(this).then((v) => {
                    this.discord.emit("message", e);
                });
            });
        }
    }.bind(this));

    this.discord.on("join", function(e) {
        for(var i=1;i<4;i++) {
            var channel = _.findWhere(this.bot_channels, {
                guild_id: e.guild.id,
                notify_join: i
            });
            if (channel) {
                var msg = e.member.mention + ", welcome to " + e.guild.name + "!";
                console.log(msg);
                this.discord.broadcast(msg, [channel.channel_id], i);
            }
        }
    }.bind(this));

    this.discord.on("leave", function(e) {
        for(var i=1;i<4;i++) {
            var channel = _.findWhere(this.bot_channels, {
                guild_id: e.guild.id,
                notify_join: i
            });
            if (channel) {
                var full_nick = e.user.username + "#" + e.user.discriminator;
                var msg = e.user.mention + " (" + full_nick + ") has left " + e.guild.name + "!";
                console.log(msg);
                this.discord.broadcast(msg, [channel.channel_id], i);
            }
        }
    }.bind(this));
    
    /*this.discord.on("react", function(e) {
        bddb_simulator.simulate(e);
    }.bind(this));*/

    bddb_botconfig.on('reload-bot_channels', () => {
        this.load_bot_channels(this);
    });
    
    bddb_admin.on('reload-bot_channels', () => {
        this.load_bot_channels(this);
    });
    
    this.discord.on("server-count", function(count) {
        console.log("Discordie: Serving " + count + " Guilds ");
        //this.bots.update(count);
    });
};

BDDB.prototype.add_channel = function(e) {
    var _parent = this;
    return new Promise(
        function(resolve, reject) {
            _parent.mysql.pool.getConnection(function(err, connection) {
                if (err) throw err;
                var data = {
                    guild_id: e.message.guild.id,
                    channel_id: e.message.channel_id
                };
                connection.query('INSERT INTO bot_channels SET ?', data, function(err, result) {
                    connection.release();
                    if (err) throw err;
                    if (result.affectedRows) {
                        console.log("BDDB: Channel " + e.message.channel_id + " added!");
                        resolve(e.message.channel_id);
                    }
                    else {
                        console.log("BDDB: Unable to add channel " + e.message.channel_id);
                        reject(e.message.channel_id);
                    }
                });
            });
        });
};

BDDB.prototype.load_bot_channels = function(cb) {
    return new Promise(
        function(resolve, reject) {
            cb.mysql.pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query(
                    'SELECT * FROM bot_channels',
                    function(err, rows) {
                        connection.release();
                        if (err) throw err;
                        cb.bot_channels = rows;
                        console.log("BDDB: Bot Channels (re-)loaded");
                        console.log("BDDB: Serving " + rows.length + " Channels");
                        resolve(rows.length);
                    }
                );
            });
        });
};

BDDB.prototype.reply_help = function(e, channel) {
    var admin = false;
    if (this.admins.indexOf(e.message.author.id) > -1 ||
        e.message.author.can(Discordie.Permissions.General.MANAGE_GUILD, e.message.guild)) {
        admin = true;
    }
    var reply = '\n__Available Commands__:';
    reply += '\n**' + channel.prefix + 'help** *- Shows you this*';
    reply += '\n**' + channel.prefix + 'tweet** *- Latest BDO Tweet*';
    //reply += '\n**' + channel.prefix + 'youtube** *- Latest YouTube Video*';
   // reply += '\n**' + channel.prefix + 'news** *- Latest News*';
   // reply += '\n**' + channel.prefix + 'event** *- Latest Event*';
   // reply += '\n**' + channel.prefix + 'patchnotes** *- Latest Patchnotes*';
    reply += '\n**' + channel.prefix + 'ingame** *- Cashshop-, Banner-, Eventpage*';
 //   reply += '\n**' + channel.prefix + 'guildrank [eu|na]** *- Guildranking for EU/NA*';
 //   reply += '\n**' + channel.prefix + 'guildsearch [eu|na] <guildname>** *- Guildsearch for EU/NA*';
 //   reply += '\n**' + channel.prefix + 'guild [eu|na] <guildname>** *- Display Guild Details*';
    reply += '\n**' + channel.prefix + 'item <name>** *- Item Search*';
    reply += '\n**' + channel.prefix + 'quest <name>** *- Quest Search*';
    reply += '\n**' + channel.prefix + 'npc <name>** *- NPC Search*';
    reply += '\n**' + channel.prefix + 'skill <name>** *- Skill Search*';
  //  reply += '\n**' + channel.prefix + 'nodewars [eu|na]** *- Nodewars Overview*';
  //  reply += '\n**' + channel.prefix + 'siegewars [eu|na]** *- Siegewars Overview*';
   // reply += '\n**' + channel.prefix + 'status** *- Login Status*';
  //  reply += '\n**' + channel.prefix + 'version** *- Client- & Launcherversion*';
    reply += '\n**' + channel.prefix + 'protip ([1-319])** *- Black Desert Protips*';
    reply += '\n**' + channel.prefix + 'horse** *- Horse Breeding Calculator*';
    reply += '\n**' + channel.prefix + 'failstack** *- Failstack Calculator*';
  //  reply += '\n**' + channel.prefix + 'simulator** *- Enhancement Simulator*';
    reply += '\n**' + channel.prefix + 'timer** *- Shows you the Ingame Time and some Timers*';
    reply += '\n**' + channel.prefix + 'addbot** *- Add me to your Discordserver*';
    reply += '\n**' + channel.prefix + 'feedback <text>** *- Feedback/Requests/Cookies for me*';
    if (admin) {
        reply += '\n\n__Admin Commands__:';
        reply += '\n**' + channel.prefix + 'config** *- Bot Configurations*';
        reply += '\n**' + channel.prefix + 'leave** *- Disconnect Bot from Server*';
    }
    e.message.reply(reply);
};

BDDB.prototype.leave_server = function(e, channel, args) {
    var admin = false;
    if (this.admins.indexOf(e.message.author.id) > -1 ||
        e.message.author.can(Discordie.Permissions.General.MANAGE_GUILD, e.message.guild)) {
        admin = true;
    }
    if (admin) {
        e.message.reply("I'll be back!").then(function(msg) {
            e.message.guild.leave();
        });
    }
};

BDDB.prototype.parse_command = function(e, channel) {
    var admin = false;
    if (this.admins.indexOf(e.message.author.id) > -1 ||
        (e.message.member && e.message.member.can(Discordie.Permissions.General.MANAGE_GUILD, e.message.guild)) ) {
        admin = true;
    }
    var content = e.message.resolveContent();
    var after_prefix = content.substr(channel.prefix.length);
    var args = after_prefix.split(' ');
    var cmd = args.shift();
    switch (cmd) {
        case 'status':
            bddb_game.status(e, channel, args, this.mysql, this.discord.discord);
            break;
        case 'version':
            bddb_game.version(e, channel, args, this.mysql, this.discord.discord);
            break;
        case 'protip':
            bddb_gametips.handle(e, channel, args);
            break;
        case 'horse':
            bddb_horsecalc.handle(e, channel, args);
            break;
        case 'config':
            bddb_botconfig.handle(e, channel, args, this.mysql, admin);
            break;
        case 'tweet':
            this.twitter.get_tweet(e, channel, args);
            break;
        case 'addbot':
            e.message.reply("__Bot Authorization Link__");
            break;
        case 'leave':
            this.leave_server(e, channel, args);
            break;
        case 'admin':
            if (this.admins.indexOf(e.message.author.id) > -1) bddb_admin.handle(e, channel, args, this.discord, this.mysql);
            break;
        case 'feedback':
            bddb_feedback.handle(e, channel, args, this.discord);
            break;
        case 'help':
            this.reply_help(e, channel);
            break;
        case 'ingame':
            bddb_game.ingame(e, channel, args, this.discord.discord);
            break;
        case 'failstacks':
        case 'failstack':
        case 'fs':
            bddb_failstacks.handle(e, channel, args);
            break;
       /* case 'simulator':
        case 'simulate':
        case 'sim':
                var cp = this.discord.discord.User.permissionsFor(e.message.channel);
                if(cp.Text.MANAGE_MESSAGES && cp.Text.EMBED_LINKS && cp.Text.ADD_REACTIONS) {
                    bddb_simulator.handle(e, channel, args);
                } else {
                    e.message.reply("sorry but I need some permissions to continue: *Embed Links, Add Reactions and Manage Messages*");
                }
            break;*/
        case 'nodewars':
            //bddb_nodewars.handle(e, channel, args, this.mysql);
            //break;
        case 'siegewars':
            //bddb_nodewars.handle(e, channel, [args.shift()], this.mysql, 1);
            //break;
        case 'guildrank':
            //bddb_ranking.handle(e, channel, args, this.mysql);
            //break;
        case 'guildsearch':
            //bddb_guildsearch.handle(e, channel, args, this.mysql);
            //break;
        case 'guild':
            //bddb_guild.handle(e, channel, args, this.mysql);
            e.message.reply("**This bot command has been seized by KGE - Kakao Games Europe B.V.**");
            break;
        case 'timer':
            bddb_timer.handle(e, channel, args, this.discord.discord);
            break;
        case 'bible':
            e.message.reply("https://docs.google.com/document/d/1JnFambQifvui7-V68QMsfuXuhAuu4C0NsVJCxJIv84E/");
            break;
        case 'item':
        case 'quest':
        case 'npc':
        case 'skill':
            bddb_search.handle(e, channel, args, cmd);
            break;
        default:
            e.message.reply("Unknown Command, please check ``" + channel.prefix + "help``.");
    }
};


module.exports = new BDDB();