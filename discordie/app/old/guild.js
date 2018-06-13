var _ = require("underscore");
var moment = require("moment");

function Guild() {
    this.server = null;
    this.name = null;
    this.mysql = null;
}

Guild.prototype.handle = function(e, channel, args, mysql) {
    this.tables = null;
    this.mysql = mysql;
    this.region = args.shift();

    if (this.region && (this.region.toLowerCase() == 'eu' || this.region.toLowerCase() == 'na')) {
        this.region = this.region.toLowerCase();
        this.get_guild(e, channel, args);
    }
    else {
        e.message.reply("Usage: ```" + channel.prefix + "guild [eu|na] <guildname>```" +
            "*Examples: ``" + channel.prefix + "guild eu black``, ``" + channel.prefix +
            "guild na desert``*");
    }


};

Guild.prototype.get_guild = function(e, channel, args) {
    var name = args.shift();
    if (name) {
        if (name.length < 3) {
            e.message.reply("Guildname is too short (minimum is 3 characters)!");
            return;
        }
        var _parent = this;
        var querytemplate = _.template('SELECT g.id, g.guild_name, g.aquired_skill_point, g.master_user_nickname, g.guild_member,' +
            ' g.updated_at, g.created_at, r.variedMemberCount, r0.area_name as t, r1.area_name as n1, r2.area_name as n2,' +
            ' r1.village_tax_level as n1l, r2.village_tax_level as n2l, r3.village_tax_level as n3l, r.guildIntroduction, ' +
            " r3.area_name as n3, g.updated_at, '<%= name %>' AS server, r.commentCount, r.rank AS ra0rank, ra1.rank AS ra1rank, " +
            ' ra2.rank AS ra2rank, ra3.rank AS ra3rank, ra3.rank AS ra3rank, ra4.rank AS ra4rank, ra5.rank AS ra5rank, ' +
            ' li0.rank AS li0rank, li1.rank AS li1rank, li2.rank AS li2rank, li3.rank AS li3rank, li4.rank AS li4rank, ' +
            ' li5.rank AS li5rank, li6.rank AS li6rank, li7.rank AS li7rank, li8.rank AS li8rank FROM guilds_<%= server %> g' +
            ' LEFT JOIN guildrank_<%= server %> r ON g.id = r.guildNo AND r.rankingType = 0' +
            ' LEFT JOIN guildrank_<%= server %> ra1 ON g.id = ra1.guildNo AND ra1.rankingType = 1' +
            ' LEFT JOIN guildrank_<%= server %> ra2 ON g.id = ra2.guildNo AND ra2.rankingType = 2' +
            ' LEFT JOIN guildrank_<%= server %> ra3 ON g.id = ra3.guildNo AND ra3.rankingType = 3' +
            ' LEFT JOIN guildrank_<%= server %> ra4 ON g.id = ra4.guildNo AND ra4.rankingType = 4' +
            ' LEFT JOIN guildrank_<%= server %> ra5 ON g.id = ra5.guildNo AND ra5.rankingType = 5' +
            ' LEFT JOIN guildlife_<%= server %> li0 ON g.id = li0.guildNo AND li0.rankingType = 0' +
            ' LEFT JOIN guildlife_<%= server %> li1 ON g.id = li1.guildNo AND li1.rankingType = 1' +
            ' LEFT JOIN guildlife_<%= server %> li2 ON g.id = li2.guildNo AND li2.rankingType = 2' +
            ' LEFT JOIN guildlife_<%= server %> li3 ON g.id = li3.guildNo AND li3.rankingType = 3' +
            ' LEFT JOIN guildlife_<%= server %> li4 ON g.id = li4.guildNo AND li4.rankingType = 4' +
            ' LEFT JOIN guildlife_<%= server %> li5 ON g.id = li5.guildNo AND li5.rankingType = 5' +
            ' LEFT JOIN guildlife_<%= server %> li6 ON g.id = li6.guildNo AND li6.rankingType = 6' +
            ' LEFT JOIN guildlife_<%= server %> li7 ON g.id = li7.guildNo AND li7.rankingType = 7' +
            ' LEFT JOIN guildlife_<%= server %> li8 ON g.id = li8.guildNo AND li8.rankingType = 8' +
            ' LEFT JOIN regions r0 ON r0.id = g.territory_key' +
            ' LEFT JOIN regions r1 ON r1.id = g.region_key1' +
            ' LEFT JOIN regions r2 ON r2.id = g.region_key2' +
            ' LEFT JOIN regions r3 ON r3.id = g.region_key3' +
            ' WHERE LOWER(g.guild_name) = LOWER(?) AND g.updated_at > NOW() - INTERVAL 1 DAY');
        var query = querytemplate({
            name: this.region.toUpperCase(),
            server: this.region
        });
        query += ';';
        this.mysql.pool.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query(
                query, [name, name, name],
                function(err, rows) {
                    connection.release();
                    if (err) {
                        e.message.reply('Guildsearch temporary not available.');
                        return;
                    }
                    if (rows.length) {
                        var embed = _parent.format_result(rows[0]);
                        e.message.reply("", null, embed);
                    }
                    else {
                        e.message.reply('Guild not found.');
                    }
                }
            );
        });
    }
    else {
        e.message.reply("Usage: ```" + channel.prefix + "guild " + this.region + " <guildname>```" +
            "*Example: ``" + channel.prefix + "guild " + this.region + " black``*");
    }
};

