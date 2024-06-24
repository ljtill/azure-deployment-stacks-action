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
  let operationPromise

  switch (options.scope) {
    case 'managementGroup':
      operationPromise = client.deploymentStacks.getAtManagementGroup(
        options.managementGroupId,
        options.name
      )
      break

    case 'subscription':
      client.subscriptionId = options.subscriptionId
      operationPromise = client.deploymentStacks.getAtSubscription(options.name)
      break

    case 'resourceGroup':
      operationPromise = client.deploymentStacks.getAtResourceGroup(
        options.resourceGroupName,
        options.name
      )
      break
  }

  const deploymentStack = await operationPromise

  if (!deploymentStack) {
    throw new Error(`Deployment stack not found`)
  }

  return deploymentStack
}

/**
 * Create deployment stack.
 */
export async function createDeploymentStack(
  options: Options,
  client: DeploymentStacksClient
): Promise<void> {
  // Display operation message
  ;(await getDeploymentStack(options, client))
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
      denySettings: helper.newDenySettings(options.denySettings),
      template,
      parameters
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

  await operationPromise
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
  // TODO(ljtill): Implement
}
