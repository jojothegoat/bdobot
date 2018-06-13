const util = require('util');
const EventEmitter = require('events');

function Botconfig() {
    this.mysql = null;
    this.configs = ["off", "on", "here", "everyone"];
}

Botconfig.prototype.handle = function(e, channel, args, mysql, admin) {
    this.mysql = mysql;
    if (admin) {
        var cmd = args.shift();
        switch (cmd) {
            case 'prefix':
                this.set_prefix(e, channel, args);
                break;
            default:
                e.message.reply("__Channel Configurations:__" +
                    "\n**" + channel.prefix + "config prefix** *- (``" + channel.prefix + "``) Set Command Prefix*" +
                    "\n\n*All configurations are only applied to this channel!*");
        }
    }
    else {
        e.message.reply("Only Server Administrators and Managers are allowed to use this command!");
    }
};

Botconfig.prototype.set_forum = function(e, channel, args) {
    var langs = ['en', 'de', 'fr'];
    var lang = args.shift();
    if (lang) {
        lang = lang.toLowerCase();
    }

    if (langs.indexOf(lang) > -1) {
        var val = args.shift();
        var setting = this.configs.indexOf(val);
        if (setting != -1) {
            this.set_value(e, channel, 'notify_rss_' + lang, setting).then((v) => {
                e.message.reply("Notifications " + (setting ? ("enabled (" + val + ")") : "disabled"));
                this.emit('reload-bot_channels');
            }).catch((e) => {
                e.message.reply("Configuration failed!");
            });
            return;
        }
        else {
            e.message.reply("**Notifications " + (channel["notify_rss_" + lang] ? "enabled" : "disabled") +
                "**\nChange Notifications with: ```" + channel.prefix + "config forum " + lang + " [on|off|here|everyone]```");
            return;
        }
    }
    e.message.reply("Usage: ```" + channel.prefix + "config forum [en|de|fr] [on|off|here|everyone]```");
};


Botconfig.prototype.set_web = function(e, channel, args) {
    var langs = ['en', 'de', 'fr'];
    var lang = args.shift();
    if (lang) {
        lang = lang.toLowerCase();
    }

    if (langs.indexOf(lang) > -1) {
        var val = args.shift();
        var setting = this.configs.indexOf(val);
        if (setting != -1) {
            this.set_value(e, channel, 'notify_web_' + lang, setting).then((v) => {
                e.message.reply("Notifications " + (setting ? ("enabled (" + val + ")") : "disabled"));
                this.emit('reload-bot_channels');
            }).catch((e) => {
                e.message.reply("Configuration failed!");
            });
            return;
        }
        else {
            e.message.reply("**Notifications " + (channel["notify_web_" + lang] ? "enabled" : "disabled") +
                "**\nChange Notifications with: ```" + channel.prefix + "config web " + lang + " [on|off|here|everyone]```");
            return;
        }
    }
    e.message.reply("Usage: ```" + channel.prefix + "config web [en|de|fr] [on|off|here|everyone]```");
};


Botconfig.prototype.set_simple = function(e, channel, args, cmd) {
    var column = {
        "serverstatus": "notify_login",
        //"siege": "notify_siege",
        "twitter": "notify_twitter",
        "client": "notify_patch",
        "launcher": "notify_launcher",
        "joins": "notify_join",
        "youtube": "notify_youtube",
        "night": "notify_night",
        "stafftracker": "notify_stafftracker"
    };
    var val = args.shift();
    var setting = this.configs.indexOf(val);
    if (setting != -1) {
        this.set_value(e, channel, column[cmd], setting).then((v) => {
            e.message.reply("Notifications " + (setting ? ("enabled (" + val + ")") : "disabled"));
            this.emit('reload-bot_channels');
        }).catch((e) => {
            e.message.reply("Configuration failed!");
        });
        return;
    }
    e.message.reply("**Notifications " + (channel[column[cmd]] ? "enabled (" + this.configs[channel[column[cmd]]] + ")" : "disabled") +
        "**\nChange Notifications with: ```" + channel.prefix + "config " + cmd + " [on|off|here|everyone]```");
};

Botconfig.prototype.set_prefix = function(e, channel, args) {
    var arg = args.join(' ');
    var old = channel.prefix.trimRight();
    if (arg.endsWith(old)) {
        var prefix = arg.substr(0, arg.length - old.length - 1);
        if (prefix.trim().length && arg.startsWith(prefix)) {
            this.set_value(e, channel, 'prefix', prefix).then((v) => {
                e.message.reply("Command Prefix changed to: ``" + prefix + "``");
                this.emit('reload-bot_channels');
            }).catch((e) => {
                e.message.reply("Changing Command Prefix failed!");
            });
            return;
        }
    }
    e.message.reply("Current Prefix: ``" + channel.prefix + "``\n" +
        "Change Prefix with: ```" + channel.prefix + "config prefix <NEW Prefix> <OLD Prefix>```" +
        "*Example: ``" + channel.prefix + "config prefix !bd  " + channel.prefix + "``*");
};

Botconfig.prototype.set_lang = function(e, channel, args) {
    var langs = ['en', 'de', 'fr'];
    var lang = args.shift();
    if (lang) {
        lang = lang.toLowerCase();
    }

    if (langs.indexOf(lang) > -1) {
        this.set_value(e, channel, 'lang', lang).then((v) => {
            e.message.reply("Bot Language changed to: ``" + lang + "``");
            this.emit('reload-bot_channels');
        }).catch((e) => {
            e.message.reply("Changing Bot Language failed!");
        });
        return;
    }
    e.message.reply("Usage: ```" + channel.prefix + "config lang [en|de|fr]```");
};

Botconfig.prototype.set_value = function(e, channel, col, val) {
    var _parent = this;
    return new Promise(
        function(resolve, reject) {
            _parent.mysql.pool.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query('UPDATE bot_channels SET ' + col + ' = ? WHERE id = ?', [val, channel.id], function(err, result) {
                    connection.release();
                    if (err) throw err;
                    if (result.affectedRows) {
                        resolve(1);
                    }
                    else {
                        reject(0);
                    }
                });
            });
        });
};

util.inherits(Botconfig, EventEmitter);

module.exports = new Botconfig();