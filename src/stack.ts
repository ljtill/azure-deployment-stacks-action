import * as core from '@actions/core'
import { DefaultAzureCredential } from '@azure/identity'
import {
  DeploymentStacksClient,
  DeploymentStack
} from '@azure/arm-resourcesdeploymentstacks'
import * as helper from './helper'
import { Config } from './types'

/**
 * Creates a new instance of DefaultAzureCredential.
 * @returns A new instance of DefaultAzureCredential.
 */
function newCredential(): DefaultAzureCredential {
  core.debug(`Generate new credential`)

  return new DefaultAzureCredential()
}

/**
 * Checks if an object is an instance of DeploymentStack.
 * @param object - The object to check.
 * @returns A boolean value indicating whether the object is an instance of DeploymentStack.
 */
function instanceOfDeploymentStack(object: unknown): object is DeploymentStack {
  return (
    typeof object === 'object' &&
    object !== null &&
    'location' in object &&
    'tags' in object &&
    'properties' in object
  )
}

/**
 * Represents the configuration for performing actions on unmanaged resources.
 */
interface ActionOnUnmanage {
  managementGroups: string
  resourceGroups: string
  resources: string
}

/**
 * Prepares the properties for unmanaging resources based on the specified value.
 * @param value - The value indicating the action to be performed on unmanaging resources.
 * @returns The ActionOnUnmanage object containing the properties for unmanaging resources.
 * @throws {Error} If the specified value is invalid.
 */
function prepareUnmanageProperties(value: string): ActionOnUnmanage {
  switch (value) {
    case 'deleteResources':
      return {
        // Delete all resources, detach resource groups and management groups
        managementGroups: 'detach',
        resourceGroups: 'detach',
        resources: 'delete'
      }
    case 'deleteAll':
      return {
        // Delete resources, resource groups and management groups
        managementGroups: 'delete',
        resourceGroups: 'delete',
        resources: 'delete'
      }
    case 'detachAll':
      return {
        // Detach resources, resource groups and management groups
        managementGroups: 'detach',
        resourceGroups: 'detach',
        resources: 'detach'
      }
    default:
      throw new Error(`Invalid actionOnUnmanage: ${value}`)
  }
}

/**
 * Represents the settings for denying access to a resource.
 */
interface DenySettings {
  mode: string
  applyToChildScopes: boolean
  excludedActions: string[]
  excludedPrincipals: string[]
}

/**
 * Prepares the deny settings based on the provided configuration.
 * @param config - The configuration object.
 * @returns The deny settings object.
 */
function prepareDenySettings(config: Config): DenySettings {
  return {
    mode: config.inputs.denySettings,
    applyToChildScopes: config.inputs.applyToChildScopes,
    excludedActions: config.inputs.excludedActions,
    excludedPrincipals: config.inputs.excludedPrincipals
  }
}

/**
 * Retrieves the deployment stack based on the provided configuration and client.
 * @param {Config} config - The configuration object.
 * @param {DeploymentStacksClient} client - The deployment stacks client.
 * @returns {Promise<DeploymentStack>} - A promise that resolves to the deployment stack.
 * @throws {Error} - If the deployment stack is not found.
 */
async function getDeploymentStack(
  config: Config,
  client: DeploymentStacksClient
): Promise<DeploymentStack> {
  core.debug(`Retrieving deployment stack`)

  let deploymentStack: DeploymentStack | undefined

  switch (config.inputs.scope) {
    case 'managementGroup':
      deploymentStack = await client.deploymentStacks.getAtManagementGroup(
        config.inputs.managementGroupId,
        config.inputs.name
      )
      break

    case 'subscription':
      client.subscriptionId = config.inputs.subscriptionId
      deploymentStack = await client.deploymentStacks.getAtSubscription(
        config.inputs.name
      )
      break

    case 'resourceGroup':
      deploymentStack = await client.deploymentStacks.getAtResourceGroup(
        config.inputs.resourceGroupName,
        config.inputs.name
      )
      break
  }

  if (!deploymentStack) {
    throw new Error(`Deployment stack not found`)
  }

  return deploymentStack
}

