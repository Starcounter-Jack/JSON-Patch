if (typeof jsonpatch === 'undefined') {
   jsonpatch = require('./../..');
}
if (typeof Benchmark === 'undefined') {
    global.Benchmark = require('benchmark');
    global.benchmarkResultsToConsole = require('./../lib/benchmark_console_reporter.js').benchmarkResultsToConsole;
}



const coreSuite = new Benchmark.Suite;
coreSuite.add('add operation', {
    setup: function(){
        const obj = {
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
coreSuite.add('remove operation', {
    setup: function(){
        const obj = {
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
coreSuite.add('replace operation', {
    setup: function(){
        const obj = {
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
coreSuite.add('move operation', {
    setup: function(){
        const obj = {
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
coreSuite.add('copy operation', {
    setup: function(){
        const obj = {
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
coreSuite.add('test operation', {
    setup: function(){
        const obj = {
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
    benchmarkReporter(coreSuite);
} else {
    coreSuite.on('complete', function () {
        benchmarkResultsToConsole(coreSuite);
    });
    coreSuite.run();
}
