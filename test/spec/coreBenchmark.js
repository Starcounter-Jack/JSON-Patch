if (typeof jsonpatch === 'undefined') {
   jsonpatch = require('./../../lib/duplex');
}
if (typeof Benchmark === 'undefined') {
    var Benchmark = require('benchmark');
    var benchmarkResultsToConsole = require('./../helpers/benchmarkReporter.js').benchmarkResultsToConsole;
}



var suite = new Benchmark.Suite;
suite.add('add operation', {
    setup: function(){
        var obj = {
            foo: 1,
            baz: [{
                qux: 'hello'
            }]
        };
    },
    fn: function() {
        jsonpatch.applyPatch(obj, [{
            op: 'add',
            path: '/bar',
            value: [1, 2, 3, 4]
        }]);
    }
});
suite.add('remove operation', {
    setup: function(){
        var obj = {
            foo: 1,
            baz: [{
                qux: 'hello'
            }],
            bar: [1, 2, 3, 4]
        };
    },
    fn: function() {
        jsonpatch.applyPatch(obj, [{
            op: 'remove',
            path: '/bar'
        }]);
    }
});
suite.add('replace operation', {
    setup: function(){
        var obj = {
            foo: 1,
            baz: [{
                qux: 'hello'
            }]
        };
    },
    fn: function() {
        jsonpatch.applyPatch(obj, [{
            op: 'replace',
            path: '/foo',
            value: [1, 2, 3, 4]
        }]);
    }
});
suite.add('move operation', {
    setup: function(){
        var obj = {
            foo: 1,
            baz: [{
                qux: 'hello'
            }],
            bar: [1, 2, 3, 4]
        };
    },
    fn: function() {
        jsonpatch.applyPatch(obj, [{
            op: 'move',
            from: '/baz/0',
            path: '/bar/0'
        }]);
    }
});
suite.add('copy operation', {
    setup: function(){
        var obj = {
            foo: 1,
            baz: [{
                qux: 'hello'
            }],
            bar: [1, 2, 3, 4]
        };
    },
    fn: function() {
        jsonpatch.applyPatch(obj, [{
            op: 'copy',
            from: '/baz/0',
            path: '/bar/0'
        }]);
    }
});
suite.add('test operation', {
    setup: function(){
        var obj = {
            foo: 1,
            baz: [{
                qux: 'hello'
            }]
        };
    },
    fn: function() {
        jsonpatch.applyPatch(obj, [{
            op: 'test',
            path: '/baz',
            value: [{
                qux: 'hello'
            }]
        }]);
    }
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
