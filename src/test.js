var obj, compiled;

// QUnit

/*
test('invalid patches', function() {
    throws(function() {
        jsonpatch.apply({}, [{foo: '/bar'}]);
    }, jsonpatch.InvalidPatchError, 'Bad operation');

    throws(function() {
        jsonpatch.apply({}, [{op: 'add', path: ''}]);
    }, jsonpatch.InvalidPatchError, 'Path must start with a /');
});
*/

test('add', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

   jsonpatch.listenTo(obj,[]);

    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: [1, 2, 3, 4]}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]});

    jsonpatch.apply(obj, [{op: 'add', path: '/baz/0/foo', value: 'world'}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello', foo: 'world'}], bar: [1, 2, 3, 4]});

    /*
    raises(function() {
        jsonpatch.apply(obj, [{op: 'add', path: '/bar/8', value: '5'}]);
    }, jsonpatch.PatchConflictError, 'Out of bounds (upper)');

    raises(function() {
        jsonpatch.apply(obj, [{op: 'add', path: '/bar/-1', value: '5'}]);
    }, jsonpatch.PatchConflictError, 'Out of bounds (lower)');

    raises(function() {
        jsonpatch.apply(obj, [{op: 'add', path: '/bar/8'}]);
    }, jsonpatch.InvalidPatchError, 'Patch member value not defined');
    */
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: true}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: true});

    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: false}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: false});

    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: null}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: null});
});


test('remove', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
   jsonpatch.listenTo(obj,[]);

    jsonpatch.apply(obj, [{op: 'remove', path: '/bar'}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{op: 'remove', path: '/baz/0/qux'}]);
    deepEqual(obj, {foo: 1, baz: [{}]});
});


test('replace', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

   jsonpatch.listenTo(obj,[]);

    jsonpatch.apply(obj, [{op: 'replace', path: '/foo', value: [1, 2, 3, 4]}]);
    deepEqual(obj, {foo: [1, 2, 3, 4], baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{op: 'replace', path: '/baz/0/qux', value: 'world'}]);
    deepEqual(obj, {foo: [1, 2, 3, 4], baz: [{qux: 'world'}]});
});


test('test', function() {
    obj = {foo: {bar: [1, 2, 5, 4]}};
    ok(jsonpatch.apply(obj, [{op: 'test', path: '/foo', value: {bar: [1, 2, 5, 4]}}]));
    ok(!jsonpatch.apply(obj, [{op: 'test', path: '/foo', value: [1, 2]}]));
});


test('move', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

   jsonpatch.listenTo(obj,[]);

   jsonpatch.apply(obj, [{op: 'move', from: '/foo', path: '/bar'}]);
    deepEqual(obj, {baz: [{qux: 'hello'}], bar: 1});

    jsonpatch.apply(obj, [{op: 'move', from: '/baz/0/qux', path: '/baz/1'}]);
    deepEqual(obj, {baz: [{}, 'hello'], bar: 1});
});


test('copy', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

   jsonpatch.listenTo(obj,[]);

    jsonpatch.apply(obj, [{op: 'copy', from: '/foo', path: '/bar'}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: 1});

    jsonpatch.apply(obj, [{op: 'copy', from: '/baz/0/qux', path: '/baz/1'}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}, 'hello'], bar: 1});
});



// JSLitmus
JSLitmus.test('Add Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: [1, 2, 3, 4]}]);
});

JSLitmus.test('Remove Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{op: 'remove', path: '/bar'}]);
});

JSLitmus.test('Replace Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'replace', path: '/foo', value: [1, 2, 3, 4]}]);
});

JSLitmus.test('Move Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{op: 'move', from: '/baz/0', path: '/bar/0'}]);
});

JSLitmus.test('Copy Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{op: 'copy', from: '/baz/0', path: '/bar/0'}]);
});


JSLitmus.test('Test Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'test', path: '/baz', value: [{qux: 'hello'}]}]);
});
        /*
var addCompiled = jsonpatch.compile([{op: 'add', path: '/bar', value: [1, 2, 3, 4]}]);
JSLitmus.test('Compiled Add Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    addCompiled(obj);
});

var removeCompiled = jsonpatch.compile([{op: 'remove', path: '/bar'}]);
JSLitmus.test('Compiled Remove Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    removeCompiled(obj);
});

var replaceCompiled = jsonpatch.compile([{op: 'replace', path: '/foo', value: [1, 2, 3, 4]}]);
JSLitmus.test('Compiled Replace Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    replaceCompiled(obj);
});

var moveCompiled = jsonpatch.compile([{op: 'move', from: '/baz/0', path: '/bar/0'}]);
JSLitmus.test('Compiled Move Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    moveCompiled(obj);
});

var copyCompiled = jsonpatch.compile([{op: 'copy', from: '/baz/0', path: '/bar/0'}]);
JSLitmus.test('Compiled Copy Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    copyCompiled(obj);
});


var testCompiled = jsonpatch.compile([{op: 'test', path: '/baz', value: [{qux: 'hello'}]}]);
JSLitmus.test('Compiled Test Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    testCompiled(obj);
});
            */