import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as io from '@actions/io'
import * as cache from '@actions/tool-cache'
import { DefaultAzureCredential } from '@azure/identity'
import { Options, ActionOnUnmanage, DenySettings } from './types'
import { DeploymentStack } from '@azure/arm-resourcesdeploymentstacks'

/**
 * Install Bicep binary.
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
 * Check Bicep is installed.
 */
export async function checkBicep(): Promise<boolean> {
  core.debug(`Checking Bicep installation`)

  if ((await io.which('bicep', false)) === '') {
    throw new Error('Bicep is not installed')
  }

  await displayBicepVersion()

  return true
}

/**
 * Print Bicep version.
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
 * Build Bicep file.
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
 * Build Bicep parameters file.
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
    throw new Error('Invalid template file path: ${filePath}')
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
  core.debug(`Parsing parameters file: ${options.parametersFile}`)

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
    throw new Error('Invalid parameters file path: ${filePath}')
  }

  // Read the file content
  const fileContent = fs.readFileSync(filePath)

  // Parse the file content
  return JSON.parse(fileContent.toString())
}

/**
 * Initialize Azure credential.
 */
export function newCredential(): DefaultAzureCredential {
  core.debug(`Generate new credential`)

  return new DefaultAzureCredential()
}

/**
 * Initiliaze Options.
 */
export function newOptions(): Options {
  core.debug(`Initializing options`)

  let options: Partial<Options> = {}

  options.mode = getInput('mode', true, ['create', 'delete', 'validate'])
  options.wait = getInput('wait', false) === 'true'

  switch (options.mode) {
    case 'create':
      options = getCreateInputs(options)
      break
    case 'delete':
      options = getDeleteInputs(options)
      break
    case 'validate':
      options = getValidateInputs(options)
      break
  }

  // Repository metadata
  options.repository = `${github.context.repo.owner}/${github.context.repo.repo}`
  options.commit = github.context.sha
  options.branch = github.context.ref

  return options as Options
}

/**
 * Get input from the workflow.
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
 * Parse create inputs.
 */
function getCreateInputs(options: Partial<Options>): Partial<Options> {
  core.debug(`Retrieving create inputs`)

  options.name = getInput('name', true)
  options.description = getInput('description', false)
  options.location = getInput('location', false)

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
  options.applyToChildScopes = getInput('applyToChildScopes', false) === 'true'
  const excludedActions = getInput('excludedActions', false)
  excludedActions
    ? (options.excludedActions = excludedActions.split(','))
    : (options.excludedActions = [])

  const excludedPrincipals = getInput('excludedPrincipals', false)
  excludedPrincipals
    ? (options.excludedPrincipals = excludedPrincipals.split(','))
    : (options.excludedPrincipals = [])

  options.excludedPrincipals = getInput('excludedPrincipals', false).split(',')

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

  options.templateFile = getInput('templateFile', true)
  options.parametersFile = getInput('parametersFile', false)

  return options
}

/**
 * Parse delete inputs.
 */
function getDeleteInputs(options: Partial<Options>): Partial<Options> {
  core.debug(`Retrieving delete inputs`)

  options.name = getInput('name', true)

  options.scope = getInput('scope', true, [
    'managementGroup',
    'subscription',
    'resourceGroup'
  ])

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

  return options
}

/**
 * Parse validate inputs.
 */
function getValidateInputs(options: Partial<Options>): Partial<Options> {
  core.debug(`Retrieving validate inputs`)

  options.name = getInput('name', true)
  options.description = getInput('description', false)
  options.location = getInput('location', false)

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
  options.applyToChildScopes = getInput('applyToChildScopes', false) === 'true'
  const excludedActions = getInput('excludedActions', false)
  excludedActions
    ? (options.excludedActions = excludedActions.split(','))
    : (options.excludedActions = [])

  const excludedPrincipals = getInput('excludedPrincipals', false)
  excludedPrincipals
    ? (options.excludedPrincipals = excludedPrincipals.split(','))
    : (options.excludedPrincipals = [])

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

  options.templateFile = getInput('templateFile', true)
  options.parametersFile = getInput('parametersFile', false)

  return options
}

/**
 * Initialize actionOnUnmanage property.
 */
export function newUnmanageProperties(value: string): ActionOnUnmanage {
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
 * Initialize denySettings property.
 */
export function newDenySettings(options: Options): DenySettings {
  return {
    mode: options.denySettings,
    applyToChildScopes: options.applyToChildScopes,
    excludedActions: options.excludedActions,
    excludedPrincipals: options.excludedPrincipals
  }
}

/**
 * Check if object is instance of DeploymentStack.
 */
export function instanceOfDeploymentStack(
  object: unknown
): object is DeploymentStack {
  return (
    typeof object === 'object' &&
    object !== null &&
    'location' in object &&
    'tags' in object &&
    'properties' in object
  )
}
