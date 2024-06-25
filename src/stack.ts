import * as core from '@actions/core'
import {
  DeploymentStacksClient,
  DeploymentStack
} from '@azure/arm-resourcesdeploymentstacks'
import * as helper from './helper'
import { Options } from './types'

/**
 * Get deployment stack.
 */
async function getDeploymentStack(
  options: Options,
  client: DeploymentStacksClient
): Promise<DeploymentStack> {
  core.debug(`Retrieving deployment stack`)

  let deploymentStack: DeploymentStack | undefined

  switch (options.scope) {
    case 'managementGroup':
      deploymentStack = await client.deploymentStacks.getAtManagementGroup(
        options.managementGroupId,
        options.name
      )
      break

    case 'subscription':
      client.subscriptionId = options.subscriptionId
      deploymentStack = await client.deploymentStacks.getAtSubscription(
        options.name
      )
      break

    case 'resourceGroup':
      deploymentStack = await client.deploymentStacks.getAtResourceGroup(
        options.resourceGroupName,
        options.name
      )
      break
  }

  if (!deploymentStack) {
    throw new Error(`Deployment stack not found`)
  }

  return deploymentStack
}

/**
 * List deployment stacks.
 */
async function listDeploymentStacks(
  options: Options,
  client: DeploymentStacksClient
): Promise<DeploymentStack[]> {
  core.debug(`Listing deployment stacks`)

  const deploymentStacks = []

  switch (options.scope) {
    case 'managementGroup':
      for await (const item of client.deploymentStacks.listAtManagementGroup(
        options.managementGroupId
      )) {
        deploymentStacks.push(item)
      }
      break

    case 'subscription':
      client.subscriptionId = options.subscriptionId
      for await (const item of client.deploymentStacks.listAtSubscription()) {
        deploymentStacks.push(item)
      }
      break

    case 'resourceGroup':
      for await (const item of client.deploymentStacks.listAtResourceGroup(
        options.resourceGroupName
      )) {
        deploymentStacks.push(item)
      }
      break
  }

  return deploymentStacks
}

/**
 * Create deployment stack.
 */
export async function createDeploymentStack(
  options: Options,
  client: DeploymentStacksClient
): Promise<void> {
  // Display operation message
  !(await listDeploymentStacks(options, client)).some(
    stack => stack.name === options.name
  )
    ? core.info(`Creating deployment stack`)
    : core.info(`Updating deployment stack`)

  // Parse template and parameter files
  const template = await helper.parseTemplateFile(options)
  const parameters = options.parametersFile
    ? helper.parseParametersFile(options)
    : {}

  // Initialize deployment stack
  const deploymentStack: DeploymentStack = {
    location: options.location,
    properties: {
      description: options.description,
      actionOnUnmanage: helper.newUnmanageProperties(options.actionOnUnmanage),
      denySettings: helper.newDenySettings(options),
      template,
      parameters
    },
    tags: {
      repository: options.repository,
      commit: options.commit,
      branch: options.branch
    }
  }

  let operationPromise

  switch (options.scope) {
    case 'managementGroup':
      operationPromise = options.wait
        ? client.deploymentStacks.beginCreateOrUpdateAtManagementGroupAndWait(
            options.managementGroupId,
            options.name,
            deploymentStack
          )
        : client.deploymentStacks.beginCreateOrUpdateAtManagementGroup(
            options.managementGroupId,
            options.name,
            deploymentStack
          )
      break

    case 'subscription':
      client.subscriptionId = options.subscriptionId
      operationPromise = options.wait
        ? client.deploymentStacks.beginCreateOrUpdateAtSubscriptionAndWait(
            options.name,
            deploymentStack
          )
        : client.deploymentStacks.beginCreateOrUpdateAtSubscription(
            options.name,
            deploymentStack
          )
      break

    case 'resourceGroup':
      operationPromise = options.wait
        ? client.deploymentStacks.beginCreateOrUpdateAtResourceGroupAndWait(
            options.resourceGroupName,
            options.name,
            deploymentStack
          )
        : client.deploymentStacks.beginCreateOrUpdateAtResourceGroup(
            options.resourceGroupName,
            options.name,
            deploymentStack
          )
      break
  }

  const result = await operationPromise

  if (result) {
    if (helper.instanceOfDeploymentStack(result)) {
      core.info(`Deployment stack created`)

      core.info(`Resources:`)
      for (const item of result.properties?.resources || []) {
        core.info(`Status: ${item.status}`)
        core.info(`DenyStatus: ${item.denyStatus}`)
        core.info(`Id: ${item.id}`)
      }
    }
  }
}

