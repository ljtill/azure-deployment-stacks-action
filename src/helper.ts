import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as io from '@actions/io'
import * as cache from '@actions/tool-cache'
import { Config, createDefaultConfig } from './types'

/**
 * Installs the Bicep binary based on the current platform and architecture.
 * @returns A Promise that resolves when the installation is complete.
 * @throws {Error} If the platform, architecture, or binary is not supported.
 */
export async function installBicep(): Promise<void> {
  core.debug(`Installing Bicep binary`)

  const url = 'https://github.com/azure/bicep/releases/latest/download/'

  switch (process.platform) {
    case 'win32':
      switch (process.arch) {
        case 'arm64':
          // TODO: Implement - bicep-win-arm64.exe
          throw new Error('Not implemented')
        case 'x64':
          // TODO: Implement - bicep-win-x64.exe
          throw new Error('Not implemented')
        default:
          throw new Error('Unsupported architecture')
      }
    case 'darwin':
      switch (process.arch) {
        case 'arm64':
          // TODO: Implement - bicep-osx-arm64
          throw new Error('Not implemented')
        case 'x64':
          // TODO: Implement - bicep-osx-x64
          throw new Error('Not implemented')
        default:
          throw new Error('Unsupported architecture')
      }
    case 'linux':
      switch (process.arch) {
        case 'arm64':
          await cache.downloadTool(
            `${url}bicep-linux-arm64`,
            `/usr/local/bin/bicep`
          )
          return
        case 'x64':
          await cache.downloadTool(
            `${url}bicep-linux-x64`,
            `/usr/local/bin/bicep`
          )
          return
        default:
          throw new Error('Unsupported architecture')
      }
    default:
      throw new Error('Unsupported platform')
  }
}

/**
 * Checks if Bicep is installed and displays its version.
 * @returns A promise that resolves to a boolean indicating if Bicep is installed.
 * @throws An error if Bicep is not installed.
 */
export async function checkBicepInstallation(): Promise<boolean> {
  core.debug(`Checking Bicep installation`)

  if ((await io.which('bicep', false)) === '') {
    throw new Error('Bicep is not installed')
  }

  await displayBicepVersion()

  return true
}

/**
 * Displays the Bicep version.
 * @returns A Promise that resolves when the Bicep version is displayed.
 */
async function displayBicepVersion(): Promise<void> {
  core.debug(`Displaying Bicep version`)

  const bicepPath = await io.which('bicep', true)

  const execOptions: exec.ExecOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        core.debug(data.toString().trim())
      },
      stderr: (data: Buffer) => {
        core.error(data.toString().trim())
      }
    },
    silent: true
  }

  await exec.exec(bicepPath, ['--version'], execOptions)
}

/**
 * Builds a Bicep file and returns the path of the output file.
 * @param filePath The path of the Bicep file to build.
 * @returns A promise that resolves to the path of the output file.
 */
async function buildBicepFile(filePath: string): Promise<string> {
  core.debug(`Building Bicep file`)

  // TODO(ljtill): Implement cross platform support
  const bicepPath = await io.which('bicep', true)
  const outputPath = '/tmp/main.json'

  const execOptions: exec.ExecOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        core.debug(data.toString().trim())
      },
      stderr: (data: Buffer) => {
        core.error(data.toString().trim())
      }
    },
    silent: true
  }

  await exec.exec(
    bicepPath,
    ['build', filePath, '--outfile', outputPath],
    execOptions
  )

  return outputPath
}

/**
 * Builds a Bicep parameters file for the given Bicep file path.
 * @param filePath The path to the Bicep file.
 * @returns A Promise that resolves to the path of the generated parameters file.
 */
async function buildBicepParametersFile(filePath: string): Promise<string> {
  core.debug(`Building Bicep parameters file`)

  // TODO(ljtill): Implement cross platform support
  const bicepPath = await io.which('bicep', true)
  const outputPath = '/tmp/params.json'

  const execOptions: exec.ExecOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        core.debug(data.toString().trim())
      },
      stderr: (data: Buffer) => {
        core.error(data.toString().trim())
      }
    },
    silent: true
  }

  await exec.exec(
    bicepPath,
    ['build-params', filePath, '--outfile', outputPath],
    execOptions
  )

  return outputPath
}

