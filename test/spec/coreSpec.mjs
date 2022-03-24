import * as jsonpatch from '../../index.mjs';

describe('jsonpatch.getValueByPointer', function () {
    it('should retrieve values by JSON pointer from tree - deep object', function () {
        const obj = {
            person: { name: 'Marilyn' }
        };
        const name = jsonpatch.getValueByPointer(obj, '/person/name');
        expect(name).toEqual('Marilyn');
    });

    it('should retrieve values by JSON pointer from tree - deep array', function () {
        const obj = {
            people: [{ name: 'Marilyn' }, { name: 'Monroe' }]
        };
        const name = jsonpatch.getValueByPointer(obj, '/people/1/name');
        expect(name).toEqual('Monroe');
    });

    it('should retrieve values by JSON pointer from tree - root object', function () {
        const obj = {
            people: [{ name: 'Marilyn' }, { name: 'Monroe' }]
        };
        const retrievedObject = jsonpatch.getValueByPointer(obj, '');

        expect(retrievedObject).toEqual({
            people: [{ name: 'Marilyn' }, { name: 'Monroe' }]
        });
    });

    it('should retrieve values by JSON pointer from tree - root array', function () {
        const obj = [
            {
                people: [{ name: 'Marilyn' }, { name: 'Monroe' }]
            }
        ];
        const retrievedObject = jsonpatch.getValueByPointer(obj, '');

        expect(retrievedObject).toEqual([
            {
                people: [{ name: 'Marilyn' }, { name: 'Monroe' }]
            }
        ]);
    });
});
describe('jsonpatch.applyReducer - using with Array#reduce', function () {
    it('should work with Array.reduce on array of patches', function () {
        const obj = {
            hello: 'world'
        };
        const patch = [
            { op: 'replace', path: '/hello', value: 1 },
            { op: 'add', path: '/bye', value: { testing: 'isGood' } }
        ];
        const obj2 = patch.reduce(jsonpatch.applyReducer, obj);
        expect(obj2).toEqual({
            hello: 1,
            bye: { testing: 'isGood' }
        });
    });
});
describe('root replacement with applyOperation', function () {
    describe('_get operation', function () {
        it('should get root value', function () {
            const obj = [
                {
                    people: [{ name: 'Marilyn' }, { name: 'Monroe' }]
                }
            ];

            const patch = { op: '_get', path: '' };

            jsonpatch.applyOperation(obj, patch);

            expect(patch.value).toEqual([
                {
                    people: [{ name: 'Marilyn' }, { name: 'Monroe' }]
                }
            ]);
        });
        it('should get deep value', function () {
            const obj = {
                people: [{ name: 'Marilyn' }, { name: 'Monroe' }]
            };

            const patch = { op: '_get', path: '/people/1/name' };

            jsonpatch.applyOperation(obj, patch);

            expect(patch.value).toEqual('Monroe');
        });
    });
    describe('add operation', function () {
        it('should `add` an object (on a json document of type object)) - in place', function () {
            const obj = {
                hello: 'world'
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '',
                value: {
                    hello: 'universe'
                }
            }).newDocument;

            expect(newObj).toEqual({
                hello: 'universe'
            });
        });
        it('should `add` an object (on a json document of type object) - and return', function () {
            const obj = {
                hello: 'world'
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '',
                value: {
                    hello: 'universe'
                }
            }).newDocument;
            expect(newObj).toEqual({
                hello: 'universe'
            });
        });
        it('should `add` an object (on a json document of type array) - and return', function () {
            const obj = [
                {
                    hello: 'world'
                }
            ];
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '',
                value: {
                    hello: 'universe'
                }
            }).newDocument;
            expect(newObj).toEqual({
                hello: 'universe'
            });
        });
        it('should `add` an array (on a json document of type array) - in place', function () {
            const obj = [
                {
                    hello: 'world'
                }
            ];
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '',
                value: [
                    {
                        hello: 'universe'
                    }
                ]
            }).newDocument;
            expect(newObj).toEqual([
                {
                    hello: 'universe'
                }
            ]);
        });
        it('should `add` an array (on a json document of type array) - and return', function () {
            const obj = [
                {
                    hello: 'world'
                }
            ];
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '',
                value: [
                    {
                        hello: 'universe'
                    }
                ]
            }).newDocument;
            expect(newObj).toEqual([
                {
                    hello: 'universe'
                }
            ]);
        });
        it('should `add` an array prop', function () {
            const obj = [];

            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '/prop',
                value: 'arrayProp'
            }).newDocument;

            expect(newObj.prop).toEqual('arrayProp');
        });
        it('should `replace` an array prop', function () {
            const obj = [];
            obj.prop = 'oldArrayProp';

            const newObj = jsonpatch.applyOperation(obj, {
                op: 'replace',
                path: '/prop',
                value: 'arrayProp'
            }).newDocument;

            expect(newObj.prop).toEqual('arrayProp');
        });
        it('should `add` an array (on a json document of type object) - and return', function () {
            const obj = {
                hello: 'world'
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '',
                value: [
                    {
                        hello: 'universe'
                    }
                ]
            }).newDocument;
            expect(newObj).toEqual([
                {
                    hello: 'universe'
                }
            ]);
        });
        it('should `add` a primitive (on a json document of type object) - and return', function () {
            const obj = {
                hello: 'world'
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '',
                value: 1
            }).newDocument;
            expect(newObj).toEqual(1);
        });
        it('should `add` with a primitive (on a json document of type array) - and return', function () {
            const obj = [
                {
                    hello: 'world'
                }
            ];
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '',
                value: 1
            }).newDocument;
            expect(newObj).toEqual(1);
        });
    });
    describe('replace operation', function () {
        it('should `replace` with an object (on a json document of type object)', function () {
            const obj = {
                hello: 'world'
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'replace',
                path: '',
                value: {
                    hello: 'universe'
                }
            }).newDocument;
            expect(newObj).toEqual({
                hello: 'universe'
            });
        });
        it('should `replace` with an object (on a json document of type array)', function () {
            const obj = [
                {
                    hello: 'world'
                }
            ];
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'replace',
                path: '',
                value: {
                    hello: 'universe'
                }
            }).newDocument;
            expect(newObj).toEqual({
                hello: 'universe'
            });
        });
        it('should `replace` with an array (on a json document of type array)', function () {
            const obj = [
                {
                    hello: 'world'
                }
            ];
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'replace',
                path: '',
                value: [
                    {
                        hello: 'universe'
                    }
                ]
            }).newDocument;
            expect(newObj).toEqual([
                {
                    hello: 'universe'
                }
            ]);
        });
        it('should `replace` with an array (on a json document of type object)', function () {
            const obj = {
                hello: 'world'
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'replace',
                path: '',
                value: [
                    {
                        hello: 'universe'
                    }
                ]
            }).newDocument;
            expect(newObj).toEqual([
                {
                    hello: 'universe'
                }
            ]);
        });
        it('should `replace` with a primitive (on a json document of type object)', function () {
            const obj = {
                hello: 'world'
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'add',
                path: '',
                value: 1
            }).newDocument;
            expect(newObj).toEqual(1);
        });
        it('should `replace` with a primitive (on a json document of type array)', function () {
            const obj = [
                {
                    hello: 'world'
                }
            ];
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'replace',
                path: '',
                value: 1
            }).newDocument;
            expect(newObj).toEqual(1);
        });
    });
    describe('remove operation', function () {
        it('should `remove` root (on a json document of type array)', function () {
            const obj = [
                {
                    hello: 'world'
                }
            ];
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'remove',
                path: ''
            }).newDocument;
            expect(newObj).toEqual(null);
        });
        it('should `remove` root (on a json document of type object)', function () {
            const obj = {
                hello: 'world'
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'remove',
                path: ''
            }).newDocument;
            expect(newObj).toEqual(null);
        });
    });

    describe('move operation', function () {
        it('should `move` a child of type object to root (on a json document of type object)', function () {
            const obj = {
                child: { name: 'Charles' }
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'move',
                from: '/child',
                path: ''
            }).newDocument;
            expect(newObj).toEqual({ name: 'Charles' });
        });
        it('should `move` a child of type object to root (on a json document of type array)', function () {
            const obj = {
                child: [{ name: 'Charles' }]
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'move',
                from: '/child/0',
                path: ''
            }).newDocument;
            expect(newObj).toEqual({ name: 'Charles' });
        });
        it('should `move` a child of type array to root (on a json document of type object)', function () {
            const obj = {
                child: [{ name: 'Charles' }]
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'move',
                from: '/child',
                path: ''
            }).newDocument;
            expect(newObj).toEqual([{ name: 'Charles' }]);
        });
    });
    describe('copy operation', function () {
        it('should `copy` a child of type object to root (on a json document of type object) - and return', function () {
            const obj = {
                child: { name: 'Charles' }
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'copy',
                from: '/child',
                path: ''
            }).newDocument;
            expect(newObj).toEqual({ name: 'Charles' });
        });
        it('should `copy` a child of type object to root (on a json document of type array) - and return', function () {
            const obj = {
                child: [{ name: 'Charles' }]
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'copy',
                from: '/child/0',
                path: ''
            }).newDocument;
            expect(newObj).toEqual({ name: 'Charles' });
        });
        it('should `copy` a child of type array to root (on a json document of type object) - and return', function () {
            const obj = {
                child: [{ name: 'Charles' }]
            };
            const newObj = jsonpatch.applyOperation(obj, {
                op: 'copy',
                from: '/child',
                path: ''
            }).newDocument;
            expect(newObj).toEqual([{ name: 'Charles' }]);
        });
    });
    describe('test operation', function () {
        it('should `test` against root (on a json document of type object) - and return true', function () {
            const obj = {
                hello: 'world'
            };
            const result = jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '',
                value: {
                    hello: 'world'
                }
            }).newDocument;
            expect(result).toEqual(obj);
        });
        it('should `test` against root (on a json document of type object) - and return false', function () {
            const obj = {
                hello: 'world'
            };
            expect(() =>
                jsonpatch.applyOperation(obj, {
                    op: 'test',
                    path: '',
                    value: 1
                })
            ).toThrow();
        });
        it('should `test` against root (on a json document of type array) - and return false', function () {
            const obj = [
                {
                    hello: 'world'
                }
            ];

            expect(() =>
                jsonpatch.applyOperation(obj, {
                    op: 'test',
                    path: '',
                    value: 1
                })
            ).toThrow();
        });
    });
});
/* this is just a copy-paste of original specs, but with using applyOperation, to test for non-root patches */
describe('core - using applyOperation', function () {
    it("shouldn't touch original tree", function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        const newObj = jsonpatch.applyOperation(
            obj,
            {
                op: 'add',
                path: '/bar',
                value: [1, 2, 3, 4]
            },
            false,
            false
        ).newDocument;

        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        });
    });
    it('should apply add', function () {
        let obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        let newObj = jsonpatch.applyOperation(obj, {
            op: 'add',
            path: '/bar',
            value: [1, 2, 3, 4]
        }).newDocument;
        expect(newObj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: [1, 2, 3, 4]
        });
        newObj = jsonpatch.applyOperation(newObj, {
            op: 'add',
            path: '/baz/0/foo',
            value: 'world'
        }).newDocument;
        expect(newObj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello',
                    foo: 'world'
                }
            ],
            bar: [1, 2, 3, 4]
        });

        obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        newObj = jsonpatch.applyOperation(obj, {
            op: 'add',
            path: '/bar',
            value: true
        }).newDocument;
        expect(newObj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: true
        });

        obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        newObj = jsonpatch.applyOperation(obj, {
            op: 'add',
            path: '/bar',
            value: false
        }).newDocument;
        expect(newObj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: false
        });

        obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        newObj = jsonpatch.applyOperation(obj, {
            op: 'add',
            path: '/bar',
            value: null
        }).newDocument;
        expect(newObj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: null
        });
    });

    it('should apply add on root', function () {
        const obj = {
            hello: 'world'
        };
        const newObj = jsonpatch.applyOperation(obj, {
            op: 'add',
            path: '',
            value: {
                hello: 'universe'
            }
        }).newDocument;
        expect(newObj).toEqual({
            hello: 'universe'
        });
    });

    it('should apply remove', function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: [1, 2, 3, 4]
        };

        let newObj = jsonpatch.applyOperation(obj, {
            op: 'remove',
            path: '/bar'
        }).newDocument;
        expect(newObj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        });
        newObj = jsonpatch.applyOperation(newObj, {
            op: 'remove',
            path: '/baz/0/qux'
        }).newDocument;
        expect(newObj).toEqual({
            foo: 1,
            baz: [{}]
        });
    });
    it('should apply replace', function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        let newObj = jsonpatch.applyOperation(obj, {
            op: 'replace',
            path: '/foo',
            value: [1, 2, 3, 4]
        }).newDocument;
        expect(newObj).toEqual({
            foo: [1, 2, 3, 4],
            baz: [
                {
                    qux: 'hello'
                }
            ]
        });
        newObj = jsonpatch.applyOperation(newObj, {
            op: 'replace',
            path: '/baz/0/qux',
            value: 'world'
        }).newDocument;
        expect(newObj).toEqual({
            foo: [1, 2, 3, 4],
            baz: [
                {
                    qux: 'world'
                }
            ]
        });
    });
    it('should apply replace on root', function () {
        const obj = {
            hello: 'world'
        };
        const newObj = jsonpatch.applyOperation(obj, {
            op: 'replace',
            path: '',
            value: {
                hello: 'universe'
            }
        }).newDocument;

        expect(newObj).toEqual({
            hello: 'universe'
        });
    });
    it('should apply test', function () {
        const obj = {
            foo: {
                bar: [1, 2, 5, 4]
            },
            bar: {
                a: 'a',
                b: 42,
                c: null,
                d: true
            }
        };
        expect(
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/foo',
                value: {
                    bar: [1, 2, 5, 4]
                }
            }).newDocument
        ).toEqual(obj);

        expect(() =>
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/foo',
                value: 1
            })
        ).toThrow();

        expect(
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/bar',
                value: {
                    d: true,
                    b: 42,
                    c: null,
                    a: 'a'
                }
            }).newDocument
        ).toEqual(obj);
        expect(
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/bar',
                value: obj.bar
            }).newDocument
        ).toEqual(obj);
        expect(
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/bar/a',
                value: 'a'
            }).newDocument
        ).toEqual(obj);
        expect(
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/bar/b',
                value: 42
            }).newDocument
        ).toEqual(obj);
        expect(
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/bar/c',
                value: null
            }).newDocument
        ).toEqual(obj);
        expect(
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/bar/d',
                value: true
            }).newDocument
        ).toEqual(obj);
        expect(() =>
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/bar/d',
                value: false
            })
        ).toThrow();
        expect(() =>
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '/bar',
                value: {
                    d: true,
                    b: 42,
                    c: null,
                    a: 'a',
                    foo: 'bar'
                }
            })
        ).toThrow();
    });

    it('should apply test on root', function () {
        const obj = {
            hello: 'world'
        };
        expect(
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '',
                value: {
                    hello: 'world'
                }
            }).newDocument
        ).toEqual(obj);
        expect(() =>
            jsonpatch.applyOperation(obj, {
                op: 'test',
                path: '',
                value: 1
            })
        ).toThrow();
    });

    it('should apply move', function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };

        let newObj = jsonpatch.applyOperation(obj, {
            op: 'move',
            from: '/foo',
            path: '/bar'
        }).newDocument;
        expect(newObj).toEqual({
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: 1
        });

        newObj = jsonpatch.applyOperation(newObj, {
            op: 'move',
            from: '/baz/0/qux',
            path: '/baz/1'
        }).newDocument;

        expect(newObj).toEqual({
            baz: [{}, 'hello'],
            bar: 1
        });
    });

    it('should apply move on root', function () {
        //investigate if this test is right (https://github.com/Starcounter-Jack/JSON-Patch/issues/40)
        const obj = {
            hello: 'world',
            location: {
                city: 'Vancouver'
            }
        };
        const newObj = jsonpatch.applyOperation(obj, {
            op: 'move',
            from: '/location',
            path: ''
        }).newDocument;

        expect(newObj).toEqual({
            city: 'Vancouver'
        });
    });

    it('should apply copy', function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };

        let newObj = jsonpatch.applyOperation(obj, {
            op: 'copy',
            from: '/foo',
            path: '/bar'
        }).newDocument;

        expect(newObj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: 1
        });

        newObj = jsonpatch.applyOperation(newObj, {
            op: 'copy',
            from: '/baz/0/qux',
            path: '/baz/1'
        }).newDocument;

        expect(newObj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                },
                'hello'
            ],
            bar: 1
        });
    });

    it('should apply copy on root', function () {
        const obj = {
            hello: 'world',
            location: {
                city: 'Vancouver'
            }
        };
        const newObj = jsonpatch.applyOperation(obj, {
            op: 'copy',
            from: '/location',
            path: ''
        }).newDocument;
        expect(newObj).toEqual({
            city: 'Vancouver'
        });
    });
});

