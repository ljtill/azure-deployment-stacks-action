"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultConfig = createDefaultConfig;
const defaultInputs = {
    name: '',
    description: '',
    location: '',
    scope: '',
    mode: '',
    actionOnUnmanage: '',
    denySettings: '',
    applyToChildScopes: false,
    excludedActions: [],
    excludedPrincipals: [],
    managementGroupId: '',
    subscriptionId: '',
    resourceGroupName: '',
    templateFile: '',
    templateSpec: '',
    templateUri: '',
    parametersFile: '',
    parameters: '',
    parametersUri: '',
    bypassStackOutOfSyncError: false,
    wait: false
};
const defaultContext = {
    templateType: undefined,
    template: {},
    parametersType: undefined,
    parameters: {},
    repository: '',
    commit: '',
    branch: ''
};
const defaultOutputs = {};
/**
 * Creates a default configuration object with optional overrides.
 * @param overrides - Optional overrides for the configuration.
 * @returns The default configuration object.
 */
function createDefaultConfig(overrides) {
    return {
        inputs: { ...defaultInputs, ...(overrides?.inputs || {}) },
        context: { ...defaultContext, ...(overrides?.context || {}) },
        outputs: { ...defaultOutputs, ...(overrides?.outputs || {}) }
    };
}
//# sourceMappingURL=config.js.map