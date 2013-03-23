JSON-Patch
==========

A leaner and meaner implementation of JSON Patch. Small footprint. High performance.

**NEW!** Dual directions! Supports both applying patches and generating patches.

## Why you should use JSON-Patch

JSON-Patch allows you to update a JSON document by sending the changes rather than the whole document. 
And now there is a [standard way](http://tools.ietf.org/html/draft-ietf-appsawg-json-patch-10) to do it. 
JSON Patch plays well with the HTTP PATCH verb (method) and REST style programming.

Mark Nottingham has a [nice blog]( http://www.mnot.net/blog/2012/09/05/patch) about it.

## Footprint
0.5 KB minified and gzipped (1.1 KB minified)

## Performance
![Fast](http://www.rebelslounge.com/res/jsonpatch/chart3.png)


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
var myobj = { firstName:"Albert", contactDetails: { phonenumbers: [ ] } };
var patches = [
   {op:"replace", path:"/firstName", value:"Joachim" },
   {op:"add", path:"/lastName", value:"Wester" }
   {op:"add", path:"/contactDetails/phonenumbers", value:{ number:"555-123" }  }
   ];
jsonpatch.apply( myobj, patches );
// myobj == { firstName:"Joachim", lastName:"Wester", contactDetails:{ phoneNumbers[ {number:"555-123"} ] } };
```
Generating patches:
```js
var myobj = { firstName:"Joachim", lastName:"Wester", contactDetails: { phonenumbers: [ { number:"555-123" }] } };
observer = jsonpatch.observe( object );
myobj.firstName = "Albert";
myobj.contactDetails.phonenumbers[0] = "123";
myobj.contactDetails.phonenumbers.push({number:"456"});
jsonpatch.generate(observer);
// patches  == [
//   { op:"replace", path="/firstName", value:"Joachim"},
//   { op:"replace", path="/contactDetails/phonenumbers/0", value:"123"},
//   { op:"add", path="/contactDetails/phonenumbers", value:{number:"456"}}];
```

