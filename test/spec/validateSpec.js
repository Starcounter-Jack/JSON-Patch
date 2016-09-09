describe("validate", function() {
    it('should return an empty array if the patch is valid', function() {
        var patch = [{
            "op": "test",
            "path": "/a/b/c",
            "value": "foo"
        }, {
            "op": "remove",
            "path": "/a/b/c"
        }, {
            "op": "add",
            "path": "/a/b/c",
            "value": ["foo", "bar"]
        }, {
            "op": "replace",
            "path": "/a/b/c",
            "value": 42
        }, {
            "op": "move",
            "from": "/a/b/c",
            "path": "/a/b/d"
        }, {
            "op": "copy",
            "from": "/a/b/d",
            "path": "/a/b/e"
        }];
        var error = jsonpatch.validate(patch);
        expect(error).toBeUndefined();
    });

    it('should return an error if the patch is not an array', function() {
        var error = jsonpatch.validate({});
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('SEQUENCE_NOT_AN_ARRAY');
        expect(error.message).toBe('Patch sequence must be an array');
    });

    it('should return an empty array if the operation is a valid object', function() {
        var error = jsonpatch.validate([{
            op: 'add',
            value: 'foo',
            path: '/bar'
        }]);
        expect(error).toBeUndefined();
    });

    it('should return an error if the operation is null', function() {
        var error = jsonpatch.validate([null]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_NOT_AN_OBJECT');
    });

    it('should return an error which is instance of Error and jsonpatch.JsonPatchError', function() {
        var error = jsonpatch.validate({});
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error instanceof Error).toBe(true);
        expect(error.name).toBe('SEQUENCE_NOT_AN_ARRAY');
    });

    it('should return an error that contains the patch and the patched object', function() {
        var tree = {
            name: "Elvis",
            cars: []
        };
        var sequence = [{
            "op": "remove",
            "path": "/name/first"
        }];
        var error = jsonpatch.validate(sequence, tree);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.operation).toBe(sequence[0]);
        expect(JSON.stringify(error.tree)).toBe(JSON.stringify(tree));
        expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
    });

    it('should return an error if the operation is undefined', function() {
        var error = jsonpatch.validate([undefined]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_NOT_AN_OBJECT');
    });

    it('should return an error if the operation is an array', function() {
        var error = jsonpatch.validate([
            []
        ]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_NOT_AN_OBJECT');
    });

    it('should return an error if the operation "op" property is not a string', function() {
        var error = jsonpatch.validate([{
            "path": "/a/b/c"
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_OP_INVALID');
    });

    it('should return an error if the operation "path" property is not a string', function() {
        var error = jsonpatch.validate([{
            "op": "remove",
            "value": "foo"
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_PATH_INVALID');
    });

    it('should return an error if an "add" operation is missing "value" property', function() {
        var error = jsonpatch.validate([{
            "op": "add",
            "path": "/a/b/c"
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
    });

    it('should return an error if an "add" operation "value" property is "undefined"', function() {
        var error = jsonpatch.validate([{
            "op": "add",
            "path": "/a/b/c",
            "value": undefined
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
    });

    it('should return an error if a "replace" operation is missing "value" property', function() {
        var error = jsonpatch.validate([{
            "op": "replace",
            "path": "/a/b/c"
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
    });

    it('should return an error if a "replace" operation "value" property is "undefined"', function() {
        var error = jsonpatch.validate([{
            "op": "replace",
            "path": "/a/b/c",
            "value": undefined
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
    });

    it('should return an error if a "test" operation is missing "value" property', function() {
        var error = jsonpatch.validate([{
            "op": "test",
            "path": "/a/b/c"
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
    });

    it('should return an error if a "test" operation "value" property is "undefined"', function() {
        var error = jsonpatch.validate([{
            "op": "test",
            "path": "/a/b/c",
            "value": undefined
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
    });

    it('should return an error if an "add" operation "value" contains "undefined"', function() {
        var error = jsonpatch.validate([{
            "op": "add",
            "path": "/a/b/c",
            "value": {
                foo: undefined
            }
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED');
    });

    it('should return an error if a "replace" operation "value" contains "undefined"', function() {
        var error = jsonpatch.validate([{
            "op": "replace",
            "path": "/a/b/c",
            "value": {
                foos: [undefined]
            }
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED');
    });

    it('should return an error if a "test" operation "value" contains "undefined"', function() {
        var error = jsonpatch.validate([{
            "op": "test",
            "path": "/a/b/c",
            "value": {
                foo: {
                    bars: [undefined]
                }
            }
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED');
    });

    it('should return an error if a "move" operation is missing "from" property', function() {
        var error = jsonpatch.validate([{
            "op": "move",
            "path": "/a/b/c"
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_FROM_REQUIRED');
    });

    it('should return an error if a "copy" operation is missing "from" property', function() {
        var error = jsonpatch.validate([{
            "op": "copy",
            "path": "/a/b/c"
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_FROM_REQUIRED');
    });

    it('should return an error if the "op" property is invalid', function() {
        var error = jsonpatch.validate([{
            "op": "foobar",
            "path": "/a/b/c"
        }]);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_OP_INVALID');
    });

    it('should return error replacing an unexisting path', function() {
        var sequence, error, tree = {
            "": "empty string is a valid key",
            name: "Elvis",
            cars: [{
                brand: "Jaguar"
            }],
            address: {}
        };

        sequence = [{
            "op": "replace",
            "path": "/name/first",
            value: ""
        }];
        error = jsonpatch.validate(sequence, tree);
        expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');

        sequence = [{
            "op": "replace",
            "path": "/firstName",
            value: ""
        }];
        error = jsonpatch.validate(sequence, tree);
        expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');

        sequence = [{
            "op": "replace",
            "path": "/cars/0/name",
            value: ""
        }];
        error = jsonpatch.validate(sequence, tree);
        expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
    });

    it('should return error removing an unexisting path', function() {
        var tree = {
            name: "Elvis",
            cars: []
        };
        var sequence = [{
            "op": "remove",
            "path": "/name/first"
        }];
        var error = jsonpatch.validate(sequence, tree);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
    });

    it('should allow adding property "b" in "a"', function() {
        var tree = {
            "a": {
                "foo": 1
            }
        };
        var sequence = [{
            "op": "add",
            "path": "/a/b",
            value: "sample"
        }];

        var error = jsonpatch.validate(sequence, tree);
        expect(error).toBeUndefined();
    });

    it('should report error because "a" does not exist', function() {
        var tree = {
            "q": {
                "bar": 2
            }
        };
        var sequence = [{
            "op": "add",
            "path": "/a/b",
            value: "sample"
        }];

        var error = jsonpatch.validate(sequence, tree);
        expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
        expect(error.name).toBe('OPERATION_PATH_CANNOT_ADD');
    });

    it('should return error when replacing a removed path', function() {
        var tree = {
            name: "Elvis"
        };
        var sequence = [{
            "op": "remove",
            "path": "/name"
        }, {
            "op": "replace",
            "path": "/name",
            "value": "Freddie"
        }];
        var error = jsonpatch.validate(sequence, tree);
        expect(error.index).toBe(1);
        expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
    });

    it('should allow to override validator to add custom validation', function() {
        var tree = {
            password: "Elvis"
        };
        var sequence = [{
            "op": "replace",
            "path": "/password",
            "value": "Elvis123"
        }, {
            "op": "replace",
            "path": "/password",
            "value": "Presley123"
        }, {
            "op": "replace",
            "path": "/password"
        }];

        function CustomJsonPatch() {} //Object.create would be better, but let's make it testable also in IE8
        CustomJsonPatch.prototype = jsonpatch;
        var customJsonpatch = new CustomJsonPatch();
        customJsonpatch.validator = function(operation, index, tree, existingPath) {
            CustomJsonPatch.prototype.validator.call(this, operation, index, tree, existingPath);

            if (operation.op === "replace" && operation.path === existingPath) {
                var existingValue = {
                    op: "_get",
                    path: existingPath
                };
                jsonpatch.apply(tree, [existingValue]);
                if (String(operation.value).indexOf(existingValue.value) > -1) {
                    throw new jsonpatch.JsonPatchError("Operation `value` property must not contain the old value", "OPERATION_VALUE_MUST_NOT_CONTAIN_OLD_VALUE", index, operation, tree);
                }
            }
        };

        var customError = customJsonpatch.validate(sequence, tree);
        expect(customError.index).toBe(0);
        expect(customError.name).toBe('OPERATION_VALUE_MUST_NOT_CONTAIN_OLD_VALUE');

        var error = jsonpatch.validate(sequence, tree);
        expect(error.index).toBe(2);
        expect(error.name).toBe('OPERATION_VALUE_REQUIRED'); //original validator should only detect a built-in error
    });

    it('should pass replacing the tree root', function() {
        var tree = {
            password: "Elvis"
        };
        var sequence = [{
            "op": "replace",
            "path": "",
            value: {}
        }];

        var error = jsonpatch.validate(sequence, tree);
        expect(error).toBeUndefined();
    });

    it('should return error moving from an unexisting path', function() {
        var tree = {
            name: "Elvis"
        };
        var sequence = [{
            "op": "move",
            "from": "/a/b/c",
            "path": "/name"
        }];
        var error = jsonpatch.validate(sequence, tree);
        expect(error.name).toBe('OPERATION_FROM_UNRESOLVABLE');
    });

    it('should return error copying from an unexisting path', function() {
        var tree = {
            name: "Elvis"
        };
        var sequence = [{
            "op": "copy",
            "from": "/a/b/c",
            "path": "/name"
        }];
        var error = jsonpatch.validate(sequence, tree);
        expect(error.name).toBe('OPERATION_FROM_UNRESOLVABLE');
    });

    it('should throw OPERATION_PATH_INVALID when applying patch without path', function() {
        var a = {};
        var ex = null;

        try {
            jsonpatch.apply(a, [{
                op: "replace",
                value: ""
            }], true);
        } catch (e) {
            ex = e;
        }

        expect(ex.name).toBe("OPERATION_PATH_INVALID");
    });

    it('should throw OPERATION_OP_INVALID when applying patch without operation', function() {
        var a = {};
        var ex = null;

        try {
            jsonpatch.apply(a, [{
                path: "/foo",
                value: ""
            }], true);
        } catch (e) {
            ex = e;
        }

        expect(ex.name).toBe("OPERATION_OP_INVALID");
    });

    it('should throw OPERATION_VALUE_REQUIRED when applying patch without value', function() {
        var a = {};
        var ex = null;

        try {
            jsonpatch.apply(a, [{
                path: "/foo",
                op: "add"
            }], true);
        } catch (e) {
            ex = e;
        }

        expect(ex.name).toBe("OPERATION_VALUE_REQUIRED");
    });
});
