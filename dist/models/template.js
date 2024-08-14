"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParametersType = exports.TemplateType = void 0;
// eslint-disable-next-line no-shadow
var TemplateType;
(function (TemplateType) {
    TemplateType[TemplateType["File"] = 0] = "File";
    TemplateType[TemplateType["Spec"] = 1] = "Spec";
    TemplateType[TemplateType["Uri"] = 2] = "Uri";
})(TemplateType || (exports.TemplateType = TemplateType = {}));
// eslint-disable-next-line no-shadow
var ParametersType;
(function (ParametersType) {
    ParametersType[ParametersType["Object"] = 0] = "Object";
    ParametersType[ParametersType["File"] = 1] = "File";
    ParametersType[ParametersType["Link"] = 2] = "Link";
    ParametersType[ParametersType["Undefined"] = 3] = "Undefined";
})(ParametersType || (exports.ParametersType = ParametersType = {}));
//# sourceMappingURL=template.js.map