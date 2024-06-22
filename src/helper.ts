import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as cache from '@actions/tool-cache'
import { DefaultAzureCredential } from '@azure/identity'
import { ActionOnUnmanage, DenySettings, Mode, Options, Scope } from './types'

/**
 * Build the Bicep file.
 */
async function buildBicepFile(filePath: string): Promise<string> {
  const bicepPath = await io.which('bicep', true)

  // TODO: Implement cross platform support
  const outputPath = '/tmp/main.json'

  await exec.exec(
    `"${bicepPath}" build "${filePath}" --outfile "${outputPath}"`
  )

  return outputPath
}

/**
 * Build the Bicep parameters file.
 */
async function buildBicepParametersFile(filePath: string): Promise<string> {
  const bicepPath = await io.which('bicep', true)

  // TODO: Implement cross platform support
  const outputPath = '/tmp/params.json'

  await exec.exec(
    `"${bicepPath}" build-params "${filePath}" --outfile "${outputPath}"`
  )

  return outputPath
}

/**
 * Install the Bicep binary.
 */
export async function installBicep(): Promise<void> {
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
 * Get the Azure token.
 */
export function newCredential(): DefaultAzureCredential {
  return new DefaultAzureCredential()
}

/**
 * Parse the inputs.
 */
export function parseInputs(): Options {
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

  // Convert a string to an enum.
  function convertToEnum<T extends string>(
    value: string,
    enumType: { [key: string]: T }
  ): T {
    const enumValues = Object.values(enumType)
    if (!enumValues.includes(value as unknown as T)) {
      throw new Error(`Invalid value for enum conversion: ${value}`)
    }

    return enumType[value as keyof typeof enumType]
  }

  // Gather inputs
  options.name = getInput('name', true)
  options.templateFile = getInput('templateFile', true)
  options.parametersFile = getInput('parametersFile', false)
  options.description = getInput('description', false)
  options.location = getInput('location', false)
  options.wait = getInput('wait', false) === 'true'

  // Parse enums
  options.scope = convertToEnum<Scope>(
    getInput('scope', true, [
      'managementGroup',
      'subscription',
      'resourceGroup'
    ]),
    Scope
  )
  options.mode = convertToEnum<Mode>(
    getInput('mode', true, ['create', 'delete']),
    Mode
  )
  options.actionOnUnmanage = convertToEnum<ActionOnUnmanage>(
    getInput('actionOnUnmanage', true, [
      'deleteAll',
      'deleteResources',
      'detachAll'
    ]),
    ActionOnUnmanage
  )
  options.denySettings = convertToEnum<DenySettings>(
    getInput('denySettings', true, [
      'denyDelete',
      'denyWriteAndDelete',
      'none'
    ]),
    DenySettings
  )

  // Handle scope-specific inputs
  switch (options.scope) {
    case Scope.ManagementGroup:
      options.managementGroupId = getInput('managementGroupId', true)
      break
    case Scope.Subscription:
      options.subscriptionId = getInput('subscriptionId', true)
      break
    case Scope.ResourceGroup:
      options.resourceGroupName = getInput('resourceGroupName', true)
      break
  }

  return options as Options
}

/**
 * Parse the template file.
 */
export async function parseTemplateFile(
  options: Options
): Promise<Record<string, unknown>> {
  let filePath = options.templateFile

  core.debug(`Parsing the template file: ${filePath}`)

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
 * Parse the parameters file.
 */
export async function parseParametersFile(
  options: Options
): Promise<Record<string, unknown>> {
  let filePath = options.parametersFile

  core.debug(`Parsing the parameters file: ${filePath}`)

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
