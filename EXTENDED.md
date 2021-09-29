# Extended Patch Operations

> ...or how to add non RFC-6902 operations to your patch chain

## The story so far...

The JSON-Patch library was built first and foremost as a compliant implementation of the RFC-6902 specification, which defines the rules and syntax for modifying (strict) JSON documents.

The RFC includes the following operations:

- **add**
- **copy**
- **move**
- **remove**
- **replace**
- **test**

This allows for basic modification of values/structure relative to the source JSON document. In the vast majority of use-cases this is all one needs. There are limitations to the core funcionality however.

For instance, an RFC-compliant patch operation does not have the ability to perform any logic/transformations relative to the value at a given path. In other words, you are only able to add new/replace existing key-value-pairs and array elements with a **static value supplied in the operation's `value` property**. You can also indiscriminately remove existing values. (assuming a valid path to the target key exists)

The core RFC operations do not care about what the existing values (or absence thereof) mean. Nor should they. The intent of JSON Patch (the specification) is primarily structural in nature. It only cares about operations that make structural modifications (including basic value replacement) to the JSON document.

What if you wanted to do more? What if there were operations that could perform structural and value mutations based on some interpretation of existing values/structure w/in the source document (or the outside world; a.k.a information external to the source JSON itself)?

For example:

- Add `25` to the number at a `path`
- Perform a `toUpperCase` to a string at a `path`
- If value at `path` is === 'foo', replace it with `5`, else leave it as is
- Update value at `path` with current unix timestamp at moment of operation processing
- Conditionally remove or add structure
- Conditionally insert a deeply-nested tree at a currently non-existent path
- Extract information from the document during patching (e.g. logging, reading/parsing for other processes)
- etc.

Enter:

## Extended Operations!

The idea behind extended operations is to enable such scenarios as listed above by allowing a user (of this library) to define their own operations that **"extend"** the functionality already provided by the RFC-6902 specification.

In this way, a user can patch a JSON document with a combination of RFC-compliant operations and their own operations without having to make separate passes or implementing their own JSON Pointer (RFC-6901) parser. Instead, they may simply register the extended operations with the library, and apply a patch including them. The library will route operation handling accordingly (core vs. extended).

### Use of Extended Operations is 100% Opt-In

