Object.defineProperty(exports, "__esModule", { value: true });
/* export all core functions and types */
var core_js_1 = require("./core.js");
exports.applyOperation = core_js_1.applyOperation;
exports.applyPatch = core_js_1.applyPatch;
exports.applyReducer = core_js_1.applyReducer;
exports.getValueByPointer = core_js_1.getValueByPointer;
exports.validate = core_js_1.validate;
exports.validator = core_js_1.validator;
exports._areEquals = core_js_1._areEquals;
/* export all duplex functions */
var duplex_js_1 = require("./duplex.js");
exports.unobserve = duplex_js_1.unobserve;
exports.observe = duplex_js_1.observe;
exports.generate = duplex_js_1.generate;
exports.compare = duplex_js_1.compare;
/* export some helpers */
var helpers_js_1 = require("./helpers.js");
exports.JsonPatchError = helpers_js_1.PatchError;
exports.deepClone = helpers_js_1._deepClone;
exports.escapePathComponent = helpers_js_1.escapePathComponent;
exports.unescapePathComponent = helpers_js_1.unescapePathComponent;
