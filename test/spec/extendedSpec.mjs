import * as jsonpatch from "../../index.mjs";

const unwrapPatchError = (fn) => () => {
  try {
    fn();
  } catch (X) {
    if (typeof X.name === "string") {
      throw new Error(X.name);
    }
    throw X;
  }
};

// API extensions
describe("additional API functions for non-RFC-6902 operations exposed", function () {
  it("has additional functions", function () {
    expect(jsonpatch.useExtendedOperation)
      .withContext("useExtendedOperation should be a method within the object")
      .toBeDefined();
    expect(jsonpatch.hasExtendedOperation)
      .withContext("hasExtendedOperation should be a method within the object")
      .toBeDefined();
    expect(jsonpatch.unregisterAllExtendedOperations)
      .withContext(
        "unregisterAllExtendedOperations should be a method within the object"
      )
      .toBeDefined();
  });
});

// Register extended operations
describe("jsonpatch.useExtendedOperation", function () {
  it("should reject improperly formatted extended operation name", function () {
    expect(
      unwrapPatchError(() => {
        jsonpatch.useExtendedOperation("", {});
      })
    ).toThrowError(Error, "OPERATION_X_OP_INVALID");
  });

  it("should reject improperly formatted extended operation name", function () {
    expect(
      unwrapPatchError(() => {
        jsonpatch.useExtendedOperation("add", {});
      })
    ).toThrowError(Error, "OPERATION_X_OP_INVALID");
  });

  it("should reject when missing `arr` function", function () {
    expect(
      unwrapPatchError(() => {
        jsonpatch.useExtendedOperation("x-foo", {
          obj: () => {},
          validator: () => {},
        });
      })
    ).toThrowError(Error, "OPERATION_X_CONFIG_INVALID");
  });

  it("should reject when missing `obj` function", function () {
    expect(
      unwrapPatchError(() => {
        jsonpatch.useExtendedOperation("x-foo", {
          arr: () => {},
          validator: () => {},
        });
      })
    ).toThrowError(Error, "OPERATION_X_CONFIG_INVALID");
  });

  it("should reject when missing `validator` function", function () {
    expect(
      unwrapPatchError(() => {
        jsonpatch.useExtendedOperation("x-foo", {
          arr: () => {},
          obj: () => {},
        });
      })
    ).toThrowError(Error, "OPERATION_X_CONFIG_INVALID");
  });
});

// Default validation
describe("default extended operation validation", function () {
  beforeEach(function () {
    jsonpatch.unregisterAllExtendedOperations();
  });

  const dummyConfig = {
    arr: () => {},
    obj: () => {},
    validator: () => {},
  };

  it("rejects extended operation w/out `xid` property", function () {
    const xop = { op: "x", path: "", value: 5 };
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation({}, xop, true);
      })
    ).toThrowError(Error, "OPERATION_X_ID_INVALID");
  });

  it("rejects unregistered extended operation", function () {
    const xop = { op: "x", xid: "x-foo", path: "", value: 5 };
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation({}, xop, true);
      })
    ).toThrowError(Error, "OPERATION_X_OP_INVALID");
  });

  it("rejects extended operation w/out path string", function () {
    jsonpatch.useExtendedOperation("x-foo", dummyConfig);
    const xop = { op: "x", xid: "x-foo", value: 5 };
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation({}, xop, true);
      })
    ).toThrowError(Error, "OPERATION_PATH_INVALID");
  });

  it("rejects extended operation w/bad path string", function () {
    jsonpatch.useExtendedOperation("x-foo", dummyConfig);
    const xop = { op: "x", xid: "x-foo", path: "not good", value: 5 };
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation({}, xop, true);
      })
    ).toThrowError(Error, "OPERATION_PATH_INVALID");
  });

  it("rejects extended operation w/slash path string", function () {
    jsonpatch.useExtendedOperation("x-foo", dummyConfig);
    const xop = { op: "x", xid: "x-foo", path: "/", value: 5 };
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation({}, xop, true);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
  });

  it("rejects extended operation w/non-array `args` property", function () {
    jsonpatch.useExtendedOperation("x-foo", dummyConfig);
    const xop = { op: "x", xid: "x-foo", path: "", value: 5, args: 99 };
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation({}, xop, true);
      })
    ).toThrowError(Error, "OPERATION_X_ARGS_NOT_ARRAY");
  });

  it("runs extended operation validator", function () {
    const cfg = Object.assign({}, dummyConfig, {
      validator: function (o, i, d, ep) {
        // custom validator rejects specific va;ue
        if (this.value === 5) {
          throw new jsonpatch.JsonPatchError(
            "custom validator",
            "OPERATION_VALUE_OUT_OF_BOUNDS"
          );
        }
      },
    });
    jsonpatch.useExtendedOperation("x-foo", cfg);
    const xop_invalid = { op: "x", xid: "x-foo", path: "", value: 5 };
    const xop_valid = { op: "x", xid: "x-foo", path: "", value: 8 };
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation({}, xop_invalid, true);
      })
    ).toThrowError(Error, "OPERATION_VALUE_OUT_OF_BOUNDS");
    // other values should pass
    const result = jsonpatch.applyOperation({}, xop_valid, true);
    expect(result.newDocument).toBe(8);
  });
});

