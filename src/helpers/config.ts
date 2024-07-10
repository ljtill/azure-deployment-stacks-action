import * as core from '@actions/core'
import * as github from '@actions/github'
import { Config, createDefaultConfig } from '../models'
import * as helpers from '../helpers'

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
 * Sets the scope inputs based on the provided configuration.
 * @param config - The configuration object.
 */
function setScopeInputs(config: Config): void {
  config.inputs.scope = getInput('scope', true, [
    'managementGroup',
    'subscription',
    'resourceGroup'
  ])

  switch (config.inputs.scope) {
    case 'managementGroup':
      config.inputs.managementGroupId = getInput('management-group-id', true)
      break
    case 'subscription':
      config.inputs.subscriptionId = getInput('subscription-id', true)
      break
    case 'resourceGroup':
      config.inputs.resourceGroupName = getInput('resource-group-name', true)
      break
  }
}

/**
 * Sets the mode inputs based on the provided configuration.
 * @param config - The configuration object.
 */
function setModeInputs(config: Config): void {
  // Action on unmanage
  config.inputs.actionOnUnmanage = getInput('action-on-unmanage', true, [
    'deleteAll',
    'deleteResources',
    'detachAll'
  ])

  // Deny settings
  config.inputs.denySettings = getInput('deny-settings', true, [
    'denyDelete',
    'denyWriteAndDelete',
    'none'
  ])

  // Apply to child scopes
  config.inputs.applyToChildScopes =
    getInput('applyToChildScopes', false) === 'true'

  // Excluded actions
  const excludedActions = getInput('excluded-actions', false)
  config.inputs.excludedActions = excludedActions
    ? excludedActions.split(',')
    : []

  // Excluded principals
  const excludedPrincipals = getInput('excluded-principals', false)
  config.inputs.excludedPrincipals = excludedPrincipals
    ? excludedPrincipals.split(',')
    : []

  // Runtime context
  config.context.repository = `${github.context.repo.owner}/${github.context.repo.repo}`
  config.context.commit = github.context.sha
  config.context.branch = github.context.ref

  // Out of sync error
  config.inputs.bypassStackOutOfSyncError =
    getInput('bypass-stack-out-of-sync-error', false) === 'true'
}

/**
 * Sets the template context based on the provided configuration.
 * @param config - The configuration object.
 */
async function setTemplateContext(config: Config): Promise<void> {
  const templateFile = getInput('template-file', false)
  const templateSpec = getInput('template-spec', false)
  const templateUri = getInput('template-uri', false)

  const templateInputs = [templateFile, templateSpec, templateUri]
  const validTemplateInputs = templateInputs.filter(Boolean)

  if (validTemplateInputs.length > 1 || validTemplateInputs.length === 0) {
    throw new Error(
      "Only one of 'templateFile', 'templateSpec', or 'templateUri' can be set."
    )
  }

  if (templateFile) {
    config.context.templateType = 'template-file'
    config.inputs.templateFile = templateFile
    config.context.template = await helpers.parseTemplateFile(config)
  } else if (templateSpec) {
    config.context.templateType = 'template-spec'
    config.inputs.templateSpec = templateSpec
  } else if (templateUri) {
    config.context.templateType = 'template-uri'
    config.inputs.templateUri = templateUri
  }
}

/**
 * Sets the parameters context based on the provided configuration.
 * @param config - The configuration object.
 */
async function setParametersContext(config: Config): Promise<void> {
  const parametersFile = getInput('parameters-file', false)
  const parameters = getInput('parameters', false)
  const parametersUri = getInput('parameters-uri', false)

  const parametersInputs = [parametersFile, parameters, parametersUri]
  const validParametersInputs = parametersInputs.filter(Boolean)

  if (validParametersInputs.length > 1) {
    throw new Error(
      "Only one of 'parametersFile', 'parameters', or 'parametersUri' can be set."
    )
  }

  if (parametersFile) {
    config.context.parametersType = 'parametersFile'
    config.inputs.parametersFile = parametersFile
    config.context.parameters = (
      await helpers.parseParametersFile(config)
    ).parameters
  } else if (parameters) {
    config.context.parametersType = 'parameters'
    config.inputs.parameters = parameters
    config.context.parameters = (
      await helpers.parseParametersObject(config)
    ).parameters
  } else if (parametersUri) {
    config.context.parametersType = 'parametersUri'
    config.inputs.parametersUri = parametersUri
  } else {
    config.context.parametersType = 'none'
  }
}

/**
 * Creates a new configuration object based on workflow inputs.
 * @returns The new configuration object.
 */
export async function initializeConfig(): Promise<Config> {
  const config: Config = createDefaultConfig()

  // Standard inputs
  config.inputs.name = getInput('name', true)
  config.inputs.description = getInput('description', false)
  config.inputs.location = getInput('location', false)
  config.inputs.mode = getInput('mode', true, ['create', 'delete', 'validate'])
  config.inputs.wait = getInput('wait', false) === 'true'

  setScopeInputs(config)

  if (['create', 'validate'].includes(config.inputs.mode)) {
    setModeInputs(config)
    await setTemplateContext(config)
    await setParametersContext(config)
  }

  // TODO(ljtill): Optional output artifact
  core.debug(`Configuration: ${JSON.stringify(config.inputs)}`)

  return config
}
