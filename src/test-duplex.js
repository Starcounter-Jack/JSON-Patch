var obj, obj2, patches;

if(typeof jsonpatch === 'undefined') {
  if(process.env.duplex === 'yes') {
    jsonpatch = require('./json-patch-duplex.js'); //testing in NodeJS, type `npm install`, then `jasmine-node --matchall --config duplex yes test.js test-duplex.js`
  }
  else {
    jsonpatch = require('./json-patch.js'); //testing in NodeJS, type `npm install`, then `jasmine-node --matchall --config duplex no test.js`
  }
}

describe("JSON-Patch-Duplex", function () {
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
    expect(obj2).toEqual(obj);
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
    expect(obj2).toEqual(obj);
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
