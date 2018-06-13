function Simulator() {
    this.enchants = ["PRI", "DUO", "TRI", "TET", "PEN"];
    this.armor = [{ // 1
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 2
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 3
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 4
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 5
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 6
        basechance: 0.2,
        maxstack: 13,
        maxchance: 0.525
    }, { // 7
        basechance: 0.175,
        maxstack: 14,
        maxchance: 0.455
    }, { // 8
        basechance: 0.1625,
        maxstack: 14,
        maxchance: 0.4075
    }, { // 9
        basechance: 0.15,
        maxstack: 15,
        maxchance: 0.375
    }, { // 10
        basechance: 0.125,
        maxstack: 16,
        maxchance: 0.325
    }, { // 11
        basechance: 0.1125,
        maxstack: 17,
        maxchance: 0.2825
    }, { // 12
        basechance: 0.1,
        maxstack: 18,
        maxchance: 0.235
    }, { // 13
        basechance: 0.075,
        maxstack: 20,
        maxchance: 0.201
    }, { // 14
        basechance: 0.05,
        maxstack: 25,
        maxchance: 0.175
    }, { // 15
        basechance: 0.025,
        maxstack: 25,
        maxchance: 0.15
    }];
    this.weapon = [{ // 1
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 2
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 3
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 4
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 5
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 6
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 7
        basechance: 1,
        maxstack: 0,
        maxchance: 1
    }, { // 8
        basechance: 0.2,
        maxstack: 13,
        maxchance: 0.525
    }, { // 9
        basechance: 0.175,
        maxstack: 14,
        maxchance: 0.455
    }, { // 10
        basechance: 0.15,
        maxstack: 15,
        maxchance: 0.375
    }, { // 11
        basechance: 0.125,
        maxstack: 16,
        maxchance: 0.325
    }, { // 12
        basechance: 0.1,
        maxstack: 18,
        maxchance: 0.235
    }, { // 13
        basechance: 0.075,
        maxstack: 20,
        maxchance: 0.201
    }, { // 14
        basechance: 0.05,
        maxstack: 25,
        maxchance: 0.175
    }, { // 15
        basechance: 0.025,
        maxstack: 25,
        maxchance: 0.15
    }, { // 16
        basechance: 0.15,
        maxstack: 25,
        maxchance: 0.525
    }, { // 17
        basechance: 0.075,
        maxstack: 35,
        maxchance: 0.3375
    }, { // 18
        basechance: 0.05,
        maxstack: 44,
        maxchance: 0.27
    }, { // 19
        basechance: 0.02,
        maxstack: 90,
        maxchance: 0.25
    }, { // 20
        basechance: 0.015,
        maxstack: 124,
        maxchance: 0.201
    }];
    this.accessory = [{ // PRI
        basechance: 0.15,
        maxstack: 25,
        maxchance: 0.525
    }, { // DUO
        basechance: 0.075,
        maxstack: 35,
        maxchance: 0.3375
    }, { // TRI
        basechance: 0.05,
        maxstack: 44,
        maxchance: 0.27
    }, { // TET
        basechance: 0.02,
        maxstack: 90,
        maxchance: 0.245
    }, { // PEN
        basechance: 0.015,
        maxstack: 124,
        maxchance: 0.325
    }];
}

