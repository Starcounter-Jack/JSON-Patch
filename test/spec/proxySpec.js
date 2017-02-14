if (typeof window === 'undefined') {
    var jsdom = require("jsdom").jsdom;
    var doc = jsdom(undefined, undefined);
    global.window = doc.defaultView;
    global.document = doc.defaultView.document;
}

/* we need json-patch-duplex for jsonpatch.compare */
if (typeof jsonpatch === 'undefined' || !jsonpatch.compare /* if jsonpatch is loaded without compare, we need to load duplex */) {
    jsonpatch = require('./../../src/json-patch-duplex.js');
}
if (typeof JsonObserver === 'undefined') {
    JsonObserver = require('./../../src/json-observe').default;
}
if (typeof _ === 'undefined') {
    var _ = require('underscore');
}

function getPatchesUsingGenerate(objFactory, objChanger) {
    var obj = objFactory();
    var jsonObserver = new JsonObserver(obj);
    var observedObj = jsonObserver.observe(true);
    objChanger(observedObj);
    return jsonObserver.generate();
}

function getPatchesUsingCompare(objFactory, objChanger) {
    var obj = objFactory();
    var mirror = JSON.parse(JSON.stringify(obj));
    objChanger(obj);
    return jsonpatch.compare(mirror, JSON.parse(JSON.stringify(obj)));
}

