import * as jsonpatch from '../../index.mjs';

describe('validate', function() {
  it('should return an empty array if the patch is valid', function() {
    const patch = [
      {
        op: 'test',
        path: '/a/b/c',
        value: 'foo'
      },
      {
        op: 'remove',
        path: '/a/b/c'
      },
      {
        op: 'add',
        path: '/a/b/c',
        value: ['foo', 'bar']
      },
      {
        op: 'replace',
        path: '/a/b/c',
        value: 42
      },
      {
        op: 'move',
        from: '/a/b/c',
        path: '/a/b/d'
      },
      {
        op: 'copy',
        from: '/a/b/d',
        path: '/a/b/e'
      }
    ];
    const error = jsonpatch.validate(patch);
    expect(error).toBeUndefined();
  });

  it('applyPatch should throw an error if the patch is not an array and validate is `true`', function() {
    expect(() => jsonpatch.applyPatch({}, {}, true)).toThrow(new jsonpatch.JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY'));
  });
  it('applyPatch should throw an error if the patch is not an array and validate is `true`', function() {
    expect(() => jsonpatch.applyPatch({}, null, true)).toThrow(new jsonpatch.JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY'));
  });
  it('applyPatch should throw list the index and the object of the faulty operation in the patch', function() {
      expect(() =>
          jsonpatch.applyPatch(
              {},
              [
                  { op: 'add', path: '/root', value: [] },
                  { op: 'add', path: '/root/2', value: 2 } // out of bounds
              ],
              true
          )
      ).toThrow(
          new jsonpatch.JsonPatchError(
              'The specified index MUST NOT be greater than the number of elements in the array',
              'OPERATION_VALUE_OUT_OF_BOUNDS',
              1, // the index of the faulty operation
              { op: 'add', path: '/root/2', value: 2 }, // the faulty operation
              { root: [] } // the tree after the first operation
          )
      );
  });
  it('JsonPatchError should have a nice formatted message', function() {
    const message = "Some error message";
    const name = "SOME_ERROR_NAME";
    const index = 1; // op index
    const operation =  JSON.stringify({ op: "replace", path: '/root', value: {} }, null, 2);
    const tree = JSON.stringify({ root: [] }, null, 2);

    const expectedError = new jsonpatch.JsonPatchError(message, name, index, operation, tree);

    /*
    Some error message
    name: SOME_ERROR_NAME
    index: 1
    operation: {
      "op": "replace",
      "path": "/root",
      "value": {}
    }
    tree: {
      "root": []
    }"
    */
    const expectedFormattedErrorMessage = message
      .concat("\nname: ")
      .concat(name, "\nindex: ")
      .concat(index, "\noperation: ")
      .concat(operation, "\ntree: ")
      .concat(tree); // don't use `` to support the loveliest browser: IE

    expect(expectedError.message).toEqual(expectedFormattedErrorMessage);
  });


  it('should return an empty array if the operation is a valid object', function() {
    const error = jsonpatch.validate([
      {
        op: 'add',
        value: 'foo',
        path: '/bar'
      }
    ]);
    expect(error).toBeUndefined();
  });

  it('should return an error if the operation is null', function() {
    const error = jsonpatch.validate([null]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_NOT_AN_OBJECT');
  });

  it('should return an error which is instance of Error and jsonpatch.JsonPatchError', function() {
    const error = jsonpatch.validate({});
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(error.name).toBe('SEQUENCE_NOT_AN_ARRAY');
  });

  it('should return an error that contains the cloned patch and the patched object', function() {
    const tree = {
      name: 'Elvis',
      cars: []
    };
    const sequence = [
      {
        op: 'remove',
        path: '/name/first'
      }
    ];
    const error = jsonpatch.validate(sequence, tree);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(JSON.stringify(error.operation)).toBe(JSON.stringify(sequence[0]));
    expect(JSON.stringify(error.tree)).toBe(JSON.stringify(tree));
    expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
  });

  it('should return an error if the operation is undefined', function() {
    const error = jsonpatch.validate([undefined]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_NOT_AN_OBJECT');
  });

  it('should return an error if the operation is an array', function() {
    const error = jsonpatch.validate([[]]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_NOT_AN_OBJECT');
  });

  it('should return an error if the operation "op" property is not a string', function() {
    const error = jsonpatch.validate([
      {
        path: '/a/b/c'
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_OP_INVALID');
  });

  it('should return an error if the operation "path" property is not a string', function() {
    const error = jsonpatch.validate([
      {
        op: 'remove',
        value: 'foo'
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_PATH_INVALID');
  });

  it('should return an error if an "add" operation is missing "value" property', function() {
    const error = jsonpatch.validate([
      {
        op: 'add',
        path: '/a/b/c'
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
  });

  it('should return an error if an "add" operation "value" property is "undefined"', function() {
    const error = jsonpatch.validate([
      {
        op: 'add',
        path: '/a/b/c',
        value: undefined
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
  });

  it('should return an error if a "replace" operation is missing "value" property', function() {
    const error = jsonpatch.validate([
      {
        op: 'replace',
        path: '/a/b/c'
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
  });

  it('should return an error if a "replace" operation "value" property is "undefined"', function() {
    const error = jsonpatch.validate([
      {
        op: 'replace',
        path: '/a/b/c',
        value: undefined
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
  });

  it('should return an error if a "test" operation is missing "value" property', function() {
    const error = jsonpatch.validate([
      {
        op: 'test',
        path: '/a/b/c'
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
  });

  it('should return an error if a "test" operation "value" property is "undefined"', function() {
    const error = jsonpatch.validate([
      {
        op: 'test',
        path: '/a/b/c',
        value: undefined
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_VALUE_REQUIRED');
  });

  it('should return an error if an "add" operation "value" contains "undefined"', function() {
    const error = jsonpatch.validate([
      {
        op: 'add',
        path: '/a/b/c',
        value: {
          foo: undefined
        }
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED');
  });

  it('should return an error if a "replace" operation "value" contains "undefined"', function() {
    const error = jsonpatch.validate([
      {
        op: 'replace',
        path: '/a/b/c',
        value: {
          foos: [undefined]
        }
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED');
  });

  it('should return an error if a "test" operation "value" contains "undefined"', function() {
    const error = jsonpatch.validate([
      {
        op: 'test',
        path: '/a/b/c',
        value: {
          foo: {
            bars: [undefined]
          }
        }
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED');
  });

  it('should return an error if a "move" operation is missing "from" property', function() {
    const error = jsonpatch.validate([
      {
        op: 'move',
        path: '/a/b/c'
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_FROM_REQUIRED');
  });

  it('should return an error if a "copy" operation is missing "from" property', function() {
    const error = jsonpatch.validate([
      {
        op: 'copy',
        path: '/a/b/c'
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_FROM_REQUIRED');
  });

  it('should return an error if the "op" property is invalid', function() {
    const error = jsonpatch.validate([
      {
        op: 'foobar',
        path: '/a/b/c'
      }
    ]);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_OP_INVALID');
  });

  it('should return error replacing an unexisting path', function() {
    let sequence;
    let error;
    const tree = {
        '': 'empty string is a valid key',
        name: 'Elvis',
        cars: [
          {
            brand: 'Jaguar'
          }
        ],
        address: {}
      };

    sequence = [
      {
        op: 'replace',
        path: '/name/first',
        value: ''
      }
    ];
    error = jsonpatch.validate(sequence, tree);
    expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');

    sequence = [
      {
        op: 'replace',
        path: '/firstName',
        value: ''
      }
    ];
    error = jsonpatch.validate(sequence, tree);
    expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');

    sequence = [
      {
        op: 'replace',
        path: '/cars/0/name',
        value: ''
      }
    ];
    error = jsonpatch.validate(sequence, tree);
    expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
  });

  it('should return error removing an unexisting path', function() {
    const tree = {
      name: 'Elvis',
      cars: []
    };
    const sequence = [
      {
        op: 'remove',
        path: '/name/first'
      }
    ];
    const error = jsonpatch.validate(sequence, tree);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
  });

  it('should allow adding property "b" in "a"', function() {
    const tree = {
      a: {
        foo: 1
      }
    };
    const sequence = [
      {
        op: 'add',
        path: '/a/b',
        value: 'sample'
      }
    ];

    const error = jsonpatch.validate(sequence, tree);
    expect(error).toBeUndefined();
  });

  it('should report error because "a" does not exist', function() {
    const tree = {
      q: {
        bar: 2
      }
    };
    const sequence = [
      {
        op: 'add',
        path: '/a/b',
        value: 'sample'
      }
    ];

    const error = jsonpatch.validate(sequence, tree);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_PATH_CANNOT_ADD');
  });

  it('should report error because "a" is null', function() {
    const tree = {
      q: {
        bar: 2
      },
      a: null
    };
    const sequence = [
      {
        op: 'add',
        path: '/a/b',
        value: 'sample'
      }
    ];

    const error = jsonpatch.validate(sequence, tree);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
  });

  it('should report error because "a" is not an object', function() {
    const tree = {
      q: {
        bar: 2
      },
      a: 42
    };
    const sequence = [
      {
        op: 'add',
        path: '/a/b',
        value: 'sample'
      }
    ];

    const error = jsonpatch.validate(sequence, tree);
    expect(error instanceof jsonpatch.JsonPatchError).toBe(true);
    expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
  });

  it('should return error when replacing a removed path', function() {
    const tree = {
      name: 'Elvis'
    };
    const sequence = [
      {
        op: 'remove',
        path: '/name'
      },
      {
        op: 'replace',
        path: '/name',
        value: 'Freddie'
      }
    ];
    const error = jsonpatch.validate(sequence, tree);
    expect(error.name).toBe('OPERATION_PATH_UNRESOLVABLE');
  });

  it('should allow to override validator to add custom validation', function() {
    const tree = {
      password: 'Elvis'
    };
    const sequence = [
      {
        op: 'replace',
        path: '/password',
        value: 'Elvis123'
      },
      {
        op: 'replace',
        path: '/password',
        value: 'Presley123'
      },
      {
        op: 'replace',
        path: '/password'
      }
    ];


    const validator = function(operation, index, tree, existingPath) {
      throw new jsonpatch.JsonPatchError(
            'Operation `value` property must not contain the old value',
            'OPERATION_VALUE_MUST_NOT_CONTAIN_OLD_VALUE',
            index,
            operation,
            tree
          );
        }
    const customError = jsonpatch.validate(sequence, tree, validator);
    expect(customError.index).toBe(0);
    expect(customError.name).toBe('OPERATION_VALUE_MUST_NOT_CONTAIN_OLD_VALUE');
  });

  it('should pass replacing the tree root', function() {
    const tree = {
      password: 'Elvis'
    };
    const sequence = [
      {
        op: 'replace',
        path: '',
        value: {}
      }
    ];

    const error = jsonpatch.validate(sequence, tree);
    expect(error).toBeUndefined();
  });

  it('should return error moving from an unexisting path', function() {
    const tree = {
      name: 'Elvis'
    };
    const sequence = [
      {
        op: 'move',
        from: '/a/b/c',
        path: '/name'
      }
    ];
    const error = jsonpatch.validate(sequence, tree);
    expect(error.name).toBe('OPERATION_FROM_UNRESOLVABLE');
  });

  it('should return error copying from an unexisting path', function() {
    const tree = {
      name: 'Elvis'
    };
    const sequence = [
      {
        op: 'copy',
        from: '/a/b/c',
        path: '/name'
      }
    ];
    const error = jsonpatch.validate(sequence, tree);
    expect(error.name).toBe('OPERATION_FROM_UNRESOLVABLE');
  });

  it('should throw OPERATION_PATH_INVALID when applying patch without path', function() {
    const a = {};
    let ex = null;

    try {
      jsonpatch.applyPatch(
        a,
        [
          {
            op: 'replace',
            value: ''
          }
        ],
        true
      );
    } catch (e) {
      ex = e;
    }

    expect(ex.name).toBe('OPERATION_PATH_INVALID');
  });

  it('should throw OPERATION_PATH_INVALID when applying patch with an invalid path. Issue #77.', function() {
    const a = {};
    let ex = null;

    try {
      jsonpatch.applyPatch(
        a,
        [
          {
            op: 'replace',
            value: '',
            path: 'foo' // no preceding "/"
          }
        ],
        true
      );
    } catch (e) {
      ex = e;
    }
    expect(ex.name).toBe('OPERATION_PATH_INVALID');
  });

  it('should throw OPERATION_OP_INVALID when applying patch without operation', function() {
    const a = {};
    let ex = null;

    try {
      jsonpatch.applyPatch(
        a,
        [
          {
            path: '/foo',
            value: ''
          }
        ],
        true
      );
    } catch (e) {
      ex = e;
    }

    expect(ex.name).toBe('OPERATION_OP_INVALID');
  });

  it('should throw OPERATION_VALUE_REQUIRED when applying patch without value', function() {
    const a = {};
    let ex = null;

    try {
      jsonpatch.applyPatch(
        a,
        [
          {
            path: '/foo',
            op: 'add'
          }
        ],
        true
      );
    } catch (e) {
      ex = e;
    }

    expect(ex.name).toBe('OPERATION_VALUE_REQUIRED');
  });

  it('should not modify patch value of type array (issue #76)', function () {
    const patches = [
      {op: 'add', path: '/foo', value: []},
      {op: 'add', path: '/foo/-', value: 1}
    ];
    jsonpatch.validate(patches, {});

    expect(patches).toEqual([
      {op: 'add', path: '/foo', value: []},
      {op: 'add', path: '/foo/-', value: 1}
    ]);
  });

  it('should not modify patch value of type object (issue #76)', function () {
    const patches = [
      {op: 'add', path: '/foo', value: {}},
      {op: 'add', path: '/foo/bar', value: 1}
    ];
    jsonpatch.validate(patches, {});

    expect(patches).toEqual([
      {op: 'add', path: '/foo', value: {}},
      {op: 'add', path: '/foo/bar', value: 1}
    ]);
  });
});
