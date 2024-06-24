import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as cache from '@actions/tool-cache'
import { DefaultAzureCredential } from '@azure/identity'
import { DeploymentStackPropertiesActionOnUnmanage } from '@azure/arm-resourcesdeploymentstacks'
import { Options } from './types'

/**
 * Install Bicep binary.
 */
export async function installBicep(): Promise<void> {
  core.debug(`Installing the Bicep binary...`)

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
 * Check Bicep binary is installed.
 */
export async function checkBicep(): Promise<boolean> {
  core.debug(`Checking for the Bicep binary...`)

  if ((await io.which('bicep', false)) === '') {
    throw new Error('Bicep is not installed')
  }

  await printBicepVersion()

  return true
}

/**
 * Print Bicep version.
 */
async function printBicepVersion(): Promise<void> {
  core.debug(`Printing the Bicep version...`)

  const bicepPath = io.which('bicep', true)

  await exec.exec(`"${bicepPath}" --version`)
}

/**
 * Build Bicep file.
 */
async function buildBicepFile(filePath: string): Promise<string> {
  core.debug(`Building Bicep file: ${filePath}`)

  const bicepPath = await io.which('bicep', true)

  // TODO(ljtill): Implement cross platform support
  const outputPath = '/tmp/main.json'

  await exec.exec(
    `"${bicepPath}" build "${filePath}" --outfile "${outputPath}"`
  )

  return outputPath
}

/**
 * Build Bicep parameters file.
 */
async function buildBicepParametersFile(filePath: string): Promise<string> {
  core.debug(`Building Bicep parameters file: ${filePath}`)

  const bicepPath = await io.which('bicep', true)

  // TODO(ljtill): Implement cross platform support
  const outputPath = '/tmp/params.json'

  await exec.exec(
    `"${bicepPath}" build-params "${filePath}" --outfile "${outputPath}"`
  )

  return outputPath
}

/**
 * Parse template file.
 */
export async function parseTemplateFile(
  options: Options
): Promise<Record<string, unknown>> {
  core.debug(`Parsing template file: ${options.templateFile}`)

  let filePath = options.templateFile

  // Parse the file extension
  const fileExtension = path.extname(filePath)

  // Check if the file path is valid
  if (fs.existsSync(filePath)) {
    if (fileExtension === '.bicep') {
      // Build the Bicep file
      filePath = await buildBicepFile(filePath)
    }
  } else {
    throw new Error('Invalid template file path')
  }

  // Read the file content
  const fileContent = fs.readFileSync(filePath)

  // Parse the file content
  return JSON.parse(fileContent.toString())
}

/**
 * Parse parameters file.
 */
export async function parseParametersFile(
  options: Options
): Promise<Record<string, unknown>> {
  core.debug(`Parsing the parameters file: ${options.parametersFile}`)

  let filePath = options.parametersFile

  // Parse the file extension
  const fileExtension = path.extname(filePath)

  // Check if the file path is valid
  if (fs.existsSync(filePath)) {
    if (fileExtension === '.bicepparam') {
      // Build the Bicep parameters file
      filePath = await buildBicepParametersFile(filePath)
    }
  } else {
    throw new Error('Invalid parameters file path')
  }

  // Read the file content
  const fileContent = fs.readFileSync(filePath)

  // Parse the file content
  return JSON.parse(fileContent.toString())
}

/**
 * Initialize Azure Credential.
 */
export function newCredential(): DefaultAzureCredential {
  core.debug(`Generate new credential...`)

  return new DefaultAzureCredential()
}

/**
 * Initiliaze Options.
 */
export function newOptions(): Options {
  core.debug(`Initializing options...`)

  const options: Partial<Options> = {}

  // Get the input if it's required and validate it.
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

  // Gather inputs
  options.name = getInput('name', true)
  options.description = getInput('description', false)
  options.location = getInput('location', false)
  options.mode = getInput('mode', true, ['create', 'delete'])
  options.scope = getInput('scope', true, [
    'managementGroup',
    'subscription',
    'resourceGroup'
  ])
  options.actionOnUnmanage = getInput('actionOnUnmanage', true, [
    'deleteAll',
    'deleteResources',
    'detachAll'
  ])
  options.denySettings = getInput('denySettings', true, [
    'denyDelete',
    'denyWriteAndDelete',
    'none'
  ])
  options.templateFile = getInput('templateFile', true)
  options.parametersFile = getInput('parametersFile', false)
  options.wait = getInput('wait', false) === 'true'

  // Handle scope-specific inputs
  switch (options.scope) {
    case 'managementGroup':
      options.managementGroupId = getInput('managementGroupId', true)
      break
    case 'subscription':
      options.subscriptionId = getInput('subscriptionId', true)
      break
    case 'resourceGroup':
      options.resourceGroupName = getInput('resourceGroupName', true)
      break
  }

  return options as Options
}

/**
 * Parse actionOnUnmanage property.
 */
export function parseUnmanageProperties(
  value: string
): DeploymentStackPropertiesActionOnUnmanage {
  core.debug(`Parsing actionOnUnmanage: ${value}`)

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
 * Parse denySettings property.
 */
export function parseDenySettings(): void {
  core.debug(`Parsing denySettings...`)
}
