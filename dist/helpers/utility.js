"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJson = isJson;
exports.isNumeric = isNumeric;
exports.isBoolean = isBoolean;
/**
 * Checks if a given string is a valid JSON.
 * @param input - The string to be checked.
 * @returns A boolean indicating whether the input is valid JSON or not.
 */
function isJson(input) {
    try {
        JSON.parse(input);
    }
    catch {
        return false;
    }
    return true;
}
/**
 * Checks if a given value is numeric.
 * @param value - The value to check.
 * @returns `true` if the value is numeric, `false` otherwise.
 */
function isNumeric(value) {
    return /^-?\d+$/.test(value);
}
/**
 * Checks if a given value is a boolean.
 * @param value - The value to check.
 * @returns True if the value is a boolean, false otherwise.
 */
function isBoolean(value) {
    return /^(true|false)$/i.test(value);
}
//# sourceMappingURL=utility.js.map