const request = require('request');
const _ = require("underscore");

function Search() {
    this.lang = "US";
    this.url = "http://bdocodex.com";
    this.searchable = {
        item: "Item",
        quest: "Quest",
        npc: "NPC",
        skill: "Skill"
    };
}

Search.prototype.handle = function(e, channel, args, type) {
    var searchtxt = args.join(' ');
    searchtxt = searchtxt.replace(/@(everyone|here)/g, '@\u200b$1');
    var niceType = this.searchable[type];
    var searchurl = this.url;
    switch (channel.lang) {
        case "de":
            this.lang = "DE";
            searchurl += "/ac.php?l=de&term=";
            break;
        case "fr":
            this.lang = "FR";
            searchurl += "/ac.php?l=fr&term=";
            break;
        default:
            searchurl += "/ac.php?l=us&term=";
    }
    if (args[0]) {
        searchurl += encodeURIComponent(searchtxt);
        console.log(searchurl);
        request({url:searchurl, json:true}, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var desc = "";
                var results = JSON.parse(body.trim());
                _.each(results, (res) => {
                    if (res.link_type == type) {
                        desc += `\n[${res.name}](${this.url}${res.link})`;
                    }
                });
                if (desc.length) {
                    e.message.reply("", false, {
                        author: {
                            name: "BDOBot " + niceType + " Search"
                        },
                        color: 0x992d22,
                        title: "Results for \"" + searchtxt + "\"",
                        description: desc,
                        footer: {
                            text: "BDOCodex.com (" + this.lang + ")"
                        }
                    });
                }
                else {
                    e.message.reply(niceType + " not found!");
                }
            }
            else {
                e.message.reply("Error: BDDatabase.net not reachable!");
            }
        });
    }
    else {
        e.message.reply("Usage: ```" + channel.prefix + type + " <name>```");
    }
};

module.exports = new Search();