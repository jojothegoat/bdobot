const child_process = require('child_process');
const filesize = require('filesize');

function Game() {}

Game.prototype.status = function(e, channel, args, mysql, discord) {
    mysql.pool.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(
            'SELECT state,(SELECT msg FROM maintenance_msgs ORDER BY updated_at DESC LIMIT 1) AS msg FROM login_states ORDER BY updated_at DESC LIMIT 1;',
            function(err, rows) {
                connection.release();
                if (err) {
                    console.log(err);
                    return;
                }
                if (rows.length == 1) {
                    e.message.reply("", false, {
                        color: rows[0]['state'] ? 0x00c000 : 0xc00000,
                        author: {
                            name: "BDOBot Status"
                        },
                        title: "Login: " + (rows[0]['state'] ? "Online" : "Offline"),
                        description: rows[0]['state'] ? "" : rows[0]['msg']
                    });
                }
                else {
                    e.message.reply('\n__Status:__\n*Login Unknown*');
                }
            }
        );
    });
};

Game.prototype.version = function(e, channel, args, mysql, discord) {
    mysql.pool.getConnection(function(err, connection) {
        if (err) {
            console.log(err);
            return;
        }
        connection.query(
            "(SELECT 'Launcher' as name, l.version, l.modified FROM launcher_versions l ORDER BY l.updated_at DESC LIMIT 1)" +
            " UNION ALL (SELECT 'Client' as name, p.version, p.modified FROM patch_versions p ORDER BY p.updated_at DESC LIMIT 1);" /*+
            " UNION ALL (SELECT 'Upcoming' AS name, MAX(version) AS version, SUM(size) AS modified FROM patch_sizes WHERE version > (SELECT MAX(version) FROM patch_versions));"*/,
            function(err, rows) {
                connection.release();
                if (err) {
                    console.log(err);
                    return;
                }

                var fields = [];

                for (var i = 0; i < 2; i++) {
                    fields.push({
                        name: rows[i]['name'],
                        value: 'v' + rows[i]['version'] +
                            '\n*(' + rows[i]['modified'] + ')*',
                        inline: true
                    });
                }
                /*if (rows[i]['version']) {
                    fields.push({
                        name: "Upcoming Patch",
                        value: 'v' + rows[i]['version'] +
                            '\n*(~' + filesize(rows[i]['modified']) + ')*'
                    });
                }*/

                e.message.reply("", false, {
                    color: 0xf1c40f,
                    author: {
                        name: "BDOBot Versions"
                    },
                    fields: fields
                });
            });
    });
};

Game.prototype.ingame = function(e, channel, args, discord) {
    var cp = discord.User.permissionsFor(e.message.channel);
    if (!cp.Text.ATTACH_FILES) {
        e.message.reply("Sorry, but I have no permission to upload files here!");
        return 1;
    }
    var chooseable = {
        "event": "Event",
        "shop": "ShopMain",
        "banner": "ShopCategory"
    };
    var choose = args.shift();
    if (chooseable[choose]) {
        var pjs = child_process.spawn("phantomjs", ["phantom.js", chooseable[choose]]);
        pjs.on('close', (code) => {
            if (code === 0) {
                e.message.channel.uploadFile('./uploads/' + chooseable[choose] + ".png");
            }
            else {
                e.message.reply('Unable to receive ' + choose + '!');
            }
        });
        return 1;
    }
    e.message.reply('Usage: ```' + channel.prefix + 'ingame [event|shop|banner]```');
};

module.exports = new Game();