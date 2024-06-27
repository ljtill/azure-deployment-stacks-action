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

function setCommonInputs(config: Config) {
  config.inputs.name = getInput('name', true)
  config.inputs.location = getInput('location', false)
  config.inputs.mode = getInput('mode', true, ['create', 'delete', 'validate'])
  config.inputs.wait = getInput('wait', false) === 'true'
}

function setModeInputs(config: Config) {
  if (config.inputs.mode === 'create' || config.inputs.mode === 'validate') {
    config.inputs.description = getInput('description', false)

    // Action on unmanage
    config.inputs.actionOnUnmanage = getInput('actionOnUnmanage', true, [
      'deleteAll',
      'deleteResources',
      'detachAll'
    ])

    // Deny settings
    config.inputs.denySettings = getInput('denySettings', true, [
      'denyDelete',
      'denyWriteAndDelete',
      'none'
    ])

    // Apply to child scopes
    config.inputs.applyToChildScopes =
      getInput('applyToChildScopes', false) === 'true'

    // Excluded actions
    const excludedActions = getInput('excludedActions', false)
    config.inputs.excludedActions = excludedActions
      ? excludedActions.split(',')
      : []

    // Excluded principals
    const excludedPrincipals = getInput('excludedPrincipals', false)
    config.inputs.excludedPrincipals = excludedPrincipals
      ? excludedPrincipals.split(',')
      : []

    // Template and parameters files
    config.inputs.templateFile = getInput('templateFile', true)
    config.inputs.parametersFile = getInput('parametersFile', false)

    // Runtime context
    config.context.repository = `${github.context.repo.owner}/${github.context.repo.repo}`
    config.context.commit = github.context.sha
    config.context.branch = github.context.ref

    // Bypass stack out of sync error
    config.inputs.bypassStackOutOfSyncError =
      getInput('bypassStackOutOfSyncError', false) === 'true'
  }
}

function setScopeInputs(config: Config) {
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
}

/**
 * Creates a new configuration object based on user inputs.
 * @returns The new configuration object.
 */
export function newConfig(): Config {
  const config: Config = createDefaultConfig()

  setCommonInputs(config)
  setModeInputs(config)
  setScopeInputs(config)

  core.debug(`Configuration: ${JSON.stringify(config)}`)

  return config
}