Guild.prototype.format_result = function(guild) {
    var max = guild.variedMemberCount ? '/' + (guild.variedMemberCount + 15) : '';

    var fields = [{
        name: "Master :crown:",
        value: guild.master_user_nickname,
        inline: true
    }, {
        name: "Member :family:",
        value: guild.guild_member + max,
        inline: true
    }, {
        name: "Points :star:",
        value: guild.aquired_skill_point,
        inline: true
    }];
    if (guild.t) {
        fields.push({
            name: "Territory :european_castle:",
            value: guild.t,
            inline: true
        });
    }
    if (guild.n1) {
        var nmsg = `${guild.n1} *(T${guild.n1l})*`;
        if (guild.n2) {
            nmsg += `\n${guild.n2} *(T${guild.n2l})*`;
        }
        if (guild.n3) {
            nmsg += `\n${guild.n3} *(T${guild.n3l})*`;
        }
        fields.push({
            name: "Nodes :triangular_flag_on_post:",
            value: nmsg,
            inline: true
        });
    }

    var ramsg = "";
    if (guild.ra0rank) {
        ramsg += ` **#${guild.ra0rank}** Points`;
    }
    if (guild.ra1rank) {
        ramsg += ` **#${guild.ra1rank}** Nodes`;
    }
    if (guild.ra2rank) {
        ramsg += ` **#${guild.ra2rank}** Battles`;
    }
    if (guild.ra3rank) {
        ramsg += ` **#${guild.ra3rank}** Members`;
    }
    if (guild.ra4rank) {
        ramsg += ` **#${guild.ra4rank}** Comments`;
    }
    if (guild.ra5rank) {
        ramsg += ` **#${guild.ra5rank}** Intro`;
    }
    if (ramsg.length) {
        fields.push({
            name: "Ranking :100:",
            value: ramsg
        });
    }

    var limsg = "";
    if (guild.li0rank) {
        limsg += ` **#${guild.li0rank}** Gathering`;
    }
    if (guild.li1rank) {
        limsg += ` **#${guild.li1rank}** Fishing`;
    }
    if (guild.li2rank) {
        limsg += ` **#${guild.li2rank}** Hunting`;
    }
    if (guild.li3rank) {
        limsg += ` **#${guild.li3rank}** Cooking`;
    }
    if (guild.li4rank) {
        limsg += ` **#${guild.li4rank}** Alchemy`;
    }
    if (guild.li5rank) {
        limsg += ` **#${guild.li5rank}** Processing`;
    }
    if (guild.li6rank) {
        limsg += ` **#${guild.li6rank}** Training`;
    }
    if (guild.li7rank) {
        limsg += ` **#${guild.li7rank}** Trade`;
    }
    if (guild.li8rank) {
        limsg += ` **#${guild.li8rank}** Farming`;
    }
    if (limsg.length) {
        fields.push({
            name: "Life Rank :fishing_pole_and_fish:",
            value: limsg
        });
    }

    if (guild.commentCount) {
        fields.push({
            name: "Guestbook :book:",
            value: guild.commentCount + " Comments",
            inline: true
        });
    }
    fields.push({
        name: "Registration :pencil:",
        value: moment(guild.created_at).utc().format("YYYY-MM-DD HH:mm:ss UTC"),
        inline: true
    });
    var origin = "Unknown";
    var gid = guild.id.toString()[0];
    if (this.region == 'eu') {
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
    fields.push({
        name: "Origin :globe_with_meridians:",
        value: origin,
        inline: true
    });
    var desc = "";
    if (guild.guildIntroduction) {
        desc = "``" + guild.guildIntroduction.replace(/`/g, "") + "``";
    }
    return {
        color: 0x9b59b6,
        author: {
            name: "BDOBot " + this.region.toUpperCase() + " Guild Details "
        },
        title: guild.guild_name,
        description: desc,
        fields: fields,
        footer: {
            text: "🕐 Updated " + moment().to(moment(guild.updated_at).add(1, 'hours'))
        }
    };
};


module.exports = new Guild();