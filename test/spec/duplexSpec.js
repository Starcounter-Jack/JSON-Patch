var obj, obj2, patches;
if (typeof window === 'undefined') {
    var jsdom = require("jsdom").jsdom;
    var doc = jsdom(undefined, undefined);
    GLOBAL.window = doc.defaultView;
    GLOBAL.document = doc.defaultView.document;
}

if (typeof jsonpatchduplex !== 'undefined') {
    jsonpatch = jsonpatchduplex;
}
if (typeof jsonpatch === 'undefined') {
    if (process.env.DUPLEX === 'yes') { //required by `jasmine-node` test runner in Node.js
        jsonpatch = require('./../../src/json-patch-duplex.js');
    } else {
        jsonpatch = require('./../../src/json-patch.js');
    }
}
if (typeof _ === 'undefined') {
    _ = require('./../lib/underscore.min.js');
}

function trigger(eventName, elem) {
    if (typeof document !== 'undefined') {
        fireEvent((elem || document.documentElement), eventName);
    }
}

function getPatchesUsingGenerate(objFactory, objChanger) {
    var obj = objFactory();
    var observer = jsonpatch.observe(obj);
    objChanger(obj);
    return jsonpatch.generate(observer);
}

function getPatchesUsingCompare(objFactory, objChanger) {
    var obj = objFactory();
    var mirror = JSON.parse(JSON.stringify(obj));
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
    toEqualInJson: function(util, customEqualityTesters) {
        return {
            compare: function(actual, expected) {
                return {
                    pass: JSON.stringify(actual) == JSON.stringify(expected)
                }
            }
        }
    },
    toReallyEqual: function(util, customEqualityTesters) {
        return {
            compare: function(actual, expected) {
                return {
                    pass: _.isEqual(actual, expected)
                }
            }
        }
    }
};