/**
 * Parses the template file and returns the parsed content as a JSON object.
 * @param config - The configuration object containing the input parameters.
 * @returns A Promise that resolves to the parsed template content.
 * @throws An error if the template file path is invalid.
 */
export async function parseTemplateFile(
  config: Config
): Promise<Record<string, unknown>> {
  core.debug(`Parsing template file: ${config.inputs.templateFile}`)

  let filePath = config.inputs.templateFile

  // Parse the file extension
  const fileExtension = path.extname(filePath)

  // Check if the file path is valid
  if (fs.existsSync(filePath)) {
    if (fileExtension === '.bicep') {
      // Build the Bicep file
      filePath = await buildBicepFile(filePath)
    }
  } else {
    throw new Error('Invalid template file path: ${filePath}')
  }

  // Read the file content
  const fileContent = fs.readFileSync(filePath)

  // Parse the file content
  return JSON.parse(fileContent.toString())
}

/**
 * Parses the parameters file and returns the parsed content as a JSON object.
 * @param config - The configuration object containing the inputs.
 * @returns A Promise that resolves to a JSON object representing the parsed parameters file.
 * @throws An error if the parameters file path is invalid.
 */
export async function parseParametersFile(
  config: Config
): Promise<Record<string, unknown>> {
  core.debug(`Parsing parameters file: ${config.inputs.parametersFile}`)

  let filePath = config.inputs.parametersFile

  // Parse the file extension
  const fileExtension = path.extname(filePath)

  // Check if the file path is valid
  if (fs.existsSync(filePath)) {
    if (fileExtension === '.bicepparam') {
      // Build the Bicep parameters file
      filePath = await buildBicepParametersFile(filePath)
    }
  } else {
    throw new Error('Invalid parameters file path: ${filePath}')
  }

  // Read the file content
  const fileContent = fs.readFileSync(filePath)

  // Parse the file content
  return JSON.parse(fileContent.toString())
}

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
  core.debug(`Initializing config`)

  const config: Config = createDefaultConfig()

  // Basic config
  config.inputs.name = getInput('name', true)
  config.inputs.mode = getInput('mode', true, ['create', 'delete', 'validate'])

  // Additional config
  if (config.inputs.mode === 'create' || config.inputs.mode === 'validate') {
    config.inputs.description = getInput('description', false)
    config.inputs.location = getInput('location', false)

    // Unmanage Action
    config.inputs.actionOnUnmanage = getInput('actionOnUnmanage', true, [
      'deleteAll',
      'deleteResources',
      'detachAll'
    ])

    // Deny Settings
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

    // Template
    config.inputs.templateFile = getInput('templateFile', true)

    // Parameters
    config.inputs.parametersFile = getInput('parametersFile', false)

    // Repository metadata
    config.context.repository = `${github.context.repo.owner}/${github.context.repo.repo}`
    config.context.commit = github.context.sha
    config.context.branch = github.context.ref
  }

  // Scope config
  config.inputs.scope = getInput('scope', true, [
    'managementGroup',
    'subscription',
    'resourceGroup'
  ])

  // Scope specific config
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

  // Control config
  config.inputs.wait = getInput('wait', false) === 'true'

  return config
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
export function prepareUnmanageProperties(value: string): ActionOnUnmanage {
  switch (value) {
    case 'deleteResources':
      return {
        // Delete all resources, detach resource groups and management groups
        managementGroups: 'detach',
        resourceGroups: 'detach',
        resources: 'delete'
      }
    case 'deleteAll':
      return {
        // Delete resources, resource groups and management groups
        managementGroups: 'delete',
        resourceGroups: 'delete',
        resources: 'delete'
      }
    case 'detachAll':
      return {
        // Detach resources, resource groups and management groups
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
export function prepareDenySettings(config: Config): DenySettings {
  return {
    mode: config.inputs.denySettings,
    applyToChildScopes: config.inputs.applyToChildScopes,
    excludedActions: config.inputs.excludedActions,
    excludedPrincipals: config.inputs.excludedPrincipals
  }
}
