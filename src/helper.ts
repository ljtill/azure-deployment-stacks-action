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
  const fileExtension = path.extname(filePath)

  // Check file exists
  if (fs.existsSync(filePath)) {
    if (fileExtension === '.bicep') {
      filePath = await buildBicepFile(filePath)
    } else if (fileExtension === '.json') {
      core.debug(`Skipping as JSON file provided.`)
    } else {
      throw new Error('Unsupported file type.')
    }
  } else {
    throw new Error('Invalid template file path: ${filePath}')
  }

  return JSON.parse(fs.readFileSync(filePath).toString())
}

interface Parameters {
  [key: string]: {
    value: string
  }
}

/**
 * Parses the parameters file and returns the parsed content as a JSON object.
 * @param config - The configuration object containing the inputs.
 * @returns A Promise that resolves to a JSON object representing the parsed parameters file.
 * @throws An error if the parameters file path is invalid.
 */
export async function parseParametersFile(config: Config): Promise<Parameters> {
  core.debug(`Parsing parameters file: ${config.inputs.parametersFile}`)

  let filePath = config.inputs.parametersFile
  const fileExtension = path.extname(filePath)

  // Check file exists
  if (fs.existsSync(filePath)) {
    if (fileExtension === '.bicepparam') {
      filePath = await buildBicepParametersFile(filePath)
    } else if (fileExtension === '.json') {
      core.debug(`Skipping as JSON file provided.`)
    } else {
      throw new Error('Unsupported file type.')
    }
  } else {
    throw new Error('Invalid parameters file path: ${filePath}')
  }

  const parsedData = JSON.parse(fs.readFileSync(filePath).toString())

  if (!parsedData.parameters) {
    throw new Error('Unable to parse parameters file.')
  }

  core.info(`Parsed parameters: ${JSON.stringify(parsedData.parameters)}`)

  return parsedData.parameters
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
