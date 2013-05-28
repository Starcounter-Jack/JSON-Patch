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