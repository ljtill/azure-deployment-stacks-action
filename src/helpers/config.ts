import * as core from '@actions/core'
import * as github from '@actions/github'

import * as helpers from '../helpers'
import {
  Config,
  createDefaultConfig,
  TemplateType,
  ParametersType
} from '../models'

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
 * Sets the scope inputs in the configuration object.
 * @param config - The configuration object.
 */
function setScopeInputs(config: Config): void {
  config.inputs.scope = getInput('scope', true, [
    'management-group',
    'subscription',
    'resource-group'
  ])

  // Handle scope properties
  switch (config.inputs.scope) {
    case 'management-group':
      config.inputs.managementGroupId = getInput('management-group-id', true)
      break
    case 'subscription':
      config.inputs.subscriptionId = getInput('subscription-id', true)
      break
    case 'resource-group':
      config.inputs.resourceGroupName = getInput('resource-group-name', true)
      break
  }
}

/**
 * Sets the mode inputs in the configuration object.
 * @param config - The configuration object.
 */
function setModeInputs(config: Config): void {
  // Action on unmanage
  config.inputs.actionOnUnmanage = getInput('action-on-unmanage', true, [
    'delete-all',
    'delete-resources',
    'detach-all'
  ])

  // Deny settings
  config.inputs.denySettings = getInput('deny-settings', true, [
    'deny-delete',
    'deny-write-and-delete',
    'none'
  ])

  // Apply to child scopes
  config.inputs.applyToChildScopes =
    getInput('apply-to-child-scopes', false) === 'true'

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
 * @returns A Promise that resolves when the template context is set.
 * @throws An error if more than one or none of the template inputs are set.
 */
async function setTemplateContext(config: Config): Promise<void> {
  const templateFile = getInput('template-file', false)
  const templateSpec = getInput('template-spec', false)
  const templateUri = getInput('template-uri', false)

  const templateInputs = [templateFile, templateSpec, templateUri]
  const validTemplateInputs = templateInputs.filter(Boolean)

  if (validTemplateInputs.length > 1 || validTemplateInputs.length === 0) {
    throw new Error(
      "Only one of 'template-file', 'template-spec', or 'template-uri' can be set."
    )
  }

  if (templateFile) {
    config.context.templateType = TemplateType.File
    config.inputs.templateFile = templateFile
    config.context.template = await helpers.parseTemplateFile(config)
  } else if (templateSpec) {
    config.context.templateType = TemplateType.Spec
    config.inputs.templateSpec = templateSpec
  } else if (templateUri) {
    config.context.templateType = TemplateType.Uri
    config.inputs.templateUri = templateUri
  }
}

/**
 * Sets the parameters context based on the provided configuration.
 * @param config - The configuration object.
 * @returns A promise that resolves when the parameters context is set.
 */
async function setParametersContext(config: Config): Promise<void> {
  const parametersFile = getInput('parameters-file', false)
  const parameters = getInput('parameters', false)
  const parametersUri = getInput('parameters-uri', false)

  const parametersInputs = [parametersFile, parameters, parametersUri]
  const validParametersInputs = parametersInputs.filter(Boolean)

  if (validParametersInputs.length > 1) {
    throw new Error(
      "Only one of 'parameters-file', 'parameters', or 'parameters-uri' can be set."
    )
  }

  if (parametersFile) {
    config.context.parametersType = ParametersType.File
    config.inputs.parametersFile = parametersFile
    config.context.parameters = await helpers.parseParametersFile(config)
  } else if (parameters) {
    config.context.parametersType = ParametersType.Object
    config.inputs.parameters = parameters
    config.context.parameters = await helpers.parseParametersObject(config)
  } else if (parametersUri) {
    config.context.parametersType = ParametersType.Link
    config.inputs.parametersUri = parametersUri
  } else {
    config.context.parametersType = ParametersType.Undefined
  }
}

/**
 * Initializes the configuration for the deployment stack action.
 * @returns A promise that resolves to the initialized configuration.
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

  core.debug(`Configuration: ${JSON.stringify(config.inputs, null, 2)}`)

  return config
}
