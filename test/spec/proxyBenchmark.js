var obj, obj2, patches;
if (typeof window === 'undefined') {
    var jsdom = require("jsdom").jsdom;
    var doc = jsdom(undefined, undefined);
    global.window = doc.defaultView;
    global.document = doc.defaultView.document;
}

if (typeof jsonpatch === 'undefined') {
    jsonpatch = require('./../../src/json-patch-duplex.js');
}
if (typeof JsonObserver === 'undefined') {
    JsonObserver = require('./../../src/json-observe.js');
}

if (typeof Benchmark === 'undefined') {
    var Benchmark = require('benchmark');
    var benchmarkResultsToConsole = require('./../helpers/benchmarkReporter.js').benchmarkResultsToConsole;
}

console.log("Benchmark: Proxy");

var suite = new Benchmark.Suite;
suite.add('generate operation', function() {

    var obj = {
        firstName: "Albert",
        lastName: "Einstein",
        phoneNumbers: [{
            number: "12345"
        }, {
            number: "45353"
        }]
    };

    var jsonObserver = new JsonObserver(obj);
    var observedObj = jsonObserver.observe(true);

    patches = jsonObserver.generate();    

    observedObj.firstName = "Joachim";
    observedObj.lastName = "Wester";
    observedObj.phoneNumbers[0].number = "123";
    observedObj.phoneNumbers[1].number = "456";

    patches = jsonObserver.generate();
    obj2 = {
        firstName: "Albert",
        lastName: "Einstein",
        phoneNumbers: [{
            number: "12345"
        }, {
            number: "45353"
        }]
    };

    jsonpatch.apply(obj2, patches);
});
suite.add('compare operation', function() {
    var obj = {
        firstName: "Albert",
        lastName: "Einstein",
        phoneNumbers: [{
            number: "12345"
        }, {
            number: "45353"
        }]
    };
    var obj2 = {
        firstName: "Joachim",
        lastName: "Wester",
        mobileNumbers: [{
            number: "12345"
        }, {
            number: "45353"
        }]
    };

    var patches = jsonpatch.compare(obj, obj2);
});

// if we are in the browser with benchmark < 2.1.2
if(typeof benchmarkReporter !== 'undefined'){
    benchmarkReporter(suite);
} else {
    suite.on('complete', function () {
        benchmarkResultsToConsole(suite);
    });
    suite.run();
}
