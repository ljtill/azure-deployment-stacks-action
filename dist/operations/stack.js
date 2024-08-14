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
exports.createDeploymentStack = createDeploymentStack;
exports.deleteDeploymentStack = deleteDeploymentStack;
exports.validateDeploymentStack = validateDeploymentStack;
const core = __importStar(require("@actions/core"));
const arm_resourcesdeploymentstacks_1 = require("@azure/arm-resourcesdeploymentstacks");
const helpers = __importStar(require("../helpers"));
const models_1 = require("../models");
/**
 * Creates a new deployment stack based on the provided configuration.
 * @param config - The configuration object for the deployment stack.
 * @returns A DeploymentStack object representing the new deployment stack.
 */
function newDeploymentStack(config) {
    const properties = {
        description: config.inputs.description,
        actionOnUnmanage: helpers.prepareUnmanageProperties(config.inputs.actionOnUnmanage),
        denySettings: helpers.prepareDenySettings(config),
        bypassStackOutOfSyncError: config.inputs.bypassStackOutOfSyncError
    };
    switch (config.context.templateType) {
        case models_1.TemplateType.File:
            properties.template = config.context.template;
            break;
        case models_1.TemplateType.Spec:
            properties.templateLink = {
                id: config.inputs.templateSpec
            };
            break;
        case models_1.TemplateType.Uri:
            properties.templateLink = {
                uri: config.inputs.templateUri
            };
            break;
    }
    switch (config.context.parametersType) {
        case models_1.ParametersType.File:
            properties.parameters = config.context.parameters;
            break;
        case models_1.ParametersType.Object:
            properties.parameters = config.context.parameters;
            break;
        case models_1.ParametersType.Link:
            properties.parametersLink = {
                uri: config.inputs.parametersUri
            };
            break;
    }
    return {
        location: config.inputs.location,
        properties,
        tags: {
            repository: config.context.repository,
            commit: config.context.commit,
            branch: config.context.branch
        }
    };
}
/**
 * Retrieves the deployment stack based on the provided configuration.
 * @param config - The configuration object containing the inputs for retrieving the deployment stack.
 * @param client - The DeploymentStacksClient used to interact with the deployment stacks.
 * @returns A Promise that resolves to the retrieved DeploymentStack.
 * @throws An Error if the deployment stack is not found.
 */
async function getDeploymentStack(config, client) {
    let deploymentStack;
    switch (config.inputs.scope) {
        case 'managementGroup':
            deploymentStack = await client.deploymentStacks.getAtManagementGroup(config.inputs.managementGroupId, config.inputs.name);
            break;
        case 'subscription':
            client.subscriptionId = config.inputs.subscriptionId;
            deploymentStack = await client.deploymentStacks.getAtSubscription(config.inputs.name);
            break;
        case 'resourceGroup':
            deploymentStack = await client.deploymentStacks.getAtResourceGroup(config.inputs.resourceGroupName, config.inputs.name);
            break;
    }
    if (!deploymentStack) {
        throw new Error(`Deployment stack not found`);
    }
    return deploymentStack;
}
/**
 * Creates a deployment stack based on the provided configuration.
 * @param config - The configuration object for creating the deployment stack.
 * @returns A Promise that resolves when the deployment stack is created.
 */
async function createDeploymentStack(config) {
    core.info(`Creating deployment stack`);
    const client = new arm_resourcesdeploymentstacks_1.DeploymentStacksClient(helpers.newCredential());
    const deploymentStack = newDeploymentStack(config);
    const optionalParams = {};
    let operationPromise;
    switch (config.inputs.scope) {
        case 'managementGroup':
            operationPromise = config.inputs.wait
                ? client.deploymentStacks.beginCreateOrUpdateAtManagementGroupAndWait(config.inputs.managementGroupId, config.inputs.name, deploymentStack, optionalParams)
                : client.deploymentStacks.beginCreateOrUpdateAtManagementGroup(config.inputs.managementGroupId, config.inputs.name, deploymentStack, optionalParams);
            break;
        case 'subscription':
            client.subscriptionId = config.inputs.subscriptionId;
            operationPromise = config.inputs.wait
                ? client.deploymentStacks.beginCreateOrUpdateAtSubscriptionAndWait(config.inputs.name, deploymentStack, optionalParams)
                : client.deploymentStacks.beginCreateOrUpdateAtSubscription(config.inputs.name, deploymentStack, optionalParams);
            break;
        case 'resourceGroup':
            operationPromise = config.inputs.wait
                ? client.deploymentStacks.beginCreateOrUpdateAtResourceGroupAndWait(config.inputs.resourceGroupName, config.inputs.name, deploymentStack, optionalParams)
                : client.deploymentStacks.beginCreateOrUpdateAtResourceGroup(config.inputs.resourceGroupName, config.inputs.name, deploymentStack, optionalParams);
            break;
    }
    helpers.logDeploymentStackResult(await operationPromise);
    core.info(`Created deployment stack`);
}
/**
 * Deletes a deployment stack based on the provided configuration.
 * @param config - The configuration object.
 * @returns A Promise that resolves when the deployment stack is deleted.
 */