describe("duplex", function() {
    beforeEach(function() {
        jasmine.addMatchers(customMatchers);
    });

    describe("toReallyEqual", function() {
        it('should treat deleted, undefined and null values as different', function() {
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

    describe("generate", function() {
        it('should generate replace', function() {
            obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var observer = jsonpatch.observe(obj);
            obj.firstName = "Joachim";
            obj.lastName = "Wester";
            obj.phoneNumbers[0].number = "123";
            obj.phoneNumbers[1].number = "456";

            var patches = jsonpatch.generate(observer);
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
            expect(obj2).toReallyEqual(obj);
        });

        it('should generate replace (escaped chars)', function() {
            obj = {
                "/name/first": "Albert",
                "/name/last": "Einstein",
                "~phone~/numbers": [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var observer = jsonpatch.observe(obj);
            obj['/name/first'] = "Joachim";
            obj['/name/last'] = "Wester";
            obj['~phone~/numbers'][0].number = "123";
            obj['~phone~/numbers'][1].number = "456";

            var patches = jsonpatch.generate(observer);
            obj2 = {
                "/name/first": "Albert",
                "/name/last": "Einstein",
                "~phone~/numbers": [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            jsonpatch.apply(obj2, patches);
            expect(obj2).toReallyEqual(obj);
        });

        it('should generate replace (2 observers)', function() {
            var person1 = {
                firstName: "Alexandra",
                lastName: "Galbreath"
            };
            var person2 = {
                firstName: "Lisa",
                lastName: "Mendoza"
            };

            var observer1 = jsonpatch.observe(person1);
            var observer2 = jsonpatch.observe(person2);

            person1.firstName = "Alexander";
            person2.firstName = "Lucas";

            var patch1 = jsonpatch.generate(observer1);
            var patch2 = jsonpatch.generate(observer2);

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

        it('should generate replace (double change, shallow object)', function() {
            obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var observer = jsonpatch.observe(obj);
            obj.firstName = "Marcin";

            var patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/firstName',
                value: 'Marcin'
            }]);

            obj.lastName = "Warp";
            patches = jsonpatch.generate(observer); //first patch should NOT be reported again here
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/lastName',
                value: 'Warp'
            }]);

            expect(obj).toReallyEqual({
                firstName: "Marcin",
                lastName: "Warp",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            }); //objects should be still the same
        });

        it('should generate replace (double change, deep object)', function() {
            obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var observer = jsonpatch.observe(obj);
            obj.phoneNumbers[0].number = "123";

            var patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/phoneNumbers/0/number',
                value: '123'
            }]);

            obj.phoneNumbers[1].number = "456";
            patches = jsonpatch.generate(observer); //first patch should NOT be reported again here
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/phoneNumbers/1/number',
                value: '456'
            }]);

            expect(obj).toReallyEqual({
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "123"
                }, {
                    number: "456"
                }]
            }); //objects should be still the same
        });

        it('should generate replace (changes in new array cell, primitive values)', function() {
            arr = [1];

            var observer = jsonpatch.observe(arr);
            arr.push(2);

            var patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'add',
                path: '/1',
                value: 2
            }]);

            arr[0] = 3;

            var patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/0',
                value: 3
            }]);

            arr[1] = 4;

            var patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/1',
                value: 4
            }]);

        });


        it('should generate replace (changes in new array cell, complex values)', function() {
            arr = [{
                id: 1,
                name: 'Ted'
            }];

            var observer = jsonpatch.observe(arr);
            arr.push({
                id: 2,
                name: 'Jerry'
            });

            var patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'add',
                path: '/1',
                value: {
                    id: 2,
                    name: 'Jerry'
                }
            }]);

            arr[0].id = 3;

            var patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/0/id',
                value: 3
            }]);

            arr[1].id = 4;

            var patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/1/id',
                value: 4
            }]);

        });

        it('should generate add', function() {
            obj = {
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }]
            };
            var observer = jsonpatch.observe(obj);

            obj.firstName = "Joachim";
            obj.lastName = "Wester";
            obj.phoneNumbers[0].number = "123";
            obj.phoneNumbers.push({
                number: "456"
            });

            patches = jsonpatch.generate(observer);
            obj2 = {
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }]
            };

            jsonpatch.apply(obj2, patches);
            expect(obj2).toEqualInJson(obj);
        });

        it('should generate remove', function() {
            obj = {
                lastName: "Einstein",
                firstName: "Albert",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "4234"
                }]
            };
            var observer = jsonpatch.observe(obj);

            delete obj.firstName;
            obj.lastName = "Wester";
            obj.phoneNumbers[0].number = "123";
            obj.phoneNumbers.pop(1);

            patches = jsonpatch.generate(observer);
            obj2 = {
                lastName: "Einstein",
                firstName: "Albert",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "4234"
                }]
            };

            jsonpatch.apply(obj2, patches);
            expect(obj2).toEqualInJson(obj);
        });

        it('should generate remove (array indexes should be sorted descending)', function() {
            obj = {
                items: ["a", "b", "c"]
            };
            var observer = jsonpatch.observe(obj);

            obj.items.pop();
            obj.items.pop();

            patches = jsonpatch.generate(observer);

            //array indexes must be sorted descending, otherwise there is an index collision in apply
            expect(patches).toReallyEqual([{
                op: 'remove',
                path: '/items/2'
            }, {
                op: 'remove',
                path: '/items/1'
            }]);

            obj2 = {
                items: ["a", "b", "c"]
            };
            jsonpatch.apply(obj2, patches);
            expect(obj).toEqualInJson(obj2);
        });

        it('should not generate the same patch twice (replace)', function() {
            obj = {
                lastName: "Einstein"
            };
            var observer = jsonpatch.observe(obj);

            obj.lastName = "Wester";

            patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'replace',
                path: '/lastName',
                value: 'Wester'
            }]);

            patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([]);
        });

        it('should not generate the same patch twice (add)', function() {
            obj = {
                lastName: "Einstein"
            };
            var observer = jsonpatch.observe(obj);

            obj.firstName = "Albert";

            patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'add',
                path: '/firstName',
                value: 'Albert'
            }]);

            patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([]);
        });

        it('should not generate the same patch twice (remove)', function() {
            obj = {
                lastName: "Einstein"
            };
            var observer = jsonpatch.observe(obj);

            delete obj.lastName;

            patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([{
                op: 'remove',
                path: '/lastName'
            }]);

            patches = jsonpatch.generate(observer);
            expect(patches).toReallyEqual([]);
        });

        it('should ignore array properties', function() {
            var obj = {
                array: [1, 2, 3]
            };

            var patches;
            var observer = jsonpatch.observe(obj);

            obj.array.value = 1;
            patches = jsonpatch.generate(observer);
            expect(patches.length).toReallyEqual(0);

            obj.array.value = 2;
            patches = jsonpatch.generate(observer);
            expect(patches.length).toReallyEqual(0);
        });

        /*it('should not generate the same patch twice (move)', function() { //"move" is not implemented yet in jsonpatch.generate
          obj = { lastName: {str: "Einstein"} };
          var observer = jsonpatch.observe(obj);

          obj.lastName2 = obj.lastName;
          delete obj.lastName;

          patches = jsonpatch.generate(observer);
          expect(patches).toReallyEqual([
            { op: 'move', from: '/lastName', to: '/lastName2' }
          ]);

          patches = jsonpatch.generate(observer);
          expect(patches).toReallyEqual([]);
        });*/

        xdescribe("undefined - JS to JSON projection", function() {
            it('when value is set to `undefined`, should generate remove (undefined is JSON.stringified to no value)', function() {
                var obj = {
                    foo: "bar"
                };

                var observer = jsonpatch.observe(obj);
                obj.foo = undefined;

                var patches = jsonpatch.generate(observer);
                expect(patches).toReallyEqual([{
                    op: 'remove',
                    path: '/foo'
                }]);
            });

            it('when new property is added, and set to `undefined`, nothing should be generated (undefined is JSON.stringified to no value)', function() {
                var obj = {
                    foo: "bar"
                };

                var observer = jsonpatch.observe(obj);
                obj.baz = undefined;

                var patches = jsonpatch.generate(observer);
                expect(patches).toReallyEqual([]);
            });

            it('when array element is set to `undefined`, should generate replace to `null` (undefined array elements are JSON.stringified to `null`)', function() {
                var obj = {
                    foo: [0, 1, 2]
                };

                var observer = jsonpatch.observe(obj);
                obj.foo[1] = undefined;

                var patches = jsonpatch.generate(observer);
                expect(patches).toReallyEqual([{
                    op: 'replace',
                    path: '/foo/1',
                    value: null
                }]);
            });

            it('when `undefined` property is set to something, should generate add (undefined is JSON.stringified to no value)', function() {
                var obj = {
                    foo: undefined
                };

                var observer = jsonpatch.observe(obj);
                obj.foo = "something";

                var patches = jsonpatch.generate(observer);
                expect(patches).toReallyEqual([{
                    op: 'add',
                    path: '/foo',
                    value: "something"
                }]);
            });
            it('when `undefined` array element is set to something, should generate replace (undefined array elements are JSON.stringified to `null`)', function() {
                var obj = {
                    foo: [0, undefined, 2]
                };

                var observer = jsonpatch.observe(obj);
                obj.foo[1] = 1;

                var patches = jsonpatch.generate(observer);
                expect(patches).toReallyEqual([{
                    op: 'replace',
                    path: '/foo/1',
                    value: 1
                }]);
            });
        });

        describe("undefined - JSON to JS extension", function() {

            describe("should generate empty patch, when", function() {

                it('when new property is set to `undefined`', function() {
                    var objFactory = function() {
                        return {
                            foo: "bar"
                        };
                    };

                    var objChanger = function(obj) {
                        obj.baz = undefined;
                    };

                    var genereatedPatches = getPatchesUsingGenerate(objFactory, objChanger);
                    var comparedPatches = getPatchesUsingCompare(objFactory, objChanger);

                    expect(genereatedPatches).toReallyEqual([]);
                    expect(genereatedPatches).toReallyEqual(comparedPatches);
                });

                it('when an `undefined` property is deleted', function() {
                    var objFactory = function() {
                        return {
                            foo: undefined
                        };
                    };

                    var objChanger = function(obj) {
                        delete obj.foo;
                    };

                    var genereatedPatches = getPatchesUsingGenerate(objFactory, objChanger);
                    var comparedPatches = getPatchesUsingCompare(objFactory, objChanger);

                    expect(genereatedPatches).toReallyEqual([]);
                    expect(genereatedPatches).toReallyEqual(comparedPatches);
                });
            });

            describe("should generate add, when", function() {

                it('`undefined` property is set to something', function() {
                    var objFactory = function() {
                        return {
                            foo: undefined
                        };
                    };

                    var objChanger = function(obj) {
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

            describe("should generate remove, when", function() {

                it('value is set to `undefined`', function() {
                    var objFactory = function() {
                        return {
                            foo: "bar"
                        };
                    };

                    var objChanger = function(obj) {
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

            describe("should generate replace, when", function() {

                it('array element is set to `undefined`', function() {
                    var objFactory = function() {
                        return {
                            foo: [0, 1, 2]
                        };
                    };

                    var objChanger = function(obj) {
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
                it('`undefined` array element is set to something', function() {
                    var objFactory = function() {
                        return {
                            foo: [0, undefined, 2]
                        };
                    };

                    var objChanger = function(obj) {
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

    describe("apply", function() {
        // https://tools.ietf.org/html/rfc6902#appendix-A.16
        it('should add an Array Value', function() {
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

    describe('callback', function() {
        it('should generate replace', function(done) {
            var patches;

            obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            jsonpatch.observe(obj, function(_patches) {
                patches = _patches;
                patchesChanged();
            });
            obj.firstName = "Joachim";
            obj.lastName = "Wester";
            obj.phoneNumbers[0].number = "123";
            obj.phoneNumbers[1].number = "456";

            trigger('keyup');

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
                expect(obj2).toReallyEqual(obj);
                done();
            }

        });

        it('should generate replace (double change, shallow object)', function(done) {
            var lastPatches, called = 0;

            obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            jsonpatch.observe(obj, function(patches) {
                called++;
                lastPatches = patches;
                patchesChanged(called);
            });
            obj.firstName = "Marcin";

            trigger('keyup');
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
                        trigger('keyup');
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

                        done();
                        break;

                }
            }
        });

        it('should generate replace (double change, deep object)', function(done) {
            var lastPatches, called = 0;

            obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            jsonpatch.observe(obj, function(patches) {
                called++;
                lastPatches = patches;
                patchesChanged(called);
            });
            obj.phoneNumbers[0].number = "123";

            trigger('keyup');

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
                        trigger('keyup');
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
                        done();
                        break;
                }
            }
        });

        it('generate should execute callback synchronously', function(done) {
            var lastPatches, called = 0,
                res;

            obj = {
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
                lastPatches = patches;
            });
            obj.phoneNumbers[0].number = "123";

            setTimeout(function() {
                expect(called).toReallyEqual(0);

                res = jsonpatch.generate(observer);
                expect(called).toReallyEqual(1);
                expect(lastPatches).toReallyEqual([{
                    op: 'replace',
                    path: '/phoneNumbers/0/number',
                    value: '123'
                }]);
                expect(lastPatches).toReallyEqual(res);

                res = jsonpatch.generate(observer);
                expect(called).toReallyEqual(1);
                expect(lastPatches).toReallyEqual([{
                    op: 'replace',
                    path: '/phoneNumbers/0/number',
                    value: '123'
                }]);
                expect(res).toReallyEqual([]);
                done();
            }, 100);
        });

        it('should unobserve then observe again', function(done) {
            var called = 0;

            obj = {
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

                trigger('keyup');

                setTimeout(function() {
                    expect(called).toReallyEqual(1);

                    observer = jsonpatch.observe(obj, function(patches) {
                        called++;
                    });

                    obj.firstName = 'Megan';
                    trigger('keyup');

                    setTimeout(function() {
                        expect(called).toReallyEqual(2);
                        done();
                    }, 20);
                }, 20);
            }, 20);
        });

        it('should unobserve then observe again (deep value)', function(done) {
            var called = 0;

            obj = {
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

            obj.phoneNumbers[1].number = '555';

            trigger('keyup');
            // ugly migration from Jasmine 1.x to > 2.0
            setTimeout(function() {
                expect(called).toReallyEqual(1);

                jsonpatch.unobserve(obj, observer);

                obj.phoneNumbers[1].number = '556';

                trigger('keyup');

                setTimeout(function() {
                    expect(called).toReallyEqual(1);

                    observer = jsonpatch.observe(obj, function(patches) {
                        called++;
                    });

                    obj.phoneNumbers[1].number = '557';

                    trigger('keyup');

                    setTimeout(function() {
                        expect(called).toReallyEqual(2);
                        done();
                    }, 20);
                }, 20);
            }, 20);
        });

        it('calling unobserve should deliver pending changes synchronously', function(done) {
            var lastPatches = '';

            obj = {
                firstName: "Albert",
                lastName: "Einstein",
                phoneNumbers: [{
                    number: "12345"
                }, {
                    number: "45353"
                }]
            };

            var observer = jsonpatch.observe(obj, function(patches) {
                lastPatches = patches;
            });

            obj.firstName = 'Malvin';

            jsonpatch.unobserve(obj, observer);

            expect(lastPatches[0].value).toBe('Malvin');

            obj.firstName = 'Jonathan';

            // ugly migration from Jasmine 1.x to > 2.0
            setTimeout(function() {
                expect(lastPatches[0].value).toBe('Malvin');
                done();
            }, 20);
        });

        it("should handle callbacks that calls observe() and unobserve() internally", function(done) {

            var obj = {
                foo: 'bar'
            };

            var observer;
            var callbackCalled, count = 0;
            var callback = jasmine.createSpy('callback', function() {
                jsonpatch.unobserve(obj, observer);

                jsonpatch.observe(obj, callback);
                callbackCalled(++count);
            }).and.callThrough();

            observer = jsonpatch.observe(obj, callback);

            expect(callback.calls.count()).toReallyEqual(0);

            obj.foo = 'bazz';

            trigger('keyup');

            // ugly migration from Jasmine 1.x to > 2.0
            function callbackCalled(time) {
                switch (time) {
                    case 1:
                        expect(callback.calls.count()).toReallyEqual(1);

                        obj.foo = 'bazinga';

                        trigger('keyup');
                        break;
                    case 2:
                        expect(callback.calls.count()).toReallyEqual(2);
                        done();
                        break;
                }
            }

        });

        it('should generate patch after `mouseup` event', function(done) {
            obj = {
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
            obj = {
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
            obj = {
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
        });

    });

    describe('compare', function() {
        it('should return an add for a property that does not exist in the first obj', function() {
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

        it('should return a remove for a property that does not exist in the second obj', function() {
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

        it('should return a replace for a property that exists in both', function() {
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

        it('should replace null with object', function() {
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

        it('should replace object with null', function() {
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
    });


    describe("Registering multiple observers with the same callback", function() {

        it("should register only one observer", function(done) {

            var obj = {
                foo: 'bar'
            };

            var callback = jasmine.createSpy('callback');

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
            var obj = {
                foo: 'bar'
            };

            var callback = jasmine.createSpy('callback');

            var observer1 = jsonpatch.observe(obj, callback);
            var observer2 = jsonpatch.observe(obj, callback);

            expect(observer1).toBe(observer2);


        });

        it("should return a different observer if callback has been unregistered and registered again", function() {
            var obj = {
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

            obj = {
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


    describe("compare", function() {
        it("should return patch difference between objects", function() {
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

        it("should not modify the source object", function() {
            var obj = {
                foo: 'bar'
            };
            jsonpatch.compare(obj, {});
            expect(obj.foo).toReallyEqual('bar');
        });
    });
});

// Benchmark performance test
if (typeof Benchmark !== 'undefined') {
    suite.add('generate operation', function() {
        obj = {
            firstName: "Albert",
            lastName: "Einstein",
            phoneNumbers: [{
                number: "12345"
            }, {
                number: "45353"
            }]
        };
        var observer = jsonpatch.observe(obj);

        obj.firstName = "Joachim";
        obj.lastName = "Wester";
        obj.phoneNumbers[0].number = "123";
        obj.phoneNumbers[1].number = "456";

        var patches = jsonpatch.generate(observer);
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
    });
    suite.add('compare operation', function() {
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
    });
}
