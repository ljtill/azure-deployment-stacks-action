import * as core from '@actions/core'
import {
  DeploymentStacksClient,
  DeploymentStack
} from '@azure/arm-resourcesdeploymentstacks'
import { Options, Scope } from './types'

/**
 * Get deployment stack.
 */
async function getDeploymentStack(
  options: Options,
  client: DeploymentStacksClient
): Promise<DeploymentStack | void> {
  core.info(`Retrieving deployment stack...`)

  switch (options.scope) {
    case Scope.ManagementGroup:
      return await client.deploymentStacks.getAtManagementGroup(
        options.managementGroupId,
        options.name
      )

    case Scope.Subscription:
      return await client.deploymentStacks.getAtSubscription(options.name)

    case Scope.ResourceGroup:
      return await client.deploymentStacks.getAtResourceGroup(
        options.resourceGroupName,
        options.name
      )
  }
}

/**
 * Create or update deployment stack.
 */
export async function createOrUpdateDeploymentStack(
  options: Options,
  client: DeploymentStacksClient,
  template: Record<string, unknown>,
  parameters: Record<string, unknown>
): Promise<void> {
  ;(await getDeploymentStack(options, client))
    ? core.info(`Updating deployment stack...`)
    : core.info(`Creating deployment stack...`)

  const deploymentStack: DeploymentStack = {
    description: options.description,
    location: options.location,
    actionOnUnmanage: { resources: options.actionsOnUnmanage },
    denySettings: { mode: options.denySettings },
    template,
    parameters
  }

  let operationPromise

  switch (options.scope) {
    case Scope.ManagementGroup:
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

    case Scope.Subscription:
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

    case Scope.ResourceGroup:
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
  ;(await getDeploymentStack(options, client))
    ? core.info(`Deleting deployment stack...`)
    : core.info(`Skipping deployment stack...`)

  let operationPromise

  switch (options.scope) {
    case Scope.ManagementGroup:
      core.debug(`Deleting deployment stack at management group...`)
      operationPromise = options.wait
        ? client.deploymentStacks.beginDeleteAtManagementGroupAndWait(
            options.managementGroupId,
            options.name
          )
        : client.deploymentStacks.beginDeleteAtManagementGroup(
            options.managementGroupId,
            options.name
          )
      break

    case Scope.Subscription:
      core.debug(`Deleting deployment stack at subscription...`)
      operationPromise = options.wait
        ? client.deploymentStacks.beginDeleteAtSubscriptionAndWait(options.name)
        : client.deploymentStacks.beginDeleteAtSubscription(options.name)
      break

    case Scope.ResourceGroup:
      core.debug(`Deleting deployment stack at resource group...`)
      operationPromise = options.wait
        ? client.deploymentStacks.beginDeleteAtResourceGroupAndWait(
            options.resourceGroupName,
            options.name
          )
        : client.deploymentStacks.beginDeleteAtResourceGroup(
            options.resourceGroupName,
            options.name
          )
      break
  }

  await operationPromise
}
