var _ = require("underscore");
var moment = require("moment");

function Ranking() {
    this.server = null;
    this.name = null;
    this.mysql = null;
}

Ranking.prototype.handle = function(e, channel, args, mysql) {
    this.server = null;
    this.mysql = mysql;
    this.region = args.shift();

    if (this.region && (this.region.toLowerCase() == 'eu' || this.region.toLowerCase() == 'na')) {
        this.region = this.region.toLowerCase();
        this.get_ranking(e, channel, args);
    }
    else {
        e.message.reply("Usage: ```" + channel.prefix + "guildrank [eu|na] [startrank]```" +
            "*Examples: ``" + channel.prefix + "guildrank eu``, ``" + channel.prefix + "guildrank na 26``*");
    }


};

Ranking.prototype.get_ranking = function(e, channel, args) {
    var index = args.shift();
    if (index) {
        idx = parseInt(index, 10);
    }
    var idx = idx > 0 ? idx : 1;
    var _parent = this;
    this.mysql.pool.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(
            'SELECT r.rank, g.id, g.guild_name, g.aquired_skill_point, g.guild_member,' +
            ' r.updated_at, r0.area_name as t, r1.area_name as n1, r2.area_name as n2,' +
            ' r1.village_tax_level as n1l, r2.village_tax_level as n2l, r3.village_tax_level as n3l,' +
            ' r3.area_name as n3, r.updated_at FROM guildrank_' + _parent.region + ' r' +
            ' LEFT JOIN guilds_' + _parent.region + ' g ON g.id = r.guildNo' +
            ' LEFT JOIN regions r0 ON r0.id = g.territory_key' +
            ' LEFT JOIN regions r1 ON r1.id = g.region_key1' +
            ' LEFT JOIN regions r2 ON r2.id = g.region_key2' +
            ' LEFT JOIN regions r3 ON r3.id = g.region_key3' +
            ' WHERE r.rankingType = 0 ORDER BY r.rank LIMIT ?, 20;', [idx - 1],
            function(err, rows) {
                connection.release();
                if (err) {
                    e.message.reply('Guildranking temp. not available.');
                    return;
                }
                if (rows.length) {
                    e.message.reply(_parent.format_result(idx, rows));
                }
                else {
                    e.message.reply('No Guilds found after Rank #' + idx + '.');
                }
            }
        );
    });
};

Ranking.prototype.format_result = function(idx, guilds) {
    var update = "Unknown";
    var _parent = this;
    _.min(guilds, function(max) {
        update = moment(max.updated_at);
    });
    var msg = '__Guild Ranking **' + (idx) + ' - ' + (idx + guilds.length - 1) +
        '** for **' + this.region.toUpperCase() + '**__ *(Updated ' + moment().to(update.add(1, 'hours')) + ')*```md';
    _.each(guilds, function(guild) {
        msg += `\n[${guild.rank}.][${guild.guild_name}]: ${guild.guild_member} Members | ${guild.aquired_skill_point} Points`;
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
        var origin = "";
        var gid = guild.id.toString()[0];
        if (_parent.region == 'eu') {
            switch (gid) {
                case '1':
                    origin = "Alustin";
                    break;
                case '2':
                    origin = "Jordine";
                    break;
                case '3':
                    origin = "Croxus";
                    break;
                case '4':
                    origin = "EU (New World)";
                    break;
            }
        }
        else {
            switch (gid) {
                case '1':
                    origin = "Edan";
                    break;
                case '2':
                    origin = "Uno";
                    break;
                case '3':
                    origin = "Orwen";
                    break;
                case '4':
                    origin = "NA (New World)";
                    break;
            }
        }
        if (origin.length) {
            msg += "| Origin: " + origin;
        }
    });
    msg += '```';
    return msg;
};


module.exports = new Ranking();