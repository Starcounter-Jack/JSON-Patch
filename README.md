JSON-Patch
==========

A leaner and meaner implementation of JSON Patch. Small footprint. High performance.

**NEW!** Dual directions! Supports both applying patches and generating patches.

## Why you should use JSON-Patch

JSON-Patch allows you to update a JSON document by sending the changes rather than the whole document. 
And now there is a [standard way](http://tools.ietf.org/html/draft-ietf-appsawg-json-patch-10) to do it. JSON Patch plays well with the HTTP PATCH and
REST style programming.

Mark Nottingham has a [nice blog]( http://www.mnot.net/blog/2012/09/05/patch) about it.

## Footprint
0.5 KB minified and gzipped (1.1 KB minified)

## Performance
![Fast](http://www.rebelslounge.com/res/jsonpatch/chart2.png)


## Features
* Allows you to apply patches on object trees for incoming traffic.
* Allows you to freely manipulate object trees and then generate patches for outgoing traffic.
* ES6 Object.observe() is used when available

## Roadmap

* The project will monitor the updates to the draft specification.
* A /bin directory will be added with minified versions
* Node.js module
* More unit tests

## Usage

Include "json-patch.js" if you want support for applying patches **or**
include "json-patch-duplex.js" if you also want to generate patches.

Applying patches:
```js
var myobj = { firstName:"Albert" };
var patches = [
   {op:"replace", path:"/firstName", value:"Joachim" },
   {op:"add", path:"/lastName", value:"Wester" }
   ];
jsonpatch.apply( myobj, patches );
// myobj == { firstName:"Joachim", lastName:"Wester" };
```
Generating patches:
```js
var myobj = { firstName:"Joachim", lastName:"Wester" };
observer = jsonpatch.observe( object );
myobj.firstName = "Albert";
myobj.lastName = "Einstein";
jsonpatch.generate(observer);
// patches  == [
//   { op:"replace", path="/firstName", value:"Joachim"},
//   { op:"replace", path="/lastName", value:"Wester" }];
```

Automatic callback when object changes (wow!):
```js
var myobj = { firstName:"Joachim", lastName:"Wester" };
observer = jsonpatch.observe( object, function(patches) {
   console.log( JSON.stringify(patches) );
   // [{ "op":"replace", "path"="/firstName", "value":"Joachim"},
   //  { "op":"replace", "path"="/lastName", "value":"Wester" }]
});

myobj.firstName = "Albert";
myobj.lastName = "Einstein";