// Object-based semantics
describe("extended operations - object-based semantics", function () {
  beforeAll(function () {
    jsonpatch.unregisterAllExtendedOperations();

    const xCfg = {
      arr: () => {
        throw new Error("`arr` operator should NOT be invoked by this spec");
      },
      // This object operator sets key to value UNLESS value === 5, then it forces value of 999.
      // If value === 77, operator should 'No Op'
      obj: function (o, k, d) {
        if (this.value === 5) {
          o[k] = 999;
        } else {
          o[k] = this.value;
        }
        // do this check AFTER the assignment to ensure
        // original object is not mutated when returning undefined
        if (this.value === 77) {
          return undefined;
        }
        return { newDocument: d };
      },
      validator: () => {},
    };

    jsonpatch.useExtendedOperation("x-obj", xCfg);
  });

  it("should run configured obj operator", function () {
    const base = {};
    const base_no_mutate = {};
    const xop = { op: "x", xid: "x-obj", path: "/a", value: 42 };

    // w/out document modifications (4th arg false)
    let result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    expect(result.newDocument.a).toBe(42);
    expect(base_no_mutate.a).toBe(undefined);

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    expect(result.newDocument.a).toBe(42);
    expect(base.a).toBe(42);
  });

  it("should run configured obj operator - value override", function () {
    const base = {};
    const base_no_mutate = {};
    const xop = { op: "x", xid: "x-obj", path: "/a", value: 5 };

    // w/out document modifications (4th arg false)
    let result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    expect(result.newDocument.a).toBe(999);
    expect(base_no_mutate.a).toBe(undefined);

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    expect(result.newDocument.a).toBe(999);
    expect(base.a).toBe(999);
  });

  it("should run configured obj operator - value override; No Op", function () {
    const base = {};
    const base_no_mutate = {};
    const xop = { op: "x", xid: "x-obj", path: "/a", value: 77 };
    let result = undefined;

    // w/out document modifications (4th arg false)
    result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    expect(result.newDocument.a).toBe(undefined);
    expect(base_no_mutate.a).toBe(undefined);

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    expect(result.newDocument.a).toBe(undefined);
    expect(base.a).toBe(undefined);

    ////// sanity check update leaf
    const b = { a: { b: { c: "foo", d: "bar" } } };
    const o = { op: "x", xid: "x-obj", path: "/a/b/d", value: "hey!" };
    result = jsonpatch.applyOperation(b, o, true, false);
    expect(result.newDocument.a.b.d).toBe("hey!");
    expect(b.a.b.d).toBe("bar");

    // with base mod
    result = jsonpatch.applyOperation(b, o, true, true);
    expect(result.newDocument.a.b.d).toBe("hey!");
    expect(b.a.b.d).toBe("hey!");
  });

  it("should NOT run configured obj operator @root path when resolve !== true - set root doc to value", function () {
    const base_no_mutate = { a: "hi" };
    const xop = { op: "x", xid: "x-obj", path: "", value: 77 };

    const result = jsonpatch.applyOperation(base_no_mutate, xop, true);
    expect(result.newDocument).toBe(77);
    // NOTE: 4th arg  to 'applyOperation' has no effect at root path
    //  - (JS function argument pass-by-value semantics)
    expect(base_no_mutate.a).toBe("hi");
  });

  it("should run configured obj operator @root path when resolve === true - does NOT replace existing root doc", function () {
    const base = { a: "hi" };
    const base_no_mutate = { a: "hi" };
    const xop = {
      op: "x",
      xid: "x-obj",
      path: "",
      value: "special value",
      resolve: true,
    };

    // w/out document modifications (4th arg false)
    let result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    // an empty string key was created on orig doc
    expect(result.newDocument[""]).toBe("special value");
    // previously existing keys still exist in result
    expect(result.newDocument.a).toBe("hi");
    // base document was not mutated
    expect(base_no_mutate.a).toBe("hi");
    expect(base_no_mutate[""]).toBe(undefined);

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    // an empty string key was created on orig doc
    expect(result.newDocument[""]).toBe("special value");
    // previously existing keys still exist in result
    expect(result.newDocument.a).toBe("hi");
    // base document was mutated as well
    expect(base[""]).toBe("special value");
    // previously existing keys still exist in base
    expect(base.a).toBe("hi");
  });

  it("should reject unresolvable path when operation.resolve !== true", function () {
    const base = {};
    const base_no_mutate = { a: "hi" };
    let result = {};
    const xop = { op: "x", xid: "x-obj", path: "/a/b/c", value: 5 };

    // w/out document modifications (4th arg false)
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(result.newDocument).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate.a).toBe("hi");

    // w/document modifications (4th arg true)
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(base, xop, true, true);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(result.newDocument).toBe(undefined);
    // no changes should have been made to base
    expect(base.a).toBe(undefined);
  });

  it("should NOT reject unresolvable path when operation.resolve === true - create missing hierarchy", function () {
    const base = {
      a: {
        d: "hi",
      },
    };
    const base_no_mutate = {
      a: {
        d: "hello",
      },
    };
    const xop = {
      op: "x",
      xid: "x-obj",
      path: "/a/b/c",
      value: 5,
      resolve: true,
    };

    // w/out document modifications (4th arg false)
    let result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    expect(result.newDocument.a.b.c).toBe(999);
    // previously existing keys should stil exist
    expect(result.newDocument.a.d).toBe("hello");
    // no changes should have been made to base
    expect(base_no_mutate.a.b).toBe(undefined);

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    expect(result.newDocument.a.b.c).toBe(999);
    // previously existing keys should stil exist
    expect(result.newDocument.a.d).toBe("hi");
    // base should be modified
    expect(base.a.b).toBeDefined();
    expect(base.a.b.c).toBe(999);
    // previously existing base keys should stil exist
    expect(base.a.d).toBe("hi");
  });

  it("should treat numeric keys as string props when root document is an Object && operation.resolve === true - create missing hierarchy", function () {
    const base = {
      a: {
        d: "hi",
      },
    };
    const base_no_mutate = {
      a: {
        d: "hello",
      },
    };
    const xop = {
      op: "x",
      xid: "x-obj",
      path: "/a/0/c",
      value: 5,
      resolve: true,
    };

    // w/out document modifications (4th arg false)
    let result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    expect(result.newDocument.a["0"].c).toBe(999);
    // previously existing keys should stil exist
    expect(result.newDocument.a.d).toBe("hello");
    // no changes should have been made to base
    expect(base_no_mutate.a["0"]).toBe(undefined);

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    expect(result.newDocument.a["0"].c).toBe(999);
    // previously existing keys should stil exist
    expect(result.newDocument.a.d).toBe("hi");
    // base should be modified
    expect(base.a["0"]).toBeDefined();
    expect(base.a["0"].c).toBe(999);
    // previously existing base keys should stil exist
    expect(base.a.d).toBe("hi");
  });

  it("should pass args from extended operations to their configured operators", function () {
    // special config that passes operation args through to newDocument
    const cfg = {
      arr: function (a, i, d) {
        return { newDocument: this.args };
      },
      obj: function (o, k, d) {
        return { newDocument: this.args };
      },
      validator: () => {},
    };
    jsonpatch.useExtendedOperation("x-args", cfg);
    const base_arr = [1, 2, 3];
    const base_obj = { a: 5 };
    // use resolve === true to force invocation of obj operator
    const xop_arr = {
      op: "x",
      xid: "x-args",
      path: "",
      value: null,
      args: ["dinosaur", "hello", 54],
      resolve: true,
    };
    // NOTE: empty path will always run the obj operator
    const xop_obj = {
      op: "x",
      xid: "x-args",
      path: "",
      value: null,
      args: ["hi", 42],
      resolve: true,
    };

    // obj
    let result = jsonpatch.applyOperation(base_obj, xop_obj, true);
    let v = result.newDocument;
    expect(Array.isArray(v) && v[0] === "hi" && v[1] === 42).toBe(true);

    // arr
    result = jsonpatch.applyOperation(base_arr, xop_arr, true);
    v = result.newDocument;
    expect(
      Array.isArray(v) && v[0] === "dinosaur" && v[1] === "hello" && v[2] === 54
    ).toBe(true);
  });
});

