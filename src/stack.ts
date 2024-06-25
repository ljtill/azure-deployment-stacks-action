import * as core from '@actions/core'
import { DefaultAzureCredential } from '@azure/identity'
import {
  DeploymentStacksClient,
  DeploymentStack
} from '@azure/arm-resourcesdeploymentstacks'
import * as helper from './helper'
import { Config } from './types'

/** Initialize Azure credential. */
function newCredential(): DefaultAzureCredential {
  core.debug(`Generate new credential`)

  return new DefaultAzureCredential()
}

/** Check if object is instance of DeploymentStack. */
function instanceOfDeploymentStack(object: unknown): object is DeploymentStack {
  return (
    typeof object === 'object' &&
    object !== null &&
    'location' in object &&
    'tags' in object &&
    'properties' in object
  )
}

/** Get deployment stack. */
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

/** List deployment stacks. */
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

/** Create deployment stack. */
export async function createDeploymentStack(config: Config): Promise<void> {
  // Initialize deployment stacks client
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
      actionOnUnmanage: helper.prepareUnmanageProperties(
        config.inputs.actionOnUnmanage
      ),
      denySettings: helper.prepareDenySettings(config),
      template,
      parameters
    },
    tags: {
      repository: config.context.repository,
      commit: config.context.commit,
      branch: config.context.branch
    }
  }

  let operationPromise

  switch (config.inputs.scope) {
    case 'managementGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginCreateOrUpdateAtManagementGroupAndWait(
            config.inputs.managementGroupId,
            config.inputs.name,
            deploymentStack
          )
        : client.deploymentStacks.beginCreateOrUpdateAtManagementGroup(
            config.inputs.managementGroupId,
            config.inputs.name,
            deploymentStack
          )
      break

    case 'subscription':
      client.subscriptionId = config.inputs.subscriptionId
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginCreateOrUpdateAtSubscriptionAndWait(
            config.inputs.name,
            deploymentStack
          )
        : client.deploymentStacks.beginCreateOrUpdateAtSubscription(
            config.inputs.name,
            deploymentStack
          )
      break

    case 'resourceGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginCreateOrUpdateAtResourceGroupAndWait(
            config.inputs.resourceGroupName,
            config.inputs.name,
            deploymentStack
          )
        : client.deploymentStacks.beginCreateOrUpdateAtResourceGroup(
            config.inputs.resourceGroupName,
            config.inputs.name,
            deploymentStack
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

/** Delete deployment stack. */
export async function deleteDeploymentStack(config: Config): Promise<void> {
  // Initialize deployment stacks client
  const client = new DeploymentStacksClient(newCredential())

  core.info(`Deleting deployment stack`)

  const deploymentStack = await getDeploymentStack(config, client)
  const params = {
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
            params
          )
        : client.deploymentStacks.beginDeleteAtManagementGroup(
            config.inputs.managementGroupId,
            config.inputs.name,
            params
          )
      break

    case 'subscription':
      client.subscriptionId = config.inputs.subscriptionId
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginDeleteAtSubscriptionAndWait(
            config.inputs.name,
            params
          )
        : client.deploymentStacks.beginDeleteAtSubscription(
            config.inputs.name,
            params
          )
      break

    case 'resourceGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginDeleteAtResourceGroupAndWait(
            config.inputs.resourceGroupName,
            config.inputs.name,
            params
          )
        : client.deploymentStacks.beginDeleteAtResourceGroup(
            config.inputs.resourceGroupName,
            config.inputs.name,
            params
          )
      break
  }

  await operationPromise
}

/** Validate deployment stack. */
export async function validateDeploymentStack(config: Config): Promise<void> {
  // Initialize deployment stacks client
  const client = new DeploymentStacksClient(newCredential())

  core.info(`Validating deployment stack`)

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
      actionOnUnmanage: helper.prepareUnmanageProperties(
        config.inputs.actionOnUnmanage
      ),
      denySettings: helper.prepareDenySettings(config),
      template,
      parameters
    },
    tags: {
      repository: config.context.repository,
      commit: config.context.commit,
      branch: config.context.branch
    }
  }

  let operationPromise

  switch (config.inputs.scope) {
    case 'managementGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginValidateStackAtManagementGroupAndWait(
            config.inputs.managementGroupId,
            config.inputs.name,
            deploymentStack
          )
        : client.deploymentStacks.beginValidateStackAtManagementGroup(
            config.inputs.managementGroupId,
            config.inputs.name,
            deploymentStack
          )
      break

    case 'subscription':
      client.subscriptionId = config.inputs.subscriptionId
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginValidateStackAtSubscriptionAndWait(
            config.inputs.name,
            deploymentStack
          )
        : client.deploymentStacks.beginValidateStackAtSubscription(
            config.inputs.name,
            deploymentStack
          )
      break

    case 'resourceGroup':
      operationPromise = config.inputs.wait
        ? client.deploymentStacks.beginValidateStackAtResourceGroupAndWait(
            config.inputs.resourceGroupName,
            config.inputs.name,
            deploymentStack
          )
        : client.deploymentStacks.beginValidateStackAtResourceGroup(
            config.inputs.resourceGroupName,
            config.inputs.name,
            deploymentStack
          )
      break
  }

  // TODO(ljtill): Parse error messages

  await operationPromise

  core.info(`No validation errors detected`)
}
