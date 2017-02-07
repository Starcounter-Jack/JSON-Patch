JSON-Patch 
===============
> A leaner and meaner implementation of JSON-Patch. Small footprint. High performance. **With opt-in ES6 Proxies version**.

[![Build Status](https://travis-ci.org/Starcounter-Jack/JSON-Patch.svg?branch=master)](https://travis-ci.org/Starcounter-Jack/JSON-Patch)

With JSON-Patch, you can:
- **apply** patches
- **validate** a sequence of patches
- **observe** for changes (and generate patches when a change is detected)
- **compare** two objects (to obtain the difference)

## Why you should use JSON-Patch

JSON-Patch [(RFC6902)](http://tools.ietf.org/html/rfc6902) is a standard format that
allows you to update a JSON document by sending the changes rather than the whole document.
JSON Patch plays well with the HTTP PATCH verb (method) and REST style programming.

Mark Nottingham has a [nice blog]( http://www.mnot.net/blog/2012/09/05/patch) about it.

## Footprint
1.22 KB minified and gzipped (3 KB minified)
Optional 1.04 KB minified and gzipped (2 KB minified) ES6-Proxy-based observing.

## Performance 

##### [`add` benchmark](http://jsperf.com/json-patch-benchmark/2)

<img width="907" alt="screenshot 2015-10-22 20 35 22" src="https://cloud.githubusercontent.com/assets/566463/10674707/b3deec60-78fc-11e5-876d-59c90a0cab2f.png">

##### [`replace` benchmark](http://jsperf.com/json-patch-benchmark-replace/2)

<img width="904" alt="screenshot 2015-10-22 20 35 58" src="https://cloud.githubusercontent.com/assets/566463/10674708/b6f80d14-78fc-11e5-82c6-658510f31f63.png">

Tested on 22.10.2015. Compared libraries:

- [Starcounter-Jack/JSON-Patch](https://github.com/Starcounter-Jack/JSON-Patch) 0.5.4
- [bruth/jsonpatch-js](https://github.com/bruth/jsonpatch-js) 0.5.0
- [dharmafly/jsonpatch.js](https://github.com/dharmafly/jsonpatch.js) master branch
- [jiff](https://www.npmjs.com/package/jiff) 0.7.2 browserified
- [json8-patch](https://www.npmjs.com/package/json8-patch) 0.3.2 browserified

We aim the tests to be fair. Our library puts performance as the #1 priority, while other libraries can have different priorities. If you'd like to update the benchmarks or add a library, please edit the jsperf benchmarks linked above and open an issue to include new results.

## Features
* Allows you to apply patches on object trees for incoming traffic.
* Allows you to freely manipulate object trees and then generate patches for outgoing traffic.
* Tested in IE 8-11, Firefox, Chrome, Safari and Node.js
* **NEW** It supports ES6 proxies. (Not in IE and Oprah Mini). 

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

Include `json-patch.js` if you want support for applying patches **or**
include `json-patch-duplex.js` if you also want to generate patches.

### In Node.js

Call require to get the instance:

```js
var jsonpatch = require('fast-json-patch');
```
And if you aim to use ES6-Proxy version
```js
var JsonObserver = require('fast-json-patch').JsonObserver;
```

Or in ES6 and TS:
```js
import jsonpatch from 'fast-json-patch';
```
And if you aim to use ES6-Proxy version
```js
import { JsonObserver } from 'fast-json-patch';
```
## Usage

### Applying patches:

```js
var myobj = { firstName:"Albert", contactDetails: { phoneNumbers: [ ] } };
var patches = [
   {op:"replace", path:"/firstName", value:"Joachim" },
   {op:"add", path:"/lastName", value:"Wester" },
   {op:"add", path:"/contactDetails/phoneNumbers/0", value:{ number:"555-123" }  }
   ];
jsonpatch.apply( myobj, patches );
// myobj == { firstName:"Joachim", lastName:"Wester", contactDetails:{ phoneNumbers[ {number:"555-123"} ] } };
```
### Generating patches using dirty checking:

```js
var myobj = { firstName:"Joachim", lastName:"Wester", contactDetails: { phoneNumbers: [ { number:"555-123" }] } };
observer = jsonpatch.observe( myobj );
myobj.firstName = "Albert";
myobj.contactDetails.phoneNumbers[0].number = "123";
myobj.contactDetails.phoneNumbers.push({number:"456"});
var patches = jsonpatch.generate(observer);
// patches  == [
//   { op:"replace", path="/firstName", value:"Albert"},
//   { op:"replace", path="/contactDetails/phoneNumbers/0/number", value:"123"},
//   { op:"add", path="/contactDetails/phoneNumbers/1", value:{number:"456"}}];
```
### Generating patches using ES6 proxies version:
```js
var myobj = { firstName:"Joachim", lastName:"Wester", contactDetails: { phoneNumbers: [ { number:"555-123" }] } };
observer = new JsonObserver( myobj );
observedObject = observer.observe(true);
observedObject.firstName = "Albert";
observedObject.contactDetails.phoneNumbers[0].number = "123";
observedObject.contactDetails.phoneNumbers.push({number:"456"});
var patches = observer.generate();
// patches  == [
//   { op:"replace", path="/firstName", value:"Albert"},
//   { op:"replace", path="/contactDetails/phoneNumbers/0/number", value:"123"},
//   { op:"add", path="/contactDetails/phoneNumbers/1", value:{number:"456"}}];
```
### Receiving patches using ES6 proxies version and a callback:
```js
var myobj = { firstName:"Joachim", lastName:"Wester", contactDetails: { phoneNumbers: [ { number:"555-123" }] } };
observer = new JsonObserver( myobj );
observedObject = observer.observe(true, function(patch) {
    // patch == { op:"replace", path="/firstName", value:"Albert"}
});
observedObject.firstName = "Albert";
```
###Comparing two object trees:

```js
var objA = {user: {firstName: "Albert", lastName: "Einstein"}};
var objB = {user: {firstName: "Albert", lastName: "Collins"}};
var diff = jsonpatch.compare(objA, objB));
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

#### jsonpatch.apply (`obj` Object, `patches` Array, `validate` Boolean) : boolean

Available in *json-patch.js* and *json-patch-duplex.js*

Applies `patches` array on `obj`.

If the `validate` parameter is set to `true`, the patch is extensively validated before applying.
An invalid patch results in throwing an error (see `jsonpatch.validate` for more information about the error object).

Returns an array of results - one item for each item in `patches`. The type of each item depends on type of operation applied
* `test` - boolean result of the test
* `remove`, `replace` and `move` - original object that has been removed
* `add` (only when adding to an array) - index at which item has been inserted (useful when using `-` alias)

## Object observing
### ES6-Proxy version 
#### constructor: JsonObserver( `root` Object ):  JsonObserver
Available in *json-observe.js* 
Creates an instance of `JsonObserver` around your object of interest `root`, for later `observe`, `unobserve`, `switchCallbackOff`, `switchCallbackOn` calls.
Returns `JsonObserver`.

#### JsonObserver.observe(`record` boolean, [`callback` Function]): Proxy
Available in *json-observe.js* 
Sets up a deep proxy observer on `root` that listens for changes in the tree. When changes are detected, the optional
callback is called with the generated patches array as the parameter. 

**record**: if set to `false`, all changes are will be pass through the callback and no history will be kept. If set to `true` patches history will be kept until you call `generate`, this will return the patches and deletes them.

Returns `Proxy` a mirror of your object.
##### Note 1: you must either set `record` to `true` or pass a callback. 
##### Note 2: you have to use the return value of this function as your object of interest. Changes to the original object will go unnoticed. 

#### JsonObserver.generate () :  Array

Available in *json-observe.js*
If there are pending changes in `root`, it returns them synchronously and clears history. 
If there are no pending changes in `root`, returns an empty array (length 0).

#### JsonObserver.unobserve () : Object

Available in *json-observe.js*
Destroys the observer set up on `root` and returns the final state of your object, unobserved.

#### JsonObserver.SwitchCallbackOff () : void

Available in *json-observe.js*
Disables patches omitting (to both callback and patches array). However, the object will be updated if you change it. 

#### JsonObserver.SwitchCallbackOn () : void

Available in *json-observe.js*
Enables patches omitting (to both callback and patches array). Starting from the moment you call it. 

### Dirty checking version 
#### jsonpatch.observe (`obj` Object, [`callback` Function]) : `observer` Object

Available in *json-patch-duplex.js*

Sets up a deep observer on `obj` that listens for changes in object tree. When changes are detected, the optional
callback is called with the generated patches array as the parameter.

Returns `observer`.

#### jsonpatch.generate (`obj` Object, `observer` Object) : `patches` Array

Available in *json-patch-duplex.js*

If there are pending changes in `obj`, returns them synchronously. If a `callback` was defined in `observe`
method, it will be triggered synchronously as well.

If there are no pending changes in `obj`, returns an empty array (length 0).

#### jsonpatch.unobserve (`obj` Object, `observer` Object) : void

Available in *json-patch-duplex.js*

Destroys the observer set up on `obj`.

Any remaining changes are delivered synchronously (as in `jsonpatch.generate`). Note: this is different that ES6/7 `Object.unobserve`, which delivers remaining changes asynchronously.

#### jsonpatch.compare (`obj1` Object, `obj2` Object) : `patches` Array

Available in *json-patch-duplex.js*

Compares object trees `obj1` and `obj2` and returns the difference relative to `obj1` as a patches array.

If there are no differences, returns an empty array (length 0).

#### jsonpatch.validate (`patches` Array, `tree` Object (optional)) : `error` JsonPatchError

Available in *json-patch.js* and *json-patch-duplex.js*

Validates a sequence of operations. If `tree` parameter is provided, the sequence is additionally validated against the object tree.

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

## `undefined`s (JS to JSON projection)

As `undefined` type does not exist in JSON, it's also not a valid value of JSON Patch operation. Therefore `jsonpatch` will not generate JSON Patches that sets anything to `undefined`.

Whenever a value is set to `undefined` in JS, JSON-Patch methods `generate` and `compare` will treat it similarly to how JavaScript method [`JSON.stringify` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) treats them:

> If `undefined` (...) is encountered during conversion it is either omitted (when it is found in an object) or censored to `null` (when it is found in an array).

See the [ECMAScript spec](http://www.ecma-international.org/ecma-262/6.0/index.html#sec-json.stringify) for details.

## Specs/tests

 - [for `json-patch.js`](http://starcounter-jack.github.io/JSON-Patch/test/SpecRunner.html)
 - [for `json-patch-duplex.js`](
     http://starcounter-jack.github.io/JSON-Patch/test/SpecRunnerDuplex.html)

## [Contributing](CONTRIBUTING.md)

## Changelog

To see the list of recent changes, see [Releases](https://github.com/Starcounter-Jack/JSON-Patch/releases).

## License

MIT
