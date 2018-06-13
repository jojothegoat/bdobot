var moment = require("moment");
var Sugar = require('sugar');
require('moment-precise-range-plugin');

function Timer() {}

Timer.prototype.setStatus = function(user, parent) {
    var _this = this;
    var d = new Date();
    var startHour = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
    var rlDayElapsedS = (Date.now() - startHour) / 1000;
    var secsIntoGameDay = (rlDayElapsedS + (200 * 60) + (20 * 60)) % (240 * 60);

    parent.mysql.pool.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(
            'SELECT state, (SELECT msg FROM maintenance_msgs ORDER BY updated_at DESC LIMIT 1 ) AS msg FROM login_states ORDER BY updated_at DESC LIMIT 1',
            function(err, rows) {
                connection.release();
                if (err) throw err;
                var result = rows[0];
                if (result['state'] == 1) {
                    // Last part of the shifted day is night
                    if (secsIntoGameDay >= 12000) {
                        _this.secsIntoGameNight = secsIntoGameDay - 12000;
                        _this.secsUntilNightEnd = (40 * 60) - _this.secsIntoGameNight;
                        _this.isDay = false;
                    }
                    else {
                        _this.secsIntoGameDaytime = secsIntoGameDay;
                        _this.secsUntilNightStart = 12000 - _this.secsIntoGameDaytime;
                        _this.isDay = true;
                    }

                    if (_this.isDay) {
                        var start = moment.preciseDiff(moment(),
                            moment().add(_this.secsUntilNightStart, 'seconds'), true);
                        if (start.hours) {
                            user.setStatus(null, {name: 'Night in ' + start.hours + ':' + ((start.minutes < 10) ? ('0' + start.minutes) : (start.minutes)) + 'h', type: 0});
                        }
                        else {
                            user.setStatus(null, {name: 'Night in ' + start.minutes + 'm', type: 0});
                            if (start.minutes == 10) {
                                parent.mysql.pool.getConnection(function(err, connection) {
                                    if (err) throw err;
                                    connection.query(
                                        'SELECT channel_id, notify_night FROM bot_channels WHERE notify_night > 0',
                                        function(err, rows) {
                                            connection.release();
                                            if (err) throw err;
                                            for (var i in rows) {
                                                var msg = "**:full_moon: Night Cycle begins in 10min!**";
                                                parent.discord.broadcast(msg, [rows[i]['channel_id']], rows[i]['notify_night']);
                                            }
                                        }
                                    );
                                });
                            }
                        }
                    }
                    else {
                        var end = moment.preciseDiff(moment(),
                            moment().add(_this.secsUntilNightEnd, 'seconds'), true);
                        if (end.hours) {
                            user.setStatus(null, {name: 'Day in ' + end.hours + ':' + end.minutes + 'h', type: 0});
                        }
                        else {
                            user.setStatus(null, {name: 'Day in ' + end.minutes + 'm', type: 0});
                        }
                    }
                }
                else {
                    var txt = result['msg'];
                    var parsed = txt.match(/The game service is on maintenance now.\\nMaintenance time: (.*) to (.*) UTC/i);
                    if (parsed) {
                        var mend = Sugar.Date.create(parsed[2].replace(/\./g, ""), {
                            fromUTC: true
                        });
                        txt = "Server up soon™";
                        if(moment(mend).isAfter()) {
                            var rend = moment.preciseDiff(moment(), moment(mend), true);
                            if (rend.hours) {
                                txt = 'Server up in ' + rend.hours + ':' + ((rend.minutes < 10) ? ('0' + rend.minutes) : (rend.minutes)) + 'h';
                            }
                            else {
                                txt = 'Server up in ' + rend.minutes + 'm';
                            }
                        }
                    }
                    user.setStatus(null, {name: txt, type: 0});
                }
            }
        );
    });
};

Timer.prototype.handle = function(e, channel, args, discord) {
    var u = new Date();
    var startHour = Date.UTC(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate(), 0, 0, 0, 0);
    var rlDayElapsedS = (Date.now() - startHour) / 1000;
    var secsIntoGameDay = (rlDayElapsedS + (200 * 60) + (20 * 60)) % (240 * 60);

    // Last part of the shifted day is night
    if (secsIntoGameDay >= 12000) {
        var secsIntoGameNight = secsIntoGameDay - 12000;
        var pctOfNightDone = secsIntoGameNight / ((40) * 60);
        this.gameHour = 9 * pctOfNightDone;
        this.gameHour = this.gameHour < 2 ? (22 + this.gameHour) : (this.gameHour - 2);
        this.secsUntilNightEnd = (40 * 60) - secsIntoGameNight;

        this.isDay = false;
        this.inGameHour = (this.gameHour / 1) >> 0;
        this.inGameMinute = ((this.gameHour % 1) * 60) >> 0;
        this.secsUntilNightEnd = this.secsUntilNightEnd;
        this.secsUntilNightStart = this.secsUntilNightEnd + 12000;
    }
    else {
        var secsIntoGameDaytime = secsIntoGameDay;
        var pctOfDayDone = secsIntoGameDay / ((200) * 60);
        this.gameHour = 7 + ((22 - 7) * pctOfDayDone);
        this.secsUntilNightStart = 12000 - secsIntoGameDaytime;

        this.isDay = true;
        this.inGameHour = (this.gameHour / 1) >> 0;
        this.inGameMinute = ((this.gameHour % 1) * 60) >> 0;
        this.secsUntilNightEnd = this.secsUntilNightStart + (40 * 60);
        this.secsUntilNightStart = this.secsUntilNightStart;
    }

    var m = moment();

    var fields = [];
    fields.push({
        name: "InGame Time",
        value: (this.isDay ? ":sunny: " : ":full_moon: ") + moment().set('hour', this.inGameHour)
            .set('minute', this.inGameMinute).format('LT')
    });
    if (this.isDay) {
        var start = moment.preciseDiff(m,
            moment().add(this.secsUntilNightStart, 'seconds'));
        fields.push({
            name: "Night Cycle",
            value: "*Begins in*\n" + start,
            inline: true
        });
    }
    else {
        var end = moment.preciseDiff(m,
            moment().add(this.secsUntilNightEnd, 'seconds'));
        fields.push({
            name: "Night Cycle",
            value: "*Ends in*\n" + end,
            inline: true
        });
    }

    var three = moment().utc().startOf('day');
    while (three.isBefore()) {
        three.add(3, 'hours');
    }
    var tradereset = moment.preciseDiff(m, three);
    fields.push({
        name: "Imperial Delivery",
        value: "*(Possible) Reset in*\n" + tradereset,
        inline: true
    });
    fields.push({
        name: "Dailies",
        value: "*Reset in*\n" + moment.preciseDiff(m,
            moment().utc().startOf('day').add(1, 'day')),
        inline: true
    });

    e.message.reply("", false, {
        color: this.isDay ? 0x37d8e6 : 0x2c3e50,
        author: {
            name: "BDOBot Timer"
        },
        fields: fields
    });
};

module.exports = new Timer();