/**
 * Lists deployment stacks based on the provided configuration and client.
 *
 * @param config - The configuration object containing inputs for listing deployment stacks.
 * @param client - The DeploymentStacksClient used to interact with the deployment stacks.
 * @returns A promise that resolves to an array of DeploymentStack objects.
 */
async function listDeploymentStacks(
  config: Config,
  client: DeploymentStacksClient
): Promise<DeploymentStack[]> {
  core.debug(`Listing deployment stacks`)

  const deploymentStacks = []

  switch (config.inputs.scope) {
    case 'managementGroup':
      for await (const item of client.deploymentStacks.listAtManagementGroup(
        config.inputs.managementGroupId
      )) {
        deploymentStacks.push(item)
      }
      break

    case 'subscription':
      client.subscriptionId = config.inputs.subscriptionId
      for await (const item of client.deploymentStacks.listAtSubscription()) {
        deploymentStacks.push(item)
      }
      break

    case 'resourceGroup':
      for await (const item of client.deploymentStacks.listAtResourceGroup(
        config.inputs.resourceGroupName
      )) {
        deploymentStacks.push(item)
      }
      break
  }

  return deploymentStacks
}

/**
 * Creates or updates a deployment stack based on the provided configuration.
 * @param config - The configuration object for the deployment stack.
 * @returns A Promise that resolves when the operation is completed successfully.
 */