// Array-based semantics
describe("extended operations - array-based semantics", function () {
  const EMSG = "`obj` operator should NOT be invoked by this spec";
  beforeAll(function () {
    jsonpatch.unregisterAllExtendedOperations();

    const xCfg = {
      // This array operator sets index to value UNLESS value === 5, then it forces value of 999.
      // If value === 77, operator should 'No Op'
      arr: function (a, i, d) {
        if (this.value === 5) {
          a[i] = 999;
        } else {
          a[i] = this.value;
        }
        // do this check AFTER the assignment to ensure
        // original object is not mutated when returning undefined
        if (this.value === 77) {
          return undefined;
        }
        return { newDocument: d };
      },
      obj: () => {
        throw new Error(EMSG);
      },
      validator: () => {},
    };

    const xCfg2 = {
      arr: function (a, i, d) {
        a[i] = this.value;
        return { newDocument: d };
      },
      obj: function (o, k, d) {
        o[k] = this.value;
        return { newDocument: d };
      },
      validator: () => {},
    };

    jsonpatch.useExtendedOperation("x-arr", xCfg);
    jsonpatch.useExtendedOperation("x-arr2", xCfg2);
  });

  it("should run configured arr operator", function () {
    const base = ["hi"];
    const base_no_mutate = ["hello"];
    const xop = { op: "x", xid: "x-arr", path: "/0", value: 42 };

    // w/out document modifications (4th arg false)
    let result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    expect(result.newDocument[0]).toBe(42);
    expect(base_no_mutate[0]).toBe("hello");

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    expect(result.newDocument[0]).toBe(42);
    expect(base[0]).toBe(42);
  });

  it("should run configured arr operator - value override", function () {
    const base = ["hi", "there"];
    const base_no_mutate = ["hello", "you"];
    const xop = { op: "x", xid: "x-arr", path: "/1", value: 5 };

    // w/out document modifications (4th arg false)
    let result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[1]).toBe(999);
    // existing indexes unchanged
    expect(result.newDocument[0]).toBe("hello");
    // no base modifications
    expect(base_no_mutate.length).toBe(2);
    expect(base_no_mutate[0]).toBe("hello");
    expect(base_no_mutate[1]).toBe("you");

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[1]).toBe(999);
    // existing indexes unchanged
    expect(result.newDocument[0]).toBe("hi");
    // base modifications
    expect(base.length).toBe(2);
    expect(base[0]).toBe("hi");
    expect(base[1]).toBe(999);
  });

  it("should run configured arr operator - value override; No Op", function () {
    const base = ["hi", "there"];
    const base_no_mutate = ["hello", "you"];
    const xop = { op: "x", xid: "x-arr", path: "/1", value: 77 };

    // w/out document modifications (4th arg false)
    let result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    expect(Array.isArray(result.newDocument)).toBe(true);
    // ensure no op
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[0]).toBe("hello");
    expect(result.newDocument[1]).toBe("you");
    // no base modifications
    expect(base_no_mutate.length).toBe(2);
    expect(base_no_mutate[0]).toBe("hello");
    expect(base_no_mutate[1]).toBe("you");

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    // ensure no op
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[0]).toBe("hi");
    expect(result.newDocument[1]).toBe("there");
    // no base modifications
    expect(base.length).toBe(2);
    expect(base[0]).toBe("hi");
    expect(base[1]).toBe("there");
  });

  it("should NOT run EITHER `arr` or `obj` configured operators @ empty root path when `resolve` === false; return raw value", function () {
    const base_no_mutate = ["hi"];
    const xop = { op: "x", xid: "x-arr", path: "", value: 77 };
    const result = jsonpatch.applyOperation(base_no_mutate, xop, true);
    expect(result.newDocument).toBe(77);
    // no base modifications
    expect(Array.isArray(base_no_mutate)).toBe(true);
    expect(base_no_mutate.length).toBe(1);
    expect(base_no_mutate[0]).toBe("hi");
  });

  it("should NOT run configured `arr` operator @empty root path when resolve === true - run `obj` operator", function () {
    const base_no_mutate = ["hi"];
    const xop = {
      op: "x",
      xid: "x-arr",
      path: "",
      value: "special value",
      resolve: true,
    };
    expect(() => {
      jsonpatch.applyOperation(base_no_mutate, xop, true);
    }).toThrowError(Error, EMSG);
    // no base modifications
    expect(Array.isArray(base_no_mutate)).toBe(true);
    expect(base_no_mutate.length).toBe(1);
    expect(base_no_mutate[0]).toBe("hi");
  });

  it("should reject unresolvable path when operation.resolve !== true", function () {
    const base = ["hi"];
    const base_no_mutate = ["hi"];
    let result = undefined;
    const xop_prop_path = { op: "x", xid: "x-arr", path: "/a", value: 2 };
    const xop_root_slash_path = { op: "x", xid: "x-arr", path: "/", value: 4 };
    const xop_idx_path = { op: "x", xid: "x-arr", path: "/4", value: 6 };
    const xop_nested_idx_path = {
      op: "x",
      xid: "x-arr",
      path: "/a/1",
      value: 8,
    };
    const xop_deep_nested_idx_path = {
      op: "x",
      xid: "x-arr",
      path: "/a/1/b/c/0",
      value: 10,
    };

    /************** w/out document modifications (4th arg false) **************/

    // prop path
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_prop_path,
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // root slash
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_root_slash_path,
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // non-existent idx
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_idx_path,
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_VALUE_OUT_OF_BOUNDS");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // nested
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_nested_idx_path,
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // deep nested
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_deep_nested_idx_path,
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    /***************** w/document modifications (4th arg true) ****************/

    // prop path
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_prop_path,
          true,
          true
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // root slash
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_root_slash_path,
          true,
          true
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // non-existent idx
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_idx_path,
          true,
          true
        );
      })
    ).toThrowError(Error, "OPERATION_VALUE_OUT_OF_BOUNDS");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // nested
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_nested_idx_path,
          true,
          true
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // deep nested
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_deep_nested_idx_path,
          true,
          true
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");
  });

  it('should still reject "Array Object Prop" path when operation.resolve === true', function () {
    const base = ["hi"];
    const base_no_mutate = ["hi"];
    let result = undefined;
    const xop_prop_path = {
      op: "x",
      xid: "x-arr",
      path: "/a",
      value: 2,
      resolve: true,
    };
    const xop_root_slash_path = {
      op: "x",
      xid: "x-arr",
      path: "/",
      value: 4,
      resolve: true,
    };
    const xop_idx_path = {
      op: "x",
      xid: "x-arr",
      path: "/4",
      value: 6,
      resolve: true,
    };
    const xop_nested_idx_path = {
      op: "x",
      xid: "x-arr",
      path: "/a/1",
      value: 8,
      resolve: true,
    };
    const xop_deep_nested_idx_path = {
      op: "x",
      xid: "x-arr",
      path: "/a/1/b/c/0",
      value: 10,
      resolve: true,
    };

    /************** w/out document modifications (4th arg false) **************/

    // prop path - still illegal when resolve === true
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_prop_path,
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // root slash - still illegal when resolve === true
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_root_slash_path,
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // non-existent idx - added when resolve === true
    result = jsonpatch.applyOperation(
      base_no_mutate,
      xop_idx_path,
      true,
      false
    );
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(5);
    expect(result.newDocument[4]).toBe(6);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // nested - first path component is non-numeric - should still reject when resolve === true
    result = undefined;
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_nested_idx_path,
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // deep nested
    result = undefined;
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_deep_nested_idx_path,
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    /***************** w/document modifications (4th arg true) ****************/

    // prop path - still illegal when resolve === true
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_prop_path,
          true,
          true
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // root slash - still illegal when resolve === true
    let b = base.concat();
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(b, xop_root_slash_path, true, true);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    // no changes should have been made to base
    expect(b[0]).toBe("hi");

    // non-existent idx - added when resolve === true
    b = base.concat();
    result = jsonpatch.applyOperation(b, xop_idx_path, true, true);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(5);
    expect(result.newDocument[4]).toBe(6);
    // appropriate changes should have been made to base
    expect(b.length).toBe(5);
    expect(b[4]).toBe(6);
    // untouched
    expect(b[0]).toBe("hi");

    // nested - first path component is non-numeric - should still reject when resolve === true
    result = undefined;
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_nested_idx_path,
          true,
          true
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");

    // deep nested
    result = undefined;
    expect(
      unwrapPatchError(() => {
        result = jsonpatch.applyOperation(
          base_no_mutate,
          xop_deep_nested_idx_path,
          true,
          true
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_ILLEGAL_ARRAY_INDEX");
    expect(result).toBe(undefined);
    // no changes should have been made to base
    expect(base_no_mutate[0]).toBe("hi");
  });

  it("should create missing arr/object hierarchy when operation.resolve === true", function () {
    const base = ["hi"];
    let result = undefined;
    const xop_idx_path = {
      op: "x",
      xid: "x-arr2",
      path: "/4",
      value: 42,
      resolve: true,
    };
    const xop_idx_path_2 = {
      op: "x",
      xid: "x-arr2",
      path: "/4/2",
      value: "double",
      resolve: true,
    };
    const xop_idx_path_3 = {
      op: "x",
      xid: "x-arr2",
      path: "/4/2/1",
      value: "triple",
      resolve: true,
    };
    const xop_idx_append = {
      op: "x",
      xid: "x-arr2",
      path: "/-",
      value: "appended",
      resolve: true,
    };
    const xop_nested_prop_path = {
      op: "x",
      xid: "x-arr2",
      path: "/1/a",
      value: "hello",
      resolve: true,
    };
    const xop_nested_prop_path_2 = {
      op: "x",
      xid: "x-arr2",
      path: "/1/a/b",
      value: "dog",
      resolve: true,
    };
    const xop_deep_nested_idx_path = {
      op: "x",
      xid: "x-arr2",
      path: "/1/1/b/c/0",
      value: { p: "nested" },
      resolve: true,
    };

    //   /************** w/out document modifications (4th arg false) **************/

    // create non-existent index - 1 level of nesting
    result = jsonpatch.applyOperation(base, xop_idx_path, true, false);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(5);
    expect(result.newDocument[4]).toBe(42);
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // no base mods
    expect(base[0]).toBe("hi");
    expect(base[4]).toBe(undefined);

    // create non-existent index - 2 level of nesting
    result = jsonpatch.applyOperation(base, xop_idx_path_2, true, false);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(5);
    expect(Array.isArray(result.newDocument[4])).toBe(true);
    expect(result.newDocument[4][2]).toBe("double");
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // no base mods
    expect(base[0]).toBe("hi");
    expect(base[4]).toBe(undefined);

    // create non-existent index - 3 level of nesting
    result = jsonpatch.applyOperation(base, xop_idx_path_3, true, false);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(5);
    expect(Array.isArray(result.newDocument[4])).toBe(true);
    expect(Array.isArray(result.newDocument[4][2])).toBe(true);
    expect(result.newDocument[4][2][1]).toBe("triple");
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // no base mods
    expect(base[0]).toBe("hi");
    expect(base[4]).toBe(undefined);

    // create non-existent index - append element sentinel
    result = jsonpatch.applyOperation(base, xop_idx_append, true, false);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[1]).toBe("appended");
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // no base mods
    expect(base[0]).toBe("hi");
    expect(base[1]).toBe(undefined);

    // create obj at non existent index
    result = jsonpatch.applyOperation(base, xop_nested_prop_path, true, false);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[1]).toEqual({ a: "hello" });
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // no base mods
    expect(base[0]).toBe("hi");
    expect(base[4]).toBe(undefined);

    // create nested obj at non existent index
    result = jsonpatch.applyOperation(
      base,
      xop_nested_prop_path_2,
      true,
      false
    );
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[1]).toEqual({ a: { b: "dog" } });
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // no base mods
    expect(base[0]).toBe("hi");
    expect(base[4]).toBe(undefined);

    // create deep nested array & obj at non existent index /1/1/b/c/0
    result = jsonpatch.applyOperation(
      base,
      xop_deep_nested_idx_path,
      true,
      false
    );
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(Array.isArray(result.newDocument[1])).toEqual(true);
    expect(result.newDocument[1][1]).toEqual({ b: { c: [{ p: "nested" }] } });
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // no base mods
    expect(base[0]).toBe("hi");
    expect(base[4]).toBe(undefined);

    // reject bogus path
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation(
          base,
          {
            op: "x",
            xid: "x-arr2",
            path: "/--/b/--",
            value: "wut?",
            resolve: true,
          },
          true,
          false
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");

    /***************** w/document modifications (4th arg true) ****************/

    let b = base.concat();

    // create non-existent index - 1 level of nesting
    result = jsonpatch.applyOperation(b, xop_idx_path, true, true);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(5);
    expect(result.newDocument[4]).toBe(42);
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // base mods
    expect(b[0]).toBe("hi");
    expect(b[4]).toBe(42);

    // create non-existent index - 2 level of nesting
    b = base.concat();
    result = jsonpatch.applyOperation(b, xop_idx_path_2, true, true);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(5);
    expect(Array.isArray(result.newDocument[4])).toBe(true);
    expect(result.newDocument[4][2]).toBe("double");
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // base mods
    expect(b[0]).toBe("hi");
    expect(Array.isArray(b[4])).toBe(true);
    expect(b[4][2]).toBe("double");

    // create non-existent index - 3 level of nesting
    b = base.concat();
    result = jsonpatch.applyOperation(b, xop_idx_path_3, true, true);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(5);
    expect(Array.isArray(result.newDocument[4])).toBe(true);
    expect(Array.isArray(result.newDocument[4][2])).toBe(true);
    expect(result.newDocument[4][2][1]).toBe("triple");
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // base mods
    expect(b[0]).toBe("hi");
    expect(Array.isArray(b[4])).toBe(true);
    expect(Array.isArray(b[4][2])).toBe(true);
    expect(b[4][2][1]).toBe("triple");

    // create non-existent index - append element sentinel
    b = base.concat();
    result = jsonpatch.applyOperation(b, xop_idx_append, true, true);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[1]).toBe("appended");
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // base mods
    expect(b[0]).toBe("hi");
    expect(b[1]).toBe("appended");

    // create obj at non existent index
    b = base.concat();
    result = jsonpatch.applyOperation(b, xop_nested_prop_path, true, true);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[1]).toEqual({ a: "hello" });
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // base mods
    expect(b[0]).toBe("hi");
    expect(b[1]).toEqual({ a: "hello" });

    // create nested obj at non existent index
    b = base.concat();
    result = jsonpatch.applyOperation(b, xop_nested_prop_path_2, true, true);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(result.newDocument[1]).toEqual({ a: { b: "dog" } });
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // base mods
    expect(b[0]).toBe("hi");
    expect(b[1]).toEqual({ a: { b: "dog" } });

    // create deep nested array & obj at non existent index /1/1/b/c/0
    b = base.concat();
    result = jsonpatch.applyOperation(b, xop_deep_nested_idx_path, true, true);
    expect(result).toBeDefined();
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(2);
    expect(Array.isArray(result.newDocument[1])).toEqual(true);
    expect(result.newDocument[1][1]).toEqual({ b: { c: [{ p: "nested" }] } });
    // existing element still there
    expect(result.newDocument[0]).toBe("hi");
    // base mods
    expect(b[0]).toBe("hi");
    expect(Array.isArray(b[1])).toBe(true);
    expect(Array.isArray(b[1][1].b.c)).toBe(true);
    expect(b[1][1]).toEqual({ b: { c: [{ p: "nested" }] } });

    // reject bogus path
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation(
          base,
          {
            op: "x",
            xid: "x-arr2",
            path: "/--/b/--",
            value: "wut?",
            resolve: true,
          },
          true,
          true
        );
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
  });
});

