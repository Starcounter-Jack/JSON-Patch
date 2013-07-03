var obj, obj2, patches;

if(typeof jsonpatch === 'undefined') {
  if(process.env.duplex === 'yes') { //required by `jasmine-node` test runner in Node.js
    jsonpatch = require('./json-patch-duplex.js');
  }
  else {
    jsonpatch = require('./json-patch.js');
  }
}

/**
 * This matcher is only needed in Chrome 28 (Chrome 28 cannot successfully compare observed objects immediately after they have been changed. Chrome 30 is unaffected)
 * @param obj
 * @returns {boolean}
 */
jasmine.Matchers.prototype.toEqualInJSON = function(obj) {
  return JSON.stringify(this.actual) == JSON.stringify(obj);
};

describe("JSON-Patch-Duplex", function () {
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
      expect(obj2).toEqualInJSON(obj);
    });

    it('should generate delete', function() {
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
      expect(obj2).toEqualInJSON(obj);
    });
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
