JSON-Patch
==========

A leaner and meaner implementation of the JSON Patch specification. Small footprint. High performance.

## Specification
http://tools.ietf.org/html/draft-ietf-appsawg-json-patch-10

## Footprint
0.6 KB minified and gzipped (1.6 KB minified)

## Performance
![Fast](http://www.rebelslounge.com/res/jsonpatch/chart.png)

## Roadmap

The project will monitor the updates to the draft specification. It will also make use of ES6 Object.observe() to generate
patches.

### Usage

```js
jsonpatch.apply( object, patcharray );
```

