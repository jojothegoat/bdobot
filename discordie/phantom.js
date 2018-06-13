var page = require('webpage').create();
var args = require('system').args;
 
if (args.length > 1) {
    page.open('https://www.blackdesertonline.com/ingame/' + args[1] + '.html', function() {
        if(args[1] === "ShopCategory") {
            page.clipRect = {width: 686, height: 178};    
        }
        page.render('./uploads/' + args[1] + '.png');
        phantom.exit();
    });
} else {
    console.log('Arg required!');
    phantom.exit();
}