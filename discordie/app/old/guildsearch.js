var _ = require("underscore");
var Guild = require("./guild.js");

function Guildsearch() {
    this.region = null;
    this.tables = null;
    this.name = null;
    this.mysql = null;
}

Guildsearch.prototype.handle = function(e, channel, args, mysql) {
    this.tables = null;
    this.mysql = mysql;
    this.args = args;
    this.region = args.shift();

    if (this.region && (this.region.toLowerCase() == 'eu' || this.region.toLowerCase() == 'na')) {
        this.region = this.region.toLowerCase();
        this.get_guild(e, channel, args);
    }
    else {
        e.message.reply("Usage: ```" + channel.prefix + "guildsearch [eu|na] <guildname>```" +
            "*Examples: ``" + channel.prefix + "guildsearch eu black``, ``" + channel.prefix + "guildsearch na desert``*");
    }


};

Guildsearch.prototype.get_guild = function(e, channel, args) {
    var name = args.shift();
    if (name) {
        if (name.length < 3) {
            e.message.reply("Searchname too short (minimum is 3 characters)!");
            return;
        }
        var _parent = this;
        var querytemplate = _.template('SELECT r.rank, g.guild_name, g.aquired_skill_point, g.guild_member,' +
            ' r.updated_at, r0.area_name as t, r1.area_name as n1, r2.area_name as n2,' +
            ' r1.village_tax_level as n1l, r2.village_tax_level as n2l, r3.village_tax_level as n3l,' +
            " r3.area_name as n3, g.updated_at, '<%= name %>' AS server FROM guilds_<%= server %> g" +
            " LEFT JOIN guildrank_<%= server %> r ON g.id = r.guildNo AND r.rankingType = 0" +
            ' LEFT JOIN regions r0 ON r0.id = g.territory_key' +
            ' LEFT JOIN regions r1 ON r1.id = g.region_key1' +
            ' LEFT JOIN regions r2 ON r2.id = g.region_key2' +
            ' LEFT JOIN regions r3 ON r3.id = g.region_key3' +
            ' WHERE g.guild_name LIKE ? AND g.updated_at > NOW() - INTERVAL 1 DAY');
        var query = querytemplate({
            name: this.region.toUpperCase(),
            server: this.region
        });
        query += ' ORDER BY aquired_skill_point DESC LIMIT 11;';
        this.mysql.pool.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query(
                query, ['%' + name + '%', '%' + name + '%', '%' + name + '%'],
                function(err, rows) {
                    connection.release();
                    if (err) {
                        e.message.reply('Guildsearch temporary not available.');
                        return;
                    }
                    if (rows.length == 1) {
                        return Guild.handle(e, channel, [_parent.region, rows[0].guild_name], _parent.mysql);
                    }
                    else if (rows.length) {
                        var msg = _parent.format_result(rows, channel);
                        if (rows.length > 10) {
                            msg += '*More than 10 Guilds found, please specify your search!*';
                        }
                        e.message.reply(msg);
                    }
                    else {
                        e.message.reply('No Guilds found.');
                    }
                }
            );
        });
    }
    else {
        e.message.reply("Usage: ```" + channel.prefix + "guildsearch " + this.region + " <guildname>```" +
            "*Example: ``" + channel.prefix + "guildsearch " + this.region + " black``*");
    }
};

Guildsearch.prototype.format_result = function(guilds, channel) {
    var msg = '__Search Result:__ *(Use ``' + channel.prefix + 'guild ' + this.region + ' <guildname>`` for details)*```md';
    //_.each(guilds, function(guild) {
    for (var i = 0; i < 10; i++) {
        if (!guilds[i]) continue;
        var guild = guilds[i];
        msg += `\n[${guild.guild_name}](${guild.server})`;
        if (guild.rank) {
            msg += ` <Rank #${guild.rank}>`;
        }
        msg += `: ${guild.guild_member} Members | ${guild.aquired_skill_point} Points`;
        if (guild.t) {
            msg += ' | Territory: ' + guild.t;
        }
        if (guild.n1) {
            msg += ` | Nodes: ${guild.n1} (T${guild.n1l})`;
        }
        if (guild.n2) {
            msg += `, ${guild.n2} (T${guild.n2l})`;
        }
        if (guild.n3) {
            msg += `, ${guild.n3} (T${guild.n3l})`;
        }
    }
    msg += '```';
    return msg;
};


module.exports = new Guildsearch();