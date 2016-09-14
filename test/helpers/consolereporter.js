var util = require('util');
var options = {
    showColors: true,
    print: function() {
        process.stdout.write(util.format.apply(this, arguments));
    }
};

jasmine.getEnv().addReporter(new jasmine.ConsoleReporter(options));
