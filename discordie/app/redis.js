const redis = require("redis");
const util = require('util');
const EventEmitter = require('events');

function Client() {
    this.rc = redis.createClient();

    this.rc.on('ready', function() {
        console.log("Redis: Ready!");
        this.subscribe('discord', 'alert', 'cleanup');
    });

    this.rc.on("error", function(err) {
        console.log("Redis: Error - " + err);
    });

    this.rc.on("message", function(channel, message) {
        console.log("Redis: [" + channel + "]: " + message);
        this.emit(channel, message);
    }.bind(this));

    this.rc.on('connect', function() {
        console.log("Redis: Connected!");
    });
}

util.inherits(Client, EventEmitter);

module.exports = Client;