describe("extended operations support (existing) property removal", function () {
  beforeAll(function () {
    jsonpatch.unregisterAllExtendedOperations();

    const xCfg = {
      arr: function (a, i, d) {
        const rem = a.splice(i, 1);
        return { newDocument: d, removed: rem[0] };
      },
      obj: function (o, k, d) {
        const removed = o[k];
        delete o[k];
        return { newDocument: d, removed };
      },
      validator: () => {},
    };

    jsonpatch.useExtendedOperation("x-rm", xCfg);
  });

  it("should allow removal from objects", function () {
    const base = {
      a: 42,
      b: "hi",
      c: {
        d: 99,
        e: {
          f: "deep prop",
        },
      },
    };
    const base_no_mutate = JSON.parse(JSON.stringify(base));
    const xop = { op: "x", xid: "x-rm", path: "/c/e" };

    // w/out document modifications (4th arg false)
    let result = jsonpatch.applyOperation(base_no_mutate, xop, true, false);
    expect(result.newDocument.c.e).toBe(undefined);
    // previously existing keys should stil exist
    expect(result.newDocument.c.d).toBe(99);
    expect(result.newDocument.a).toBe(42);
    expect(result.newDocument.b).toBe("hi");
    // no changes should have been made to base
    expect(base_no_mutate.c.e).toBeDefined();
    expect(base_no_mutate.c.e.f).toBe("deep prop");
    // previously existing keys should stil exist
    expect(base_no_mutate.c.d).toBe(99);
    expect(base_no_mutate.a).toBe(42);
    expect(base_no_mutate.b).toBe("hi");

    // w/document modifications (4th arg true)
    result = jsonpatch.applyOperation(base, xop, true, true);
    expect(result.newDocument.c.e).toBe(undefined);
    // previously existing keys should stil exist
    expect(result.newDocument.c.d).toBe(99);
    expect(result.newDocument.a).toBe(42);
    expect(result.newDocument.b).toBe("hi");
    // changes should have been made to base
    expect(base.c.e).toBe(undefined);
    // previously existing keys should stil exist
    expect(base.c.d).toBe(99);
    expect(base.a).toBe(42);
    expect(base.b).toBe("hi");
  });

  it("should avoid removal at unresolvable path - obj; undef leaf", function () {
    const base = {
      a: 42,
      b: "hi",
      c: {
        d: 99,
        e: {
          f: "deep prop",
        },
      },
    };
    // only prop 'g' is undefined
    const b = JSON.parse(JSON.stringify(base));
    const xop = { op: "x", xid: "x-rm", path: "/c/e/g" };
    const r = jsonpatch.applyOperation(b, xop, true, true);
    // no changes to base
    expect(r.newDocument).toEqual(base);
  });

  it("should reject removal at unresolvable path - obj; undef parent(s)", function () {
    const base = {
      a: 42,
      b: "hi",
      c: {
        d: 99,
        e: {
          f: "deep prop",
        },
      },
    };
    // all props below 'g' are undefined
    const xop = { op: "x", xid: "x-rm", path: "/c/e/g/h/i" };
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation(base, xop, true);
      })
    ).toThrowError("OPERATION_PATH_UNRESOLVABLE");
  });

  it("should allow removal from arrays", function () {
    const base_arr = [0, 1, 2, 3, 4];
    const base_arr_2 = [0, 1, [2, 3], 4];
    const base_obj = {
      a: {
        b: [9, 8, 7],
      },
      c: "hi",
      d: [5, [6, 7], 8],
    };
    let b = undefined;
    let result = undefined;
    const xop_arr = { op: "x", xid: "x-rm", path: "/2" };
    const xop_arr_nested = { op: "x", xid: "x-rm", path: "/2/1" };
    const xop_obj_arr = { op: "x", xid: "x-rm", path: "/a/b/2" };
    const xop_obj_arr_nested = { op: "x", xid: "x-rm", path: "/d/1/0" };

    /************** w/out document modifications (4th arg false) **************/

    // simple index
    b = base_arr.concat();
    result = jsonpatch.applyOperation(b, xop_arr, true, false);
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(4);
    expect(result.newDocument).toEqual([0, 1, 3, 4]);
    // no changes should have been made to base
    expect(Array.isArray(b)).toBe(true);
    expect(b.length).toBe(5);
    expect(b).toEqual(base_arr);

    // nested index
    b = base_arr_2.concat();
    result = jsonpatch.applyOperation(b, xop_arr_nested, true, false);
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(4);
    expect(Array.isArray(result.newDocument[2])).toBe(true);
    expect(result.newDocument[2].length).toBe(1);
    expect(result.newDocument[2]).toEqual([2]);
    // no changes should have been made to base
    expect(Array.isArray(b)).toBe(true);
    expect(b.length).toBe(4);
    expect(b).toEqual(base_arr_2);

    // remove double nested array
    b = base_arr_2.concat();
    result = jsonpatch.applyOperation(b, xop_arr, true, false);
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(3);
    expect(result.newDocument).toEqual([0, 1, 4]);
    // no changes should have been made to base
    expect(Array.isArray(b)).toBe(true);
    expect(b.length).toBe(4);
    expect(b).toEqual(base_arr_2);

    // remove array element nested in object
    b = JSON.parse(JSON.stringify(base_obj));
    result = jsonpatch.applyOperation(b, xop_obj_arr, true, false);
    expect(Array.isArray(result.newDocument.a.b)).toBe(true);
    expect(result.newDocument.a.b.length).toBe(2);
    expect(result.newDocument.a.b).toEqual([9, 8]);
    // no changes should have been made to base
    expect(b).toEqual(base_obj);

    // remove double nested array element nested in an object
    b = JSON.parse(JSON.stringify(base_obj));
    result = jsonpatch.applyOperation(b, xop_obj_arr_nested, true, false);
    expect(Array.isArray(result.newDocument.d)).toBe(true);
    expect(result.newDocument.d.length).toBe(3);
    expect(result.newDocument.d[1]).toEqual([7]);
    // no changes should have been made to base
    expect(b).toEqual(base_obj);

    /***************** w/document modifications (4th arg true) ****************/

    // simple index
    b = base_arr.concat();
    result = jsonpatch.applyOperation(b, xop_arr, true, true);
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(4);
    expect(result.newDocument).toEqual([0, 1, 3, 4]);
    // changes should have been made to base
    expect(Array.isArray(b)).toBe(true);
    expect(b.length).toBe(4);
    expect(b).toEqual([0, 1, 3, 4]);

    // nested index
    b = base_arr_2.concat();
    result = jsonpatch.applyOperation(b, xop_arr_nested, true, true);
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(4);
    expect(Array.isArray(result.newDocument[2])).toBe(true);
    expect(result.newDocument[2].length).toBe(1);
    expect(result.newDocument[2]).toEqual([2]);
    // changes should have been made to base
    expect(Array.isArray(b)).toBe(true);
    expect(b[2].length).toBe(1);
    expect(b[2]).toEqual([2]);

    // remove double nested array
    b = base_arr_2.concat();
    result = jsonpatch.applyOperation(b, xop_arr, true, true);
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument.length).toBe(3);
    expect(result.newDocument).toEqual([0, 1, 4]);
    // changes should have been made to base
    expect(Array.isArray(b)).toBe(true);
    expect(b.length).toBe(3);
    expect(b).toEqual([0, 1, 4]);

    // remove array element nested in object
    b = JSON.parse(JSON.stringify(base_obj));
    result = jsonpatch.applyOperation(b, xop_obj_arr, true, true);
    expect(Array.isArray(result.newDocument.a.b)).toBe(true);
    expect(result.newDocument.a.b.length).toBe(2);
    expect(result.newDocument.a.b).toEqual([9, 8]);
    // no changes should have been made to base
    expect(b.a.b.length).toBe(2);
    expect(b.a.b).toEqual([9, 8]);

    // remove double nested array element nested in an object
    b = JSON.parse(JSON.stringify(base_obj));
    result = jsonpatch.applyOperation(b, xop_obj_arr_nested, true, true);
    expect(Array.isArray(result.newDocument.d)).toBe(true);
    expect(result.newDocument.d.length).toBe(3);
    expect(result.newDocument.d[1]).toEqual([7]);
    // changes should have been made to base
    expect(b.d[1]).toEqual([7]);
  });

  it("should reject removal at unresolvable path - arr", function () {
    const base = {
      a: 42,
      b: "hi",
      c: {
        d: [99, 100, "abc"],
        e: {
          f: "deep prop",
        },
      },
    };
    //
    const xop = { op: "x", xid: "x-rm", path: "/c/d/4" };
    expect(
      unwrapPatchError(() => {
        jsonpatch.applyOperation(base, xop, true, true);
      })
    ).toThrowError("OPERATION_VALUE_OUT_OF_BOUNDS");
    // no modifications to base
    expect(base).toEqual(base);
  });
});

