JSON-Patch
===============

> A leaner and meaner implementation of JSON-Patch. Small footprint. High performance.

[![Build Status](https://travis-ci.org/Starcounter-Jack/JSON-Patch.svg?branch=master)](https://travis-ci.org/Starcounter-Jack/JSON-Patch)

With JSON-Patch, you can:
- **applyPatch** to apply patches
- **applyOperation** to apply single operations
- **validate** a sequence of patches
- **observe** for changes (and generate patches when a change is detected)
- **compare** two objects (to obtain the difference).

## Why you should use JSON-Patch

JSON-Patch [(RFC6902)](http://tools.ietf.org/html/rfc6902) is a standard format that
allows you to update a JSON document by sending the changes rather than the whole document.
JSON Patch plays well with the HTTP PATCH verb (method) and REST style programming.

Mark Nottingham has a [nice blog]( http://www.mnot.net/blog/2012/09/05/patch) about it.

## Footprint
4 KB minified and gzipped (12 KB minified)

## Performance

##### [`add` benchmark](https://run.perf.zone/view/JSON-Patch-Add-Operation-1500650502896)

![image](https://user-images.githubusercontent.com/17054134/28513264-b0c8eede-7055-11e7-8204-4536d871e971.png)

##### [`replace` benchmark](https://run.perf.zone/view/JSON-Patch-Replace-Operation-1500645548223)

![image](https://user-images.githubusercontent.com/17054134/28513298-d8c927a0-7055-11e7-9a4e-2da024655ac0.png)

Tested on 24.07.2017. Compared libraries:

- [Starcounter-Jack/JSON-Patch](https://www.npmjs.com/package/fast-json-patch) 2.0.4
- [bruth/jsonpatch-js](https://www.npmjs.com/package/json-patch) 0.6.1
- [dharmafly/jsonpatch.js](https://www.npmjs.com/package/jsonpatch) 3.0.0
- [jiff](https://www.npmjs.com/package/jiff) 0.7.3

We aim the tests to be fair. Our library puts performance as the #1 priority, while other libraries can have different priorities. If you'd like to update the benchmarks or add a library, please fork  the [perf.zone](https://perf.zone) benchmarks linked above and open an issue to include new results.

## Features
* Allows you to apply patches on object trees for incoming traffic.
* Allows you to freely manipulate object trees and then generate patches for outgoing traffic.
* Tested in IE 8-11, Firefox, Chrome, Safari and Node.js


## Install

Install the current version (and save it as a dependency):

### npm

```sh
$ npm install fast-json-patch --save
```
### bower

```sh
$ bower install fast-json-patch --save
```

### [download as ZIP](https://github.com/Starcounter-Jack/JSON-Patch/archive/master.zip)


## Adding to your project

### In a web browser

Include `dist/fast-json-patch.js`.

### In Node.js

Call require to get the instance:

```js
var jsonpatch = require('fast-json-patch')
```

Or use ES6 style:

```js
import { applyOperation } from 'fast-json-patch'
```

You can also require all API functions individually, all jsonpatch functions can be used as pure functions:

```js
const { applyOperation } = require('fast-json-patch');
```

## Usage

#### Applying patches:

```js
var document = { firstName: "Albert", contactDetails: { phoneNumbers: [] } };
var patch = [
  { op: "replace", path: "/firstName", value: "Joachim" },
  { op: "add", path: "/lastName", value: "Wester" },
  { op: "add", path: "/contactDetails/phoneNumbers/0", value: { number: "555-123" }  }
];
document = jsonpatch.applyPatch(document, patch).newDocument;
// document == { firstName: "Joachim", lastName: "Wester", contactDetails: { phoneNumbers: [{number:"555-123"}] } };
```

##### For apply individual operations you can use `applyOperation`

`jsonpatch.applyOperation` accepts a single operation object instead of a sequence, and returns the object after applying the operation. It works with all the standard JSON patch operations (`add, replace, move, test, remove and copy`).

```js
var document = { firstName: "Albert", contactDetails: { phoneNumbers: [] } };
var operation = { op: "replace", path: "/firstName", value: "Joachim" };
document = jsonpatch.applyOperation(document, operation).newDocument;
// document == { firstName: "Joachim", contactDetails: { phoneNumbers: [] }}
```

#### Using `applyReducer` with `reduce`

If you have an array of operations, you can simple reduce them using `applyReducer` as your reducer:

```js
var document = { firstName: "Albert", contactDetails: { phoneNumbers: [ ] } };
var patch = [
  { op:"replace", path: "/firstName", value: "Joachim" },
  { op:"add", path: "/lastName", value: "Wester" },
  { op:"add", path: "/contactDetails/phoneNumbers/0", value: { number: "555-123" } }
];
var updatedDocument = patch.reduce(applyReducer, document);
// updatedDocument == { firstName:"Joachim", lastName:"Wester", contactDetails:{ phoneNumbers[ {number:"555-123"} ] } };
```

Generating patches:

```js
var document = { firstName: "Joachim", lastName: "Wester", contactDetails: { phoneNumbers: [ { number:"555-123" }] } };
var observer = jsonpatch.observe(document);
document.firstName = "Albert";
document.contactDetails.phoneNumbers[0].number = "123";
document.contactDetails.phoneNumbers.push({ number:"456" });
var patch = jsonpatch.generate(observer);
// patch  == [
//   { op: "replace", path: "/firstName", value: "Albert"},
//   { op: "replace", path: "/contactDetails/phoneNumbers/0/number", value: "123" },
//   { op: "add", path: "/contactDetails/phoneNumbers/1", value: {number:"456"}}
// ];
```

Comparing two object trees:

```js
var documentA = {user: {firstName: "Albert", lastName: "Einstein"}};
var documentB = {user: {firstName: "Albert", lastName: "Collins"}};
var diff = jsonpatch.compare(documentA, documentB);
//diff == [{op: "replace", path: "/user/lastName", value: "Collins"}]
```

Validating a sequence of patches:

```js
var obj = {user: {firstName: "Albert"}};
var patches = [{op: "replace", path: "/user/firstName", value: "Albert"}, {op: "replace", path: "/user/lastName", value: "Einstein"}];
var errors = jsonpatch.validate(patches, obj);
if (errors.length == 0) {
 //there are no errors!
}
else {
  for (var i=0; i < errors.length; i++) {
    if (!errors[i]) {
      console.log("Valid patch at index", i, patches[i]);
    }
    else {
      console.error("Invalid patch at index", i, errors[i], patches[i]);
    }
  }
}
```

## API

#### `jsonpatch.applyPatch<T>(document: any, patch: Operation[], validateOperation: Boolean | Function = false): OperationResult<T>[]`

Applies `patch` array on `obj`.

An invalid patch results in throwing an error (see `jsonpatch.validate` for more information about the error object).

It modifies the `document` object and `patch` - it gets the values by reference.
If you would like to avoid touching your values, clone them: `jsonpatch.applyPatch(document, jsonpatch.deepClone(patch))`.

Returns an array of [`OperationResult`](#operationresult-type) objects - one item for each item in `patches`, each item is an object `{newDocument: any, test?: boolean, removed?: any}`.

* `test` - boolean result of the test
* `remove`, `replace` and `move` - original object that has been removed
* `add` (only when adding to an array) - index at which item has been inserted (useful when using `-` alias)

** Note: It throws `TEST_OPERATION_FAILED` error if `test` operation fails. **

** Note II: the returned array has `newDocument` property that you can use as the final state of the patched document **.

- See [Validation notes](#validation-notes).

#### `applyOperation<T>(document: any, operation: Operation, validateOperation: <Boolean | Function> = false, mutateDocument = true): OperationResult<T>`

Applies single operation object `operation` on `document`.

- `document` The document to patch
- `operation` The operation to apply
- `validateOperation` Whether to validate the operation, or to pass a validator callback
- `mutateDocument` Whether to mutate the original document or clone it before applying

It modifies the `document` object and `operation` - it gets the values by reference.
If you would like to avoid touching your values, clone them: `jsonpatch.applyOperation(document, jsonpatch.deepClone(operation))`.

Returns an [`OperationResult`](#operationresult-type) object `{newDocument: any, test?: boolean, removed?: any}`.

** Note: It throws `TEST_OPERATION_FAILED` error if `test` operation fails. **

- See [Validation notes](#validation-notes).

#### `jsonpatch.applyReducer<T>(document: T, operation: Operation): T`

**Ideal for `patch.reduce(jsonpatch.applyReducer, document)`**.

Applies single operation object `operation` on `document`.

Returns the a modified document.

Note: It throws `TEST_OPERATION_FAILED` error if `test` operation fails.

#### `jsonpatch.deepClone(value: any): any`

Returns deeply cloned value.

#### `jsonpatch.escapePathComponent(path: string): string`

Returns the escaped path.

#### `jsonpatch.unescapePathComponent(path: string): string`

Returns the unescaped path.

#### `jsonpatch.getValueByPointer(document: object, pointer: string)`

Retrieves a value from a JSON document by a JSON pointer.

Returns the value.

#### `jsonpatch.observe(document: any, callback?: Function): Observer`

Sets up an deep observer on `document` that listens for changes in object tree. When changes are detected, the optional
callback is called with the generated patches array as the parameter.

Returns `observer`.

#### `jsonpatch.generate(document: any, observer: Observer): Operation[]`

If there are pending changes in `obj`, returns them synchronously. If a `callback` was defined in `observe`
method, it will be triggered synchronously as well.

If there are no pending changes in `obj`, returns an empty array (length 0).

#### `jsonpatch.unobserve(document: any, observer: Observer): void`

Destroys the observer set up on `document`.

Any remaining changes are delivered synchronously (as in `jsonpatch.generate`). Note: this is different that ES6/7 `Object.unobserve`, which delivers remaining changes asynchronously.

#### `jsonpatch.compare(document1: any, document2: any): Operation[]`

Compares object trees `document1` and `document2` and returns the difference relative to `document1` as a patches array.

If there are no differences, returns an empty array (length 0).

#### `jsonpatch.validate(patch: Operation[], document?: any, validator?: Function): JsonPatchError`

See [Validation notes](#validation-notes)

Validates a sequence of operations. If `document` parameter is provided, the sequence is additionally validated against the object tree.

If there are no errors, returns undefined. If there is an errors, returns a JsonPatchError object with the following properties:

- `name` String - short error code
- `message` String - long human readable error message
- `index` Number - index of the operation in the sequence
- `operation` Object - reference to the operation
- `tree` Object - reference to the tree

Possible errors:

Error name                    | Error message
------------------------------|------------
SEQUENCE_NOT_AN_ARRAY         | Patch sequence must be an array
OPERATION_NOT_AN_OBJECT       | Operation is not an object
OPERATION_OP_INVALID          | Operation `op` property is not one of operations defined in RFC-6902
OPERATION_PATH_INVALID        | Operation `path` property is not a valid string
OPERATION_FROM_REQUIRED       | Operation `from` property is not present (applicable in `move` and `copy` operations)
OPERATION_VALUE_REQUIRED      | Operation `value` property is not present, or `undefined` (applicable in `add`, `replace` and `test` operations)
OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED  | Operation `value` property object has at least one `undefined` value (applicable in `add`, `replace` and `test` operations)
OPERATION_PATH_CANNOT_ADD     | Cannot perform an `add` operation at the desired path
OPERATION_PATH_UNRESOLVABLE   | Cannot perform the operation at a path that does not exist
OPERATION_FROM_UNRESOLVABLE   | Cannot perform the operation from a path that does not exist
OPERATION_PATH_ILLEGAL_ARRAY_INDEX | Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index
OPERATION_VALUE_OUT_OF_BOUNDS | The specified index MUST NOT be greater than the number of elements in the array
TEST_OPERATION_FAILED | When operation is `test` and the test fails, applies to `applyReducer`.

## `OperationResult` Type

Functions `applyPatch` and `applyOperation` both return `OperationResult` object. This object is:

```ts
{newDocument: any, test?: boolean, removed?: any}
```

Where:

- `newDocument`: the new state of the document after the patch/operation is applied.
- `test`: if the operation was a `test` operation. This will be its result.
- `removed`: contains the removed, moved, or replaced values from the document after a `remove`, `move` or `replace` operation.


## Validation Notes

Functions `applyPatch`, `applyOperation`, and `validate` accept a `validate`/ `validator` parameter:

- If the `validateOperation` parameter is set to `false`, validation will not occur.
- If set to `true`, the patch is extensively validated before applying using jsonpatch's default validation.
- If set to a `function` callback, the patch is validated using that function.

If you pass a validator, it will be called with four parameters for each operation, `function(operation, index, tree, existingPath)` and it is expected to throw `JsonPatchError` when your conditions are not met.

- `operation` The operation it self.
- `index` `operation`'s index in the patch array (if application).  
- `tree` The object that is supposed to be patched.
- `existingPath` the path `operation` points to.

## Overwriting and `move` Operation

When the target of the move operation already exists, it is cached, deep cloned and returned as `removed` in `OperationResult`.

## `undefined`s (JS to JSON projection)

As `undefined` type does not exist in JSON, it's also not a valid value of JSON Patch operation. Therefore `jsonpatch` will not generate JSON Patches that sets anything to `undefined`.

Whenever a value is set to `undefined` in JS, JSON-Patch methods `generate` and `compare` will treat it similarly to how JavaScript method [`JSON.stringify` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) treats them:

> If `undefined` (...) is encountered during conversion it is either omitted (when it is found in an object) or censored to `null` (when it is found in an array).

See the [ECMAScript spec](http://www.ecma-international.org/ecma-262/6.0/index.html#sec-json.stringify) for details.

## Specs/tests

 - [Run in browser](http://starcounter-jack.github.io/JSON-Patch/test/)

## [Contributing](CONTRIBUTING.md)

## Changelog

To see the list of recent changes, see [Releases](https://github.com/Starcounter-Jack/JSON-Patch/releases).

## License

MIT
