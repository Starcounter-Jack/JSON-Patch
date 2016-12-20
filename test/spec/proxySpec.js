if (typeof window === 'undefined') {
    var jsdom = require("jsdom").jsdom;
    var doc = jsdom(undefined, undefined);
    global.window = doc.defaultView;
    global.document = doc.defaultView.document;
}

if (typeof jsonpatch === 'undefined' || !jsonpatch.compare /* in jsonpatch is loaded without compare, we need to load duplex */) {
    jsonpatch = require('./../../src/json-patch-duplex.js');
}
if (typeof JsonObserver === 'undefined') {
    JsonObserver = require('./../../src/json-observe');
}
if (typeof _ === 'undefined') {
    var _ = require('underscore');
}
function trigger(eventName, elem) {
    if (typeof document !== 'undefined') {
        fireEvent((elem || document.documentElement), eventName);
    }
}

function getPatchesUsingGenerate(objFactory, objChanger) {
    let obj = objFactory();
    let jsonObserver = new JsonObserver(obj);
    let observedObj = jsonObserver.observe(true);
    objChanger(observedObj);
    return jsonObserver.generate();
}

function getPatchesUsingCompare(objFactory, objChanger) {
    let obj = objFactory();
    let mirror = JSON.parse(JSON.stringify(obj));
    objChanger(obj);
    return jsonpatch.compare(mirror, JSON.parse(JSON.stringify(obj)));
}