describe("extended operations support end element sentinels `--`", function () {
  let base_arr;
  let base_obj;
  beforeAll(function () {
    jsonpatch.unregisterAllExtendedOperations();

    base_arr = [
      "hi",
      {
        // "/--"
        a: "A",
        b: [
          0,
          1,
          2,
          {
            // "/--/b/--"
            c: [
              9,
              8,
              7,
              [
                6,
                5,
                4, // "/--/b/--/c/3/--"
              ],
              3,
              2,
              1, // "/--/b/--/c/--"
            ],
          },
        ],
      },
    ];

    base_obj = {
      a: "hi",
      b: [
        [
          // "/b/0"
          1,
          2,
          3, // "/b/0/--"
        ],
        {
          // "/b/--"
          c: [
            1,
            [
              // "/b/--/c/--"
              { d: "deep" },
              [
                1,
                2,
                3, // "/b/--/c/--/--/--"
              ],
            ],
          ],
        },
      ],
    };

    const xCfg = {
      arr: function (a, i, d) {
        const rem = a.splice(i, 1);
        return { newDocument: d, removed: rem[0] };
      },
      obj: function (o, k, d) {
        const removed = o[k];
        delete o[k];
        return { newDocument: d, removed };
      },
      validator: () => {},
    };

    const xCfg2 = {
      arr: function (a, i, d) {
        a[i] = this.value;
        return { newDocument: d };
      },
      obj: function (o, k, d) {
        o[k] = this.value;
        return { newDocument: d };
      },
      validator: () => {},
    };

    jsonpatch.useExtendedOperation("x-rm", xCfg);
    jsonpatch.useExtendedOperation("x-set", xCfg2);
  });

  it("should find and replace appropriate end elements", function () {
    const xop = { op: "x", xid: "x-set", value: 42 };
    let result;

    /************** w/out document modifications (4th arg false) **************/

    /**** root obj is Array ****/

    let b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument[1]).toBe(42);
    // no base mods
    expect(b).toEqual(base_arr);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument[1].b[3]).toBe(42);
    // no base mods
    expect(b).toEqual(base_arr);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--/c/3/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument[1].b[3].c[3][2]).toBe(42);
    // no base mods
    expect(b).toEqual(base_arr);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--/c/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument[1].b[3].c[6]).toBe(42);
    // no base mods
    expect(b).toEqual(base_arr);

    /**** root obj is Object ****/

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/0/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[0][2]).toBe(42);
    // no base mods
    expect(b).toEqual(base_obj);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[1]).toBe(42);
    // no base mods
    expect(b).toEqual(base_obj);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[1].c[1]).toBe(42);
    // no base mods
    expect(b).toEqual(base_obj);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--/0/d";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[1].c[1][0].d).toBe(42);
    // no base mods
    expect(b).toEqual(base_obj);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--/--/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[1].c[1][1][2]).toBe(42);
    // no base mods
    expect(b).toEqual(base_obj);

    /***************** w/document modifications (4th arg true) ****************/

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument[1]).toBe(42);
    // base mods
    expect(b[1]).toBe(42);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument[1].b[3]).toBe(42);
    // base mods
    expect(b[1].b[3]).toBe(42);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--/c/3/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument[1].b[3].c[3][2]).toBe(42);
    // base mods
    expect(b[1].b[3].c[3][2]).toBe(42);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--/c/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument[1].b[3].c[6]).toBe(42);
    // base mods
    expect(b[1].b[3].c[6]).toBe(42);

    /**** root obj is Object ****/

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/0/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[0][2]).toBe(42);
    // base mods
    expect(b.b[0][2]).toBe(42);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[1]).toBe(42);
    // base mods
    expect(b.b[1]).toBe(42);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[1].c[1]).toBe(42);
    // base mods
    expect(b.b[1].c[1]).toBe(42);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--/0/d";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[1].c[1][0].d).toBe(42);
    // base mods
    expect(b.b[1].c[1][0].d).toBe(42);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--/--/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[1].c[1][1][2]).toBe(42);
    // base mods
    expect(b.b[1].c[1][1][2]).toBe(42);
  });

  it("should preform appropriate removals based on end sentinels", function () {
    const xop = { op: "x", xid: "x-rm" };

    /************** w/out document modifications (4th arg false) **************/

    /**** root obj is Array ****/

    //
    let b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--";
    let result = jsonpatch.applyOperation(b, xop, true, false);
    expect(Array.isArray(result.newDocument)).toBe(true);
    expect(result.newDocument[1]).toBe(undefined);
    // no changes should have been made to base
    expect(b).toEqual(base_arr);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument[1].b[3]).toBe(undefined);
    // no base mods
    expect(b).toEqual(base_arr);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--/c/3/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument[1].b[3].c[3][2]).toBe(undefined);
    // no base mods
    expect(b).toEqual(base_arr);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--/c/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument[1].b[3].c[6]).toBe(undefined);
    // no base mods
    expect(b).toEqual(base_arr);

    /**** root obj is Object ****/

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/0/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[0][2]).toBe(undefined);
    // no base mods
    expect(b).toEqual(base_obj);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[1]).toBe(undefined);
    // no base mods
    expect(b).toEqual(base_obj);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[1].c[1]).toBe(undefined);
    // no base mods
    expect(b).toEqual(base_obj);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--/0/d";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[1].c[1][0].d).toBe(undefined);
    // no base mods
    expect(b).toEqual(base_obj);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--/--/--";
    result = jsonpatch.applyOperation(b, xop, true, false);
    expect(result.newDocument.b[1].c[1][1][2]).toBe(undefined);
    // no base mods
    expect(b).toEqual(base_obj);

    /***************** w/document modifications (4th arg true) ****************/

    /**** root obj is Array ****/

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument[1]).toBe(undefined);
    // base mods
    expect(b[1]).toBe(undefined);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument[1].b[3]).toBe(undefined);
    // base mods
    expect(b[1].b[3]).toBe(undefined);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--/c/3/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument[1].b[3].c[3][2]).toBe(undefined);
    // base mods
    expect(b[1].b[3].c[3][2]).toBe(undefined);

    //
    b = JSON.parse(JSON.stringify(base_arr));
    xop.path = "/--/b/--/c/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument[1].b[3].c[6]).toBe(undefined);
    // base mods
    expect(b[1].b[3].c[6]).toBe(undefined);

    /**** root obj is Object ****/

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/0/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[0][2]).toBe(undefined);
    // base mods
    expect(b.b[0][2]).toBe(undefined);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[1]).toBe(undefined);
    // base mods
    expect(b.b[1]).toBe(undefined);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[1].c[1]).toBe(undefined);
    // base mods
    expect(b.b[1].c[1]).toBe(undefined);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--/0/d";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[1].c[1][0].d).toBe(undefined);
    // base mods
    expect(b.b[1].c[1][0].d).toBe(undefined);

    //
    b = JSON.parse(JSON.stringify(base_obj));
    xop.path = "/b/--/c/--/--/--";
    result = jsonpatch.applyOperation(b, xop, true, true);
    expect(result.newDocument.b[1].c[1][1][2]).toBe(undefined);
    // base mods
    expect(b.b[1].c[1][1][2]).toBe(undefined);
  });
});