export async function createDeploymentStack(config: Config): Promise<void> {
  const client = new DeploymentStacksClient(newCredential())

  // Display operation message
  !(await listDeploymentStacks(config, client)).some(
    stack => stack.name === config.inputs.name
  )
    ? core.info(`Creating deployment stack`)
    : core.info(`Updating deployment stack`)

  // Parse template and parameter files
  const template = await helper.parseTemplateFile(config)
  const parameters = config.inputs.parametersFile
    ? helper.parseParametersFile(config)
    : {}

  // Initialize deployment stack
  const deploymentStack: DeploymentStack = {
    location: config.inputs.location,
    properties: {
      description: config.inputs.description,
      actionOnUnmanage: prepareUnmanageProperties(
        config.inputs.actionOnUnmanage
      ),
      denySettings: prepareDenySettings(config),
      template,
      parameters
    },
    tags: {
      repository: config.context.repository,
      commit: config.context.commit,
      branch: config.context.branch
    }
  }

  const optionalParams = {
    abortSignal: new AbortController().signal
  }

  let operationPromise

  switch (config.inputs.scope) {
    case 'managementGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginCreateOrUpdateAtManagementGroupAndWait(
            config.inputs.managementGroupId,
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
        : client.deploymentStacks.beginCreateOrUpdateAtManagementGroup(
            config.inputs.managementGroupId,
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
      break

    case 'subscription':
      client.subscriptionId = config.inputs.subscriptionId
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginCreateOrUpdateAtSubscriptionAndWait(
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
        : client.deploymentStacks.beginCreateOrUpdateAtSubscription(
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
      break

    case 'resourceGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginCreateOrUpdateAtResourceGroupAndWait(
            config.inputs.resourceGroupName,
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
        : client.deploymentStacks.beginCreateOrUpdateAtResourceGroup(
            config.inputs.resourceGroupName,
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
      break
  }

  const result = await operationPromise

  if (result && instanceOfDeploymentStack(result)) {
    core.startGroup('Deployed resources')
    for (const item of result.properties?.resources || []) {
      core.info(`Id: ${item.id}`)
      core.info(`Status: ${item.status}`)
      core.info(`DenyStatus: ${item.denyStatus}`)
      core.info(`---`)
    }
    core.endGroup()
  }

  core.info(`Operation completed successfully`)
}

/**
 * Validates the deployment stack based on the provided configuration.
 * @param config - The configuration object.
 * @returns A Promise that resolves when the validation is complete.
 */
export async function validateDeploymentStack(config: Config): Promise<void> {
  const client = new DeploymentStacksClient(newCredential())

  core.info(`Validating deployment stack`)

  // Parse template and parameter files
  const template = await helper.parseTemplateFile(config)
  const parameters = config.inputs.parametersFile
    ? helper.parseParametersFile(config)
    : {}

  core.info(`Parameters: ${parameters}`)

  // Initialize deployment stack
  const deploymentStack: DeploymentStack = {
    location: config.inputs.location,
    properties: {
      description: config.inputs.description,
      actionOnUnmanage: prepareUnmanageProperties(
        config.inputs.actionOnUnmanage
      ),
      denySettings: prepareDenySettings(config),
      template,
      parameters
    },
    tags: {
      repository: config.context.repository,
      commit: config.context.commit,
      branch: config.context.branch
    }
  }

  const optionalParams = {
    abortSignal: new AbortController().signal
  }

  let operationPromise

  switch (config.inputs.scope) {
    case 'managementGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginValidateStackAtManagementGroupAndWait(
            config.inputs.managementGroupId,
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
        : client.deploymentStacks.beginValidateStackAtManagementGroup(
            config.inputs.managementGroupId,
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
      break

    case 'subscription':
      client.subscriptionId = config.inputs.subscriptionId
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginValidateStackAtSubscriptionAndWait(
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
        : client.deploymentStacks.beginValidateStackAtSubscription(
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
      break

    case 'resourceGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginValidateStackAtResourceGroupAndWait(
            config.inputs.resourceGroupName,
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
        : client.deploymentStacks.beginValidateStackAtResourceGroup(
            config.inputs.resourceGroupName,
            config.inputs.name,
            deploymentStack,
            optionalParams
          )
      break
  }

  // TODO(ljtill): Parse error messages

  await operationPromise

  core.info(`No validation errors detected`)
}

/**
 * Deletes a deployment stack based on the provided configuration.
 * @param config - The configuration object containing the necessary parameters.
 * @returns A Promise that resolves when the deletion operation is complete.
 */
export async function deleteDeploymentStack(config: Config): Promise<void> {
  const client = new DeploymentStacksClient(newCredential())

  core.info(`Deleting deployment stack`)

  const deploymentStack = await getDeploymentStack(config, client)
  const optionalParams = {
    abortSignal: new AbortController().signal,
    unmanageActionManagementGroups:
      deploymentStack.properties?.actionOnUnmanage.managementGroups,
    unmanageActionResourceGroups:
      deploymentStack.properties?.actionOnUnmanage.resourceGroups,
    unmanageActionResources:
      deploymentStack.properties?.actionOnUnmanage.resources
  }

  let operationPromise

  switch (config.inputs.scope) {
    case 'managementGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginDeleteAtManagementGroupAndWait(
            config.inputs.managementGroupId,
            config.inputs.name,
            optionalParams
          )
        : client.deploymentStacks.beginDeleteAtManagementGroup(
            config.inputs.managementGroupId,
            config.inputs.name,
            optionalParams
          )
      break

    case 'subscription':
      client.subscriptionId = config.inputs.subscriptionId
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginDeleteAtSubscriptionAndWait(
            config.inputs.name,
            optionalParams
          )
        : client.deploymentStacks.beginDeleteAtSubscription(
            config.inputs.name,
            optionalParams
          )
      break

    case 'resourceGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginDeleteAtResourceGroupAndWait(
            config.inputs.resourceGroupName,
            config.inputs.name,
            optionalParams
          )
        : client.deploymentStacks.beginDeleteAtResourceGroup(
            config.inputs.resourceGroupName,
            config.inputs.name,
            optionalParams
          )
      break
  }

  await operationPromise
}
