import * as core from '@actions/core'
import * as github from '@actions/github'
import { Config, createDefaultConfig } from '../models'

/**
 * Retrieves the value of the specified input key from the workflow run context.
 * @param key - The name of the input key.
 * @param required - Specifies whether the input is required. If set to true and the input is not provided, an error will be thrown.
 * @param validValues - An optional array of valid values for the input. If provided, the retrieved value must be one of the valid values, otherwise an error will be thrown.
 * @returns The value of the input key.
 * @throws Error if the input is required but not provided, or if the retrieved value is not one of the valid values (if specified).
 */
function getInput(
  key: string,
  required: boolean,
  validValues?: string[]
): string {
  const value = core.getInput(key, { required, trimWhitespace: true })
  if (validValues && !validValues.includes(value)) {
    throw new Error(`Invalid ${key}`)
  }

  return value
}

/**
 * Creates a new configuration object based on user inputs.
 * @returns The new configuration object.
 */
export function newConfig(): Config {
  const config: Config = createDefaultConfig()

  config.inputs.name = getInput('name', true)
  config.inputs.mode = getInput('mode', true, ['create', 'delete', 'validate'])

  if (config.inputs.mode === 'create' || config.inputs.mode === 'validate') {
    config.inputs.description = getInput('description', false)
    config.inputs.location = getInput('location', false)

    config.inputs.actionOnUnmanage = getInput('actionOnUnmanage', true, [
      'deleteAll',
      'deleteResources',
      'detachAll'
    ])

    config.inputs.denySettings = getInput('denySettings', true, [
      'denyDelete',
      'denyWriteAndDelete',
      'none'
    ])

    config.inputs.applyToChildScopes =
      getInput('applyToChildScopes', false) === 'true'

    const excludedActions = getInput('excludedActions', false)
    config.inputs.excludedActions = excludedActions
      ? excludedActions.split(',')
      : []

    const excludedPrincipals = getInput('excludedPrincipals', false)
    config.inputs.excludedPrincipals = excludedPrincipals
      ? excludedPrincipals.split(',')
      : []

    config.inputs.templateFile = getInput('templateFile', true)
    config.inputs.parametersFile = getInput('parametersFile', false)

    config.context.repository = `${github.context.repo.owner}/${github.context.repo.repo}`
    config.context.commit = github.context.sha
    config.context.branch = github.context.ref
  }

  config.inputs.scope = getInput('scope', true, [
    'managementGroup',
    'subscription',
    'resourceGroup'
  ])

  switch (config.inputs.scope) {
    case 'managementGroup':
      config.inputs.managementGroupId = getInput('managementGroupId', true)
      break
    case 'subscription':
      config.inputs.subscriptionId = getInput('subscriptionId', true)
      break
    case 'resourceGroup':
      config.inputs.resourceGroupName = getInput('resourceGroupName', true)
      break
  }

  config.inputs.bypassStackOutOfSyncError =
    getInput('bypassStackOutOfSyncError', false) === 'true'
  config.inputs.wait = getInput('wait', false) === 'true'

  return config
}
