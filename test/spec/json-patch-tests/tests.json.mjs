export default [
    { "comment": "empty list, empty docs",
      "doc": {},
      "patch": [],
      "expected": {} },

    { "comment": "empty patch list",
      "doc": {"foo": 1},
      "patch": [],
      "expected": {"foo": 1} },

    { "comment": "rearrangements OK?",
      "doc": {"foo": 1, "bar": 2},
      "patch": [],
      "expected": {"bar":2, "foo": 1} },

    { "comment": "rearrangements OK?  How about one level down ... array",
      "doc": [{"foo": 1, "bar": 2}],
      "patch": [],
      "expected": [{"bar":2, "foo": 1}] },

    { "comment": "rearrangements OK?  How about one level down...",
      "doc": {"foo":{"foo": 1, "bar": 2}},
      "patch": [],
      "expected": {"foo":{"bar":2, "foo": 1}} },

    { "comment": "add replaces any existing field",
      "doc": {"foo": null},
      "patch": [{"op": "add", "path": "/foo", "value":1}],
      "expected": {"foo": 1} },

    { "comment": "toplevel array",
      "doc": [],
      "patch": [{"op": "add", "path": "/0", "value": "foo"}],
      "expected": ["foo"] },

    { "comment": "toplevel array, no change",
      "doc": ["foo"],
      "patch": [],
      "expected": ["foo"] },

    { "comment": "toplevel object, numeric string",
      "doc": {},
      "patch": [{"op": "add", "path": "/foo", "value": "1"}],
      "expected": {"foo":"1"} },

    { "comment": "toplevel object, integer",
      "doc": {},
      "patch": [{"op": "add", "path": "/foo", "value": 1}],
      "expected": {"foo":1} },

    { "comment": "Toplevel scalar values OK?",
      "doc": "foo",
      "patch": [{"op": "replace", "path": "", "value": "bar"}],
      "expected": "bar",
      "disabled": true },

    { "comment": "Add, / target",
      "doc": {},
      "patch": [ {"op": "add", "path": "/", "value":1 } ],
      "expected": {"":1} },

    { "comment": "Add composite value at top level",
      "doc": {"foo": 1},
      "patch": [{"op": "add", "path": "/bar", "value": [1, 2]}],
      "expected": {"foo": 1, "bar": [1, 2]} },

    { "comment": "Add into composite value",
      "doc": {"foo": 1, "baz": [{"qux": "hello"}]},
      "patch": [{"op": "add", "path": "/baz/0/foo", "value": "world"}],
      "expected": {"foo": 1, "baz": [{"qux": "hello", "foo": "world"}]} },

    { "doc": {"bar": [1, 2]},
      "patch": [{"op": "add", "path": "/bar/8", "value": "5"}],
      "error": "Out of bounds (upper)" },

    { "doc": {"bar": [1, 2]},
      "patch": [{"op": "add", "path": "/bar/-1", "value": "5"}],
      "error": "Out of bounds (lower)" },

    { "doc": {"foo": 1},
      "patch": [{"op": "add", "path": "/bar", "value": true}],
      "expected": {"foo": 1, "bar": true} },

    { "doc": {"foo": 1},
      "patch": [{"op": "add", "path": "/bar", "value": false}],
      "expected": {"foo": 1, "bar": false} },

    { "doc": {"foo": 1},
      "patch": [{"op": "add", "path": "/bar", "value": null}],
      "expected": {"foo": 1, "bar": null} },

    { "comment": "0 can be an array index or object element name",
      "doc": {"foo": 1},
      "patch": [{"op": "add", "path": "/0", "value": "bar"}],
      "expected": {"foo": 1, "0": "bar" } },

    { "doc": ["foo"],
      "patch": [{"op": "add", "path": "/1", "value": "bar"}],
      "expected": ["foo", "bar"] },

    { "doc": ["foo", "sil"],
      "patch": [{"op": "add", "path": "/1", "value": "bar"}],
      "expected": ["foo", "bar", "sil"] },

    { "doc": ["foo", "sil"],
      "patch": [{"op": "add", "path": "/0", "value": "bar"}],
      "expected": ["bar", "foo", "sil"] },

    { "doc": ["foo", "sil"],
      "patch": [{"op":"add", "path": "/2", "value": "bar"}],
      "expected": ["foo", "sil", "bar"] },

    { "comment": "test against implementation-specific numeric parsing",
      "doc": {"1e0": "foo"},
      "patch": [{"op": "test", "path": "/1e0", "value": "foo"}],
      "expected": {"1e0": "foo"} },

    { "comment": "test with bad number should fail",
      "doc": ["foo", "bar"],
      "patch": [{"op": "test", "path": "/1e0", "value": "bar"}],
      "error": "test op shouldn't get array element 1" },

    { "doc": ["foo", "sil"],
      "patch": [{"op": "add", "path": "/bar", "value": 42}],
      "error": "Object operation on array target" },

    { "doc": ["foo", "sil"],
      "patch": [{"op": "add", "path": "/1", "value": ["bar", "baz"]}],
      "expected": ["foo", ["bar", "baz"], "sil"],
      "comment": "value in array add not flattened" },

    { "doc": {"foo": 1, "bar": [1, 2, 3, 4]},
      "patch": [{"op": "remove", "path": "/bar"}],
      "expected": {"foo": 1} },

    { "doc": {"foo": 1, "baz": [{"qux": "hello"}]},
      "patch": [{"op": "remove", "path": "/baz/0/qux"}],
      "expected": {"foo": 1, "baz": [{}]} },

    { "doc": {"foo": 1, "baz": [{"qux": "hello"}]},
      "patch": [{"op": "replace", "path": "/foo", "value": [1, 2, 3, 4]}],
      "expected": {"foo": [1, 2, 3, 4], "baz": [{"qux": "hello"}]} },

    { "doc": {"foo": [1, 2, 3, 4], "baz": [{"qux": "hello"}]},
      "patch": [{"op": "replace", "path": "/baz/0/qux", "value": "world"}],
      "expected": {"foo": [1, 2, 3, 4], "baz": [{"qux": "world"}]} },

    { "doc": ["foo"],
      "patch": [{"op": "replace", "path": "/0", "value": "bar"}],
      "expected": ["bar"] },

    { "doc": [""],
      "patch": [{"op": "replace", "path": "/0", "value": 0}],
      "expected": [0] },

    { "doc": [""],
      "patch": [{"op": "replace", "path": "/0", "value": true}],
      "expected": [true] },

    { "doc": [""],
      "patch": [{"op": "replace", "path": "/0", "value": false}],
      "expected": [false] },

    { "doc": [""],
      "patch": [{"op": "replace", "path": "/0", "value": null}],
      "expected": [null] },

    { "doc": ["foo", "sil"],
      "patch": [{"op": "replace", "path": "/1", "value": ["bar", "baz"]}],
      "expected": ["foo", ["bar", "baz"]],
      "comment": "value in array replace not flattened" },

    { "comment": "replace whole document",
      "doc": {"foo": "bar"},
      "patch": [{"op": "replace", "path": "", "value": {"baz": "qux"}}],
      "expected": {"baz": "qux"} },

    { "comment": "spurious patch properties",
      "doc": {"foo": 1},
      "patch": [{"op": "test", "path": "/foo", "value": 1, "spurious": 1}],
      "expected": {"foo": 1} },

    { "doc": {"foo": null},
      "patch": [{"op": "test", "path": "/foo", "value": null}],
      "comment": "null value should be valid obj property" },

    { "doc": {"foo": null},
      "patch": [{"op": "replace", "path": "/foo", "value": "truthy"}],
      "expected": {"foo": "truthy"},
      "comment": "null value should be valid obj property to be replaced with something truthy" },

    { "doc": {"foo": null},
      "patch": [{"op": "move", "from": "/foo", "path": "/bar"}],
      "expected": {"bar": null},
      "comment": "null value should be valid obj property to be moved" },

    { "doc": {"foo": null},
      "patch": [{"op": "copy", "from": "/foo", "path": "/bar"}],
      "expected": {"foo": null, "bar": null},
      "comment": "null value should be valid obj property to be copied" },

    { "doc": {"foo": null},
      "patch": [{"op": "remove", "path": "/foo"}],
      "expected": {},
      "comment": "null value should be valid obj property to be removed" },

    { "doc": {"foo": "bar"},
      "patch": [{"op": "replace", "path": "/foo", "value": null}],
      "expected": {"foo": null},
      "comment": "null value should still be valid obj property replace other value" },

    { "doc": {"foo": {"foo": 1, "bar": 2}},
      "patch": [{"op": "test", "path": "/foo", "value": {"bar": 2, "foo": 1}}],
      "comment": "test should pass despite rearrangement" },

    { "doc": {"foo": [{"foo": 1, "bar": 2}]},
      "patch": [{"op": "test", "path": "/foo", "value": [{"bar": 2, "foo": 1}]}],
      "comment": "test should pass despite (nested) rearrangement" },

    { "doc": {"foo": {"bar": [1, 2, 5, 4]}},
      "patch": [{"op": "test", "path": "/foo", "value": {"bar": [1, 2, 5, 4]}}],
      "comment": "test should pass - no error" },

    { "doc": {"foo": {"bar": [1, 2, 5, 4]}},
      "patch": [{"op": "test", "path": "/foo", "value": [1, 2]}],
      "error": "test op should fail" },

    { "comment": "Whole document",
      "doc": { "foo": 1 },
      "patch": [{"op": "test", "path": "", "value": {"foo": 1}}],
      "disabled": true },

    { "comment": "Empty-string element",
      "doc": { "": 1 },
      "patch": [{"op": "test", "path": "/", "value": 1}] },

    { "doc": {
            "foo": ["bar", "baz"],
            "": 0,
            "a/b": 1,
            "c%d": 2,
            "e^f": 3,
            "g|h": 4,
            "i\\j": 5,
            "k\"l": 6,
            " ": 7,
            "m~n": 8
            },
      "patch": [{"op": "test", "path": "/foo", "value": ["bar", "baz"]},
                {"op": "test", "path": "/foo/0", "value": "bar"},
                {"op": "test", "path": "/", "value": 0},
                {"op": "test", "path": "/a~1b", "value": 1},
                {"op": "test", "path": "/c%d", "value": 2},
                {"op": "test", "path": "/e^f", "value": 3},
                {"op": "test", "path": "/g|h", "value": 4},
                {"op": "test", "path":  "/i\\j", "value": 5},
                {"op": "test", "path": "/k\"l", "value": 6},
                {"op": "test", "path": "/ ", "value": 7},
                {"op": "test", "path": "/m~0n", "value": 8}] },

    { "comment": "Move to same location has no effect",
      "doc": {"foo": 1},
      "patch": [{"op": "move", "from": "/foo", "path": "/foo"}],
      "expected": {"foo": 1} },

    { "doc": {"foo": 1, "baz": [{"qux": "hello"}]},
      "patch": [{"op": "move", "from": "/foo", "path": "/bar"}],
      "expected": {"baz": [{"qux": "hello"}], "bar": 1} },

    { "comment": "Move handles escaped paths",
      "doc": {"foo/": {"bar/": 1, "baz": 1}},
      "patch": [{"op": "move", "from": "/foo~1/bar~1", "path": "/bar"}],
      "expected": {"bar": 1, "foo/": {"baz": 1}} },

    { "doc": {"baz": [{"qux": "hello"}], "bar": 1},
      "patch": [{"op": "move", "from": "/baz/0/qux", "path": "/baz/1"}],
      "expected": {"baz": [{}, "hello"], "bar": 1} },

    { "doc": {"baz": [{"qux": "hello"}], "bar": 1},
      "patch": [{"op": "copy", "from": "/baz/0", "path": "/boo"}],
      "expected": {"baz":[{"qux":"hello"}],"bar":1,"boo":{"qux":"hello"}} },

    { "comment": "replacing the root of the document is possible with add",
      "doc": {"foo": "bar"},
      "patch": [{"op": "add", "path": "", "value": {"baz": "qux"}}],
      "expected": {"baz":"qux"}},

    { "comment": "Adding to \"/-\" adds to the end of the array",
      "doc": [ 1, 2 ],
      "patch": [ { "op": "add", "path": "/-", "value": { "foo": [ "bar", "baz" ] } } ],
      "expected": [ 1, 2, { "foo": [ "bar", "baz" ] } ]},

    { "comment": "Adding to \"/-\" adds to the end of the array, even n levels down",
      "doc": [ 1, 2, [ 3, [ 4, 5 ] ] ],
      "patch": [ { "op": "add", "path": "/2/1/-", "value": { "foo": [ "bar", "baz" ] } } ],
      "expected": [ 1, 2, [ 3, [ 4, 5, { "foo": [ "bar", "baz" ] } ] ] ]},

    { "comment": "test remove with bad number should fail",
      "doc": {"foo": 1, "baz": [{"qux": "hello"}]},
      "patch": [{"op": "remove", "path": "/baz/1e0/qux"}],
      "error": "remove op shouldn't remove from array with bad number" },

    { "comment": "test remove on array",
      "doc": [1, 2, 3, 4],
      "patch": [{"op": "remove", "path": "/0"}],
      "expected": [2, 3, 4] },

    { "comment": "test repeated removes",
      "doc": [1, 2, 3, 4],
      "patch": [{ "op": "remove", "path": "/1" },
                { "op": "remove", "path": "/2" }],
      "expected": [1, 3] },

    { "comment": "test remove with bad index should fail",
      "doc": [1, 2, 3, 4],
      "patch": [{"op": "remove", "path": "/1e0"}],
      "error": "remove op shouldn't remove from array with bad number" },

    { "comment": "test replace with bad number should fail",
      "doc": [""],
      "patch": [{"op": "replace", "path": "/1e0", "value": false}],
      "error": "replace op shouldn't replace in array with bad number" },

    { "comment": "test copy with bad number should fail",
      "doc": {"baz": [1,2,3], "bar": 1},
      "patch": [{"op": "copy", "from": "/baz/1e0", "path": "/boo"}],
      "error": "copy op shouldn't work with bad number" },

    { "comment": "test move with bad number should fail",
      "doc": {"foo": 1, "baz": [1,2,3,4]},
      "patch": [{"op": "move", "from": "/baz/1e0", "path": "/foo"}],
      "error": "move op shouldn't work with bad number" },

    { "comment": "test add with bad number should fail",
      "doc": ["foo", "sil"],
      "patch": [{"op": "add", "path": "/1e0", "value": "bar"}],
      "error": "add op shouldn't add to array with bad number" },

    { "comment": "missing 'value' parameter to add",
      "doc": [ 1 ],
      "patch": [ { "op": "add", "path": "/-" } ],
      "error": "missing 'value' parameter" },

    { "comment": "missing 'value' parameter to replace",
      "doc": [ 1 ],
      "patch": [ { "op": "replace", "path": "/0" } ],
      "error": "missing 'value' parameter" },

    { "comment": "missing 'value' parameter to test",
      "doc": [ null ],
      "patch": [ { "op": "test", "path": "/0" } ],
      "error": "missing 'value' parameter" },

    { "comment": "missing value parameter to test - where undef is falsy",
      "doc": [ false ],
      "patch": [ { "op": "test", "path": "/0" } ],
      "error": "missing 'value' parameter" },

    { "comment": "missing from parameter to copy",
      "doc": [ 1 ],
      "patch": [ { "op": "copy", "path": "/-" } ],
      "error": "missing 'from' parameter" },

    { "comment": "missing from parameter to move",
      "doc": { "foo": 1 },
      "patch": [ { "op": "move", "path": "" } ],
      "error": "missing 'from' parameter" },

    { "comment": "duplicate ops",
      "doc": { "foo": "bar" },
      "patch": [ { "op": "add", "path": "/baz", "value": "qux",
                   "op": "move", "from":"/foo" } ],
      "error": "patch has two 'op' members",
      "disabled": true },

    { "comment": "unrecognized op should fail",
      "doc": {"foo": 1},
      "patch": [{"op": "spam", "path": "/foo", "value": 1}],
      "error": "Unrecognized op 'spam'" },

    // Deep nesting operations (5+ levels)
    { "comment": "Deep nesting - 5 levels",
      "doc": {"a": {"b": {"c": {"d": {"e": 1}}}}},
      "patch": [{"op": "replace", "path": "/a/b/c/d/e", "value": 2}],
      "expected": {"a": {"b": {"c": {"d": {"e": 2}}}}} },

    { "comment": "Very deep nesting - add at depth",
      "doc": {"a": {"b": {"c": {"d": {"e": {"f": {"g": 1}}}}}}},
      "patch": [{"op": "add", "path": "/a/b/c/d/e/f/g/h", "value": 2}],
      "expected": {"a": {"b": {"c": {"d": {"e": {"f": {"g": {"h": 2}}}}}}}},
      "disabled": true },

    // Large arrays
    { "comment": "Operation on large array",
      "doc": Array(1000).fill(0).map((_, i) => i),
      "patch": [{"op": "replace", "path": "/999", "value": "last"},
                {"op": "replace", "path": "/0", "value": "first"}],
      "expected": (() => {
          let arr = Array(1000).fill(0).map((_, i) => i);
          arr[0] = "first";
          arr[999] = "last";
          return arr;
      })() },

    // Unicode and special characters in paths
    { "comment": "Unicode characters in path",
      "doc": {"🔑": "value", "κλειδί": "τιμή", "鍵": "値"},
      "patch": [{"op": "replace", "path": "/🔑", "value": "new value"}],
      "expected": {"🔑": "new value", "κλειδί": "τιμή", "鍵": "値"} },

    // Circular references (testing prevention)
    { "comment": "Preventing circular references",
      "doc": {"foo": {"bar": 1}},
      "patch": [{"op": "copy", "from": "", "path": "/foo/circular"}],
      "error": "Creating a circular reference" },

    // Testing across array/object boundaries
    { "comment": "Convert object to array",
      "doc": {"foo": {"a": 1, "b": 2}},
      "patch": [{"op": "replace", "path": "/foo", "value": [1, 2, 3]}],
      "expected": {"foo": [1, 2, 3]} },

    { "comment": "Convert array to object",
      "doc": {"foo": [1, 2, 3]},
      "patch": [{"op": "replace", "path": "/foo", "value": {"a": 1, "b": 2}}],
      "expected": {"foo": {"a": 1, "b": 2}} },

    // Empty operations
    { "comment": "Add empty object",
      "doc": {"foo": 1},
      "patch": [{"op": "add", "path": "/bar", "value": {}}],
      "expected": {"foo": 1, "bar": {}} },

    { "comment": "Add empty array",
      "doc": {"foo": 1},
      "patch": [{"op": "add", "path": "/bar", "value": []}],
      "expected": {"foo": 1, "bar": []} },

    // Array indices edge cases
    { "comment": "Very large array index",
      "doc": [],
      "patch": [{"op": "add", "path": "/9007199254740991", "value": "max safe integer"}],
      "error": "Array index too large" },

    { "comment": "Scientific notation as path",
      "doc": [1, 2, 3, 4, 5],
      "patch": [{"op": "replace", "path": "/1e1", "value": "shouldn't work"}],
      "error": "Invalid array index format" },

    // Complete document replacement with various types
    {
      "comment": "Replace document with null",
      "doc": {"foo": "bar"},
      "patch": [{"op": "replace", "path": "", "value": null}],
      "expected": null
    },

    { "comment": "Replace document with array",
      "doc": {"foo": "bar"},
      "patch": [{"op": "replace", "path": "", "value": [1, 2, 3]}],
      "expected": [1, 2, 3] },

    { "comment": "Replace document with boolean",
      "doc": {"foo": "bar"},
      "patch": [{"op": "replace", "path": "", "value": true}],
      "expected": true },

    // Multiple operations affecting the same path
    { "comment": "Multiple operations on same path",
      "doc": {"foo": 1},
      "patch": [
        {"op": "replace", "path": "/foo", "value": 2},
        {"op": "replace", "path": "/foo", "value": 3},
        {"op": "replace", "path": "/foo", "value": 4}
      ],
      "expected": {"foo": 4} },

    { "comment": "Operations that potentially conflict",
      "doc": {"foo": {"bar": 1}},
      "patch": [
        {"op": "remove", "path": "/foo/bar"},
        {"op": "add", "path": "/foo/bar", "value": 2},
        {"op": "replace", "path": "/foo", "value": {"baz": 3}}
      ],
      "expected": {"foo": {"baz": 3}} },

    // Copy/move to descendant paths
    { "comment": "Move to descendant path",
      "doc": {"foo": {"bar": "baz"}},
      "patch": [{"op": "move", "from": "/foo", "path": "/foo/child"}],
      "error": "Cannot move to a path that is a descendant of the source" },

    { "comment": "Copy to descendant path",
      "doc": {"foo": {"bar": "baz"}},
      "patch": [{"op": "copy", "from": "/foo", "path": "/foo/child"}],
      "expected": {"foo": {"bar": "baz", "child": {"bar": "baz"}}} },

    // Non-existent source paths
    { "comment": "Move from non-existent path",
      "doc": {"foo": 1},
      "patch": [{"op": "move", "from": "/bar", "path": "/baz"}],
      "error": "Path not found" },

    { "comment": "Copy from non-existent path",
      "doc": {"foo": 1},
      "patch": [{"op": "copy", "from": "/bar", "path": "/baz"}],
      "error": "Path not found" },

    { "comment": "Test on non-existent path",
      "doc": {"foo": 1},
      "patch": [{"op": "test", "path": "/bar", "value": "anything"}],
      "error": "Path not found" },

    // Additional edge cases
    { "comment": "Add to non-existent nested path",
      "doc": {"foo": 1},
      "patch": [{"op": "add", "path": "/bar/baz", "value": "qux"}],
      "error": "Path not found" },

    { "comment": "Test on array length",
      "doc": [1, 2, 3],
      "patch": [{"op": "test", "path": "/length", "value": 3}],
      "error": "Cannot test special property 'length'" },

]