// Mixed w/RFC-6902 ops
describe("extended operations applied with RFC-6902 ops", function () {
  let base_arr;
  let base_obj;
  let results;

  beforeAll(function () {
    jsonpatch.unregisterAllExtendedOperations();

    const xCfg = {
      arr: function (a, i, d) {
        a[i] = this.value;
        // do this check AFTER the assignment to ensure
        // original object is not mutated when returning undefined
        if (this.value === 77) {
          return undefined;
        }
        return { newDocument: d };
      },
      // This object operator sets key to value UNLESS value === 5, then it forces value of 999.
      // If value === 77, operator should 'No Op'
      obj: function (o, k, d) {
        if (this.value === 5) {
          o[k] = 999;
        } else {
          o[k] = this.value;
        }
        // do this check AFTER the assignment to ensure
        // original object is not mutated when returning undefined
        if (this.value === 77) {
          return undefined;
        }
        return { newDocument: d };
      },
      validator: () => {},
    };

    const xCfg2 = {
      arr: function (a, i, d) {
        const rem = a.splice(i, 1);
        return { newDocument: d, removed: rem[0] };
      },
      obj: function (o, k, d) {
        const removed = o[k];
        delete o[k];
        return { newDocument: d, removed };
      },
      validator: () => {},
    };

    jsonpatch.useExtendedOperation("x-foo", xCfg);
    jsonpatch.useExtendedOperation("x-rm", xCfg2);

    base_arr = [
      "hi",
      {
        // "/--"
        a: "A",
        b: [
          0,
          1,
          2,
          {
            // "/--/b/--"
            c: [
              9,
              8,
              7,
              [
                6,
                5,
                4, // "/--/b/--/c/3/--"
              ],
              3,
              2,
              1, // "/--/b/--/c/--"
            ],
          },
        ],
      },
    ];

    base_obj = {
      a: "hi",
      b: [
        [0, 1, 2],
        {
          c: [1, [{ d: "deep" }, [0, 1, 2]]],
        },
      ],
    };
  });

  it("should add and replace with RFC ops while also modifying with extended ops", function () {
    const ops = [
      { op: "add", path: "/1/b/-", value: 3 },
      { op: "x", xid: "x-foo", path: "/1/b/--", value: "X" },
      { op: "replace", path: "/1/b/4", value: "replaced" },
    ];

    /************** w/out document modifications (4th arg false) **************/

    let b = JSON.parse(JSON.stringify(base_arr));
    results = jsonpatch.applyPatch(b, ops, true, false);
    expect(results.newDocument).toEqual([
      "hi",
      {
        a: "A",
        b: [
          0,
          1,
          2,
          {
            c: [9, 8, 7, [6, 5, 4], 3, 2, 1],
          },
          "replaced",
        ],
      },
    ]);
  });

  it("should respect extended No-Op with RFC ops - root Array", function () {
    const ops = [
      { op: "add", path: "/1/b/-", value: 4 },
      { op: "x", xid: "x-foo", path: "/1/b/--", value: "X" },
      { op: "replace", path: "/1/b/4", value: "replaced" },
      { op: "replace", path: "/1/b/4", value: "replaced again" },
      { op: "x", xid: "x-foo", path: "/1/b/--", value: 77 }, // NoOp
    ];

    const expected = [
      "hi",
      {
        a: "A",
        b: [
          0,
          1,
          2,
          {
            c: [9, 8, 7, [6, 5, 4], 3, 2, 1],
          },
          "replaced again",
        ],
      },
    ];

    let b = JSON.parse(JSON.stringify(base_arr));
    results = jsonpatch.applyPatch(b, ops, true, false);
    expect(results.newDocument).toEqual(expected);
    expect(b).toEqual(base_arr);

    b = [0, 1, 2];
    results = jsonpatch.applyPatch(
      b,
      [{ op: "x", xid: "x-rm", path: "/1" }],
      true,
      false
    );
    expect(results.newDocument).toEqual([0, 2]);
    expect(b).toEqual([0, 1, 2]);

    b = [0, 1, 2];
    results = jsonpatch.applyPatch(
      b,
      [{ op: "x", xid: "x-rm", path: "/--" }],
      true,
      false
    );
    expect(results.newDocument).toEqual([0, 1]);
    expect(b).toEqual([0, 1, 2]);

    /***************** w/document modifications (4th arg true) ****************/

    b = JSON.parse(JSON.stringify(base_arr));
    results = jsonpatch.applyPatch(b, ops, true, true);
    expect(results.newDocument).toEqual(expected);
    expect(b).toEqual(results.newDocument);

    b = [0, 1, 2];
    results = jsonpatch.applyPatch(
      b,
      [{ op: "x", xid: "x-rm", path: "/1" }],
      true,
      true
    );
    expect(results.newDocument).toEqual([0, 2]);
    expect(b).toEqual([0, 2]);

    b = [0, 1, 2];
    results = jsonpatch.applyPatch(
      b,
      [{ op: "x", xid: "x-rm", path: "/--" }],
      true,
      true
    );
    expect(results.newDocument).toEqual([0, 1]);
    expect(b).toEqual([0, 1]);
  });

  it("should respect extended No-Op with RFC ops - root Object", function () {
    const ops = [
      { op: "add", path: "/b/0/-", value: 3 },
      { op: "x", xid: "x-foo", path: "/b/0/--", value: "X" },
      { op: "replace", path: "/b/0/3", value: "replaced" },
      { op: "x", xid: "x-foo", path: "/b/--", value: 77 }, // NoOp
      { op: "replace", path: "/b/0/3", value: "replaced again" },
      { op: "add", path: "/b/1/c/1/0/e", value: { f: "deep nested" } },
      { op: "x", xid: "x-rm", path: "/a" },
    ];

    const expected = {
      b: [
        [0, 1, 2, "replaced again"],
        {
          c: [
            1,
            [
              {
                d: "deep",
                e: { f: "deep nested" },
              },
              [0, 1, 2],
            ],
          ],
        },
      ],
    };

    // top-level removal
    const o = [{ op: "x", xid: "x-rm", path: "/a" }];

    /************** w/out document modifications (4th arg false) **************/

    let b = JSON.parse(JSON.stringify(base_obj));
    results = jsonpatch.applyPatch(b, ops, true, false);
    expect(results.newDocument).toEqual(expected);
    expect(b).toEqual(base_obj);

    // top
    b = { a: "hi", b: 42 };
    results = jsonpatch.applyPatch(b, o, true, false);
    expect(results.newDocument).toEqual({ b: 42 });
    expect(b).toEqual({ a: "hi", b: 42 });

    /***************** w/document modifications (4th arg true) ****************/

    b = JSON.parse(JSON.stringify(base_obj));
    results = jsonpatch.applyPatch(b, ops, true, true);
    expect(results.newDocument).toEqual(expected);
    expect(b).toEqual(results.newDocument);

    // top
    b = { a: "hi", b: 42 };
    results = jsonpatch.applyPatch(b, o, true, true);
    expect(results.newDocument).toEqual({ b: 42 });
    expect(b).toEqual(results.newDocument);
  });
});