var customMatchers = {
    /**
     * This matcher is only needed in Chrome 28 (Chrome 28 cannot successfully compare observed objects immediately after they have been changed. Chrome 30 is unaffected)
     * @param obj
     * @returns {boolean}
     */
    toEqualInJson: function (util, customEqualityTesters) {
        return {
            compare: function (actual, expected) {
                return {
                    pass: JSON.stringify(actual) == JSON.stringify(expected)
                }
            }
        }
    },
    toReallyEqual: function (util, customEqualityTesters) {
        return {
            compare: function (actual, expected) {
                return {
                    pass: _.isEqual(actual, expected)
                }
            }
        }
    }
};
describe("Custom matchers", function () {
    
    beforeEach(function () {
        jasmine.addMatchers(customMatchers);
    });   

    describe("toReallyEqual", function () {
        it('should treat deleted, undefined and null values as different', function () {
            expect({
                a: undefined
            }).not.toReallyEqual({});
            expect({
                a: null
            }).not.toReallyEqual({});
            expect({}).not.toReallyEqual({
                a: undefined
            });
            expect({}).not.toReallyEqual({
                a: null
            });
            expect({
                a: undefined
            }).not.toReallyEqual({
                a: null
            });
            expect({
                a: null
            }).not.toReallyEqual({
                a: undefined
            });
        });
    });
});
describe("proxy", function () {

    beforeEach(function () {
        jasmine.addMatchers(customMatchers);
    });   

    describe("generate", function () {

        it('should generate replace', function () {
            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            observedObj.firstName = "Joachim";
            observedObj.lastName = "Wester";
            observedObj.phoneNumbers[0].number = "123";
            observedObj.phoneNumbers[1].number = "456";

            var patches = jsonObserver.generate();

            var obj2 = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            jsonpatch.apply(obj2, patches);
            expect(obj2).toReallyEqual(observedObj);
        });
        /*
        //https://github.com/Starcounter-Jack/JSON-Patch/issues/125
        it('should generate nothing', function () {
            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            observedObj.firstName = function() {}

            var patches = jsonObserver.generate();

            expect(patches).toReallyEqual([]);
        });
        */
        it('should generate replace (escaped chars)', function () {
            var obj = {
                "/name/first": "Albert",
                "/name/last": "Einstein",
                "~phone~/numbers": [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            observedObj['/name/first'] = "Joachim";
            observedObj['/name/last'] = "Wester";
            observedObj['~phone~/numbers'][0].number = "123";
            observedObj['~phone~/numbers'][1].number = "456";

            var patches = jsonObserver.generate();
            var obj2 = {
                "/name/first": "Albert",
                "/name/last": "Einstein",
                "~phone~/numbers": [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            jsonpatch.apply(obj2, patches);
            expect(obj2).toReallyEqual(observedObj);
        });

        it('should generate replace (2 observers)', function () {
            var person1 = {
                firstName: "Alexandra",
                lastName: "Galbreath"
            };
            var person2 = {
                firstName: "Lisa",
                lastName: "Mendoza"
            };

            var jsonObserver1 = new JsonObserver(person1);
            var observedPerson1 = jsonObserver1.observe(true);

            var jsonObserver2 = new JsonObserver(person2);
            var observedPerson2 = jsonObserver2.observe(true);

            observedPerson1.firstName = "Alexander";
            observedPerson2.firstName = "Lucas";

            var patch1 = jsonObserver1.generate();
            var patch2 = jsonObserver2.generate();

            expect(patch1).toReallyEqual([{
                "op": "replace",
                "path": "/firstName",
                "value": "Alexander"
            }]);
            expect(patch2).toReallyEqual([{
                "op": "replace",
                "path": "/firstName",
                "value": "Lucas"
            }]);
        });

        it('should generate replace (double change, shallow object)', function () {
            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            observedObj.firstName = "Marcin";

            var patches = jsonObserver.generate();

            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/firstName',
                value: 'Marcin'
            }]);

            observedObj.lastName = "Warp";
            patches = jsonObserver.generate(); //first patch should NOT be reported again here
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/lastName',
                value: 'Warp'
            }]);

            expect(observedObj).toReallyEqual({
                firstName: "Marcin",
                lastName: "Warp",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            }); //objects should be still the same
        });

        it('should generate replace (double change, deep object)', function () {
            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            observedObj.phoneNumbers[0].number = "123";

            var patches = jsonObserver.generate();

            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/phoneNumbers/0/number',
                value: '123'
            }]);

            observedObj.phoneNumbers[1].number = "456";
            patches = jsonObserver.generate(); //first patch should NOT be reported again here
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/phoneNumbers/1/number',
                value: '456'
            }]);

            expect(observedObj).toReallyEqual({
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "123"
                }, {
                    number: "456"
                }]
            }); //objects should be still the same
        });

        it('should generate replace (changes in new array cell, primitive values)', function () {

            var arr = [1];

            var jsonObserver = new JsonObserver(arr);
            var observedArr = jsonObserver.observe(true);

            observedArr.push(2);

            var patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'add',
                path: '/1',
                value: 2
            }]);

            observedArr[0] = 3;

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/0',
                value: 3
            }]);

            observedArr[1] = 4;

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/1',
                value: 4
            }]);

        });


        it('should generate replace (changes in new array cell, complex values)', function () {
            var arr = [{
                id: 1,
                name: 'Ted'
            }];

            var jsonObserver = new JsonObserver(arr);
            var observedArr = jsonObserver.observe(true);

            observedArr.push({
                id: 2,
                name: 'Jerry'
            });

            var patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'add',
                path: '/1',
                value: {
                    id: 2,
                    name: 'Jerry'
                }
            }]);

            observedArr[0].id = 3;

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/0/id',
                value: 3
            }]);

            observedArr[1].id = 4;

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/1/id',
                value: 4
            }]);

        });

        it('should generate add', function () {
            var obj = {
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }]
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            observedObj.firstName = "Joachim";
            observedObj.lastName = "Wester";
            observedObj.phoneNumbers[0].number = "123";
            observedObj.phoneNumbers.push({
                number: "456"
            });

            var patches = jsonObserver.generate();

            var obj2 = {
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }]
            };

            jsonpatch.apply(obj2, patches);
            expect(obj2).toEqualInJson(observedObj);
        });

        it('should generate remove', function () {
            var obj = {
                lastName: "Einstein",
                firstName: "Albert",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "4234"
                }]
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            delete observedObj.firstName;
            observedObj.lastName = "Wester";
            observedObj.phoneNumbers[0].number = "123";
            observedObj.phoneNumbers.pop(1);

            var patches = jsonObserver.generate();
            var obj2 = {
                lastName: "Einstein",
                firstName: "Albert",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "4234"
                }]
            };
            jsonpatch.apply(obj2, patches);
            expect(obj2).toEqualInJson(observedObj);
        });

        it('should generate remove (array indexes should be sorted descending)', function () {
            var obj = {
                items: ["a", "b", "c"]
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            observedObj.items.pop();
            observedObj.items.pop();

            var patches = jsonObserver.generate();

            //array indexes must be sorted descending, otherwise there is an index collision in apply
            expect(patches).toReallyEqual([{
                op: 'remove',
                path: '/items/2'
            }, {
                op: 'remove',
                path: '/items/1'
            }]);

            var obj2 = {
                items: ["a", "b", "c"]
            };
            jsonpatch.apply(obj2, patches);
            expect(observedObj).toEqualInJson(obj2);
        });

        it('should not generate the same patch twice (replace)', function () {
            var obj = {
                lastName: "Einstein"
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            observedObj.lastName = "Wester";

            var patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/lastName',
                value: 'Wester'
            }]);

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([]);
        });

        it('should not generate the same patch twice (add)', function () {
            var obj = {
                lastName: "Einstein"
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);


            observedObj.firstName = "Albert";

            var patches = jsonObserver.generate();

            expect(patches).toReallyEqual([{
                op: 'add',
                path: '/firstName',
                value: 'Albert'
            }]);

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([]);
        });

        it('should not generate the same patch twice (remove)', function () {
            var obj = {
                lastName: "Einstein"
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            delete observedObj.lastName;

            var patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'remove',
                path: '/lastName'
            }]);

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([]);
        });

        it('should ignore array properties', function () {
            var obj = {
                array: [1, 2, 3]
            };


            var patches;

            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);


            observedObj.array.value = 1;
            patches = jsonObserver.generate();
            expect(patches.length).toReallyEqual(0);

            observedObj.array.value = 2;
            patches = jsonObserver.generate();
            expect(patches.length).toReallyEqual(0);
        });

        /*it('should not generate the same patch twice (move)', function() { //"move" is not implemented yet in jsonpatch.generate
          var obj = { lastName: {str: "Einstein"} };
          var jsonObserver = new JsonObserver(obj);             
                var observedObj = jsonObserver.observe(true);

          obj.lastName2 = obj.lastName;
          delete obj.lastName;

          var patches = jsonObserver.generate();
          expect(patches).toReallyEqual([
            { op: 'move', from: '/lastName', to: '/lastName2' }
          ]);

          var patches = jsonObserver.generate();
          expect(patches).toReallyEqual([]);
        });*/

        xdescribe("undefined - JS to JSON projection", function () {
            it('when value is set to `undefined`, should generate remove (undefined is JSON.stringified to no value)', function () {
                var obj = {
                    foo: "bar"
                };

                var jsonObserver = new JsonObserver(obj);
                var observedObj = jsonObserver.observe(true);
                observedObj.foo = undefined;

                var patches = jsonObserver.generate();
                expect(patches).toReallyEqual([{
                    op: 'remove',
                    path: '/foo'
                }]);
            });

            it('when new property is added, and set to `undefined`, nothing should be generated (undefined is JSON.stringified to no value)', function () {
                var obj = {
                    foo: "bar"
                };

                var jsonObserver = new JsonObserver(obj);
                var observedObj = jsonObserver.observe(true);
                observedObj.baz = undefined;

                var patches = jsonObserver.generate();
                expect(patches).toReallyEqual([]);
            });

            it('when array element is set to `undefined`, should generate replace to `null` (undefined array elements are JSON.stringified to `null`)', function () {
                var obj = {
                    foo: [0, 1, 2]
                };

                var jsonObserver = new JsonObserver(obj);
                var observedObj = jsonObserver.observe(true);
                observedObj.foo[1] = undefined;

                var patches = jsonObserver.generate();
                expect(patches).toReallyEqual([{
                    op: 'replace',
                    path: '/foo/1',
                    value: null
                }]);
            });

            it('when `undefined` property is set to something, should generate add (undefined in JSON.stringified to no value)', function () {
                var obj = {
                    foo: undefined
                };

                var jsonObserver = new JsonObserver(obj);
                var observedObj = jsonObserver.observe(true);
                observedObj.foo = "something";

                var patches = jsonObserver.generate();
                expect(patches).toReallyEqual([{
                    op: 'add',
                    path: '/foo',
                    value: "something"
                }]);
            });
            it('when `undefined` array element is set to something, should generate replace (undefined array elements are JSON.stringified to `null`)', function () {
                var obj = {
                    foo: [0, undefined, 2]
                };

                var jsonObserver = new JsonObserver(obj);
                var observedObj = jsonObserver.observe(true);
                observedObj.foo[1] = 1;

                var patches = jsonObserver.generate();
                expect(patches).toReallyEqual([{
                    op: 'replace',
                    path: '/foo/1',
                    value: 1
                }]);
            });
        });

        describe("undefined - JSON to JS extension", function () {

            describe("should generate empty patch, when", function () {

                it('when new property is set to `undefined`', function () {
                    var objFactory = function () {
                        return {
                            foo: "bar"
                        };
                    };

                    var objChanger = function (obj) {
                        obj.baz = undefined;
                    };

                    var genereatedPatches = getPatchesUsingGenerate(objFactory, objChanger);
                    var comparedPatches = getPatchesUsingCompare(objFactory, objChanger);

                    expect(genereatedPatches).toReallyEqual([]);
                    expect(genereatedPatches).toReallyEqual(comparedPatches);
                });

                it('when an `undefined` property is deleted', function () {
                    var objFactory = function () {
                        return {
                            foo: undefined
                        };
                    };

                    var objChanger = function (obj) {
                        delete obj.foo;
                    };

                    var genereatedPatches = getPatchesUsingGenerate(objFactory, objChanger);
                    var comparedPatches = getPatchesUsingCompare(objFactory, objChanger);

                    expect(genereatedPatches).toReallyEqual([]);
                    expect(genereatedPatches).toReallyEqual(comparedPatches);
                });
            });

            describe("should generate add, when", function () {

                it('`undefined` property is set to something', function () {
                    var objFactory = function () {
                        return {
                            foo: undefined
                        };
                    };

                    var objChanger = function (obj) {
                        obj.foo = "something";
                    };

                    var genereatedPatches = getPatchesUsingGenerate(objFactory, objChanger);
                    var comparedPatches = getPatchesUsingCompare(objFactory, objChanger);

                    expect(genereatedPatches).toReallyEqual([{
                        op: 'add',
                        path: '/foo',
                        value: 'something'
                    }]);
                    expect(genereatedPatches).toReallyEqual(comparedPatches);
                });
            });

            describe("should generate remove, when", function () {

                it('value is set to `undefined`', function () {
                    var objFactory = function () {
                        return {
                            foo: "bar"
                        };
                    };

                    var objChanger = function (obj) {
                        obj.foo = undefined;
                    };

                    var genereatedPatches = getPatchesUsingGenerate(objFactory, objChanger);
                    var comparedPatches = getPatchesUsingCompare(objFactory, objChanger);

                    expect(genereatedPatches).toReallyEqual([{
                        op: 'remove',
                        path: '/foo'
                    }]);
                    expect(genereatedPatches).toReallyEqual(comparedPatches);
                });
            });

            describe("should generate replace, when", function () {

                it('array element is set to `undefined`', function () {
                    var objFactory = function () {
                        return {
                            foo: [0, 1, 2]
                        };
                    };

                    var objChanger = function (obj) {
                        obj.foo[1] = undefined;
                    };

                    var genereatedPatches = getPatchesUsingGenerate(objFactory, objChanger);
                    var comparedPatches = getPatchesUsingCompare(objFactory, objChanger);

                    expect(genereatedPatches).toReallyEqual([{
                        op: 'replace',
                        path: '/foo/1',
                        value: null
                    }]);
                    expect(genereatedPatches).toReallyEqual(comparedPatches);
                });
                it('`undefined` array element is set to something', function () {
                    var objFactory = function () {
                        return {
                            foo: [0, undefined, 2]
                        };
                    };

                    var objChanger = function (obj) {
                        obj.foo[1] = 1;
                    };

                    var genereatedPatches = getPatchesUsingGenerate(objFactory, objChanger);
                    var comparedPatches = getPatchesUsingCompare(objFactory, objChanger);

                    expect(genereatedPatches).toReallyEqual([{
                        op: 'replace',
                        path: '/foo/1',
                        value: 1
                    }]);
                    expect(genereatedPatches).toReallyEqual(comparedPatches);
                });
            });
        });
    });

    describe("apply", function () {
        // https://tools.ietf.org/html/rfc6902#appendix-A.16
        it('should add an Array Value', function () {
            var obj = {
                "foo": ["bar"]
            };
            var patches = [{
                "op": "add",
                "path": "/foo/-",
                "value": ["abc", "def"]
            }];

            jsonpatch.apply(obj, patches);
            expect(obj).toReallyEqual({
                "foo": ["bar", ["abc", "def"]]
            });
        });
    });

    describe('callback', function () {
        it('should generate replace', function () {
            var patches;
            var obj2;
            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true);

            jsonObserver.observe(true, function (_patches) {
                patches = _patches;
                patchesChanged();
            });
            observedObj.firstName = "Joachim";
            /*
            this doesn't work any more, because we don't need
            a key up event to record stuff

            observedObj.lastName = "Wester";
            observedObj.phoneNumbers[0].number = "123";
            observedObj.phoneNumbers[1].number = "456";

            */

            function patchesChanged() {
                obj2 = {
                    firstName: "Albert",
                    lastName: "Einstein",
                    phoneNumbers: [{
                        number: "12345"
                    }, {
                        number: "45353"
                    }]
                };

                jsonpatch.apply(obj2, patches);
                expect(obj2).toReallyEqual(observedObj);
            }

        });

        it('should generate replace (double change, shallow object)', function () {
            var lastPatches, called = 0;

            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            var jsonObserver = new JsonObserver(obj);

            var observedObj = jsonObserver.observe(true, function (patches) {
                called++;
                lastPatches = [patches];
                patchesChanged(called);
            });
            observedObj.firstName = "Marcin";

            // ugly migration from Jasmine 1.x to > 2.0
            function patchesChanged(time) {
                switch (time) {
                    case 1:
                        expect(called).toReallyEqual(1);
                        expect(lastPatches).toReallyEqual([{
                            op: 'replace',
                            path: '/firstName',
                            value: 'Marcin'
                        }]);

                        obj.lastName = "Warp";
                        break;
                    case 2:
                        expect(called).toReallyEqual(2);
                        expect(lastPatches).toReallyEqual([{
                            op: 'replace',
                            path: '/lastName',
                            value: 'Warp'
                        }]); //first patch should NOT be reported again here

                        expect(obj).toReallyEqual({
                            firstName: "Marcin",
                            lastName: "Warp",
                            phoneNumbers: [{
                                number: "12345"
                            }, {
                                number: "45353"
                            }]
                        }); //objects should be still the same
                        break;

                }
            }
        });

        it('should generate replace (double change, deep object)', function () {
            var lastPatches, called = 0;

            // ugly migration from Jasmine 1.x to > 2.0
            function patchesChanged(time) {
                switch (time) {
                    case 1:
                        expect(called).toReallyEqual(1);
                        expect(lastPatches).toReallyEqual([{
                            op: 'replace',
                            path: '/phoneNumbers/0/number',
                            value: '123'
                        }]);

                        obj.phoneNumbers[1].number = "456";
                        break;
                    case 2:

                        expect(called).toReallyEqual(2);
                        expect(lastPatches).toReallyEqual([{
                            op: 'replace',
                            path: '/phoneNumbers/1/number',
                            value: '456'
                        }]); //first patch should NOT be reported again here

                        expect(obj).toReallyEqual({
                            firstName: "Albert",
                            lastName: "Einstein",
                            phoneNumbers: [{
                                number: "123"
                            }, {
                                number: "456"
                            }]
                        }); //objects should be still the same
                        break;
                }
            }

            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            var jsonObserver = new JsonObserver(obj);

            var observedObj = jsonObserver.observe(true, function (patches) {
                called++;
                lastPatches = [patches];
                patchesChanged(called);
            });
            observedObj.phoneNumbers[0].number = "123";           
        });

        it('generate should execute callback synchronously', function (done) {
            var lastPatches, called = 0,
                res;

            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true, function (patches) {
                called++;
                lastPatches = [patches];
            });
            observedObj.phoneNumbers[0].number = "123";

            //needless too
            //setTimeout(function() {
            expect(called).toReallyEqual(1);

            res = jsonObserver.generate();
            expect(called).toReallyEqual(1);
            expect(lastPatches).toReallyEqual([{
                op: 'replace',
                path: '/phoneNumbers/0/number',
                value: '123'
            }]);
            expect(lastPatches).toReallyEqual(res);

            res = jsonObserver.generate();
            expect(called).toReallyEqual(1);
            expect(lastPatches).toReallyEqual([{
                op: 'replace',
                path: '/phoneNumbers/0/number',
                value: '123'
            }]);
            expect(res).toReallyEqual([]);

            done();
            // }, 100);
        });

        it('should unobserve then observe again', function (done) {
            var called = 0;

            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true, function (patches) {
                called++;
            });

            observedObj.firstName = 'Malvin';

            // ugly migration from Jasmine 1.x to > 2.0
            setTimeout(function () {

                // an ugly walk around
                jasmine.addMatchers(customMatchers);

                expect(called).toReallyEqual(1);

                observedObj = jsonObserver.unobserve();

                observedObj.firstName = 'Wilfred';

                setTimeout(function () {

                    // an ugly walkaround
                    jasmine.addMatchers(customMatchers);

                    expect(called).toReallyEqual(1);

                    var observedObj = jsonObserver.observe(true, function (patches) {
                        called++;
                    });

                    observedObj.firstName = 'Megan';
                    setTimeout(function () {
                        // an ugly walkaround
                        jasmine.addMatchers(customMatchers);

                        expect(called).toReallyEqual(2);
                        done();
                    }, 20);
                }, 20);
            }, 20);
        });

         it('shouldn\'t omit patches when unobserved', function () {
            var called = 0;

            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true, function (patches) {
                called++;
            });

            observedObj.firstName = 'Malvin';            
            expect(called).toReallyEqual(1);

            observedObj.firstName = 'Ronaldo';       
            expect(called).toReallyEqual(2);

            jsonObserver.switchObserverOff();

            observedObj.firstName = 'Messi';       
            expect(called).toReallyEqual(2);
        });

        it('should omit patches when unobserved then observed', function () {
            var called = 0;

            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true, function (patches) {
                called++;
            });

            observedObj.firstName = 'Malvin';            
            expect(called).toReallyEqual(1);

            observedObj.firstName = 'Ronaldo';       
            expect(called).toReallyEqual(2);

            jsonObserver.switchObserverOff();

            observedObj.firstName = 'Messi';       
            expect(called).toReallyEqual(2);

            jsonObserver.switchObserverOn();

            observedObj.firstName = 'Carlos';       
            expect(called).toReallyEqual(3);
        });

        it('should unobserve then observe again (deep value)', function (done) {
            var called = 0;

            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var jsonObserver = new JsonObserver(obj);

            var observedObj = jsonObserver.observe(true, function (patches) {
                called++;
            });

            observedObj.phoneNumbers[1].number = '555';

            // ugly migration from Jasmine 1.x to > 2.0
            setTimeout(function () {
                jasmine.addMatchers(customMatchers);

                expect(called).toReallyEqual(1);

                jsonObserver.unobserve();

                observedObj.phoneNumbers[1].number = '556';

                setTimeout(function () {

                    jasmine.addMatchers(customMatchers);

                    expect(called).toReallyEqual(2);

                    observedObj = jsonObserver.observe(true, function (patches) {
                        called++;
                    });

                    observedObj.phoneNumbers[1].number = '557';

                    setTimeout(function () {

                        jasmine.addMatchers(customMatchers);
                        expect(called).toReallyEqual(3);
                        done();


                    }, 20);
                }, 20);
            }, 20);
        });

        it('calling unobserve should deliver pending changes synchronously', function (done) {

            //TODO: needs attention
            var lastPatches = '';

            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var jsonObserver = new JsonObserver(obj);

            var observedObj = jsonObserver.observe(true, function (patches) {
                lastPatches = [patches];
            });
            observedObj.firstName = 'Malvin';

            jsonObserver.unobserve(false);

            expect(lastPatches[0].value).toBe('Malvin');

            observedObj.firstName = 'Jonathan';

            // ugly migration from Jasmine 1.x to > 2.0
            setTimeout(function () {
                jasmine.addMatchers(customMatchers);

                expect(lastPatches[0].value).toBe('Jonathan');
                done();
            }, 20);
        });

        
        it("should handle callbacks that calls observe() and unobserve() internally", function (done) {

            //TODO: needs attention
            var obj = {
                foo: 'bar'
            };

            var observer;
            var count = 0;

            var callback = jasmine.createSpy('callback', function () {

                var jsonObserver = new JsonObserver(obj);
                var observedObj = jsonObserver.observe(true, callback);

                jsonObserver.unobserve();
                observedObj = jsonObserver.observe(true, callback);

                callbackCalled(++count);
            }).and.callThrough();

            var jsonObserver = new JsonObserver(obj);
            var observedObj = jsonObserver.observe(true, callback);

            expect(callback.calls.count()).toReallyEqual(0);

            observedObj.foo = 'bazz';

            // ugly migration from Jasmine 1.x to > 2.0
            function callbackCalled(time) {
                jasmine.addMatchers(customMatchers);
                switch (time) {
                    case 1:

                        expect(callback.calls.count()).toReallyEqual(1);

                        observedObj.foo = 'bazinga';

                        break;
                    case 2:
                        expect(callback.calls.count()).toReallyEqual(2);
                        done();
                        break;
                }
            }
        });             
    });

    describe('compare', function () {
        it('should return an add for a property that does not exist in the first obj', function () {
            var objA = {
                user: {
                    firstName: "Albert"
                }
            };
            var objB = {
                user: {
                    firstName: "Albert",
                    lastName: "Einstein"
                }
            };

            expect(jsonpatch.compare(objA, objB)).toReallyEqual([{
                op: "add",
                path: "/user/lastName",
                value: "Einstein"
            }]);
        });

        it('should return a remove for a property that does not exist in the second obj', function () {
            var objA = {
                user: {
                    firstName: "Albert",
                    lastName: "Einstein"
                }
            };
            var objB = {
                user: {
                    firstName: "Albert"
                }
            };

            expect(jsonpatch.compare(objA, objB)).toReallyEqual([{
                op: "remove",
                path: "/user/lastName"
            }]);
        });

        it('should return a replace for a property that exists in both', function () {
            var objA = {
                user: {
                    firstName: "Albert",
                    lastName: "Einstein"
                }
            };
            var objB = {
                user: {
                    firstName: "Albert",
                    lastName: "Collins"
                }
            };

            expect(jsonpatch.compare(objA, objB)).toReallyEqual([{
                op: "replace",
                path: "/user/lastName",
                value: "Collins"
            }]);
        });

        it('should replace null with object', function () {
            var objA = {
                user: null
            };
            var objB = {
                user: {}
            };

            expect(jsonpatch.compare(objA, objB)).toReallyEqual([{
                op: "replace",
                path: "/user",
                value: {}
            }]);
        });

        it('should replace object with null', function () {
            var objA = {
                user: {}
            };
            var objB = {
                user: null
            };

            expect(jsonpatch.compare(objA, objB)).toReallyEqual([{
                op: "replace",
                path: "/user",
                value: null
            }]);
        });

        it('should not remove undefined', function () {
            var objA = {
                user: undefined
            };
            var objB = {
                user: undefined
            };

            expect(jsonpatch.compare(objA, objB)).toReallyEqual([]);
        })

        it("should replace 0 with empty string", function () {
            var objA = {
                user: 0
            };
            var objB = {
                user: ''
            };

            expect(jsonpatch.compare(objA, objB)).toReallyEqual([{
                op: "replace",
                path: "/user",
                value: ''
            }]);
        });
    });    
    describe("compare", function () {
        it("should return patch difference between objects", function () {
            var obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            var obj2 = {
                firstName: "Joachim",
                lastName: "Wester",
                mobileNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var patches = jsonpatch.compare(obj, obj2);
            expect(patches).toReallyEqual([{
                "op": "remove",
                "path": "/phoneNumbers"
            }, {
                "op": "replace",
                "path": "/lastName",
                "value": "Wester"
            }, {
                "op": "replace",
                "path": "/firstName",
                "value": "Joachim"
            }, {
                "op": "add",
                "path": "/mobileNumbers",
                "value": [{
                    "number": "12345"
                }, {
                    "number": "45353"
                }]
            }]);
        });

        it("should not modify the source object", function () {
            var obj = {
                foo: 'bar'
            };
            jsonpatch.compare(obj, {});
            expect(obj.foo).toReallyEqual('bar');
        });
    });
});