//http://stackoverflow.com/questions/827716/emulate-clicking-a-link-with-javascript-that-works-with-ie
function fireEvent(obj, evt) {
    var fireOnThis = obj;
    if (document.createEvent) {
        var evObj = document.createEvent(evt.indexOf('mouse') > -1 ? 'MouseEvents' : 'KeyboardEvent');
        evObj.initEvent(evt, true, false);
        fireOnThis.dispatchEvent(evObj);

    } else if (document.createEventObject) {
        var evObj = document.createEventObject();
        fireOnThis.fireEvent('on' + evt, evObj);
    }
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

describe("duplex", function () {

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

    describe("generate", function () {

        it('should generate replace', function () {
            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            observedObj.firstName = "Joachim";
            observedObj.lastName = "Wester";
            observedObj.phoneNumbers[0].number = "123";
            observedObj.phoneNumbers[1].number = "456";

            let patches = jsonObserver.generate();

            let obj2 = {
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
        //https://github.com/Starcounter-Jack/JSON-Patch/issues/125
        it('should generate nothing', function () {
            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            observedObj.firstName = function() {}

            let patches = jsonObserver.generate();

            expect(patches).toReallyEqual([]);
        });
        it('should generate replace (escaped chars)', function () {
            let obj = {
                "/name/first": "Albert",
                "/name/last": "Einstein",
                "~phone~/numbers": [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            observedObj['/name/first'] = "Joachim";
            observedObj['/name/last'] = "Wester";
            observedObj['~phone~/numbers'][0].number = "123";
            observedObj['~phone~/numbers'][1].number = "456";

            let patches = jsonObserver.generate();
            let obj2 = {
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
            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            observedObj.firstName = "Marcin";

            let patches = jsonObserver.generate();

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
            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            observedObj.phoneNumbers[0].number = "123";

            let patches = jsonObserver.generate();

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

            let arr = [1];

            let jsonObserver = new JsonObserver(arr);
            var observedArr = jsonObserver.observe(true);

            observedArr.push(2);

            let patches = jsonObserver.generate();
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
            let arr = [{
                id: 1,
                name: 'Ted'
            }];

            let jsonObserver = new JsonObserver(arr);
            var observedArr = jsonObserver.observe(true);

            observedArr.push({
                id: 2,
                name: 'Jerry'
            });

            let patches = jsonObserver.generate();
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
            let obj = {
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }]
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            observedObj.firstName = "Joachim";
            observedObj.lastName = "Wester";
            observedObj.phoneNumbers[0].number = "123";
            observedObj.phoneNumbers.push({
                number: "456"
            });

            let patches = jsonObserver.generate();

            let obj2 = {
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }]
            };

            jsonpatch.apply(obj2, patches);
            expect(obj2).toEqualInJson(observedObj);
        });

        it('should generate remove', function () {
            let obj = {
                lastName: "Einstein",
                firstName: "Albert",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "4234"
                }]
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            delete observedObj.firstName;
            observedObj.lastName = "Wester";
            observedObj.phoneNumbers[0].number = "123";
            observedObj.phoneNumbers.pop(1);

            let patches = jsonObserver.generate();
            let obj2 = {
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
            let obj = {
                items: ["a", "b", "c"]
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            observedObj.items.pop();
            observedObj.items.pop();

            let patches = jsonObserver.generate();

            //array indexes must be sorted descending, otherwise there is an index collision in apply
            expect(patches).toReallyEqual([{
                op: 'remove',
                path: '/items/2'
            }, {
                op: 'remove',
                path: '/items/1'
            }]);

            let obj2 = {
                items: ["a", "b", "c"]
            };
            jsonpatch.apply(obj2, patches);
            expect(observedObj).toEqualInJson(obj2);
        });

        it('should not generate the same patch twice (replace)', function () {
            let obj = {
                lastName: "Einstein"
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            observedObj.lastName = "Wester";

            let patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/lastName',
                value: 'Wester'
            }]);

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([]);
        });

        it('should not generate the same patch twice (add)', function () {
            let obj = {
                lastName: "Einstein"
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);


            observedObj.firstName = "Albert";

            let patches = jsonObserver.generate();

            expect(patches).toReallyEqual([{
                op: 'add',
                path: '/firstName',
                value: 'Albert'
            }]);

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([]);
        });

        it('should not generate the same patch twice (remove)', function () {
            let obj = {
                lastName: "Einstein"
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

            delete observedObj.lastName;

            let patches = jsonObserver.generate();
            expect(patches).toReallyEqual([{
                op: 'remove',
                path: '/lastName'
            }]);

            patches = jsonObserver.generate();
            expect(patches).toReallyEqual([]);
        });

        it('should ignore array properties', function () {
            let obj = {
                array: [1, 2, 3]
            };


            let patches;

            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);


            observedObj.array.value = 1;
            patches = jsonObserver.generate();
            expect(patches.length).toReallyEqual(0);

            observedObj.array.value = 2;
            patches = jsonObserver.generate();
            expect(patches.length).toReallyEqual(0);
        });

        /*it('should not generate the same patch twice (move)', function() { //"move" is not implemented yet in jsonpatch.generate
          let obj = { lastName: {str: "Einstein"} };
          let jsonObserver = new JsonObserver(obj);             
                let observedObj = jsonObserver.observe(true);

          obj.lastName2 = obj.lastName;
          delete obj.lastName;

          let patches = jsonObserver.generate();
          expect(patches).toReallyEqual([
            { op: 'move', from: '/lastName', to: '/lastName2' }
          ]);

          let patches = jsonObserver.generate();
          expect(patches).toReallyEqual([]);
        });*/

        xdescribe("undefined - JS to JSON projection", function () {
            it('when value is set to `undefined`, should generate remove (undefined is JSON.stringified to no value)', function () {
                let obj = {
                    foo: "bar"
                };

                let jsonObserver = new JsonObserver(obj);
                let observedObj = jsonObserver.observe(true);
                observedObj.foo = undefined;

                let patches = jsonObserver.generate();
                expect(patches).toReallyEqual([{
                    op: 'remove',
                    path: '/foo'
                }]);
            });

            it('when new property is added, and set to `undefined`, nothing should be generated (undefined is JSON.stringified to no value)', function () {
                let obj = {
                    foo: "bar"
                };

                let jsonObserver = new JsonObserver(obj);
                let observedObj = jsonObserver.observe(true);
                observedObj.baz = undefined;

                let patches = jsonObserver.generate();
                expect(patches).toReallyEqual([]);
            });

            it('when array element is set to `undefined`, should generate replace to `null` (undefined array elements are JSON.stringified to `null`)', function () {
                let obj = {
                    foo: [0, 1, 2]
                };

                let jsonObserver = new JsonObserver(obj);
                let observedObj = jsonObserver.observe(true);
                observedObj.foo[1] = undefined;

                let patches = jsonObserver.generate();
                expect(patches).toReallyEqual([{
                    op: 'replace',
                    path: '/foo/1',
                    value: null
                }]);
            });

            it('when `undefined` property is set to something, should generate add (undefined in JSON.stringified to no value)', function () {
                let obj = {
                    foo: undefined
                };

                let jsonObserver = new JsonObserver(obj);
                let observedObj = jsonObserver.observe(true);
                observedObj.foo = "something";

                let patches = jsonObserver.generate();
                expect(patches).toReallyEqual([{
                    op: 'add',
                    path: '/foo',
                    value: "something"
                }]);
            });
            it('when `undefined` array element is set to something, should generate replace (undefined array elements are JSON.stringified to `null`)', function () {
                let obj = {
                    foo: [0, undefined, 2]
                };

                let jsonObserver = new JsonObserver(obj);
                let observedObj = jsonObserver.observe(true);
                observedObj.foo[1] = 1;

                let patches = jsonObserver.generate();
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
                    let objFactory = function () {
                        return {
                            foo: "bar"
                        };
                    };

                    let objChanger = function (obj) {
                        obj.baz = undefined;
                    };

                    var genereatedPatches = getPatchesUsingGenerate(objFactory, objChanger);
                    var comparedPatches = getPatchesUsingCompare(objFactory, objChanger);

                    expect(genereatedPatches).toReallyEqual([]);
                    expect(genereatedPatches).toReallyEqual(comparedPatches);
                });

                it('when an `undefined` property is deleted', function () {
                    let objFactory = function () {
                        return {
                            foo: undefined
                        };
                    };

                    let objChanger = function (obj) {
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
                    let objFactory = function () {
                        return {
                            foo: undefined
                        };
                    };

                    let objChanger = function (obj) {
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
                    let objFactory = function () {
                        return {
                            foo: "bar"
                        };
                    };

                    let objChanger = function (obj) {
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
                    let objFactory = function () {
                        return {
                            foo: [0, 1, 2]
                        };
                    };

                    let objChanger = function (obj) {
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
                    let objFactory = function () {
                        return {
                            foo: [0, undefined, 2]
                        };
                    };

                    let objChanger = function (obj) {
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
            let obj = {
                "foo": ["bar"]
            };
            let patches = [{
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
            let patches;
            let obj2;
            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true);

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


            //useless now
            //trigger('keyup');
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

            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            let jsonObserver = new JsonObserver(obj);

            let observedObj = jsonObserver.observe(true, function (patches) {
                called++;
                lastPatches = [patches];
                patchesChanged(called);
            });
            observedObj.firstName = "Marcin";

            //trigger('keyup');
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

            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            let jsonObserver = new JsonObserver(obj);

            let observedObj = jsonObserver.observe(true, function (patches) {
                called++;
                lastPatches = [patches];
                patchesChanged(called);
            });
            observedObj.phoneNumbers[0].number = "123";

            //needless now
            //trigger('keyup');

            
        });

        it('generate should execute callback synchronously', function (done) {
            var lastPatches, called = 0,
                res;

            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true, function (patches) {
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

            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            let jsonObserver = new JsonObserver(obj);
            let observedObj = jsonObserver.observe(true, function (patches) {
                called++;
            });

            observedObj.firstName = 'Malvin';

            // ugly migration from Jasmine 1.x to > 2.0
            setTimeout(function () {

                // an ugly walkaround
                jasmine.addMatchers(customMatchers);

                expect(called).toReallyEqual(1);

                observedObj = jsonObserver.unobserve();

                observedObj.firstName = 'Wilfred';

                //trigger('keyup');

                setTimeout(function () {

                    // an ugly walkaround
                    jasmine.addMatchers(customMatchers);

                    expect(called).toReallyEqual(1);

                    let observedObj = jsonObserver.observe(true, function (patches) {
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

        it('should unobserve then observe again (deep value)', function (done) {
            var called = 0;

            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            let jsonObserver = new JsonObserver(obj);

            let observedObj = jsonObserver.observe(true, function (patches) {
                called++;
            });

            observedObj.phoneNumbers[1].number = '555';

            //trigger('keyup');
            // ugly migration from Jasmine 1.x to > 2.0
            setTimeout(function () {
                jasmine.addMatchers(customMatchers);

                expect(called).toReallyEqual(1);

                jsonObserver.unobserve();

                observedObj.phoneNumbers[1].number = '556';

                //trigger('keyup');

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

            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            let jsonObserver = new JsonObserver(obj);

            let observedObj = jsonObserver.observe(true, function (patches) {
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

        /*
        it("should handle callbacks that calls observe() and unobserve() internally", function (done) {

            //TODO: needs attention
            let obj = {
                foo: 'bar'
            };

            var observer;
            var count = 0;

            var callback = jasmine.createSpy('callback', function () {

                let jsonObserver = new JsonObserver(obj);
                let observedObj = jsonObserver.observe(true, callback);

                jsonObserver.unobserve();
                observedObj = jsonObserver.observe(true, callback);

                callbackCalled(++count);
            }).and.callThrough();

            let jsonObserver = new JsonObserver(obj);
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
        
        it('should generate patch after `mouseup` event', function(done) {
            let obj = {
                lastName: "Einstein"
            };
            var lastPatches;
            var observer = jsonpatch.observe(obj, function(patches) {
                lastPatches = patches;
            });

            obj.lastName = "Hawking";

            trigger('mouseup');

            setTimeout(function() {
                expect(lastPatches).toEqual([{
                    op: 'replace',
                    path: '/lastName',
                    value: 'Hawking'
                }]);
                done();
            });
        });

        it('should generate patch after `mousedown` event', function(done) {
            let obj = {
                lastName: "Einstein"
            };
            var lastPatches;
            var observer = jsonpatch.observe(obj, function(patches) {
                lastPatches = patches;
            });

            obj.lastName = "Hawking";
            trigger('mousedown');

            setTimeout(function() {
                expect(lastPatches).toEqual([{
                    op: 'replace',
                    path: '/lastName',
                    value: 'Hawking'
                }]);
                done();
            }, 20);
        });

        it('should generate patch after `keydown` event', function(done) {
            let obj = {
                lastName: "Einstein"
            };
            var lastPatches;
            var observer = jsonpatch.observe(obj, function(patches) {
                lastPatches = patches;
            });

            obj.lastName = "Hawking";
            trigger('keydown');

            setTimeout(function() {
                expect(lastPatches).toEqual([{
                    op: 'replace',
                    path: '/lastName',
                    value: 'Hawking'
                }]);
                done();
            }, 20);
        });*/

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

    /*  
    useless now, thanks to ES6 classes
    describe("Registering multiple observers with the same callback", function() {

        it("should register only one observer", function(done) {

            let obj = {
                foo: 'bar'
            };

            var callback = jasmine.createSpy('callback');

            let jsonObserver = new JsonObserver(obj);             
            let observedObj = jsonObserver.observe(true, callback);

            jsonpatch.observe(obj, callback);
            jsonpatch.observe(obj, callback);

            expect(callback.calls.count()).toReallyEqual(0);

            obj.foo = 'bazz';

            trigger('keyup')

            setTimeout(function() {
                expect(callback.calls.count()).toReallyEqual(1);
                done();
            }, 100);
        });

        it("should return the same observer if callback has been already registered)", function() {
            let obj = {
                foo: 'bar'
            };

            var callback = jasmine.createSpy('callback');

            var observer1 = jsonpatch.observe(obj, callback);
            var observer2 = jsonpatch.observe(obj, callback);

            expect(observer1).toBe(observer2);


        });

        it("should return a different observer if callback has been unregistered and registered again", function() {
            let obj = {
                foo: 'bar'
            };

            var callback = jasmine.createSpy('callback');

            var observer1 = jsonpatch.observe(obj, callback);

            jsonpatch.unobserve(obj, observer1);

            var observer2 = jsonpatch.observe(obj, callback);

            expect(observer1).not.toBe(observer2);

        });

        it('should not call callback on key and mouse events after unobserve', function(done) {
            var called = 0;

            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var observer = jsonpatch.observe(obj, function(patches) {
                called++;
            });

            obj.firstName = 'Malvin';

            trigger('keyup');

            // ugly migration from Jasmine 1.x to > 2.0
            setTimeout(function() {
                expect(called).toReallyEqual(1);

                jsonpatch.unobserve(obj, observer);

                obj.firstName = 'Wilfred';

                trigger('mousedown');
                trigger('mouseup');
                trigger('keydown');
                trigger('keyup');

                setTimeout(function() {
                    expect(called).toReallyEqual(1);
                    done();
                }, 20)
            }, 20);
        });
    });
    */

    describe("compare", function () {
        it("should return patch difference between objects", function () {
            let obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };
            let obj2 = {
                firstName: "Joachim",
                lastName: "Wester",
                mobileNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            let patches = jsonpatch.compare(obj, obj2);
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
            let obj = {
                foo: 'bar'
            };
            jsonpatch.compare(obj, {});
            expect(obj.foo).toReallyEqual('bar');
        });
    });
});
