var _ = require("underscore");
var moment = require('moment-timezone');
var Sugar = require('sugar');
require('moment-precise-range-plugin');

function Nodewars() {}

Nodewars.prototype.handle = function(e, channel, args, mysql, siege) {
    this.mysql = mysql;
    this.region = args.shift();

    if (this.region && (this.region.toLowerCase() == 'eu' || this.region.toLowerCase() == 'na')) {
        this.region = this.region.toLowerCase();
        if (siege) {
            this.get_siegewars(e);
        }
        else {
            this.get_nodewars(e, channel, args);
        }
    }
    else {
        if (siege) {
            e.message.reply("Usage: ```" + channel.prefix + "siegewars [eu|na]```" +
                "*Examples: ``" + channel.prefix + "siegewars eu``, ``" + channel.prefix + "siegewars na``*");
        }
        else {
            e.message.reply("Usage: ```" + channel.prefix + "nodewars [eu|na] (weekday)```" +
                "*Examples: ``" + channel.prefix + "nodewars eu``, ``" + channel.prefix + "nodewars na tomorrow``*");
        }
    }


};

Nodewars.prototype.get_siegewars = function(e) {
    var _parent = this;
    var tz = this.region == 'eu' ? "CET" : "EST";
    var m = null;
    var regiontz = moment().tz(tz);

    var querytemplate = _.template("SELECT v.region_name, t.territory_name, <%= server %>.guild_name, <%= server %>.updated_at" +
        " FROM regions r" +
        " LEFT JOIN village_sieges v ON v.id = r.village_siege_id" +
        " LEFT JOIN territorys t ON t.id = r.territory_id" +
        " LEFT JOIN guilds_<%= server %> <%= server %> ON r.id = <%= server %>.territory_key" +
        " WHERE r.region_type=1" +
        " ORDER BY r.territory_id;");

    var query = querytemplate({
        server: this.region
    });
    this.lastupdate = null;
    this.mysql.pool.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(
            query, [regiontz.day()],
            function(err, rows) {
                connection.release();
                if (err) {
                    e.message.reply('Siegewars Overview temporary not available.');
                    return;
                }
                else if (rows.length) {
                    var fields = _parent.format_sieges(rows);
                    e.message.reply("", false, {
                        author: {
                            name: "BDOBot " + _parent.region.toUpperCase() + " Siegewars Overview"
                        },
                        description: "",
                        fields: fields,
                        footer: {
                            text: "🕐 Updated " + (_parent.lastupdate ? moment().to(_parent.lastupdate.add(1, 'hours')) : "never")
                        }
                    });
                }
                else {
                    e.message.reply('Siegewars Overview unavailable.');
                }
            }
        );
    });
};


Nodewars.prototype.get_nodewars = function(e, channel, args) {
    var _parent = this;
    var tz = this.region == 'eu' ? "CET" : "EST";
    var m = null;
    var regiontz = moment().tz(tz);

    var customdate = args.join(' ');
    if (customdate) {
        m = moment(Sugar.Date.create(customdate));
        if (isNaN(m)) {
            e.message.reply("invalid Date!");
            return;
        }
        regiontz = moment(m).tz(tz);
    }

    if (regiontz.day() == 6) {
        return this.get_siegewars(e);
    }
    var querytemplate = _.template("SELECT r.area_name, r.village_tax_level, <%= server %>.guild_name, <%= server %>.updated_at" +
        " FROM regions r" +
        " LEFT JOIN village_sieges v ON v.id = r.village_siege_id" +
        " LEFT JOIN territorys t ON t.id = r.territory_id" +
        " LEFT JOIN guilds_<%= server %> <%= server %> ON CONCAT(',', <%= server %>.region_key, ',') LIKE CONCAT('%,', r.id, ',%')" +
        " WHERE r.is_village_war_area = 1 AND r.village_siege_type = ?" +
        " ORDER BY r.area_name;");

    var query = querytemplate({
        server: this.region
    });

    var txt = "";
    var nodewarstart = moment().tz(tz).day(regiontz.day());
    if (nodewarstart.endOf('day').isBefore()) {
        nodewarstart.add(7, "days");
    }
    nodewarstart.startOf('day').hour(this.region == 'eu' ? 20 : 21);
    var nodewarend = moment(nodewarstart).add(2, "hours");
    if (nodewarend.isBefore()) {
        txt += "Ended " + moment.preciseDiff(moment(), nodewarend) + " ago";
    }
    else if (nodewarstart.isBefore()) {
        txt += "Started " + moment.preciseDiff(moment(), nodewarstart) + " ago";
        txt += "Ends in " + moment.preciseDiff(moment(), nodewarend);
    }
    else {
        txt += "Starts in " + moment.preciseDiff(moment(), nodewarstart);
        var buildtimeend = moment(nodewarstart).subtract(1, "hour");
        if (buildtimeend.isAfter()) {
            var buildtimestart = moment(buildtimeend).subtract(19, "hour");
            if (buildtimestart.isAfter()) {
                txt += "\n*Build Time starts in " + moment.preciseDiff(moment(), buildtimestart) + "*";
            }
            else {
                txt += "\n*Build Time ends in " + moment.preciseDiff(moment(), buildtimeend) + "*";
            }
        }
    }

    this.lastupdate = null;
    this.mysql.pool.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(
            query, [regiontz.day()],
            function(err, rows) {
                connection.release();
                if (err) {
                    e.message.reply('Nodewars Overview temporary not available.');
                    return;
                }
                else if (rows.length) {
                    var fields = _parent.format_result(rows);
                    e.message.reply("", false, {
                        author: {
                            name: "BDOBot " + _parent.region.toUpperCase() + " Nodewars Overview for " + regiontz.format("dddd")
                        },
                        description: txt,
                        fields: fields,
                        footer: {
                            text: "🕐 Updated " + (_parent.lastupdate ? moment().to(_parent.lastupdate.add(1, 'hours')) : "never")
                        }
                    });
                }
                else {
                    e.message.reply('Nodewars Overview unavailable.');
                }
            }
        );
    });
};

Nodewars.prototype.format_result = function(rows) {
    var _parent = this;
    var fields = [];
    _.each(rows, function(node) {
        var txt = "**Owner:** *" + (node['guild_name'] ? node['guild_name'] : "n/a") + "*";
        fields.push({
            name: node['area_name'] + " (T" + node['village_tax_level'] + ")",
            value: txt,
            inline: true
        });
        var updated = moment(node['updated_at']);
        if (node['updated_at'] && !_parent.lastupdate) {
            _parent.lastupdate = updated;
        }
        if (updated.isBefore(moment(_parent.lastupdate))) {
            _parent.lastupdate = updated;
        }
    });
    return fields;
};

Nodewars.prototype.format_sieges = function(rows) {
    var _parent = this;
    var fields = [];
    _.each(rows, function(node) {
        var txt = "__" + node['region_name'] + "__\n**Owner:** *" + (node['guild_name'] ? node['guild_name'] : "n/a") + "*";
        fields.push({
            name: node['territory_name'],
            value: txt,
            inline: true
        });
        var updated = moment(node['updated_at']);
        if (node['updated_at'] && !_parent.lastupdate) {
            _parent.lastupdate = updated;
        }
        if (updated.isBefore(moment(_parent.lastupdate))) {
            _parent.lastupdate = updated;
        }
    });
    return fields;
};

module.exports = new Nodewars();