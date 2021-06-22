Object.defineProperty(exports, "__esModule", { value: true });
function baseIsNaN(value) {
    return value !== value;
}
function strictIndexOf(array, value, fromIndex) {
    var index = fromIndex - 1;
    var length = array.length;
    while (++index < length) {
        if (array[index] === value) {
            return index;
        }
    }
    return -1;
}
function baseFindIndex(array, predicate, fromIndex, fromRight) {
    var length = array.length;
    var index = fromIndex + (fromRight ? 1 : -1);
    while ((fromRight ? index-- : ++index < length)) {
        if (predicate(array[index], index, array)) {
            return index;
        }
    }
    return -1;
}
function baseIndexOf(array, value, fromIndex) {
    return value === value
        ? strictIndexOf(array, value, fromIndex)
        : baseFindIndex(array, baseIsNaN, fromIndex, false);
}
function arrayIncludes(array, value) {
    var length = array == null ? 0 : array.length;
    return !!length && baseIndexOf(array, value, 0) > -1;
}
function lodashDifference(array, values) {
    var includes = arrayIncludes;
    var isCommon = true;
    var result = [];
    var valuesLength = values.length;
    if (!array.length) {
        return result;
    }
    outer: for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var value = array_1[_i];
        var computed = value;
        value = (value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
            var valuesIndex = valuesLength;
            while (valuesIndex--) {
                if (values[valuesIndex] === computed) {
                    continue outer;
                }
            }
            result.push(value);
        }
        else if (!includes(values, computed)) {
            result.push(value);
        }
    }
    return result;
}
exports.default = lodashDifference;