Simulator.prototype.simulate = function(e) {
    var embed = e.message.embeds[0];
    var lvl = parseInt(embed.fields[0].value, 10);
    var fs = parseInt(embed.fields[1].value, 10);
    var maxlvl = 0;
    var item = null;
    var react = { name: "💍" };
    
    switch (embed.title) {
        case "Weapon :crossed_swords:":
            maxlvl = 20;
            react = { id: "", name: "bs_weapon" };
            break;
        case "Armor :shield:":
            maxlvl = 15;
            react = { id: "", name: "bs_armor" };
            break;
        case "Accessory :ring:":
            maxlvl = 5;
            break;
        default:
            break;
    }
    
    var nextlvl = lvl + 1;
    var prevlvl = null;

    if (isNaN(lvl)) {
        var idx = this.enchants.indexOf(embed.fields[0].value);
        lvl = maxlvl - 4 + idx;
        nextlvl = this.enchants[idx + 1];
        if (idx > 0) {
            prevlvl = this.enchants[idx - 1];
            if (maxlvl - prevlvl < 5) {
                var rev = this.enchants.slice();
                prevlvl = rev.reverse()[maxlvl - prevlvl];
            }
        }
    }
    
    if (maxlvl - nextlvl < 5) {
        var rev = this.enchants.slice();
        nextlvl = rev.reverse()[maxlvl - nextlvl];
    }
    
    var items = null;
    switch (embed.title) {
        case "Weapon :crossed_swords:":
            items = this.weapon;
            item = this.weapon[lvl];
            break;
        case "Armor :shield:":
            items = this.armor;
            item = this.armor[lvl];
            break;
        case "Accessory :ring:":
            items = this.accessory;
            item = this.accessory[lvl];
            break;
        default:
            break;
    }

    if (lvl < maxlvl) {
        var chance = 1;

        if (!Number.isInteger(fs)) {
            var m = fs.match(/(\d+)/);
            fs = m[1];
        }

        if (item.maxstack) {
            var afs = fs > item.maxstack ? item.maxstack : fs;
            var cpl = (item.maxchance - item.basechance) / item.maxstack;
            chance = item.basechance + afs * cpl;
        }
        var rand = Math.random();
        var sum = embed.fields[2].value.match(/Enhancement Success: (\d+)\nEnhancement Fail: (\d+)/);

        var success = rand < chance;
        if (success) {
            sum[1]++;
            embed.description = "*Enchantment to **" + (Number(nextlvl) ? ('+' + nextlvl) : nextlvl) + "** SUCCESSFUL!*";
            embed.fields[0].value = (Number(nextlvl) ? ('+' + nextlvl) : nextlvl);
            embed.fields[1].value = 0;
            lvl++;
            if (lvl < maxlvl && items[lvl].maxstack == 0) {
                embed.fields[1].value += " *(max. Chance)*";
            }
        }
        else {
            sum[2]++;
            embed.description = "*Enchantment to **" + (Number(nextlvl) ? ('+' + nextlvl) : nextlvl) + "** FAILED!*";
            if (lvl > 14) {
                fs += lvl - 14;
            }
            if (prevlvl) {
                embed.fields[0].value = (Number(prevlvl) ? ('+' + prevlvl) : prevlvl);
                lvl--;
            }
            fs++;
            embed.fields[1].value = fs;
            
            if (fs >= items[lvl].maxstack) {
                embed.fields[1].value += " *(max. Chance)*";
            }
        }
        embed.fields[2].value = "Enhancement Success: " + sum[1] + "\nEnhancement Fail: " + sum[2];

        if (lvl >= maxlvl) {
            embed.description = "*MAXED!*";
            e.message.removeReaction(e.emoji);
        }
        
        if (maxlvl - lvl < 6) {
            switch (embed.title) {
                case "Armor :shield:":
                    react = { id: "", name: "cmbs_armor" };
                    break;
                case "Weapon :crossed_swords:":
                    react = { id: "", name: "cmbs_weapon" };
                    break;
                default:
                    break;
            }
        }
        
        if (maxlvl - lvl < 5) {
            var rev = this.enchants.slice();
            embed.fields[0].value = rev.reverse()[maxlvl - lvl];
        }

        e.message.edit(e.message.content, embed).then((em) => {
            em.removeReaction(e.emoji, e.user);
            if(e.emoji.name != react.name) {
                em.removeReaction(e.emoji);
                em.addReaction(react);
            }
        });
    }
};

Simulator.prototype.handle = function(e, channel, args) {
    var maxlvl = 0;
    var item = null;
    var title = "Weapon :crossed_swords:";
    var react = { name: "💍" };

    switch (args[0]) {
        case 'armor':
            maxlvl = 15;
            item = this.armor;
            title = "Armor :shield:";
            react = { id: "", name: "bs_armor" };
            break;
        case 'weapon':
            maxlvl = 20;
            item = this.weapon;
            react = { id: "", name: "bs_weapon" };
            break;
        case 'accessory':
            maxlvl = 5;
            item = this.accessory;
            title = "Accessory :ring:";
            break;
        default:
            break;
    }
    var lvl = parseInt(args[1], 10);
    if (isNaN(lvl)) {
        lvl = 0;
    }
    if (maxlvl > 0) {
        if (lvl >= maxlvl) {
            return e.message.reply("Invalid Enchantment Level, try: 0-" + (maxlvl - 1));
        }
        var fs = parseInt(args[2], 10);
        if (isNaN(fs) || fs > 999) {
            fs = 0;
        }

        if (fs >= item[lvl].maxstack) {
            fs += " *(max. Chance)*";
        }

        
        if (maxlvl - lvl < 6) {
            switch (args[0]) {
                case 'armor':
                    react = { id: "", name: "cmbs_armor" };
                    break;
                case 'weapon':
                    react = { id: "", name: "cmbs_weapon" };
                    break;
                default:
                    break;
            }
        }
        
        if (maxlvl - lvl < 5) {
            var rev = this.enchants.slice();
            lvl = rev.reverse()[maxlvl - lvl];
        }

        e.message.reply("", false, {
            color: 0x553788,
            author: {
                name: "BDO Enhancement Simulator",
                url: "https://kodycode.github.io/"
            },
            title: title,
            description: "*Good Luck!*",
            fields: [{
                name: "Enchantment Level",
                value: (Number(lvl) ? ('+' + lvl) : lvl),
                inline: true
            }, {
                name: "Fail Stack Count",
                value: fs,
                inline: true
            }, {
                name: "Summary",
                value: "Enhancement Success: 0\nEnhancement Fail: 0"
            }]
        }).then((em) => {
            em.addReaction(react);
        });
    }
    else {
        e.message.reply("Usage: ```" + channel.prefix + "[simulator|sim] [armor|weapon|accessory] (<enchant lvl (0-19)>) (<failstack (0-999)>)```");
    }
};

module.exports = new Simulator();