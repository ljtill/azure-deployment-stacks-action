import * as core from '@actions/core'
import {
  DeploymentStacksClient,
  DeploymentStack
} from '@azure/arm-resourcesdeploymentstacks'
import * as helpers from '../helpers'
import { Config } from '../models'

/**
 * Retrieves the deployment stack based on the provided configuration.
 * @param config - The configuration object.
 * @param client - The DeploymentStacksClient instance.
 * @returns A Promise that resolves to the DeploymentStack object.
 * @throws An error if the deployment stack is not found.
 */
async function getDeploymentStack(
  config: Config,
  client: DeploymentStacksClient
): Promise<DeploymentStack> {
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
 * Creates a deployment stack based on the provided configuration.
 * @param config - The configuration object for creating the deployment stack.
 * @returns A Promise that resolves when the deployment stack is created.
 */
export async function createDeploymentStack(config: Config): Promise<void> {
  core.info(`Creating deployment stack`)

  const client = new DeploymentStacksClient(helpers.newCredential())
  const deploymentStack = await helpers.newDeploymentStack(config)
  const optionalParams = {}

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

  helpers.logResult(await operationPromise)

  core.info(`Created deployment stack`)
}

/**
 * Deletes a deployment stack based on the provided configuration.
 * @param config - The configuration object containing the necessary parameters.
 * @returns A Promise that resolves when the deletion operation is complete.
 */
export async function deleteDeploymentStack(config: Config): Promise<void> {
  core.info(`Deleting deployment stack`)

  const client = new DeploymentStacksClient(helpers.newCredential())
  const deploymentStack = await getDeploymentStack(config, client)
  const optionalParams = {
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

  core.debug(`Deleted deployment stack`)
}

/**
 * Validates the deployment stack based on the provided configuration.
 * @param config - The configuration object.
 * @returns A Promise that resolves when the validation is complete.
 */
export async function validateDeploymentStack(config: Config): Promise<void> {
  const client = new DeploymentStacksClient(helpers.newCredential())

  core.info(`Validating deployment stack`)

  const deploymentStack = await helpers.newDeploymentStack(config)
  const optionalParams = {}

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

  helpers.logValidateResult(await operationPromise)

  core.info(`Validated deployment stack`)
}
