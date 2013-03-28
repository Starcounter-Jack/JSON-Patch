var obj, compiled;



test('apply add', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

   //jsonpatch.listenTo(obj,[]);

    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: [1, 2, 3, 4]}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]});

    jsonpatch.apply(obj, [{op: 'add', path: '/baz/0/foo', value: 'world'}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello', foo: 'world'}], bar: [1, 2, 3, 4]});


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


test('apply remove', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
   //jsonpatch.listenTo(obj,[]);

    jsonpatch.apply(obj, [{op: 'remove', path: '/bar'}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{op: 'remove', path: '/baz/0/qux'}]);
    deepEqual(obj, {foo: 1, baz: [{}]});
});


test('apply replace', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

    jsonpatch.apply(obj, [{op: 'replace', path: '/foo', value: [1, 2, 3, 4]}]);
    deepEqual(obj, {foo: [1, 2, 3, 4], baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{op: 'replace', path: '/baz/0/qux', value: 'world'}]);
    deepEqual(obj, {foo: [1, 2, 3, 4], baz: [{qux: 'world'}]});
});


test('apply test', function() {
    obj = {foo: {bar: [1, 2, 5, 4]}};
    ok(jsonpatch.apply(obj, [{op: 'test', path: '/foo', value: {bar: [1, 2, 5, 4]}}]));
    ok(!jsonpatch.apply(obj, [{op: 'test', path: '/foo', value: [1, 2]}]));
});


test('apply move', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

   jsonpatch.apply(obj, [{op: 'move', from: '/foo', path: '/bar'}]);
    deepEqual(obj, {baz: [{qux: 'hello'}], bar: 1});

    jsonpatch.apply(obj, [{op: 'move', from: '/baz/0/qux', path: '/baz/1'}]);
    deepEqual(obj, {baz: [{}, 'hello'], bar: 1});
});


test('apply copy', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

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

    testCompiled(obj);
});
            */
