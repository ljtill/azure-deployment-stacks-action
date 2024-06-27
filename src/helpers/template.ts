import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as cache from '@actions/tool-cache'
import { Config } from '../models'

/**
 * Installs the Bicep binary based on the current platform and architecture.
 * @returns A Promise that resolves when the installation is complete.
 * @throws {Error} If the platform, architecture, or binary is not supported.
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
 * Checks if Bicep is installed and displays its version.
 * @returns A promise that resolves to a boolean indicating if Bicep is installed.
 * @throws An error if Bicep is not installed.
 */
export async function checkBicepInstall(): Promise<boolean> {
  try {
    const bicepPath = await io.which('bicep', false)
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

    return true
  } catch {
    throw new Error('Bicep is not installed')
  }
}

/**
 * Builds a Bicep file and returns the path of the output file.
 * @param filePath The path of the Bicep file to build.
 * @returns A promise that resolves to the path of the output file.
 */
async function buildBicepFile(filePath: string): Promise<string> {
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

  core.debug(`bicep build --outfile ${outputPath}`)
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

  core.debug(`bicep build-params --outfile ${outputPath}`)
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

/**
 * Represents the content of the parameters file.
 */
interface ParametersContent {
  $schema: string
  contentVersion: string
  parameters: Parameters
}
interface Parameters {
  [key: string]: {
    value: string | Reference
  }
}
interface Reference {
  keyVault: {
    id: string
  }
  secretName: string
}

/**
 * Parses the parameters file and returns the parsed content as a JSON object.
 * @param config - The configuration object containing the inputs.
 * @returns A Promise that resolves to a JSON object representing the parsed parameters file.
 * @throws An error if the parameters file path is invalid.
 */
export async function parseParametersFile(config: Config): Promise<Parameters> {
  let filePath = config.inputs.parametersFile
  const fileExtension = path.extname(filePath)

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

  try {
    const deploymentParameters: ParametersContent = JSON.parse(
      fs.readFileSync(filePath).toString()
    )
    return deploymentParameters.parameters
  } catch {
    throw new Error('Invalid parameters file content')
  }
}
