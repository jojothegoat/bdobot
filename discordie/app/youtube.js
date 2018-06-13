function YouTube() {
}

YouTube.prototype.handle = function(e, channel, args, mysql) {
    mysql.pool.getConnection(function(err, connection) {
        if (err) throw err;
        connection.query(
            'SELECT videoId, created_at FROM youtube_videos ORDER BY created_at DESC LIMIT 1;', 
            function(err, rows) {
                connection.release();
                if (err) throw err;
                if (rows.length == 1) {
                    e.message.reply("https://youtu.be/" + rows[0]['videoId']);
                }
                else {
                    e.message.reply('https://www.youtube.com/channel/UCcO-TjLkDNzvYrlPkOHgnfA');
                }
            }
        );
    });
};

module.exports = new YouTube();