describe("misc extended operations", function () {
  let base_arr;
  let base_obj;
  let results;

  beforeAll(function () {
    jsonpatch.unregisterAllExtendedOperations();

    /*
     operation that sums existing values with provided value

     rejects non-numeric type mismatch

     value must be numeric

     operation takes 3 optional additional args:
      args[0] - number, default "accumulator" value when target path is undefined
        default 0
      args[1] - number, minimum final value (inclusive) (default none)
      args[2] - number, maximum final value (inclusive) (default none)
     */

    // this function can apply to both arr and obj
    function xsum(o, k, d) {
      let sum =
        Array.isArray(this.args) && typeof this.args[0] === "number"
          ? this.args[0]
          : 0;

      if (o[k] === undefined) {
        sum += this.value;
      } else if (typeof o[k] !== "number") {
        throw new jsonpatch.JsonPatchError(
          "x-sum op target value is not a number",
          "OPERATION_X_OPERATOR_EXCEPTION",
          undefined,
          this,
          d
        );
      } else {
        sum = o[k] + this.value;
      }

      // check min max
      if (Array.isArray(this.args)) {
        // min
        if (this.args[1] !== undefined) {
          sum = Math.max(sum, this.args[1]);
        }
        // max
        if (this.args[2] !== undefined) {
          sum = Math.min(sum, this.args[2]);
        }
      }

      // update
      o[k] = sum;
      return { newDocument: d };
    }

    const xCfg_sum = {
      arr: xsum,
      obj: xsum,
      validator: (op, i, d, ep) => {
        // validate operation inputs
        if (typeof op.value !== "number") {
          throw new jsonpatch.JsonPatchError(
            "x-sum operation `value` must be a number",
            "OPERATION_VALUE_REQUIRED",
            i,
            op,
            d
          );
        }

        if (Array.isArray(op.args)) {
          if (
            op.args.find((v) => v !== undefined && typeof v !== "number") !==
            undefined
          ) {
            throw new jsonpatch.JsonPatchError(
              "x-sum operation all provided `args` must be a explicitly undefined or a number",
              "OPERATION_X_OP_INVALID",
              i,
              op,
              d
            );
          }
        }
      },
    };

    const xCfg_rm = {
      arr: function (a, i, d) {
        const rem = a.splice(i, 1);
        return { newDocument: d, removed: rem[0] };
      },
      obj: function (o, k, d) {
        const removed = o[k];
        delete o[k];
        return { newDocument: d, removed };
      },
      validator: () => {},
    };

    jsonpatch.useExtendedOperation("x-sum", xCfg_sum);
    jsonpatch.useExtendedOperation("x-rm", xCfg_rm);

    base_arr = [
      "hi",
      {
        // "/--"
        a: "A",
        b: [
          0,
          1,
          2,
          {
            // "/--/b/--"
            c: [
              9,
              8,
              7,
              [
                6,
                5,
                4, // "/--/b/--/c/3/--"
              ],
              3,
              2,
              42, // "/--/b/--/c/--"
            ],
          },
        ],
      },
    ];

    base_obj = {
      a: "hi",
      b: [
        [0, 1, 2],
        {
          c: [1, [{ d: "deep" }, [0, 1, 2]]],
        },
      ],
    };
  });

  it("should run custom sum operator - obj basic", function () {
    let b = JSON.parse(JSON.stringify(base_obj));
    const o = { op: "x", xid: "x-sum", path: "/b/0/1", value: 100 };
    const o2 = { op: "x", xid: "x-sum", path: "/d", value: 200 };
    const o3 = { op: "x", xid: "x-sum", path: "/b/1/e/f", value: 500 };
    let r = undefined;

    /************** w/out document modifications (4th arg false) **************/

    r = jsonpatch.applyOperation(b, o, true, false);
    expect(r.newDocument.b[0][1]).toBe(101);
    expect(b.b[0][1]).toBe(1);

    r = jsonpatch.applyOperation(b, o2, true, false);
    expect(r.newDocument.d).toBe(200);
    expect(b.d).toBe(undefined);

    // reject when resolve == false
    r = undefined;
    b = JSON.parse(JSON.stringify(base_obj));
    expect(
      unwrapPatchError(() => {
        r = jsonpatch.applyOperation(b, o3, true, false);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(r).toBe(undefined);
    expect(b.b[1].e).toBe(undefined);

    // resolve === true
    r = undefined;
    o3.resolve = true;
    r = jsonpatch.applyOperation(b, o3, true, false);
    expect(r.newDocument.b[1].e.f).toBe(500);
    expect(b.b[1].e).toBe(undefined);

    /***************** w/document modifications (4th arg true) ****************/

    b = JSON.parse(JSON.stringify(base_obj));
    r = jsonpatch.applyOperation(b, o, true, true);
    expect(r.newDocument.b[0][1]).toBe(101);
    expect(b.b[0][1]).toBe(101);

    b = JSON.parse(JSON.stringify(base_obj));
    r = jsonpatch.applyOperation(b, o2, true, true);
    expect(r.newDocument.d).toBe(200);
    expect(b.d).toBe(200);

    // reject when resolve == false
    r = undefined;
    o3.resolve = false;
    b = JSON.parse(JSON.stringify(base_obj));
    expect(
      unwrapPatchError(() => {
        r = jsonpatch.applyOperation(b, o3, true, true);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(r).toBe(undefined);
    expect(b.b[1].e).toBe(undefined);

    // resolve === true
    r = undefined;
    o3.resolve = true;
    b = JSON.parse(JSON.stringify(base_obj));
    r = jsonpatch.applyOperation(b, o3, true, true);
    expect(r.newDocument.b[1].e.f).toBe(500);
    expect(b.b[1].e.f).toBe(500);
  });

  it("should run custom sum operator - arr basic", function () {
    let b = JSON.parse(JSON.stringify(base_arr));
    // existing leaf
    const o = { op: "x", xid: "x-sum", path: "/1/b/2", value: 100 };
    // root existing leaf - bad type
    const o2 = { op: "x", xid: "x-sum", path: "/0", value: 200 };
    // deep nesting
    const o3 = { op: "x", xid: "x-sum", path: "/1/b/3/c/3/1", value: 300 };
    // end element sentinel
    const o4 = { op: "x", xid: "x-sum", path: "/1/b/3/c/--", value: 400 };
    // non-existent
    const o5 = { op: "x", xid: "x-sum", path: "/1/d/1/e/f", value: 500 };
    let r = undefined;

    /************** w/out document modifications (4th arg false) **************/

    r = jsonpatch.applyOperation(b, o, true, false);
    expect(r.newDocument[1].b[2]).toBe(102);
    expect(b[1].b[2]).toBe(2);

    // should reject - target value is not a number
    r = undefined;
    expect(
      unwrapPatchError(() => {
        r = jsonpatch.applyOperation(b, o2, true, false);
      })
    ).toThrowError(Error, "OPERATION_X_OPERATOR_EXCEPTION");
    expect(r).toBe(undefined);
    expect(b[0]).toBe("hi");

    r = jsonpatch.applyOperation(b, o3, true, false);
    expect(r.newDocument[1].b[3].c[3][1]).toBe(305);
    expect(b[1].b[3].c[3][1]).toBe(5);

    r = jsonpatch.applyOperation(b, o4, true, false);
    expect(r.newDocument[1].b[3].c[6]).toBe(442);
    expect(b[1].b[3].c[6]).toBe(42);

    // should reject - bad path - resolve == false
    r = undefined;
    expect(
      unwrapPatchError(() => {
        r = jsonpatch.applyOperation(b, o5, true, false);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(r).toBe(undefined);
    expect(b[0]).toBe("hi");

    // resolve === true
    o5.resolve = true;
    r = jsonpatch.applyOperation(b, o5, true, false);
    expect(r.newDocument[1].d[1].e.f).toBe(500);
    expect(b[1].d).toBe(undefined);

    /***************** w/document modifications (4th arg true) ****************/

    b = JSON.parse(JSON.stringify(base_arr));
    r = jsonpatch.applyOperation(b, o, true, true);
    expect(r.newDocument[1].b[2]).toBe(102);
    expect(b[1].b[2]).toBe(102);

    // should reject - target value is not a number
    b = JSON.parse(JSON.stringify(base_arr));
    r = undefined;
    expect(
      unwrapPatchError(() => {
        r = jsonpatch.applyOperation(b, o2, true, true);
      })
    ).toThrowError(Error, "OPERATION_X_OPERATOR_EXCEPTION");
    expect(r).toBe(undefined);
    expect(b[0]).toBe("hi");

    b = JSON.parse(JSON.stringify(base_arr));
    r = jsonpatch.applyOperation(b, o3, true, true);
    expect(r.newDocument[1].b[3].c[3][1]).toBe(305);
    expect(b[1].b[3].c[3][1]).toBe(305);

    b = JSON.parse(JSON.stringify(base_arr));
    r = jsonpatch.applyOperation(b, o4, true, true);
    expect(r.newDocument[1].b[3].c[6]).toBe(442);
    expect(b[1].b[3].c[6]).toBe(442);

    // should reject - bad path - resolve == false
    o5.resolve = false;
    b = JSON.parse(JSON.stringify(base_arr));
    r = undefined;
    expect(
      unwrapPatchError(() => {
        r = jsonpatch.applyOperation(b, o5, true, true);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(r).toBe(undefined);
    expect(b[0]).toBe("hi");

    // resolve === true
    o5.resolve = true;
    b = JSON.parse(JSON.stringify(base_arr));
    o5.resolve = true;
    r = jsonpatch.applyOperation(b, o5, true, true);
    expect(r.newDocument[1].d[1].e.f).toBe(500);
    expect(b[1].d[1].e.f).toBe(500);
  });

  it("should run custom sum operator - obj w/args", function () {
    let b = JSON.parse(JSON.stringify(base_obj));
    // existing path
    const o = { op: "x", xid: "x-sum", path: "/b/0/1", value: 100 };
    // non-existent path
    const o2 = { op: "x", xid: "x-sum", path: "/b/1/e/f", value: 500 };
    let r = undefined;

    /************** w/out document modifications (4th arg false) **************/

    // test minimum
    o.args = [undefined, 125];
    r = jsonpatch.applyOperation(b, o, true, false);
    expect(r.newDocument.b[0][1]).toBe(125);
    expect(b.b[0][1]).toBe(1);

    // test maximum
    o.args = [undefined, undefined, 50];
    r = jsonpatch.applyOperation(b, o, true, false);
    expect(r.newDocument.b[0][1]).toBe(50);
    expect(b.b[0][1]).toBe(1);

    // reject when resolve == false
    r = undefined;
    o2.resolve = false;
    o2.args = undefined;
    b = JSON.parse(JSON.stringify(base_obj));
    expect(
      unwrapPatchError(() => {
        r = jsonpatch.applyOperation(b, o2, true, false);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(r).toBe(undefined);
    expect(b.b[1].e).toBe(undefined);

    // resolve === true
    r = undefined;
    o2.resolve = true;
    // new starting accumulator
    o2.args = [-200];
    r = jsonpatch.applyOperation(b, o2, true, false);
    expect(r.newDocument.b[1].e.f).toBe(300);
    expect(b.b[1].e).toBe(undefined);

    /***************** w/document modifications (4th arg true) ****************/

    // test minimum
    b = JSON.parse(JSON.stringify(base_obj));
    o.args = [undefined, 125];
    r = jsonpatch.applyOperation(b, o, true, true);
    expect(r.newDocument.b[0][1]).toBe(125);
    expect(b.b[0][1]).toBe(125);

    // test maximum
    b = JSON.parse(JSON.stringify(base_obj));
    o.args = [undefined, undefined, 50];
    r = jsonpatch.applyOperation(b, o, true, true);
    expect(r.newDocument.b[0][1]).toBe(50);
    expect(b.b[0][1]).toBe(50);

    // reject when resolve == false
    r = undefined;
    o2.resolve = false;
    o2.args = undefined;
    b = JSON.parse(JSON.stringify(base_obj));
    expect(
      unwrapPatchError(() => {
        r = jsonpatch.applyOperation(b, o2, true, true);
      })
    ).toThrowError(Error, "OPERATION_PATH_UNRESOLVABLE");
    expect(r).toBe(undefined);
    expect(b.b[1].e).toBe(undefined);

    // resolve === true
    b = JSON.parse(JSON.stringify(base_obj));
    r = undefined;
    o2.resolve = true;
    // new starting accumulator
    o2.args = [-200];
    r = jsonpatch.applyOperation(b, o2, true, true);
    expect(r.newDocument.b[1].e.f).toBe(300);
    expect(b.b[1].e.f).toBe(300);
  });

  it("should apply patch of repeated custom sum operations - obj w/args", function () {
    const base = {};
    const patch = [
      { op: "add", path: "/a", value: {} },
      { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 150
      { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 250
      { op: "add", path: "/a/c", value: "hi" }, // a.c === 'hi'
      { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 350
      { op: "replace", path: "/a/c", value: "hello" }, // a.c === 'hello'
      { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 400
    ];

    const expected = {
      a: {
        b: 400,
        c: "hello",
      },
    };

    let r = undefined;

    /************** w/out document modifications (4th arg false) **************/
    let b = JSON.parse(JSON.stringify(base));
    r = jsonpatch.applyPatch(b, patch, true, false);
    expect(r.newDocument.a.b).toBe(400);
    expect(r.newDocument.a.c).toBe("hello");
    expect(b).toEqual({});

    /***************** w/document modifications (4th arg true) ****************/
    b = JSON.parse(JSON.stringify(base));
    r = jsonpatch.applyPatch(b, patch, true, true);
    expect(r.newDocument.a.b).toBe(400);
    expect(r.newDocument.a.c).toBe("hello");
    expect(b).toEqual(expected);
  });
});
