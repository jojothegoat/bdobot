var mysql = require('mysql');
const util = require('util');
const EventEmitter = require('events');

function MySQL() {
    this.pool = mysql.createPool({
      host     : 'localhost',
      user     : 'root',
      password : '',
      database : ''
    });
    
    /*this.connection.connect(function(err) {
      if (err) {
        console.error('MySQL: Error - ' + err.stack);
        return;
      }
    
      console.log('MySQL: Connected!');
    });*/
};

util.inherits(MySQL, EventEmitter);

module.exports = MySQL;