/**
 * Delete deployment stack.
 */
export async function deleteDeploymentStack(
  options: Options,
  client: DeploymentStacksClient
): Promise<void> {
  core.info(`Deleting deployment stack`)

  const deploymentStack = await getDeploymentStack(options, client)
  const params = {
    unmanageActionManagementGroups:
      deploymentStack.properties?.actionOnUnmanage.managementGroups,
    unmanageActionResourceGroups:
      deploymentStack.properties?.actionOnUnmanage.resourceGroups,
    unmanageActionResources:
      deploymentStack.properties?.actionOnUnmanage.resources
  }

  let operationPromise

  switch (options.scope) {
    case 'managementGroup':
      operationPromise = options.wait
        ? client.deploymentStacks.beginDeleteAtManagementGroupAndWait(
            options.managementGroupId,
            options.name,
            params
          )
        : client.deploymentStacks.beginDeleteAtManagementGroup(
            options.managementGroupId,
            options.name,
            params
          )
      break

    case 'subscription':
      client.subscriptionId = options.subscriptionId
      operationPromise = options.wait
        ? client.deploymentStacks.beginDeleteAtSubscriptionAndWait(
            options.name,
            params
          )
        : client.deploymentStacks.beginDeleteAtSubscription(
            options.name,
            params
          )
      break

    case 'resourceGroup':
      operationPromise = options.wait
        ? client.deploymentStacks.beginDeleteAtResourceGroupAndWait(
            options.resourceGroupName,
            options.name,
            params
          )
        : client.deploymentStacks.beginDeleteAtResourceGroup(
            options.resourceGroupName,
            options.name,
            params
          )
      break
  }

  await operationPromise
}

/**
 * Validate deployment stack.
 */
export async function validateDeploymentStack(
  options: Options,
  client: DeploymentStacksClient
): Promise<void> {
  core.info(`Validating deployment stack`)

  // Parse template and parameter files
  const template = await helper.parseTemplateFile(options)
  const parameters = options.parametersFile
    ? helper.parseParametersFile(options)
    : {}

  // Initialize deployment stack
  const deploymentStack: DeploymentStack = {
    location: options.location,
    properties: {
      description: options.description,
      actionOnUnmanage: helper.newUnmanageProperties(options.actionOnUnmanage),
      denySettings: helper.newDenySettings(options),
      template,
      parameters
    },
    tags: {
      repository: options.repository,
      commit: options.commit,
      branch: options.branch
    }
  }

  let operationPromise

  switch (options.scope) {
    case 'managementGroup':
      operationPromise = options.wait
        ? client.deploymentStacks.beginValidateStackAtManagementGroupAndWait(
            options.managementGroupId,
            options.name,
            deploymentStack
          )
        : client.deploymentStacks.beginValidateStackAtManagementGroup(
            options.managementGroupId,
            options.name,
            deploymentStack
          )
      break

    case 'subscription':
      client.subscriptionId = options.subscriptionId
      operationPromise = options.wait
        ? client.deploymentStacks.beginValidateStackAtSubscriptionAndWait(
            options.name,
            deploymentStack
          )
        : client.deploymentStacks.beginValidateStackAtSubscription(
            options.name,
            deploymentStack
          )
      break

    case 'resourceGroup':
      operationPromise = options.wait
        ? client.deploymentStacks.beginValidateStackAtResourceGroupAndWait(
            options.resourceGroupName,
            options.name,
            deploymentStack
          )
        : client.deploymentStacks.beginValidateStackAtResourceGroup(
            options.resourceGroupName,
            options.name,
            deploymentStack
          )
      break
  }

  // TODO(ljtill): Parse error messages

  await operationPromise

  core.info(`No validation errors detected`)
}
