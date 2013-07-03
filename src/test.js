var obj, compiled;

if(typeof jsonpatch === 'undefined') {
  if(process.env.duplex === 'yes') { //required by `jasmine-node` test runner in Node.js
    jsonpatch = require('./json-patch-duplex.js');
  }
  else {
    jsonpatch = require('./json-patch.js');
  }
}

describe("JSON-Patch", function () {
  it('should apply add', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: [1, 2, 3, 4]}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]});

    jsonpatch.apply(obj, [{op: 'add', path: '/baz/0/foo', value: 'world'}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello', foo: 'world'}], bar: [1, 2, 3, 4]});


    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: true}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}], bar: true});

    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: false}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}], bar: false});

    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: null}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}], bar: null});
  });


  it('should apply remove', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
   //jsonpatch.listenTo(obj,[]);

    jsonpatch.apply(obj, [{op: 'remove', path: '/bar'}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{op: 'remove', path: '/baz/0/qux'}]);
    expect(obj).toEqual({foo: 1, baz: [{}]});
  });


  it('should apply replace', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

    jsonpatch.apply(obj, [{op: 'replace', path: '/foo', value: [1, 2, 3, 4]}]);
    expect(obj).toEqual({foo: [1, 2, 3, 4], baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{op: 'replace', path: '/baz/0/qux', value: 'world'}]);
    expect(obj).toEqual({foo: [1, 2, 3, 4], baz: [{qux: 'world'}]});
  });


  it('should apply test', function() {
    obj = {foo: {bar: [1, 2, 5, 4]}};
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/foo', value: {bar: [1, 2, 5, 4]}}])).toBe(true);
    expect(!jsonpatch.apply(obj, [{op: 'test', path: '/foo', value: [1, 2]}])).toBe(true);
  });


  it('should apply move', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

   jsonpatch.apply(obj, [{op: 'move', from: '/foo', path: '/bar'}]);
    expect(obj).toEqual({baz: [{qux: 'hello'}], bar: 1});

    jsonpatch.apply(obj, [{op: 'move', from: '/baz/0/qux', path: '/baz/1'}]);
    expect(obj).toEqual({baz: [{}, 'hello'], bar: 1});
  });


  it('should apply copy', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

    jsonpatch.apply(obj, [{op: 'copy', from: '/foo', path: '/bar'}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}], bar: 1});

    jsonpatch.apply(obj, [{op: 'copy', from: '/baz/0/qux', path: '/baz/1'}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}, 'hello'], bar: 1});
  });
});

// JSLitmus performance test
if(typeof JSLitmus !== 'undefined') {
  JSLitmus.test('should Add Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'add', path: '/bar', value: [1, 2, 3, 4]}]);
  });

  JSLitmus.test('should Remove Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{op: 'remove', path: '/bar'}]);
  });

  JSLitmus.test('should Replace Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'replace', path: '/foo', value: [1, 2, 3, 4]}]);
  });

  JSLitmus.test('should Move Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{op: 'move', from: '/baz/0', path: '/bar/0'}]);
  });

  JSLitmus.test('should Copy Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{op: 'copy', from: '/baz/0', path: '/bar/0'}]);
  });

  JSLitmus.test('should Test Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{op: 'test', path: '/baz', value: [{qux: 'hello'}]}]);
  });
}