- The core JSON-Patch API remains unchanged (function signatures are the same)
- By default, JSON-Patch will reject any non-RFC-6902 operations
- Extended Operations **NEVER** change how RFC-6902 operations are processed
- No surprises; Similar conventions; It _should_ be possible to recreate most of the functionality of the RFC-6902 operations as extended operations (although discouraged - keep it DRY, use existing operations when applicable; they're guaranteed to work as described)
- Small API footprint; just a few functions have been added, but they may be ignored if you don't need them.
- All core unit tests pass w/out modification/accommodation for extended operation functionality.

### Extended Operation Object Structure

Extended operation objects are structured very much like their RFC-6902 cousins and must follow specific naming conventions to avoid any ambiguity with RFC ops.

A basic extended operation object **must** include the following **REQUIRED** properties:

- **op** - string literal 'x'; always and only 'x'; indicates extended operation namespace
- **xid** - string; matching the pattern `/x-[a-z0-9-]+$/`; this is the extended operation's id; it is analogous with `op` in the RFC. NOTE: the required prefix `'x-'` is a convention choice to help visually discern extended from RFC ops
- **path** - string; RFC-6901-_ish_ (more about this below) JSON Pointer path

##### Example Basic Extended Operation Object (as JSON)

```json
{ "op": "x", "xid": "x-foo", "path": "/a/2/b" }
```

As you can see it's not much different from the RFC ops.

Extended operation objects may also include the following **OPTIONAL** properties:

- **value** - any type; (`undefined` is treated as not present); Unlike some RFC ops, this prop is optional as it is up to the operation's implementation whether or not it is used. [**default**: `undefined`]
- **args** - Array&lt;any type&gt;; (`undefined` is treated as not present. Individual `undefined` elements are allowed however - in JS). The args array is a way for additional data to be passed along to the associated operator function(s) that implement the logic of the extended operation. It can be thought of as an extension to the `value` property of RFC ops; for convenience. It's up to the developer to determine if/how `args` are used. [**default**: `undefined`]
- **resolve** - boolean; Flag to allow for non-existent paths to be **CREATED** (or "resolved") before invoking the operator function. [**default**: `false`] (more about this below)

##### Example Advanced Extended Operation Object (as JSON)

```json
{
  "op": "x",
  "xid": "x-bar",
  "path": "/a/b/c",
  "value": 42,
  "args": [null, 54, "<"],
  "resolve": true
}
```

That's still fairly compact and similar to the RFC ops.

## RFC-6901 (JSON Pointer Extensions)

Path strings are defined by the RFC-6901 specification. Extended operations resolve paths just like their RFC-6902 counterparts, but with a couple of additions of note:

- **'/'** A single slash path is **NOT** allowed for extended operations since its interpretation is ambiguous without knowing what the corresponding operator(s) are intended to do; e.g. replace top-level document or make changes at the root of the top-level document, etc.

- **'--'** (double dash) **applies to Arrays only**; This is the _"end element sentinel"_ It is a dynamic placeholder for the last existing (highest) index of an array. This is **NOT** RFC-6901 compliant; It only applies to extended operation paths. It is a cousin to the **'-'** (single dash) "append sentinel" _(which represents the index after the last existing element)_ Note: if used on an object, it will represent a literal double dash key name.

#### End Element Sentinel Examples

```js
const arr = [0, 1, 2, 3, 4];
// this path represents index 4 relative to 'arr'
const path = "/--"; // gets transformed to '/4'

// may be nested
const arr2 = [0, 1, 2, 3, [4, "hi"]];
// represents path to value 'hi'
const path2 = "/--/--"; // gets transformed to '/4/1

// also works with arrays nested in objects and vice versa
const obj = {
  a: {
    b: [
      "hi",
      {
        c: [0, 1, 2],
        d: "foo",
      },
    ],
  },
};
// represents nested array element with value 2
const path3 = "/a/b/--/c/--"; // gets transformed to '/a/b/1/c/2'
```

# Extended Operation Configuration - Creating Your Own Custom Extended Operations

In a nutshell, creating an extended operation involves authoring a JavaScript `Object` with exactly `3` specific properties:

- **'arr'**
- **'obj'**
- **'validator'**

The TypeScript signature for this object is:

```ts
interface ExtendedMutationOperationConfig<T> {
  readonly arr: ArrayOperator<T, OperationResult<T> | undefined>;
  readonly obj: ObjectOperator<T, OperationResult<T> | undefined>;
  readonly validator: Validator<T>;
}
```

ALL values for these properties are **required** to be `functions` (shown types will be discussed later)

### Operators

Properties `arr` and `obj` are called "**operators**", or "operator functions". These functions define the (potential) mutation behavior of the **Extended Operation** with respect to the type of object at the given '_`path`_'; `Array` or `Object` ('arr' or 'obj', respectively)

Operators **must** return an `Object` with the following signature:

```ts
// return type
type ExtendedOperationResult<T> = OperationResult<T> | undefined;

// where OperationResult ===
interface OperationResult<T> {
  removed?: any;
  newDocument: T;
}
```

#### Operator: Function vs. Arrow Function

**IMPORTANT!!!**
When defining your operator functions, you should use [traditional function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function)
**NOT** [arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

Operator functions are invoked via `Function.prototype.call` in order to provide the context of the `extended operation object` as `this` inside of the operator function. Arrow functions are not `Function Objects` proper, and do not allow `call`-ing with context other than any closures that may have been created at the scope on which they were defined.

Arrow functions **WILL NOT** have access to the operation object by using '`this.<prop>`'

#### Array Operator

The array operator (identified by property '`arr`') is a JavaScript `function` with the following signature:

```ts
interface ArrayOperator<T> {
  (arr: Array<T>, i: number, document: T): ExtendedOperationResult<T>;
}
```

- **arr** - is a reference to the current parent object (Array) at the given `path`. This is the array that may be mutated by the operator at index `i`. (this represents the 2nd to last path component in the source document)
- **i** - the numeric index (or key) to be mutated/inspected
- **document** - this is the root-level source document to which `arr` belongs. It should be treated as _read only_ (though there's nothing enforcing this) Modifications should only be made to `arr` at index `i`.

##### example arr operator

```js
// assume extended operator object is
const xop = {op: 'x', xid: 'x-foo', path: '/0', value: 'hi'};

// source document is
const source = ['first'];

const config = {
  /** arr OPERATOR
   *  this operator adds/replaces value at path
   */
  arr: function(arr, i, document) {
    arr[i] = this.value; // this.value === 'hi'; 'this' is the 'xop' object above
    return { newDocument: document };
  };
  /* ...rest of config... */
};

// the result of this operation when applied to source array is
['hi']
```

**Note**: `document` is mutated by the assignment of `arr[i]` since `arr` is a reference to an array object nested somewhere within the document (in this case they are the same reference). The 'root' ref of the modified document must be returned. By convention, you should always return the `document` as `newDocument`.

#### Object Operator

The object operator (identified by property '`obj`') is a JavaScript `function` with the following signature:

```ts
interface ObjectOperator<T> {
  (obj: T, key: string, document: T): ExtendedOperationResult<T>;
}
```

- **obj** - is a reference to the current parent object (Object) at the given `path`. This is the object that may be mutated/inspected by the operator at key `key`. (this represents the 2nd to last path component in the source document)
- **key** - the string property name (or key) to be mutated/inspected
- **document** - this is the root-level source document to which `obj` belongs. It should be treated as _read only_ (though there's nothing enforcing this) Modifications should only be made to `obj` at `key`.

##### example obj operator

```js
// assume extended operator object is
const xop = {op: 'x', xid: 'x-foo', path: '/a/b/c', value: 'hi'};

// source document is
const source = {
  a: {
    b: {},
  },
};

const config = {
  /** obj OPERATOR
   * this operator adds/replaces value at path
   */
  obj: function(obj, key, document) {
    obj[key] = this.value; // this.value === 'hi'; 'this' is the 'xop' object above
    return { newDocument: document };
  };
  /* ...rest of config... */
};

// the result of this operation when applied to source array is
{
  a: {
    b: {
      c: 'hi',
    },
  },
}
```

**Note**: `document` is mutated by the assignment of `obj[key]` since `obj` is a reference to an object nested somewhere within the document. The 'root' ref of the modified document must be returned. By convention, you should always return the `document` as `newDocument`.

### Signaling a "No Op" - Making No changes

A distinguishing feature of extended operations is that they allow their operators to determine whether or not to perform a mutation at all without having to terminate the patch with an `Error` (exception).

An operator may perform some conditional check first and then decide that no modifications are necessary by explicitly returning `undefined` _instead_ of an `Object` with a 'newDocument' property.

**NOTE**: missing path components created via "**forced path resolution**" (see below) will not persist when the operator returns `undefined`; ensuring that it is a true "No Op" with no side effects.

### Item Removal

It is possible for an operator to remove a value at `i` or `key`. However, nothing prevents your operator implementation from removing other things **"off-path"**. But the chances of these removals actually propagating to the final result document are not great.

It's best to stick with **ONLY** removing the item at `arr[i]` or `obj[key]` should you need to do so. And even then, the RFC spec already provides operations to do just that. Extended operations with removals can be useful in cases where you may want to perform removal based upon some condition that can only be determined when patching is executing.

If you do remove something at the given path, **ALWAYS INCLUDE** a non-`undefined` value for the property `removed` in your operator's return value (Object) In most cases this should be the value of the thing that was removed. The extended operation processor itself does not care what the actual value is (but your callers might). The processor will look for any non-`undefined` value in order to perform some extra housekeeping in order to preserve the removal in the final result of the patch.

```js
// e.g. operator return value includes the removed value
return { newDocument: document, removed: 42 };
```

#### Nota Bene

In most cases you should be using the standard RFC-6902 `remove` and `move` operations for their associated purposes. The extended operation processor is **NOT** able to determine the intention behind your operator implementations, and as such it cannot always determine which parts of the document tree have been removed and will output an erroneous patched result document when "off-path" removals have occured during processing.

Also, removal on a non-existent path (via "forced path resolution" or not) results in an `Error`. You can't remove something that doesn't exist.

### Operator Errors

Should you encounter a condition in which you'd like your operator to signal a **termination** of the entire patching process (as opposed to skipping the operation with a No Op), simply throw an `Error` from your operator function.

It is recommended to throw `JsonPatchError` and use the error name '`OPERATION_X_OPERATOR_EXCEPTION`' (defined in [src/helpers.ts](src/helpers.ts)) to better identify the source of problems.

### Validator Function

The validator function is an extension to JSON-Patch's (the library) default operation validation. This function is not required to be implemented, but is required to exist in the extended operation's configuration object.

The signature of the validator is:

```ts
interface Validator<T> {
  (
    operation: Operation,
    index: number,
    document: T,
    existingPathFragment: string
  ): void;
}
```

The parameters are:

- **'operation'** - the `extended operation object`
- **'index'** - not always present - when bulk validating a patch, the current index of the operation object in the patch array
- **'document'** - the source document tree
- **'existingPathFragment'** - not always present - current path during path resolution phase of current patch operation

Note that the validator function does not return a value. This is because a validator's purpose is to ensure the `operation object` is valid against its intended purpose as well as the state of the source document. In other words, an invalid state indicates that there is an error and the patching process should be terminated.

Therefore, the implementation of a validator must throw an `Error` when an invalid state is detected. Return values are ignored.

In most cases the validator should be used to check the values in the `extended operation object` against the operational semantics of the operation. In other words, "Do the values of props `value` and/or `args` make sense in the context of this operation?"

#### Example Validator Function

```js
validator: (op, i, d, ep) => {
  // validate operation inputs
  if (typeof op.value !== "number") {
    throw new jsonpatch.JsonPatchError(
      "x operation `value` must be a number",
      "OPERATION_VALUE_REQUIRED",
      i,
      op,
      d
    );
  }
};

// the validator above would reject the following operation object:
{op: 'x', xid: 'x-bad', path: '/a/b/c', value: 'hi there'}
```

**NOTE**: unlike operator functions, a validator function **MAY** be implemented as an `arrow function` (and probably should be)

#### Example "bypass" Validator

You might not need/want to implement any additional validation for your extended operation. In this case, just supply an empty function (reminder: a validator function must always be included in a config object, even if it doesn't do anything):

```js
const cfg = {
  /* ... operator functions ... */

  // No Op validator - a function value is always required
  validator: () => {},
};
```

# Resolving Non-Existent Path Components - Forced Path Resolution

Extended operations allow for actions to be performed at paths that do not exist on the current source document being patched (if desired). This is called "forced path resolution", and is flagged by passing the KVP '`resolve: true`' along with the extended operation in question:

```js
{resolve: true, /*other op properties...*/}
```

**By DEFAULT, extended operations set `resolve = false` when not present in the operation object**.

When `resolve === true`, if any `path` component (below root) is not present in the source document, the corresponding object structure will be created in order to resolve the path down to the final "leaf" component.

#### Example of Forced Path Resolution

```js
// starting source document
const d = {
  a: {
    b: "hi",
  },
};

// non-existent path @ 'c'
const path = "/a/c/d";

// when resolve === true, the missing structure will be created
const out = {
  a: {
    b: "hi",
    c: {}, // object now exists at /a/c as a potential parent for key 'd'
  },
};
```

**NOTE**: in order for a path component to be "force resolved", it **MUST NOT** already exist in the source document. Forced path resolution will **NOT** replace existing document structure. The operaton will be rejected with a `JsonPathError`.

**NOTE2**: Strictly speaking, when dealing with JavaScript objects (beyond what is representable by JSON) forced path resolution may add properties and object trees to the target; so any JavaScript `Object`-like thing, as long as it is not sealed or frozen, etc., can be mutated, and things may wind up in places you do not expect (via custom getters/setters, indexers, etc.). Be mindful of object references when dealing with source JS objects that are not just "freshly parsed JSON documents"

## Resolving when top-level doc is Array vs. Object

The behavior of `resolve` differs with the type of the **root** (source) document. When the source doc is an `Object` proper (not an Array), the missing path components are created as empty Objects `{}`.

**NOTE**: numeric keys (path components) ex: '`/a/2/1/c`' will be treated as `string properties` when resolving `Object` paths; like so:

```js
// start with source document (Object) {a: {b: 'foo'}}
// a resolved path of '/a/2/1/c' results in the following structure:
const result = {
  a: {
    b: "foo",
    // Object @ key "2"
    2: {
      // Object @ key "1"
      1: {},
    },
  },
};
```

### When Source Document is Array

Resolving missing path components when the source document is an `Array` results in additional nested `Arrays` being created at the corresponding path components.

For example:

```js
// source Array is ['hi'] ; length 1
// path to resolve is '/4/2/1'
// resolved result is:
const result = ["hi", , , , [, , []]];
```

The missing elements in the example aren't typos. Those are "empty" elements as defined by JavaScript - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Array

The rule is that a sparse array is created for each missing path component. The algorithm uses '`new Array(idx + 1)`' to ensure capacity of at least a length required to accommodate an insertion at the given path (index). The sparse nature of the array will not occupy additional space (memory) even for large capacities.

**Note**: Be careful when serializing to JSON from JS after resolving Array paths. Empty elements are translated into `null` values in JSON. It is possible to cause the size of the resulting JSON file to increase by a significant amount.

## When in doubt...

Don't try to "force resolve" paths into complex structures in cases where instead using the RFC `add` operation will produce the desired result. Forced path resolution is useful in cases when diffrent operation behavior is necessary depending upon the existence of structure in the source document (e.g. create/replace vs. update); which isn't possible with the standard RFC ops. Use the resolve feature only when necessary; YMMV.

# Extended Operations API

As stated above, extended operation functionality is 100% opt-in. This is done by "registering" your custom operation configs with the JSON-Patch library.

### Once Extended Ops are registered, you use the standard API as you would with regular RFC operations.

**reminder**: Only the following JSON-Patch functions are compatible with _registered_ extended operations:

```js
jsonpatch.applyOperation(/* ... */);

jsonpatch.applyPatch(/* ... */);

jsonpatch.applyReducer(/* ... */);

jsonpatch.validator(/* ... */);

jsonpatch.validate(/* ... */);
```

The extended operation API adds a single function that registers an extended operation configuration. You call this once per extended operation you wish to register.

The extended API also includes a couple of convenience functions to help manage your extensions.

#### `function useExtendedOperation<T>(xid: string, config: ExtendedMutationOperationConfig<T>): void`

Registers an extended operation (configuration object) `config` with the library with operation id `xid`.

**This is the only function required to "opt-in" to using extended operations**; Called once per extended operation you wish to use. i.e. once an extended operation is registered, you do not need to call this function again at any point for the same operation. (unless, of course extended operations have been unregistered - see below)

(re)Registering a previously-registered (same `xid`) **replaces** the existing configuration with the new `config`.

Will throw an error if `xid` or `config` are invalid.

#### `function hasExtendedOperation(xid: string): boolean`

A convenience function to inspect the extended operation registry for the existence of a user-defined operation with id `xid`

#### `function unregisterAllExtendedOperations(): void`

A convenience function to remove all registered extended operations from the library.

This is mostly useful during unit testing.

## Extended Operation Error Names

In addition to the core library exceptions, Extended Operations introduce a few more possibilities to help when debugging: (note: Error messages vary)

| Error name                     | Description                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| OPERATION_X_ARGS_NOT_ARRAY     | `args` was provided a value (in an extended operation object) and is not an array                                  |
| OPERATION_X_OP_INVALID         | `xid` was not found in extended operations registry                                                                |
| OPERATION_X_CONFIG_INVALID     | Extended operation configuration object has an invalid/missing `arr`, `obj`, or `validator` property               |
| OPERATION_X_ID_INVALID         | Extended operation `xid` is missing or does not follow the '`x-`' prefix convention                                |
| OPERATION_X_AMBIGUOUS_REMOVAL  | `arr` operator reported a removal (returned a `removed` value) when the operation object specified `resolve: true` |
| OPERATION_X_OPERATOR_EXCEPTION | Intended to be used by developers when throwing an error from their custom extended operator functions             |

# Core Lib Interop Note

Extended Operations are NOT compatible with (will not be considered) when performing the following core JSON-Patch API calls:

```js
/* these core API functions will NOT include ANY registered/unregistered extended operations*/

jsonpatch.observe(/* ... */);

jsonpatch.unobserve(/* ... */);

jsonpatch.generate(/* ... */);

jsonpatch.compare(/* ... */);
```

Unlike the well-known RFC-6902 operations, there is no way to determine what an extended operation will do without executing it. Technically, the user-defined extended operator functions are possibly non-invertable anyway with no way to derive a suitable "undo". They are a black-box to the library with their semantics only exposed through developer documentation. (you did document your operations, didn't you?)

# Limitations

The intent behind extended operations is to **AUGMENT** the functionality provided by the core JSON Patch spec (RFC-6902). Therefore, extended operations are expected to respect the _spirit_ of the RFC.

Extended operations should only mutate at the given path (if they mutate at all) not perform multiple mutations at parts of the document tree unrelated to the provided `path`. Extended operations should also not duplicate the exact functionality of an existing RFC operation. Use standard existing ops when possible.

### TL;DR

#### What it IS:

> A simple way to have patch operations that change their behavior based on values in the source document; a way to do "dynamic" patching along side of the standard RFC operations.

#### What it ISN'T:

> A replacement for complex JSON/JS Object parsing/traversal/manipulation tools. Keep it simple. Use the right tools for the job.

### Best Practices

- **It is best to keep things simple when implementing your own extended operations** as complex computations and manipulations will hinder performance and be difficult to test/validate.

- **Always prefer a standard RFC-6902 operation over a custom extended implementation if it will do what you need**; no need to reinvent the wheel

- **Stick with operations that update/add/replace instead of remove/move** - in most cases you should be using the RFC `remove` and `move` operations for their associated purposes. The extended operation processor is **NOT** able to determine the intention behind your operator implementations, and as such it cannot always determine which parts of the document tree have been removed and will output an erroneous patched result document when "off-path" removals have occured during processing.

- **Do NOT mix addition of properties/values with removal of properties** - per above, it is impossible to determine what has been removed/added if outside the given `path` target. Stick with RFC-compliant removal ops when needed.

- **Beware JS-to-JSON and JSON-to-JS serialization** - Keep in mind how you are using the results of an extended operation. Only a subset of JS values properly serialize into JSON; can be parsed back to JS. Values for the properties `value` and `args` may include any valid JS value; But not all of these values will be representable in JSON when serializing the operation objects themselves, or the resulting mutated document tree.

- **Extended Operations are Black Boxes** - If you are creating extended operations for later use, or planned distribution to other developers, at a minimum, you must document their functionality including inputs, output, intention/usage, pre-conditions, etc. **Distribute a unit test suite with your extended operation configurations** to provide working examples of your operations in action along with documentation of what is and isn't supported by their use.

- **Always Enable Validation** - It is recommended to always set `applyOperation` to use validation (3rd argument `true`)

# Example Extended Operation Implementations

These examples represent the kind of mutations that are best suited for implementation as extended operations.

## Basic Summation Operation

Suppose you are patching some documents and instead of just replacing some numbers, you'd like to update the numbers according to their current values while patching (maybe you've got a simple database of prices that is represented as a JSON document, and you need to increase/decrease certain values by a specific amount; in bulk). This extended operation configuration allows for summing existing values with a provided value.

```js
/*
 This function applies to both arr and obj and is defined separately.

 The operation it represents adds an existing number with a number
 provided in the operation object.

 If the value at the target path is not of type number, then No Op

 - value may be +/-
*/
function xsum(o, k, d) {
  if (typeof o[k] !== "number") {
    // No Op
    return undefined;
  }

  // update
  o[k] = o[k] + this.value;
  return { newDocument: d };
}

/* Create the operation config object */
const xcfg = {
  // arr and obj share same logic
  arr: xsum,
  obj: xsum,
  // custom validator ensures that the operation object has a numeric `value` property
  validator: (op, i, d) => {
    if (typeof op.value !== "number") {
      throw new jsonpatch.JsonPatchError(
        "x-sum operation `value` must be a number",
        "OPERATION_VALUE_REQUIRED",
        i,
        op,
        d
      );
    }
  },
};

/* Register the configuration object with the library with the id 'sum' */
jsonpatch.useExtendedOperation("x-sum", xcfg);
```

```js
/* ---EXPECTED BEHAVIOR--- */

/* EXAMPLE #1
given a source document of: */
{
  a: 5
}

// and an operation object:
{op: 'x', xid: 'x-sum', path: '/a', value: 12}

// the result of the extended operation would yield:
{
  a: 17
}

/* EXAMPLE #2
this operation would result in an error because the value property is not a number: */
{op: 'x', xid: 'x-sum', path: '/a', value: 'i am not a numeric type'}

/* EXAMPLE #3
given this source document: */
[1, 'hello']

// and an operation object:
{op: 'x', xid: 'x-sum', path: '/1', value: 4}

// the result of the extended operation would yield:
[1, 'hello']

// No changes were made because the value at the specified path was not numeric
```

## Advanced Summation Operation

To demonstrate that more sophisticated behavior is possible with extended operations this example extends the summation task from above by adding more control over the numeric results by passing additional values in the operation object as `args`.

Here we specify `args` as follows:

- **args[0]** numeric - a "default/starting value" to use when value at `path` is not present
- **args[1]** numeric - a minimum (inclusive) value that the result must not fall below after the summation
- **args[2]** numeric - a maximum (inclusive) value that the result must not rise above after the summation

**Note**: all args are implemented as _optional_ with the following defaults:

- default 'missing' value 0
- no minimum enforced
- no maximum enforced

```js
/*
 This function applies to both arr and obj and is defined separately.

 The operation it represents adds an existing number with a number
 provided in the operation object.

  - If the value at the target path is not present (undefined), use default value before performing the summation
 
 - If the value at the target path is not of type number, throw an error

 - allow for user-specified min and/or max values of the final result
*/
function xsum2(o, k, d) {
  // start with a default offset of 0 or user-provided in args
  let sum =
    Array.isArray(this.args) && typeof this.args[0] === "number"
      ? this.args[0]
      : 0;

  // target is not present
  if (o[k] === undefined) {
    sum += this.value;
  }
  // target exists, but is not numeric
  else if (typeof o[k] !== "number") {
    throw new jsonpatch.JsonPatchError(
      "x-sum op target value is not a number",
      "OPERATION_X_OPERATOR_EXCEPTION",
      undefined,
      this,
      d
    );
  }
  // add existing with provided value
  else {
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

/* Create the operation config object */
const xcfg2 = {
  // arr and obj share same logic
  arr: xsum2,
  obj: xsum2,
  // custom validator ensures valid inputs in the operation object
  validator: (op, i, d, ep) => {
    // validate operation input value
    if (typeof op.value !== "number") {
      throw new jsonpatch.JsonPatchError(
        "x-sum2 operation `value` must be a number",
        "OPERATION_VALUE_REQUIRED",
        i,
        op,
        d
      );
    }

    // validate args if present
    if (Array.isArray(op.args)) {
      if (
        op.args.find((v) => v !== undefined && typeof v !== "number") !==
        undefined
      ) {
        throw new jsonpatch.JsonPatchError(
          "x-sum2 operation all provided `args` must be a explicitly undefined or a number",
          "OPERATION_X_OP_INVALID",
          i,
          op,
          d
        );
      }
    }
  },
};

/* Register the configuration object with the library with the id 'sum2' */
jsonpatch.useExtendedOperation("x-sum2", xcfg2);
```

```js
---EXPECTED BEHAVIOR---

EXAMPLE #1

// Given a source document of {}

// And a patch consisting of several operations
[
  { op: "add", path: "/a", value: {} },
  { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 150
  { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 250
  { op: "add", path: "/a/c", value: "hi" }, // a.c === 'hi'
  { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 350
  { op: "replace", path: "/a/c", value: "hello" }, // a.c === 'hello'
  { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 400
];

// The expected results of `jsonpatch.applyPatch` are
{
  a: {
    b: 400,
    c: "hello",
  },
};

EXAMPLE #2

// The same results could be achieved by "force resolving" the path '/a/b' instead of first creating it with an RFC 'add' operation:
[
  // { op: "add", path: "/a", value: {} },
  {
    resolve: true, op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400],
  }, // a.b === 150
  { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 250
  { op: "add", path: "/a/c", value: "hi" }, // a.c === 'hi'
  { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 350
  { op: "replace", path: "/a/c", value: "hello" }, // a.c === 'hello'
  { op: "x", xid: "x-sum", path: "/a/b", value: 100, args: [50, 100, 400] }, // a.b === 400
];

```