describe('core', function () {
    it("shouldn't touch original tree", function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        const newObj = jsonpatch.applyPatch(
            obj,
            [
                {
                    op: 'add',
                    path: '/bar',
                    value: [1, 2, 3, 4]
                }
            ],
            false,
            false
        ).newDocument;

        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        });
    });
    it('should apply add', function () {
        let obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        jsonpatch.applyPatch(obj, [
            {
                op: 'add',
                path: '/bar',
                value: [1, 2, 3, 4]
            }
        ]);
        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: [1, 2, 3, 4]
        });

        jsonpatch.applyPatch(obj, [
            {
                op: 'add',
                path: '/baz/0/foo',
                value: 'world'
            }
        ]);
        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello',
                    foo: 'world'
                }
            ],
            bar: [1, 2, 3, 4]
        });
        obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        jsonpatch.applyPatch(obj, [
            {
                op: 'add',
                path: '/bar',
                value: true
            }
        ]);
        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: true
        });

        obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        jsonpatch.applyPatch(obj, [
            {
                op: 'add',
                path: '/bar',
                value: false
            }
        ]);
        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: false
        });

        obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };
        jsonpatch.applyPatch(obj, [
            {
                op: 'add',
                path: '/bar',
                value: null
            }
        ]);
        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: null
        });
    });

    it('should apply add on root', function () {
        const obj = {
            hello: 'world'
        };
        const newObj = jsonpatch.applyPatch(obj, [
            {
                op: 'add',
                path: '',
                value: {
                    hello: 'universe'
                }
            }
        ])[0].newDocument;

        expect(newObj).toEqual({
            hello: 'universe'
        });
    });

    it('should apply remove', function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: [1, 2, 3, 4]
        };
        //jsonpatch.listenTo(obj,[]);

        jsonpatch.applyPatch(obj, [
            {
                op: 'remove',
                path: '/bar'
            }
        ]);
        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        });

        jsonpatch.applyPatch(obj, [
            {
                op: 'remove',
                path: '/baz/0/qux'
            }
        ]);
        expect(obj).toEqual({
            foo: 1,
            baz: [{}]
        });
    });

    it('should apply replace', function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };

        jsonpatch.applyPatch(obj, [
            {
                op: 'replace',
                path: '/foo',
                value: [1, 2, 3, 4]
            }
        ]);
        expect(obj).toEqual({
            foo: [1, 2, 3, 4],
            baz: [
                {
                    qux: 'hello'
                }
            ]
        });

        jsonpatch.applyPatch(obj, [
            {
                op: 'replace',
                path: '/baz/0/qux',
                value: 'world'
            }
        ]);
        expect(obj).toEqual({
            foo: [1, 2, 3, 4],
            baz: [
                {
                    qux: 'world'
                }
            ]
        });
    });

    it('should apply replace on root', function () {
        const obj = {
            hello: 'world'
        };
        const newObject = jsonpatch.applyPatch(obj, [
            {
                op: 'replace',
                path: '',
                value: {
                    hello: 'universe'
                }
            }
        ])[0].newDocument;

        expect(newObject).toEqual({
            hello: 'universe'
        });
    });

    it('should apply test', function () {
        const obj = {
            foo: {
                bar: [1, 2, 5, 4]
            },
            bar: {
                a: 'a',
                b: 42,
                c: null,
                d: true
            }
        };
        expect(
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/foo',
                    value: {
                        bar: [1, 2, 5, 4]
                    }
                }
            ])[0].test
        ).toBe(true);

        expect(() =>
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/foo',
                    value: [1, 2]
                }
            ])
        ).toThrow();

        expect(
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/bar',
                    value: {
                        d: true,
                        b: 42,
                        c: null,
                        a: 'a'
                    }
                }
            ])[0].test
        ).toBe(true);

        expect(
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/bar',
                    value: obj.bar
                }
            ])[0].test
        ).toBe(true);
        expect(
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/bar/a',
                    value: 'a'
                }
            ])[0].test
        ).toBe(true);
        expect(
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/bar/b',
                    value: 42
                }
            ])[0].test
        ).toBe(true);
        expect(
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/bar/c',
                    value: null
                }
            ])[0].test
        ).toBe(true);
        expect(
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/bar/d',
                    value: true
                }
            ])[0].test
        ).toBe(true);
        expect(() =>
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/bar/d',
                    value: false
                }
            ])
        ).toThrow();
        expect(() =>
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '/bar',
                    value: {
                        d: true,
                        b: 42,
                        c: null,
                        a: 'a',
                        foo: 'bar'
                    }
                }
            ])
        ).toThrow();
    });

    it('should apply test on root', function () {
        const obj = {
            hello: 'world'
        };
        expect(
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '',
                    value: {
                        hello: 'world'
                    }
                }
            ])[0].test
        ).toBe(true);
        expect(() =>
            jsonpatch.applyPatch(obj, [
                {
                    op: 'test',
                    path: '',
                    value: {
                        hello: 'universe'
                    }
                }
            ])
        ).toThrow();
    });

    it('should apply move', function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };

        jsonpatch.applyPatch(obj, [
            {
                op: 'move',
                from: '/foo',
                path: '/bar'
            }
        ]);
        expect(obj).toEqual({
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: 1
        });

        jsonpatch.applyPatch(obj, [
            {
                op: 'move',
                from: '/baz/0/qux',
                path: '/baz/1'
            }
        ]);
        expect(obj).toEqual({
            baz: [{}, 'hello'],
            bar: 1
        });
    });

    it('should apply move on root', function () {
        //investigate if this test is right (https://github.com/Starcounter-Jack/JSON-Patch/issues/40)
        const obj = {
            hello: 'world',
            location: {
                city: 'Vancouver'
            }
        };
        const newObj = jsonpatch.applyPatch(obj, [
            {
                op: 'move',
                from: '/location',
                path: ''
            }
        ])[0].newDocument;

        expect(newObj).toEqual({
            city: 'Vancouver'
        });
    });

    it('should apply copy', function () {
        const obj = {
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ]
        };

        jsonpatch.applyPatch(obj, [
            {
                op: 'copy',
                from: '/foo',
                path: '/bar'
            }
        ]);
        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                }
            ],
            bar: 1
        });

        jsonpatch.applyPatch(obj, [
            {
                op: 'copy',
                from: '/baz/0/qux',
                path: '/baz/1'
            }
        ]);
        expect(obj).toEqual({
            foo: 1,
            baz: [
                {
                    qux: 'hello'
                },
                'hello'
            ],
            bar: 1
        });
    });

    it('should apply copy on root', function () {
        const obj = {
            hello: 'world',
            location: {
                city: 'Vancouver'
            }
        };
        const newObj = jsonpatch.applyPatch(obj, [
            {
                op: 'copy',
                from: '/location',
                path: ''
            }
        ])[0].newDocument;

        expect(newObj).toEqual({
            city: 'Vancouver'
        });
    });

    it('should apply copy, without leaving cross-reference between nodes', function () {
        const obj = {};
        const patchset = [
            { op: 'add', path: '/foo', value: [] },
            { op: 'add', path: '/foo/-', value: 1 },
            { op: 'copy', from: '/foo', path: '/bar' },
            { op: 'add', path: '/bar/-', value: 2 }
        ];

        jsonpatch.applyPatch(obj, patchset);

        expect(obj).toEqual({
            foo: [1],
            bar: [1, 2]
        });
    });

    it('should use value object as a reference', function () {
        const obj1 = {};
        const patch = [{ op: 'add', path: '/foo', value: [] }];

        jsonpatch.applyPatch(obj1, patch, false);

        expect(obj1.foo).toBe(patch[0].value);
    });

    describe('returning removed elements >', function () {
        let obj;
        beforeEach(function () {
            obj = {
                name: 'jack',
                languages: ['c#', 'haskell', 'python'],
                hobby: 'music'
            };
        });

        it('return removed element when removing from object', function () {
            const result = jsonpatch.applyPatch(obj, [
                {
                    op: 'remove',
                    path: '/name'
                }
            ]);
            expect(result[0].removed).toEqual('jack');
        });
        it('return removed element when replacing in object', function () {
            const result = jsonpatch.applyPatch(obj, [
                {
                    op: 'replace',
                    path: '/name',
                    value: 'john'
                }
            ]);
            expect(result[0].removed).toEqual('jack');
        });
        it('return removed element when moving in object', function () {
            const result = jsonpatch.applyPatch(obj, [
                {
                    op: 'move',
                    from: '/name',
                    path: '/hobby'
                }
            ]);
            expect(result[0].removed).toEqual('music');
        });

        it('return removed element when removing from array', function () {
            const result = jsonpatch.applyPatch(obj, [
                {
                    op: 'remove',
                    path: '/languages/1'
                }
            ]);
            expect(result[0].removed).toEqual('haskell');
        });
        it('return removed element when replacing in array', function () {
            const result = jsonpatch.applyPatch(obj, [
                {
                    op: 'replace',
                    path: '/languages/1',
                    value: 'erlang'
                }
            ]);
            expect(result[0].removed).toEqual('haskell');
        });
        it('return removed element when moving in array', function () {
            const result = jsonpatch.applyPatch(obj, [
                {
                    op: 'move',
                    from: '/hobby',
                    path: '/languages/1'
                }
            ]);
            expect(result[0].removed).toEqual('haskell');
        });
        it('return root when removing root', function () {
            const result = jsonpatch.applyPatch(obj, [
                {
                    op: 'remove',
                    path: ''
                }
            ]);
            expect(result[0].removed).toEqual({
                name: 'jack',
                languages: ['c#', 'haskell', 'python'],
                hobby: 'music'
            });
        });
        it('return root when replacing root', function () {
            const result = jsonpatch.applyPatch(obj, [
                {
                    op: 'replace',
                    path: '',
                    value: {
                        newRoot: 'yes'
                    }
                }
            ]);
            expect(result[0].removed).toEqual({
                name: 'jack',
                languages: ['c#', 'haskell', 'python'],
                hobby: 'music'
            });
        });
        it('return root when moving to root', function () {
            const result = jsonpatch.applyPatch(obj, [
                {
                    op: 'move',
                    from: '/languages',
                    path: ''
                }
            ]);
            expect(result[0].removed).toEqual({
                name: 'jack',
                languages: ['c#', 'haskell', 'python'],
                hobby: 'music'
            });
        });
    });
});

