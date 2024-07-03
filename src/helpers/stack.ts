import * as core from '@actions/core'
import { OperationState, SimplePollerLike } from '@azure/core-lro'
import { DefaultAzureCredential } from '@azure/identity'
import {
  DeploymentStack,
  DeploymentStackValidateResult,
  DeploymentStackProperties
} from '@azure/arm-resourcesdeploymentstacks'
import { Config } from '../models'

/**
 * Represents the result of a deployment stack operation.
 * It can be either a DeploymentStack object, a SimplePollerLike object,
 * or undefined if the result is not available.
 */
type Result =
  | DeploymentStack
  | SimplePollerLike<OperationState<DeploymentStack>, DeploymentStack>
  | undefined

/**
 * Represents the result of a deployment stack validation operation.
 * It can be either a DeploymentStackValidateResult object, a SimplePollerLike object,
 * or undefined if the result is not available.
 */
type ValidateResult =
  | DeploymentStackValidateResult
  | SimplePollerLike<
      OperationState<DeploymentStackValidateResult>,
      DeploymentStackValidateResult
    >
  | undefined

/**
 * Checks if the provided result is an instance of 'DeploymentStack'.
 * @param result - The result to check.
 * @returns A boolean value indicating whether the object is an instance of DeploymentStack.
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
 * Checks if the provided result is an instance of `DeploymentStackValidateResult`.
 * @param result - The result to be checked.
 * @returns A boolean value indicating whether the object is an instance of DeploymentStackValidateResult.
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
 * Creates a new deployment stack based on the provided configuration.
 * @param config - The configuration object for the deployment stack.
 * @returns A promise that resolves to the created DeploymentStack.
 */
export async function newDeploymentStack(
  config: Config
): Promise<DeploymentStack> {
  const properties: DeploymentStackProperties = {
    description: config.inputs.description,
    actionOnUnmanage: prepareUnmanageProperties(config.inputs.actionOnUnmanage),
    denySettings: prepareDenySettings(config),
    bypassStackOutOfSyncError: config.inputs.bypassStackOutOfSyncError
  }

  switch (config.context.templateType) {
    case 'templateFile':
      properties.template = config.context.template
      break
    case 'templateSpec':
      properties.templateLink = {
        id: config.inputs.templateSpec
      }
      break
    case 'templateUri':
      properties.templateLink = {
        uri: config.inputs.templateUri
      }
      break
  }

  switch (config.context.parametersType) {
    case 'parametersFile':
      properties.parameters = config.context.parameters
      break
    case 'parametersUri':
      properties.parametersLink = {
        uri: config.inputs.parametersUri
      }
      break
  }

  return {
    location: config.inputs.location,
    properties,
    tags: {
      repository: config.context.repository,
      commit: config.context.commit,
      branch: config.context.branch
    }
  }
}

/**
 * Parses the result of a deployment stack operation and logs the deployed resources.
 * @param result - The result of the deployment stack operation.
 */
export function logResult(result: Result): void {
  if (result === undefined) {
    core.warning('No result returned from operation')
    return
  }

  if (instanceOfDeploymentStack(result)) {
    core.startGroup('Resources')
    for (const item of result.properties?.resources || []) {
      core.info(`- Id:          ${item.id}`)
      core.info(`  Status:      ${item.status}`)
      core.info(`  Deny Status: ${item.denyStatus}`)
    }
    core.endGroup()

    core.startGroup('Deleted Resources')
    for (const item of result.properties?.deletedResources || []) {
      core.info(`- Id: ${item.id}`)
    }
    core.endGroup()

    core.startGroup('Detached Resources')
    for (const item of result.properties?.detachedResources || []) {
      core.info(`- Id: ${item.id}`)
    }
    core.endGroup()

    core.startGroup('Failed Resources')
    for (const item of result.properties?.failedResources || []) {
      core.info(`- Id:    ${item.id}`)
      core.info(`  Error: ${item.error?.code}`)
    }
    core.endGroup()
  } else {
    core.debug(`Payload: ${JSON.stringify(result)}`)
  }
}

export function logValidateResult(validateResult: ValidateResult): void {
  if (validateResult === undefined) {
    core.warning('No result returned from operation')
    return
  }

  if (instanceOfDeploymentStackValidateResult(validateResult)) {
    if (validateResult.error?.code) {
      core.setFailed(
        `Validation failed with error: ${validateResult.error.code}`
      )

      return
    }

    core.startGroup('Resources')
    for (const item of validateResult.properties?.validatedResources || []) {
      core.info(`- Id: ${item.id}`)
    }
    core.endGroup()
  } else {
    core.debug(`Payload: ${JSON.stringify(validateResult)}`)
  }
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
