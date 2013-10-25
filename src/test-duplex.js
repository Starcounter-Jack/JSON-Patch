var obj, obj2, patches;

if(typeof jsonpatch === 'undefined') {
  if(process.env.duplex === 'yes') { //required by `jasmine-node` test runner in Node.js
    jsonpatch = require('./json-patch-duplex.js');
  }
  else {
    jsonpatch = require('./json-patch.js');
  }
}

describe("JSON-Patch-Duplex", function () {
  beforeEach(function () {
    this.addMatchers({
/**
 * This matcher is only needed in Chrome 28 (Chrome 28 cannot successfully compare observed objects immediately after they have been changed. Chrome 30 is unaffected)
 * @param obj
 * @returns {boolean}
 */
      toEqualInJson: function (expected) {
        return JSON.stringify(this.actual) == JSON.stringify(expected);
      }
    });
  });

  describe("generate", function () {
    it('should generate replace', function() {
      obj = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      var observer = jsonpatch.observe(obj);
      obj.firstName = "Joachim";
      obj.lastName = "Wester";
      obj.phoneNumbers[0].number = "123";
      obj.phoneNumbers[1].number = "456";

      var patches = jsonpatch.generate(observer);
      obj2 = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      jsonpatch.apply(obj2,patches);
      expect(obj2).toEqual(obj);
    });

    it('should generate replace (escaped chars)', function() {
      obj = { "/name/first":"Albert", "/name/last":"Einstein",
        "~phone~/numbers":[ {number:"12345"}, {number:"45353"} ]};

      var observer = jsonpatch.observe(obj);
      obj['/name/first'] = "Joachim";
      obj['/name/last'] = "Wester";
      obj['~phone~/numbers'][0].number = "123";
      obj['~phone~/numbers'][1].number = "456";

      var patches = jsonpatch.generate(observer);
      obj2 = { "/name/first":"Albert", "/name/last":"Einstein",
        "~phone~/numbers":[ {number:"12345"}, {number:"45353"} ]};

      jsonpatch.apply(obj2,patches);
      expect(obj2).toEqual(obj);
    });

    it('should generate replace (2 observers)', function() {
      var person1 = {firstName: "Alexandra", lastName: "Galbreath"};
      var person2 = {firstName: "Lisa", lastName: "Mendoza"};

      var observer1 = jsonpatch.observe(person1);
      var observer2 = jsonpatch.observe(person2);

      person1.firstName = "Alexander";
      person2.firstName = "Lucas";

      var patch1 = jsonpatch.generate(observer1);
      var patch2 = jsonpatch.generate(observer2);

      expect(patch1).toEqual([{"op": "replace", "path": "/firstName", "value": "Alexander"}]);
      expect(patch2).toEqual([{"op": "replace", "path": "/firstName", "value": "Lucas"}]);
    });

    it('should generate replace (double change, shallow object)', function() {
      obj = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      var observer = jsonpatch.observe(obj);
      obj.firstName = "Marcin";

      var patches = jsonpatch.generate(observer);
      expect(patches).toEqual([{op: 'replace', path: '/firstName', value: 'Marcin'}]);

      obj.lastName = "Warp";
      patches = jsonpatch.generate(observer); //first patch should NOT be reported again here
      expect(patches).toEqual([{op: 'replace', path: '/lastName', value: 'Warp'}]);

      expect(obj).toEqual({ firstName:"Marcin", lastName:"Warp",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]}); //objects should be still the same
    });

    it('should generate replace (double change, deep object)', function() {
      obj = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      var observer = jsonpatch.observe(obj);
      obj.phoneNumbers[0].number = "123";

      var patches = jsonpatch.generate(observer);
      expect(patches).toEqual([{op: 'replace', path: '/phoneNumbers/0/number', value: '123'}]);

      obj.phoneNumbers[1].number = "456";
      patches = jsonpatch.generate(observer); //first patch should NOT be reported again here
      expect(patches).toEqual([{op: 'replace', path: '/phoneNumbers/1/number', value: '456'}]);

      expect(obj).toEqual({ firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"123"}, {number:"456"} ]}); //objects should be still the same
    });

    it('should generate replace (changes in new array cell, primitive values)', function() {
      arr = [1];

      var observer = jsonpatch.observe(arr);
      arr.push(2);

      var patches = jsonpatch.generate(observer);
      expect(patches).toEqual([{op: 'add', path: '/1', value: 2}]);

      arr[0] = 3;

      var patches = jsonpatch.generate(observer);
      expect(patches).toEqual([{op: 'replace', path: '/0', value: 3}]);

      arr[1] = 4;

      var patches = jsonpatch.generate(observer);
      expect(patches).toEqual([{op: 'replace', path: '/1', value: 4}]);

    });


    it('should generate replace (changes in new array cell, complex values)', function() {
      arr = [
        {
          id: 1,
          name: 'Ted'
        }
      ];

      var observer = jsonpatch.observe(arr);
      arr.push({id: 2, name: 'Jerry'});

      var patches = jsonpatch.generate(observer);
      expect(patches).toEqual([{op: 'add', path: '/1', value: {id: 2, name: 'Jerry'}}]);

      arr[0].id = 3;

      var patches = jsonpatch.generate(observer);
      expect(patches).toEqual([{op: 'replace', path: '/0/id', value: 3}]);

      arr[1].id = 4;

      var patches = jsonpatch.generate(observer);
      expect(patches).toEqual([{op: 'replace', path: '/1/id', value: 4}]);

    });

    it('should generate add', function() {
      obj = { lastName:"Einstein",
        phoneNumbers:[ {number:"12345"} ]};
      var observer = jsonpatch.observe(obj);

      obj.firstName = "Joachim";
      obj.lastName = "Wester";
      obj.phoneNumbers[0].number = "123";
      obj.phoneNumbers.push( { number: "456" } );

      patches = jsonpatch.generate(observer);
      obj2 = { lastName:"Einstein",
        phoneNumbers:[ {number:"12345"} ]};

      jsonpatch.apply(obj2,patches);
      expect(obj2).toEqualInJson(obj);
    });

    it('should generate remove', function() {
      obj = { lastName:"Einstein", firstName:"Albert",
        phoneNumbers:[ {number:"12345"}, {number:"4234"} ]};
      var observer = jsonpatch.observe(obj);

      delete obj.firstName;
      obj.lastName = "Wester";
      obj.phoneNumbers[0].number = "123";
      obj.phoneNumbers.pop(1);

      patches = jsonpatch.generate(observer);
      obj2 = { lastName:"Einstein", firstName:"Albert",
        phoneNumbers:[ {number:"12345"}, {number:"4234"} ]};

      jsonpatch.apply(obj2,patches);
      expect(obj2).toEqualInJson(obj);
    });

    it('should generate remove (array indexes should be sorted descending)', function() {
      obj = { items: ["a", "b", "c"]};
      var observer = jsonpatch.observe(obj);

      obj.items.pop();
      obj.items.pop();

      patches = jsonpatch.generate(observer);

      //array indexes must be sorted descending, otherwise there is an index collision in apply
      expect(patches).toEqual([
        { op: 'remove', path: '/items/2' },
        { op: 'remove', path: '/items/1' }
      ]);

      obj2 = { items: ["a", "b", "c"]};
      jsonpatch.apply(obj2,patches);
      expect(obj).toEqualInJson(obj2);
    });

    it('should not generate the same patch twice (replace)', function() {
      obj = { lastName:"Einstein" };
      var observer = jsonpatch.observe(obj);

      obj.lastName = "Wester";

      patches = jsonpatch.generate(observer);
      expect(patches).toEqual([
        { op: 'replace', path: '/lastName', value: 'Wester' }
      ]);

      patches = jsonpatch.generate(observer);
      expect(patches).toEqual([]);
    });

    it('should not generate the same patch twice (add)', function() {
      obj = { lastName:"Einstein" };
      var observer = jsonpatch.observe(obj);

      obj.firstName = "Albert";

      patches = jsonpatch.generate(observer);
      expect(patches).toEqual([
        { op: 'add', path: '/firstName', value: 'Albert' }
      ]);

      patches = jsonpatch.generate(observer);
      expect(patches).toEqual([]);
    });

    it('should not generate the same patch twice (remove)', function() {
      obj = { lastName:"Einstein" };
      var observer = jsonpatch.observe(obj);

      delete obj.lastName;

      patches = jsonpatch.generate(observer);
      expect(patches).toEqual([
        { op: 'remove', path: '/lastName' }
      ]);

      patches = jsonpatch.generate(observer);
      expect(patches).toEqual([]);
    });

    //related issue: https://github.com/Starcounter-Jack/JSON-Patch/issues/14
    it('should generate the same patch using Object.observe and shim', function() {
      var arr1 = [
        ["Albert", "Einstein"],
        ["Erwin", "Shrodinger"]
      ];

      var arr2 = arr1.slice();

      var newRecord = ['Niels', 'Bohr'];

      var observer1 = jsonpatch.observe(arr1);
      arr1.push(newRecord);

      var objectObservePatches = jsonpatch.generate(observer1);

      var _observe = Object.observe;
      Object.observe = undefined;

      var observer2 = jsonpatch.observe(arr2);
      arr2.push(newRecord);

      var shimPatches = jsonpatch.generate(observer2);

      expect(objectObservePatches).toEqual(shimPatches);

      Object.observe = _observe;
    });

    /*it('should not generate the same patch twice (move)', function() { //"move" is not implemented yet in jsonpatch.generate
      obj = { lastName: {str: "Einstein"} };
      var observer = jsonpatch.observe(obj);

      obj.lastName2 = obj.lastName;
      delete obj.lastName;

      patches = jsonpatch.generate(observer);
      expect(patches).toEqual([
        { op: 'move', from: '/lastName', to: '/lastName2' }
      ]);

      patches = jsonpatch.generate(observer);
      expect(patches).toEqual([]);
    });*/
  });

  describe('callback', function() {
    it('should generate replace', function() {
      var patches;

      obj = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      jsonpatch.observe(obj, function(_patches) {
        patches = _patches;
      });
      obj.firstName = "Joachim";
      obj.lastName = "Wester";
      obj.phoneNumbers[0].number = "123";
      obj.phoneNumbers[1].number = "456";

      waitsFor(function(){
        return typeof patches === 'object';
      }, 100);

      runs(function(){
        obj2 = { firstName:"Albert", lastName:"Einstein",
          phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

        jsonpatch.apply(obj2,patches);
        expect(obj2).toEqual(obj);
      });
    });

    it('should generate replace (double change, shallow object)', function() {
      var lastPatches
        , called = 0;

      obj = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      jsonpatch.intervals = [50];
      jsonpatch.observe(obj, function(patches) {
        called++;
        lastPatches = patches;
      });
      obj.firstName = "Marcin";

      waitsFor(function(){
        return called > 0;
      }, 100, 'firstName change to Marcin');

      runs(function(){
        expect(called).toEqual(1);
        expect(lastPatches).toEqual([{op: 'replace', path: '/firstName', value: 'Marcin'}]);

        obj.lastName = "Warp";
      });

      waitsFor(function(){
        return called > 1;
      }, 100, 'lastName change to Warp');

      runs(function(){
        expect(called).toEqual(2);
        expect(lastPatches).toEqual([{op: 'replace', path: '/lastName', value: 'Warp'}]); //first patch should NOT be reported again here

        expect(obj).toEqual({ firstName:"Marcin", lastName:"Warp",
          phoneNumbers:[ {number:"12345"}, {number:"45353"} ]}); //objects should be still the same
      });
    });

    it('should generate replace (double change, deep object)', function() {
      var lastPatches
        , called = 0;

      obj = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      jsonpatch.intervals = [50];
      jsonpatch.observe(obj, function(patches) {
        called++;
        lastPatches = patches;
      });
      obj.phoneNumbers[0].number = "123";

      waitsFor(function(){
        return called > 0;
      }, 100, 'phoneNumbers[0].number change to 123');

      runs(function(){
        expect(called).toEqual(1);
        expect(lastPatches).toEqual([{op: 'replace', path: '/phoneNumbers/0/number', value: '123'}]);

        obj.phoneNumbers[1].number = "456";
      });

      waitsFor(function(){
        return called > 1;
      }, 100, 'phoneNumbers[1].number change to 456');

      runs(function(){
        expect(called).toEqual(2);
        expect(lastPatches).toEqual([{op: 'replace', path: '/phoneNumbers/1/number', value: '456'}]); //first patch should NOT be reported again here

        expect(obj).toEqual({ firstName:"Albert", lastName:"Einstein",
          phoneNumbers:[ {number:"123"}, {number:"456"} ]}); //objects should be still the same
      });
    });

    it('generate should execute callback synchronously', function() {
      var lastPatches
        , called = 0
        , res;

      obj = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      jsonpatch.intervals = [10];
      var observer = jsonpatch.observe(obj, function(patches) {
        called++;
        lastPatches = patches;
      });
      obj.phoneNumbers[0].number = "123";

      waits(100);
      expect(called).toEqual(0);

      res = jsonpatch.generate(observer);
      expect(called).toEqual(1);
      expect(lastPatches).toEqual([{op: 'replace', path: '/phoneNumbers/0/number', value: '123'}]);
      expect(lastPatches).toEqual(res);

      res = jsonpatch.generate(observer);
      expect(called).toEqual(1);
      expect(lastPatches).toEqual([{op: 'replace', path: '/phoneNumbers/0/number', value: '123'}]);
      expect(res).toEqual([]);
    });

    it('should unobserve then observe again', function() {
      var called = 0;

      obj = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      jsonpatch.intervals = [10];
      var observer = jsonpatch.observe(obj, function(patches) {
        called++;
      });

      obj.firstName = 'Malvin';

      waits(20);

      runs(function(){
        expect(called).toEqual(1);

        jsonpatch.unobserve(obj, observer);

        obj.firstName = 'Wilfred';
      });

      waits(20);

      runs(function(){
        expect(called).toEqual(1);

        observer = jsonpatch.observe(obj, function(patches) {
          called++;
        });

        obj.firstName = 'Megan';
      });

      waits(20);

      runs(function(){
        expect(called).toEqual(2);
      });
    });

    it('should unobserve then observe again (deep value)', function() {
      var called = 0;

      obj = { firstName:"Albert", lastName:"Einstein",
        phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

      jsonpatch.intervals = [10];
      var observer = jsonpatch.observe(obj, function(patches) {
        called++;
      });

      obj.phoneNumbers[1].number = '555';

      waits(20);

      runs(function(){
        expect(called).toEqual(1);

        jsonpatch.unobserve(obj, observer);

        obj.phoneNumbers[1].number = '556';
      });

      waits(20);

      runs(function(){
        expect(called).toEqual(1);

        observer = jsonpatch.observe(obj, function(patches) {
          called++;
        });

        obj.phoneNumbers[1].number = '557';
      });

      waits(20);

      runs(function(){
        expect(called).toEqual(2);
      });
    });

    it('calling unobserve should deliver pending changes synchronously', function() {
      var lastPatches = '';

      obj = { firstName: "Albert", lastName: "Einstein",
        phoneNumbers: [
          {number: "12345"},
          {number: "45353"}
        ]};

      jsonpatch.intervals = [10];
      var observer = jsonpatch.observe(obj, function (patches) {
        lastPatches = patches;
      });

      obj.firstName = 'Malvin';

      jsonpatch.unobserve(obj, observer);

      expect(lastPatches[0].value).toBe('Malvin');

      obj.firstName = 'Jonathan';

      waits(20);

      runs(function () {
        expect(lastPatches[0].value).toBe('Malvin');
      });
    });

    it("should handle callbacks that calls observe() and unobserve() internally", function () {

      var obj = {
        foo: 'bar'
      };

      var observer;

      var callback = jasmine.createSpy('callback');
      callback.plan = function(){
        jsonpatch.unobserve(obj, observer);

        jsonpatch.observe(obj, callback);
      };

      observer = jsonpatch.observe(obj, callback);

      expect(callback.calls.length).toEqual(0);

      obj.foo = 'bazz';

      waitsFor(function () {
        return callback.calls.length > 0;
      }, 'callback calls', 1000);

      runs(function () {
         expect(callback.calls.length).toEqual(1);

        callback.reset();

        obj.foo = 'bazinga';
      });

      waitsFor(function () {
        return callback.calls.length > 0;
      }, 'callback calls', 1000);

      runs(function () {
        expect(callback.calls.length).toEqual(1);
      });


    });

  });



  describe("Registering multiple observers with the same callback", function () {

    it("should register only one observer", function () {

      var obj = {
        foo: 'bar'
      };

      var callback = jasmine.createSpy('callback');

      jsonpatch.observe(obj, callback);
      jsonpatch.observe(obj, callback);

      expect(callback.calls.length).toEqual(0);

      obj.foo = 'bazz';

      waitsFor(function () {
        return callback.calls.length > 0;
      }, 'callback call', 1000);

      runs(function () {
        expect(callback.calls.length).toEqual(1);
      });

    });

    it("should return the same observer if callback has been already registered)", function () {
      var obj = {
        foo: 'bar'
      };

      var callback = jasmine.createSpy('callback');

      var observer1 = jsonpatch.observe(obj, callback);
      var observer2 = jsonpatch.observe(obj, callback);

      expect(observer1).toBe(observer2);


    });

    it("should return a different observer if callback has been unregistered and registered again", function () {
      var obj = {
        foo: 'bar'
      };

      var callback = jasmine.createSpy('callback');

      var observer1 = jsonpatch.observe(obj, callback);

      jsonpatch.unobserve(obj, observer1);

      var observer2 = jsonpatch.observe(obj, callback);

      expect(observer1).not.toBe(observer2);

    });
  });

});

// JSLitmus performance test
if(typeof JSLitmus !== 'undefined') {
  JSLitmus.test('should Generate replace', function() {
    obj = { firstName:"Albert", lastName:"Einstein",
      phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};
    var observer = jsonpatch.observe(obj);

    obj.firstName = "Joachim";
    obj.lastName = "Wester";
    obj.phoneNumbers[0].number = "123";
    obj.phoneNumbers[1].number = "456";

    var patches = jsonpatch.generate(observer);
    obj2 = { firstName:"Albert", lastName:"Einstein",
      phoneNumbers:[ {number:"12345"}, {number:"45353"} ]};

    jsonpatch.apply(obj2,patches);
  });
}
