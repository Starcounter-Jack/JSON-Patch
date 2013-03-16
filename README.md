JSON-Patch
==========

A leaner and meaner implementation of JSON Patch. Small footprint. High performance.

## Why you should use JSON-Patch

JSON-Patch allows you to update a JSON document by sending the changes rather than the whole document. 
And now there is a standard to do it (an IEFT DRAFT spec). JSON Patch plays well with the HTTP PATCH and
REST style programming.

[test](http://www.mnot.net/blog/2012/09/05/patch)


## Specification
http://tools.ietf.org/html/draft-ietf-appsawg-json-patch-10

## Footprint
0.6 KB minified and gzipped (1.6 KB minified)

## Performance
![Fast](http://www.rebelslounge.com/res/jsonpatch/chart.png)

## Roadmap

* The project will monitor the updates to the draft specification.
* Add generation of outgoing patches
* Make use of ES6 Object.observe() to generate patches when available (Chrome 27)

## Usage

```js
jsonpatch.apply( object, patcharray );
```

