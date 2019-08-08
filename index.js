var core = require("./lib/core.js");
Object.assign(exports, core);

var duplex = require("./lib/duplex.js");
Object.assign(exports, duplex);

var helpers = require("./lib/helpers.js");
exports.JsonPatchError = helpers.PatchError;
exports.deepClone = helpers._deepClone;
exports.escapePathComponent = helpers.escapePathComponent;
exports.unescapePathComponent = helpers.unescapePathComponent;
