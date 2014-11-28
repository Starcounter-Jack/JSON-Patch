Fast-JSON-Patch
===============

A leaner and meaner implementation of JSON-Patch. Small footprint. High performance.
Also support dual directions! I.e. you can both apply patches and generate patches.

## Why you should use JSON-Patch

JSON-Patch [(RFC6902)](http://tools.ietf.org/html/rfc6902) is a standard format that 
allows you to update a JSON document by sending the changes rather than the whole document. 
JSON Patch plays well with the HTTP PATCH verb (method) and REST style programming.

Mark Nottingham has a [nice blog]( http://www.mnot.net/blog/2012/09/05/patch) about it.

## Footprint
0.5 KB minified and gzipped (1.1 KB minified)

## Performance
![Fast](http://www.rebelslounge.com/res/jsonpatch/chart3.png)


## Features
* Allows you to apply patches on object trees for incoming traffic.
* Allows you to freely manipulate object trees and then generate patches for outgoing traffic.
* ES7 Object.observe() is used when available.
* Tested in IE 8-10, Firefox, Chrome and Node.js

## Roadmap

* A /bin directory will be added with minified versions
* More unit tests


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

### [download as ZIP](https://github.com/my-user/my-repo/archive/master.zip)


## Adding to your project

### In a web browser

Include `json-patch.js` if you want support for applying patches **or**
include `json-patch-duplex.js` if you also want to generate patches.

### In Node.js

Call require to get the instance: 

```js
var jsonpatch = require('fast-json-patch')
```

:bulb: Node.js supports native `Object.observe` in preview release 0.11.x (and only when started with `--harmony_observation` flag). With stable versions of Node, a shimmed version of `Object.observe` is used.


## Usage

Applying patches:
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
Generating patches:
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
Comparing two object trees:
```
var objA = {user: {firstName: "Albert", lastName: "Einstein"}};
var objB = {user: {firstName: "Albert", lastName: "Collins"}};
var diff = jsonpatch.compare(objA, objB));
//diff == [{op: "replace", path: "/user/lastName", value: "Collins"}]
```

## Testing

### In a web browser

1. Testing **json-patch.js**
 - Load `test/SpecRunner.html` in your web browser
2. Testing **json-patch-duplex.js**
 - Load `test/SpecRunnerDuplex.html` in your web browser

Each of the test suite files contains *Jasmine* unit test suite and *Benchmark.js* performance test suite.

To run *Benchmark.js* performance tests, press "Run Tests" button.

### In Node.js

1. Go to directory where you have cloned the repo
2. Install Jasmine Node.js module by running command `npm install jasmine-node -g`
3. Testing **json-patch.js**
 - Run command `jasmine-node --matchall --config duplex no test/spec/coreSpec.js`
4. Testing **json-patch-duplex.js**
 - Run command `jasmine-node --matchall --config duplex yes test/spec/coreSpec.js test/spec/duplexSpec.js`

## API

#### jsonpatch.apply (`obj` Object, `patches` Array) : boolean

Available in *json-patch.js* and *json-patch-duplex.js*

Applies `patches` array on `obj`.

If patch was succesfully applied, returns `true`. Otherwise returns `false`.

If there was a `test` patch in `patches` array, returns the result of the test.

If there was more than one patch in the array, the result of the last patch is returned.

#### jsonpatch.observe (`obj` Object, `callback` Function (optional)) : `observer` Object

Available in *json-patch-duplex.js*

Sets up an deep observer on `obj` that listens for changes in object tree. When changes are detected, the optional
callback is called with the generated patches array as the parameter.

Returns `observer`.

#### jsonpatch.generate (`obj` Object, `observer` Object) : `patches` Array

Available in *json-patch-duplex.js*

If there are pending changes in `obj`, returns them synchronously. If a `callback` was defined in `observe`
method, it will be triggered synchronously as well.

If there are no pending changes in `obj`, returns an empty array.

#### jsonpatch.unobserve (`obj` Object, `observer` Object) : void

Available in *json-patch-duplex.js*

Destroys the observer set up on `obj`.

Any remaining changes are delivered synchronously (as in `jsonpatch.generate`). Note: this is different that ES6/7 `Object.unobserve`, which delivers remaining changes asynchronously.

#### jsonpatch.compare (`obj1` Object, `obj2` Object) : `patches` Array

Available in *json-patch-duplex.js*

Compares object trees `obj1` and `obj2` and returns the difference relative to `obj1` as a patches array.

If there are no differences, returns an empty array.

## Changelog

To see the list of recent changes, see [Releases](https://github.com/PuppetJs/PuppetJs/releases).