async function deleteDeploymentStack(config) {
    core.info(`Deleting deployment stack`);
    const client = new arm_resourcesdeploymentstacks_1.DeploymentStacksClient(helpers.newCredential());
    const deploymentStack = await getDeploymentStack(config, client);
    const optionalParams = {
        unmanageActionManagementGroups: deploymentStack.properties?.actionOnUnmanage.managementGroups,
        unmanageActionResourceGroups: deploymentStack.properties?.actionOnUnmanage.resourceGroups,
        unmanageActionResources: deploymentStack.properties?.actionOnUnmanage.resources
    };
    let operationPromise;
    switch (config.inputs.scope) {
        case 'managementGroup':
            operationPromise = config.inputs.wait
                ? client.deploymentStacks.beginDeleteAtManagementGroupAndWait(config.inputs.managementGroupId, config.inputs.name, optionalParams)
                : client.deploymentStacks.beginDeleteAtManagementGroup(config.inputs.managementGroupId, config.inputs.name, optionalParams);
            break;
        case 'subscription':
            client.subscriptionId = config.inputs.subscriptionId;
            operationPromise = config.inputs.wait
                ? client.deploymentStacks.beginDeleteAtSubscriptionAndWait(config.inputs.name, optionalParams)
                : client.deploymentStacks.beginDeleteAtSubscription(config.inputs.name, optionalParams);
            break;
        case 'resourceGroup':
            operationPromise = config.inputs.wait
                ? client.deploymentStacks.beginDeleteAtResourceGroupAndWait(config.inputs.resourceGroupName, config.inputs.name, optionalParams)
                : client.deploymentStacks.beginDeleteAtResourceGroup(config.inputs.resourceGroupName, config.inputs.name, optionalParams);
            break;
    }
    await operationPromise;
    core.info(`Deleted deployment stack`);
}
/**
 * Validates the deployment stack based on the provided configuration.
 * @param config - The configuration object containing the inputs for the deployment stack validation.
 * @returns A Promise that resolves to void.
 */
async function validateDeploymentStack(config) {
    core.info(`Validating deployment stack`);
    const client = new arm_resourcesdeploymentstacks_1.DeploymentStacksClient(helpers.newCredential());
    const deploymentStack = newDeploymentStack(config);
    const optionalParams = {};
    let operationPromise;
    switch (config.inputs.scope) {
        case 'managementGroup':
            operationPromise = config.inputs.wait
                ? client.deploymentStacks.beginValidateStackAtManagementGroupAndWait(config.inputs.managementGroupId, config.inputs.name, deploymentStack, optionalParams)
                : client.deploymentStacks.beginValidateStackAtManagementGroup(config.inputs.managementGroupId, config.inputs.name, deploymentStack, optionalParams);
            break;
        case 'subscription':
            client.subscriptionId = config.inputs.subscriptionId;
            operationPromise = config.inputs.wait
                ? client.deploymentStacks.beginValidateStackAtSubscriptionAndWait(config.inputs.name, deploymentStack, optionalParams)
                : client.deploymentStacks.beginValidateStackAtSubscription(config.inputs.name, deploymentStack, optionalParams);
            break;
        case 'resourceGroup':
            operationPromise = config.inputs.wait
                ? client.deploymentStacks.beginValidateStackAtResourceGroupAndWait(config.inputs.resourceGroupName, config.inputs.name, deploymentStack, optionalParams)
                : client.deploymentStacks.beginValidateStackAtResourceGroup(config.inputs.resourceGroupName, config.inputs.name, deploymentStack, optionalParams);
            break;
    }
    helpers.logDeploymentStackValidateResult(await operationPromise);
    core.info(`Validated deployment stack`);
}
//# sourceMappingURL=stack.js.map