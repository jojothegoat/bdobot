function Forum() {
    this.mysql = null;
}

Forum.prototype.handle = function(e, channel, args, mysql, cmd) {
    this.mysql = mysql;
    var feed_id = 1;
    switch(channel.lang) {
        case 'de': feed_id = 4; break;
        case 'fr': feed_id = 7; break;
        default: feed_id = 1;
    }
    switch (cmd) {
        case 'patchnotes': feed_id +=1; break;
        case 'event': feed_id += 2; break;
        default: break;
    }
    mysql.pool.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(
            'SELECT MAX(guid) as guid FROM feed_items WHERE feed_id = ?;', [feed_id], 
            function(err, rows) {
                connection.release();
                if (err) throw err;
                if (rows.length == 1) {
                    e.message.reply("https://community.blackdesertonline.com/index.php?threads/" + rows[0]['guid']);
                }
                else {
                    e.message.reply('unable to receive ' + cmd + '!');
                }
            }
        );
    });
};

module.exports = new Forum();