describe('undefined - JS to JSON projection / JSON to JS extension', function () {
    describe('jsonpatch should apply', function () {
        it('add for properties already set to `undefined` in target JS document', function () {
            const obj = {
                hello: 'world',
                nothing: undefined
            };
            jsonpatch.applyPatch(obj, [
                {
                    op: 'add',
                    path: '/nothing',
                    value: 'defined'
                }
            ]);

            expect(obj).toEqual({
                hello: 'world',
                nothing: 'defined'
            });
        });

        it('add for properties with value set to `undefined` (extension)', function () {
            const obj = {
                hello: 'world'
            };
            jsonpatch.applyPatch(obj, [
                {
                    op: 'add',
                    path: '/nothing',
                    value: undefined
                }
            ]);

            expect(obj).toEqual({
                hello: 'world',
                nothing: undefined
            });
        });

        it('remove on element already set to `undefined`, and remove it completely', function () {
            const obj = {
                foo: 1,
                not: undefined
            };

            jsonpatch.applyPatch(obj, [
                {
                    op: 'remove',
                    path: '/not'
                }
            ]);
            expect(obj).toEqual({
                foo: 1
            });
        });
        it('remove on array element set to `undefined`', function () {
            const obj = {
                foo: 1,
                bar: [0, 1, undefined, 3]
            };

            jsonpatch.applyPatch(obj, [
                {
                    op: 'remove',
                    path: '/bar/2'
                }
            ]);
            expect(obj).toEqual({
                foo: 1,
                bar: [0, 1, 3]
            });
        });

        it('replace on element set to `undefined`', function () {
            const obj = {
                foo: 1,
                not: undefined
            };

            jsonpatch.applyPatch(obj, [
                {
                    op: 'replace',
                    path: '/not',
                    value: 'defined'
                }
            ]);
            expect(obj).toEqual({
                foo: 1,
                not: 'defined'
            });
        });
        it('replace on array element set to `undefined`', function () {
            const obj = {
                foo: 1,
                bar: [0, 1, undefined, 3]
            };

            jsonpatch.applyPatch(obj, [
                {
                    op: 'replace',
                    path: '/bar/2',
                    value: 'defined'
                }
            ]);
            expect(obj).toEqual({
                foo: 1,
                bar: [0, 1, 'defined', 3]
            });
        });
        it('replace element with `undefined` (extension)', function () {
            const obj = {
                foo: 1
            };

            jsonpatch.applyPatch(obj, [
                {
                    op: 'replace',
                    path: '/foo',
                    value: undefined
                }
            ]);
            expect(obj).toEqual({
                foo: undefined
            });
        });
        it('replace array element with `undefined` (extension)', function () {
            const obj = {
                foo: 1,
                bar: [0, 1, 2, 3]
            };

            jsonpatch.applyPatch(obj, [
                {
                    op: 'replace',
                    path: '/bar/2',
                    value: undefined
                }
            ]);
            expect(obj).toEqual({
                foo: 1,
                bar: [0, 1, undefined, 3]
            });
        });
        it('test on element set to `undefined`', function () {
            const obj = {
                foo: 1,
                not: undefined
            };
            expect(() =>
                jsonpatch.applyPatch(obj, [
                    {
                        op: 'test',
                        path: '/not',
                        value: 'defined'
                    }
                ])
            ).toThrow();
            expect(
                jsonpatch.applyPatch(obj, [
                    {
                        op: 'test',
                        path: '/not',
                        value: undefined
                    }
                ])[0].test
            ).toBe(true);
        });
        it('test on array element set to `undefined`', function () {
            const obj = {
                foo: 1,
                bar: [0, 1, undefined, 3]
            };
            expect(() =>
                jsonpatch.applyPatch(obj, [
                    {
                        op: 'test',
                        path: '/bar/2',
                        value: 'defined'
                    }
                ])
            ).toThrow();
            expect(() =>
                jsonpatch.applyPatch(obj, [
                    {
                        op: 'test',
                        path: '/bar/2',
                        value: null
                    }
                ])
            ).toThrow();
            expect(
                jsonpatch.applyPatch(obj, [
                    {
                        op: 'test',
                        path: '/bar/2',
                        value: undefined
                    }
                ])[0].test
            ).toBe(true);
        });

        it('move of `undefined`', function () {
            const obj = {
                foo: undefined,
                baz: 'defined'
            };

            jsonpatch.applyPatch(obj, [
                {
                    op: 'move',
                    from: '/foo',
                    path: '/bar'
                }
            ]);
            expect(obj).toEqual({
                baz: 'defined',
                bar: undefined
            });

            jsonpatch.applyPatch(obj, [
                {
                    op: 'move',
                    from: '/bar',
                    path: '/baz'
                }
            ]);
            expect(obj).toEqual({
                baz: undefined
            });
        });

        it('copy of `undefined` as `null` (like `JSON.stringify` does)', function () {
            const obj = {
                foo: undefined,
                baz: 'defined'
            };
            jsonpatch.applyPatch(obj, [
                {
                    op: 'copy',
                    from: '/foo',
                    path: '/bar'
                }
            ]);
            expect(obj).toEqual({
                foo: undefined,
                baz: 'defined',
                bar: null
            });

            jsonpatch.applyPatch(obj, [
                {
                    op: 'copy',
                    from: '/bar',
                    path: '/baz'
                }
            ]);
            expect(obj).toEqual({
                foo: undefined,
                baz: null,
                bar: null
            });
        });

        it(`should allow __proto__ modifications when the banPrototypeModifications flag is set`, function () {
            function SomeClass() {
                this.foo = 'bar';
            }

            let doc = new SomeClass();
            let otherDoc = new SomeClass();

            const patch = [
                { op: 'replace', path: `/__proto__/x`, value: 'polluted' }
            ];

            jsonpatch.applyPatch(doc, patch, false, true, false);

            expect(otherDoc.x).toEqual('polluted');
        });

        it(`should not allow __proto__ modifications without unsetting the banPrototypeModifications flag and should throw an error`, function () {
            const expectedErrorMessage =
                'JSON-Patch: modifying `__proto__` or `constructor/prototype` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README';
            function SomeClass() {
                this.foo = 'bar';
            }

            let doc = new SomeClass();
            let otherDoc = new SomeClass();

            const patch = [
                { op: 'replace', path: `/__proto__/x`, value: 'polluted' }
            ];

            expect(() => jsonpatch.applyPatch(doc, patch)).toThrow(new TypeError(expectedErrorMessage));

            expect(otherDoc.x).toEqual(undefined);
            expect(doc.x).toEqual(undefined);

            let arr = [];
            expect(() => jsonpatch.applyPatch(arr, patch)).toThrow(new TypeError(expectedErrorMessage));
            expect(arr.x).toEqual(undefined);
        });
    });
});
