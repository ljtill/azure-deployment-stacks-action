import * as core from '@actions/core'
import { OperationState, SimplePollerLike } from '@azure/core-lro'
import { DefaultAzureCredential } from '@azure/identity'
import {
  DeploymentStack,
  DeploymentStackValidateResult
} from '@azure/arm-resourcesdeploymentstacks'
import { logger } from '../logger'
import { Config } from '../models'

type Result =
  | DeploymentStack
  | SimplePollerLike<OperationState<DeploymentStack>, DeploymentStack>
  | undefined

type ValidateResult =
  | DeploymentStackValidateResult
  | SimplePollerLike<
      OperationState<DeploymentStackValidateResult>,
      DeploymentStackValidateResult
    >
  | undefined

/**
 * Checks if the given result is an instance of DeploymentStack.
 * @param result - The result to check.
 * @returns True if the result is an instance of DeploymentStack, false otherwise.
 */
function instanceOfDeploymentStack(result: Result): result is DeploymentStack {
  return (
    !!result &&
    'id' in result &&
    'name' in result &&
    'type' in result &&
    'systemData' in result &&
    'location' in result &&
    'tags' in result &&
    'properties' in result
  )
}

/**
 * Checks if the provided result is an instance of DeploymentStackValidateResult.
 * @param result - The result to be checked.
 * @returns True if the result is an instance of DeploymentStackValidateResult, false otherwise.
 */
function instanceOfDeploymentStackValidateResult(
  result: ValidateResult
): result is DeploymentStackValidateResult {
  return (
    !!result &&
    'id' in result &&
    'name' in result &&
    'type' in result &&
    'properties' in result
  )
}

/**
 * Creates a new instance of DefaultAzureCredential.
 * @returns A new instance of DefaultAzureCredential.
 */
export function newCredential(): DefaultAzureCredential {
  return new DefaultAzureCredential()
}

/**
 * Logs the deployment stack result.
 * @param result - The deployment stack result.
 */
export function logDeploymentStackResult(result: Result): void {
  if (result === undefined) {
    core.warning('No result returned from operation')
    return
  }

  if (instanceOfDeploymentStack(result)) {
    core.startGroup('Resources')
    for (const item of result.properties?.resources || []) {
      logger.info(`- Id:          ${item.id}`)
      logger.info(`  Status:      ${item.status}`)
      logger.info(`  Deny Status: ${item.denyStatus}`)
    }
    core.endGroup()

    core.startGroup('Deleted Resources')
    for (const item of result.properties?.deletedResources || []) {
      logger.info(`- Id: ${item.id}`)
    }
    core.endGroup()

    core.startGroup('Detached Resources')
    for (const item of result.properties?.detachedResources || []) {
      logger.info(`- Id: ${item.id}`)
    }
    core.endGroup()

    core.startGroup('Failed Resources')
    for (const item of result.properties?.failedResources || []) {
      logger.info(`- Id:    ${item.id}`)
      logger.info(`  Error: ${item.error?.code}`)
    }
    core.endGroup()
  } else {
    logger.debug(`Payload: ${JSON.stringify(result)}`)
  }
}

/**
 * Logs the result of validating a deployment stack.
 * @param validateResult - The result of the validation operation.
 */
export function logDeploymentStackValidateResult(
  validateResult: ValidateResult
): void {
  if (validateResult === undefined) {
    logger.warning('No result returned from operation')
    return
  }

  if (instanceOfDeploymentStackValidateResult(validateResult)) {
    if (validateResult.error?.code) {
      throw new Error(
        `Validation failed with error: ${validateResult.error.code}`
      )
    }

    core.startGroup('Resources')
    for (const item of validateResult.properties?.validatedResources || []) {
      logger.info(`- Id: ${item.id}`)
    }
    core.endGroup()
  } else {
    logger.debug(`Payload: ${JSON.stringify(validateResult)}`)
  }
}

interface ActionOnUnmanage {
  managementGroups: string
  resourceGroups: string
  resources: string
}

/**
 * Prepares the unmanage properties based on the provided value.
 * @param value - The value indicating the action to be performed on unmanage.
 * @returns The ActionOnUnmanage object with the corresponding properties set.
 * @throws Error if the provided value is invalid.
 */
export function prepareUnmanageProperties(value: string): ActionOnUnmanage {
  switch (value) {
    case 'deleteResources':
      return {
        managementGroups: 'detach',
        resourceGroups: 'detach',
        resources: 'delete'
      }
    case 'deleteAll':
      return {
        managementGroups: 'delete',
        resourceGroups: 'delete',
        resources: 'delete'
      }
    case 'detachAll':
      return {
        managementGroups: 'detach',
        resourceGroups: 'detach',
        resources: 'detach'
      }
    default:
      throw new Error(`Invalid actionOnUnmanage: ${value}`)
  }
}

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
export function prepareDenySettings(config: Config): DenySettings {
  return {
    mode: config.inputs.denySettings,
    applyToChildScopes: config.inputs.applyToChildScopes,
    excludedActions: config.inputs.excludedActions,
    excludedPrincipals: config.inputs.excludedPrincipals
  }
}
