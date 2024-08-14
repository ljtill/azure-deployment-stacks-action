"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newCredential = newCredential;
exports.logDeploymentStackResult = logDeploymentStackResult;
exports.logDeploymentStackValidateResult = logDeploymentStackValidateResult;
exports.prepareUnmanageProperties = prepareUnmanageProperties;
exports.prepareDenySettings = prepareDenySettings;
const core = __importStar(require("@actions/core"));
const identity_1 = require("@azure/identity");
/**
 * Checks if the given result is an instance of DeploymentStack.
 * @param result - The result to check.
 * @returns True if the result is an instance of DeploymentStack, false otherwise.
 */
function instanceOfDeploymentStack(result) {
    return (!!result &&
        'id' in result &&
        'name' in result &&
        'type' in result &&
        'systemData' in result &&
        'location' in result &&
        'tags' in result &&
        'properties' in result);
}
/**
 * Checks if the provided result is an instance of DeploymentStackValidateResult.
 * @param result - The result to be checked.
 * @returns True if the result is an instance of DeploymentStackValidateResult, false otherwise.
 */
function instanceOfDeploymentStackValidateResult(result) {
    return (!!result &&
        'id' in result &&
        'name' in result &&
        'type' in result &&
        'properties' in result);
}
/**
 * Creates a new instance of DefaultAzureCredential.
 * @returns A new instance of DefaultAzureCredential.
 */
function newCredential() {
    return new identity_1.DefaultAzureCredential();
}
/**
 * Logs the deployment stack result.
 * @param result - The deployment stack result.
 */
function logDeploymentStackResult(result) {
    if (result === undefined) {
        core.warning('No result returned from operation');
        return;
    }
    if (instanceOfDeploymentStack(result)) {
        core.startGroup('Resources');
        for (const item of result.properties?.resources || []) {
            core.info(`- Id:          ${item.id}`);
            core.info(`  Status:      ${item.status}`);
            core.info(`  Deny Status: ${item.denyStatus}`);
        }
        core.endGroup();
        core.startGroup('Deleted Resources');
        for (const item of result.properties?.deletedResources || []) {
            core.info(`- Id: ${item.id}`);
        }
        core.endGroup();
        core.startGroup('Detached Resources');
        for (const item of result.properties?.detachedResources || []) {
            core.info(`- Id: ${item.id}`);
        }
        core.endGroup();
        core.startGroup('Failed Resources');
        for (const item of result.properties?.failedResources || []) {
            core.info(`- Id:    ${item.id}`);
            core.info(`  Error: ${item.error?.code}`);
        }
        core.endGroup();
    }
    else {
        core.debug(`Payload: ${JSON.stringify(result)}`);
    }
}
/**
 * Logs the result of validating a deployment stack.
 * @param validateResult - The result of the validation operation.
 */
function logDeploymentStackValidateResult(validateResult) {
    if (validateResult === undefined) {
        core.warning('No result returned from operation');
        return;
    }
    if (instanceOfDeploymentStackValidateResult(validateResult)) {
        if (validateResult.error?.code) {
            throw new Error(`Validation failed with error: ${validateResult.error.code}`);
        }
        core.startGroup('Resources');
        for (const item of validateResult.properties?.validatedResources || []) {
            core.info(`- Id: ${item.id}`);
        }
        core.endGroup();
    }
    else {
        core.debug(`Payload: ${JSON.stringify(validateResult)}`);
    }
}
/**
 * Prepares the unmanage properties based on the provided value.
 * @param value - The value indicating the action to be performed on unmanage.
 * @returns The ActionOnUnmanage object with the corresponding properties set.
 * @throws Error if the provided value is invalid.
 */
function prepareUnmanageProperties(value) {
    switch (value) {
        case 'deleteResources':
            return {
                managementGroups: 'detach',
                resourceGroups: 'detach',
                resources: 'delete'
            };
        case 'deleteAll':
            return {
                managementGroups: 'delete',
                resourceGroups: 'delete',
                resources: 'delete'
            };
        case 'detachAll':
            return {
                managementGroups: 'detach',
                resourceGroups: 'detach',
                resources: 'detach'
            };
        default:
            throw new Error(`Invalid actionOnUnmanage: ${value}`);
    }
}
/**
 * Prepares the deny settings based on the provided configuration.
 * @param config - The configuration object.
 * @returns The deny settings object.
 */
function prepareDenySettings(config) {
    return {
        mode: config.inputs.denySettings,
        applyToChildScopes: config.inputs.applyToChildScopes,
        excludedActions: config.inputs.excludedActions,
        excludedPrincipals: config.inputs.excludedPrincipals
    };
}
//# sourceMappingURL=stack.js.map