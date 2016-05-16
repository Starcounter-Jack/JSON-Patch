var obj;

if(typeof jsonpatch === 'undefined') {
  if(process.env.duplex === 'yes') { //required by `jasmine-node` test runner in Node.js
    jsonpatch = require('./../../src/json-patch-duplex.js');
  }
  else {
    jsonpatch = require('./../../src/json-patch.js');
  }
}

describe("core", function () {
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

  it('should apply add on root', function() {
    var obj = {"hello": "world"};
    jsonpatch.apply(obj, [{"op":"add","path":"","value":{"hello": "universe"}}]);

    expect(obj).toEqual({"hello": "universe"});
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


  it('should apply replace on root', function() {
    var obj = {"hello": "world"};
    jsonpatch.apply(obj, [{"op":"replace","path":"","value":{"hello": "universe"}}]);

    expect(obj).toEqual({"hello": "universe"});
  });

  it('should apply replace (with validation) on path with escaped characters', function() {
    var obj = {"a/b": "old"};

    var error = jsonpatch.apply(obj, [{"op":"replace", "path": "/a~1b", "value": "new"}], true);

    expect(obj["a/b"]).toBe("new");
  });


  it('should apply test', function() {
    obj = {
      foo: {bar: [1, 2, 5, 4]},
      bar: {a: 'a', b: 42, c: null, d: true}
    };
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/foo', value: {bar: [1, 2, 5, 4]}}])).toBe(true);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/foo', value: [1, 2]}])).toBe(false);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar', value: {d: true, b: 42, c: null, a: 'a'}}])).toBe(true);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar', value: obj.bar}])).toBe(true);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar/a', value: 'a'}])).toBe(true);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar/b', value: 42}])).toBe(true);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar/c', value: null}])).toBe(true);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar/d', value: true}])).toBe(true);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar/d', value: false}])).toBe(false);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar', value: {d: true, b: 42, c: null, a: 'a', foo: 'bar'}}])).toBe(false);
  });


  it('should apply test on root', function() {
    var obj = {"hello": "world"};
    expect(jsonpatch.apply(obj, [{op: 'test', path: '', value: {"hello": "world"}}])).toBe(true);
    expect(jsonpatch.apply(obj, [{op: 'test', path: '', value: {"hello": "universe"}}])).toBe(false);
  });


  it('should apply move', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

   jsonpatch.apply(obj, [{op: 'move', from: '/foo', path: '/bar'}]);
    expect(obj).toEqual({baz: [{qux: 'hello'}], bar: 1});

    jsonpatch.apply(obj, [{op: 'move', from: '/baz/0/qux', path: '/baz/1'}]);
    expect(obj).toEqual({baz: [{}, 'hello'], bar: 1});
  });

  it('should apply move on root', function() { //investigate if this test is right (https://github.com/Starcounter-Jack/JSON-Patch/issues/40)
    var obj = {"hello": "world", "location": {"city": "Vancouver"}};
    jsonpatch.apply(obj, [{op: 'move', from: '/location', path: ''}]);
    expect(obj).toEqual({"city": "Vancouver"});
  });

  it('should apply copy', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

    jsonpatch.apply(obj, [{op: 'copy', from: '/foo', path: '/bar'}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}], bar: 1});

    jsonpatch.apply(obj, [{op: 'copy', from: '/baz/0/qux', path: '/baz/1'}]);
    expect(obj).toEqual({foo: 1, baz: [{qux: 'hello'}, 'hello'], bar: 1});
  });

  it('should apply copy on root', function() {
    var obj = {"hello": "world", "location": {"city": "Vancouver"}};
    jsonpatch.apply(obj, [{op: 'copy', from: '/location', path: ''}]);
    expect(obj).toEqual({"city": "Vancouver"});
  });
});


