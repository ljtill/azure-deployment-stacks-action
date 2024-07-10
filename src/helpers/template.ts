import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as helpers from '../helpers'
import { Config, Parameters, ParametersContent } from '../models'

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
  const bicepPath = await io.which('bicep', true)
  const outputPath = `${os.tmpdir()}/main.json`

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
  const bicepPath = await io.which('bicep', true)

  const outputPath = `${os.tmpdir()}/params.json`

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
 * Parses the parameters file and returns the parsed content as a JSON object.
 * @param config - The configuration object containing the inputs.
 * @returns A Promise that resolves to a JSON object representing the parsed parameters file.
 * @throws An error if the parameters file path is invalid.
 */
export async function parseParametersFile(
  config: Config
): Promise<ParametersContent> {
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
    return JSON.parse(fs.readFileSync(filePath).toString())
  } catch {
    throw new Error('Invalid parameters file content')
  }
}

/**
 * Parses the parameters object from the config and returns a ParametersContent object.
 * @param config - The config object containing the parameters.
 * @returns A Promise that resolves to a ParametersContent object.
 * @throws Error if the parameters object is invalid.
 *
 * TODO(ljtill): Support Reference (Key Vault) object
 */
export async function parseParametersObject(
  config: Config
): Promise<ParametersContent> {
  // TODO(ljtill): Support bicepparams object
  const parameters = config.inputs.parameters

  const parametersContent: ParametersContent = {
    $schema:
      'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#',
    contentVersion: '1.0.0.0',
    parameters: {}
  }

  if (helpers.isJson(parameters)) {
    const data = JSON.parse(parameters)
    const extractedData: Parameters = {}

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        extractedData[key] = {
          value: data[key].value
        }
      }
    }

    parametersContent.parameters = extractedData
  } else {
    try {
      // Iterate over each line
      for (const line of parameters.split(/\r|\n/)) {
        // Split on either ':' or '=' seperator
        const parts = line.split(/[:=]/)

        // Check if the line is valid
        if (parts.length < 2) {
          throw new Error('Invalid parameters object')
        }

        const name: string = parts[0].trim()
        let value: string | number | boolean = parts[1].trim()

        // TODO(ljtill): Check any other types
        if (helpers.isNumeric(value)) {
          value = parseInt(value)
        } else if (helpers.isBoolean(value)) {
          value = value === 'true'
        }

        parametersContent.parameters[parts[0].trim()] = {
          value: value
        }
      }
    } catch {
      throw new Error('Unable to parse parameters object')
    }
  }

  core.debug(`Parameters: ${JSON.stringify(parametersContent)}`)

  return parametersContent
}
