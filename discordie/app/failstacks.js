function Failstacks() {
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

Failstacks.prototype.handle = function(e, channel, args) {
    var lvl = parseInt(args[0], 10);
    if (!isNaN(lvl) && lvl < 20) {
        var fs = parseInt(args[1], 10);
        if (isNaN(fs) || fs > 999) {
            fs = 0;
        }
        var fields = [];
        var armor = this.armor[lvl];
        if (armor) {
            var chance = armor.basechance;
            var msg = "Enchant Chance:";
            if (armor.maxstack) {
                var afs = fs > armor.maxstack ? armor.maxstack : fs;
                var cpl = (armor.maxchance - armor.basechance) / armor.maxstack;
                msg += " **" + ((chance + afs * cpl) * 100).toFixed(2) + "%** ";
                msg += "\n *(+" + (cpl * 100).toFixed(2) + "% per FS)*";
                msg += "\nMax. Chance: **" + (armor.maxchance * 100).toFixed(2) + "%**\n *(" + armor.maxstack + " FS)*";
            }
            else {
                msg += " **" + (chance * 100).toFixed(2) + "%** ";
            }
            var upgrade = '+' + (lvl + 1);
            fields.push({
                name: "Armor " + upgrade + " :shield:",
                value: msg,
                inline: true
            });
        }
        var weapon = this.weapon[lvl];
        if (weapon) {
            var wchance = weapon.basechance;
            var wmsg = "Enchant Chance:";
            if (weapon.maxstack) {
                var wafs = fs > weapon.maxstack ? weapon.maxstack : fs;
                var wcpl = (weapon.maxchance - weapon.basechance) / weapon.maxstack;
                wmsg += " **" + ((wchance + wafs * wcpl) * 100).toFixed(2) + "%** ";
                wmsg += "\n *(+" + (wcpl * 100).toFixed(2) + "% per FS)*";
                wmsg += "\nMax. Chance: **" + (weapon.maxchance * 100).toFixed(2) + "%**\n *(" + weapon.maxstack + " FS)*";
            }
            else {
                wmsg += " **" + (chance * 100).toFixed(2) + "%** ";
            }
            var wupgrade = '+' + (lvl + 1);
            if (lvl > 14) {
                wupgrade = this.enchants[lvl - 15] + " *(" + wupgrade + ")*";
            }
            fields.push({
                name: "Weapon " + wupgrade + " :crossed_swords:",
                value: wmsg,
                inline: true
            });
        }
        var accessory = this.accessory[lvl];
        if (accessory) {
            var achance = accessory.basechance;
            var amsg = "Enchant Chance:";
            var aafs = fs > accessory.maxstack ? accessory.maxstack : fs;
            var acpl = (accessory.maxchance - accessory.basechance) / accessory.maxstack;
            amsg += " **" + ((achance + aafs * acpl) * 100).toFixed(2) + "%** ";
            amsg += "\n *(+" + (acpl * 100).toFixed(2) + "% per FS)*";
            amsg += "\nMax. Chance: **" + (accessory.maxchance * 100).toFixed(2) + "%**\n *(" + accessory.maxstack + " FS)*";
            var aupgrade = this.enchants[lvl] + " *(+" + (lvl + 1) + ")*";
            fields.push({
                name: "Accessory " + aupgrade + " :ring:",
                value: amsg,
                inline: true
            });
        }
        var footer = null;
        if (fs == 0) {
            footer = {
                text: "Hint: Add your failstack count with \"" +
                    channel.prefix + "fs " + lvl + " 0-999\""
            };
        }

        e.message.reply("", false, {
            color: 0xffffff,
            author: {
                name: "BDOBot Failstack Calculator"
            },
            title: "Failstack Charts (Source)",
            description: "Enchantment Level **+" + lvl +
                "**\nFail Stack Count **" + fs + "**",
            fields: fields,
            footer: footer
        });
    }
    else {
        e.message.reply("Usage: ```" + channel.prefix + "[failstack|fs] <current enchant lvl (0-19)> <current failstack (0-999)>```");
    }
};

module.exports = new Failstacks();