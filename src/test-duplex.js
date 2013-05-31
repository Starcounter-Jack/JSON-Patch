var obj, obj2, patches;

test('generate replace', function() {
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

   ok(true,JSON.stringify(patches));
   jsonpatch.apply(obj2,patches);
   deepEqual(obj2,obj);
});

test('generate replace (2 observers)', function() {
   var person1 = {firstName: "Alexandra", lastName: "Galbreath"};
   var person2 = {firstName: "Lisa", lastName: "Mendoza"};

   var observer1 = jsonpatch.observe(person1);
   var observer2 = jsonpatch.observe(person2);

   person1.firstName = "Alexander";
   person2.firstName = "Lucas";

   var patch1 = jsonpatch.generate(observer1);
   var patch2 = jsonpatch.generate(observer2);

   deepEqual(patch1, [{"op": "replace", "path": "/firstName", "value": "Alexander"}]);
   deepEqual(patch2, [{"op": "replace", "path": "/firstName", "value": "Lucas"}]);
});

test('generate add', function() {
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

   ok(true,JSON.stringify(patches));
   jsonpatch.apply(obj2,patches);
   deepEqual(obj2,obj);
});


test('generate delete', function() {
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
   ok(true,JSON.stringify(patches));
   jsonpatch.apply(obj2,patches);
   deepEqual(obj2,obj);
});

// JSLitmus
JSLitmus.test('Generate replace', function() {
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
