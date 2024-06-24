import * as core from '@actions/core'
import {
  DeploymentStacksClient,
  DeploymentStack
} from '@azure/arm-resourcesdeploymentstacks'
import * as helper from './helper'
import { Options } from './types'

/**
 * Create or update deployment stack.
 */
export async function createOrUpdateDeploymentStack(
  options: Options,
  client: DeploymentStacksClient,
  template: Record<string, unknown>,
  parameters: Record<string, unknown>
): Promise<void> {
  core.info(`Creating deployment stack`)

  const deploymentStack: DeploymentStack = {
    description: options.description,
    location: options.location,
    actionOnUnmanage: helper.parseUnmanageProperties(options.actionOnUnmanage),
    denySettings: { mode: options.denySettings },
    template,
    parameters
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

  let operationPromise

  const properties = helper.parseUnmanageProperties(options.actionOnUnmanage)
  const params = {
    unmanageActionManagementGroups: properties.managementGroups,
    unmanageActionResourceGroups: properties.resourceGroups,
    unmanageActionResources: properties.resources
  }

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