describe("undefined - JS to JSON projection / JSON to JS extension", function () {
  describe("jsonpatch should apply", function(){

    it('add for properties already set to `undefined` in target JS document', function() {
      var obj = {"hello": "world", "nothing": undefined};
      jsonpatch.apply(obj, [{"op":"add","path":"/nothing","value":"defined"}]);

      expect(obj).toEqual({"hello": "world", "nothing": "defined"});
    });

    it('add for properties with value set to `undefined` (extension)', function() {
      var obj = {"hello": "world"};
      jsonpatch.apply(obj, [{"op":"add","path":"/nothing","value": undefined}]);

      expect(obj).toEqual({"hello": "world", "nothing": undefined});
    });

    it('remove on element already set to `undefined`, and remove it completely', function() {
      obj = {foo: 1, not: undefined};

      jsonpatch.apply(obj, [{op: 'remove', path: '/not'}]);
      expect(obj).toEqual({foo: 1});
    });
    it('remove on array element set to `undefined`', function() {
      obj = {foo: 1, bar: [0, 1, undefined, 3]};

      jsonpatch.apply(obj, [{op: 'remove', path: '/bar/2'}]);
      expect(obj).toEqual({foo: 1, bar: [0, 1, 3]});
    });


    it('replace on element set to `undefined`', function() {
      obj = {foo: 1, not: undefined};

      jsonpatch.apply(obj, [{op: 'replace', path: '/not', value: "defined"}]);
      expect(obj).toEqual({foo: 1, not: "defined"});
    });
    it('replace on array element set to `undefined`', function() {
      obj = {foo: 1, bar: [0, 1, undefined, 3]};

      jsonpatch.apply(obj, [{op: 'replace', path: '/bar/2', value: "defined"}]);
      expect(obj).toEqual({foo: 1, bar: [0, 1, "defined", 3]});
    });
    it('replace element with `undefined` (extension)', function() {
      obj = {foo: 1};

      jsonpatch.apply(obj, [{op: 'replace', path: '/foo', value: undefined}]);
      expect(obj).toEqual({foo: undefined});
    });
    it('replace array element with `undefined` (extension)', function() {
      obj = {foo: 1, bar: [0, 1, 2, 3]};

      jsonpatch.apply(obj, [{op: 'replace', path: '/bar/2', value: undefined}]);
      expect(obj).toEqual({foo: 1, bar: [0, 1, undefined, 3]});
    });
    it('test on element set to `undefined`', function() {
      obj = {foo: 1, not: undefined};
      expect(jsonpatch.apply(obj, [{op: 'test', path: '/not', value: "defined"}])).toBe(false);
      expect(jsonpatch.apply(obj, [{op: 'test', path: '/not', value: undefined}])).toBe(true);
    });
    it('test on array element set to `undefined`', function() {
      obj = {foo: 1, bar: [0, 1, undefined, 3]};
      expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar/2', value: "defined"}])).toBe(false);
      expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar/2', value: null}])).toBe(false);
      expect(jsonpatch.apply(obj, [{op: 'test', path: '/bar/2', value: undefined}])).toBe(true);
    });

    it('move of `undefined`', function() {
      obj = {foo: undefined, baz: "defined"};

      jsonpatch.apply(obj, [{op: 'move', from: '/foo', path: '/bar'}]);
      expect(obj).toEqual({baz: "defined", bar: undefined});

      jsonpatch.apply(obj, [{op: 'move', from: '/bar', path: '/baz'}]);
      expect(obj).toEqual({baz: undefined});
    });

    it('copy of `undefined`', function() {
      obj = {foo: undefined, baz: "defined"};

      jsonpatch.apply(obj, [{op: 'copy', from: '/foo', path: '/bar'}]);
      expect(obj).toEqual({foo: undefined, baz: "defined", bar: undefined});

      jsonpatch.apply(obj, [{op: 'copy', from: '/bar', path: '/baz'}]);
      expect(obj).toEqual({foo: undefined, baz: undefined, bar: undefined});
    });
  });
});

// Benchmark performance test
if (typeof Benchmark !== 'undefined') {
  var suite = new Benchmark.Suite;
  suite.add('add operation', function () {
    obj = {foo: 1, baz: [
      {qux: 'hello'}
    ]};
    jsonpatch.apply(obj, [
      {op: 'add', path: '/bar', value: [1, 2, 3, 4]}
    ]);
  });
  suite.add('remove operation', function () {
    obj = {foo: 1, baz: [
      {qux: 'hello'}
    ], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [
      {op: 'remove', path: '/bar'}
    ]);
  });
  suite.add('replace operation', function () {
    obj = {foo: 1, baz: [
      {qux: 'hello'}
    ]};
    jsonpatch.apply(obj, [
      {op: 'replace', path: '/foo', value: [1, 2, 3, 4]}
    ]);
  });
  suite.add('move operation', function () {
    obj = {foo: 1, baz: [
      {qux: 'hello'}
    ], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [
      {op: 'move', from: '/baz/0', path: '/bar/0'}
    ]);
  });
  suite.add('copy operation', function () {
    obj = {foo: 1, baz: [
      {qux: 'hello'}
    ], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [
      {op: 'copy', from: '/baz/0', path: '/bar/0'}
    ]);
  });
  suite.add('test operation', function () {
    obj = {foo: 1, baz: [
      {qux: 'hello'}
    ]};
    jsonpatch.apply(obj, [
      {op: 'test', path: '/baz', value: [
        {qux: 'hello'}
      ]}
    ]);
  });

  benchmarkReporter(suite);
}
