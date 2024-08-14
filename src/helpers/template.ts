import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'

import * as helpers from '../helpers'
import { Config, Parameters } from '../models'

/**
 * Retrieves the path of the Bicep executable.
 * @returns A promise that resolves to the path of the Bicep executable.
 */
async function getBicepPath(): Promise<string> {
  let path: string

  try {
    path = await io.which('bicep', true)
  } catch {
    throw new Error('Bicep CLI is not installed')
  }

  return path
}

/**
 * Verifies if Bicep is installed by checking its version.
 * @returns {Promise<void>} A promise that resolves when the verification is complete.
 * @throws {Error} If Bicep is not installed.
 */
export async function logBicepVersion(): Promise<void> {
  let bicepPath = await getBicepPath()

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
 * Builds a Bicep file by invoking the Bicep compiler.
 * @param filePath The path to the Bicep file.
 * @returns A Promise that resolves to the path of the compiled Bicep file.
 */
async function buildBicepFile(filePath: string): Promise<string> {
  const bicepPath = await getBicepPath()
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

  core.debug(`Command - bicep build --outfile ${outputPath}`)
  await exec.exec(
    bicepPath,
    ['build', filePath, '--outfile', outputPath],
    execOptions
  )

  return outputPath
}

/**
 * Builds a Bicep parameters file for the given Bicep file path.
 * @param filePath - The path to the Bicep file.
 * @returns A promise that resolves to the path of the generated parameters file.
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

  core.debug(`Command - bicep build-params --outfile ${outputPath}`)
  await exec.exec(
    bicepPath,
    ['build-params', filePath, '--outfile', outputPath],
    execOptions
  )

  return outputPath
}

/**
 * Parses the template file based on the provided configuration.
 * @param config - The configuration object containing the template file path.
 * @returns A promise that resolves to a record representing the parsed template.
 * @throws An error if the file type is unsupported or the file path is invalid.
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
 * Parses the parameters file based on the provided configuration.
 * @param config - The configuration object.
 * @returns A promise that resolves to the parsed parameters.
 * @throws An error if the file type is unsupported, the file path is invalid, or the file content is invalid.
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
    return JSON.parse(fs.readFileSync(filePath).toString()).parameters
  } catch {
    throw new Error('Invalid parameters file content')
  }
}

/**
 * Parses the parameters object from the config and returns a Promise of Parameters.
 * @param config - The config object containing the inputs and parameters.
 * @returns A Promise of Parameters object.
 * @throws Error if the parameters object is invalid or unable to parse.
 */
export async function parseParametersObject(
  config: Config
): Promise<Parameters> {
  const inputsParameters = config.inputs.parameters

  let parameters: Parameters = {}

  if (helpers.isJson(inputsParameters)) {
    const data = JSON.parse(inputsParameters)
    const extractedData: Parameters = {}

    for (const key in data) {
      if (Object.hasOwn(data, key)) {
        if (helpers.isNumeric(data[key].value)) {
          extractedData[key] = {
            value: parseInt(data[key].value)
          }
        } else if (helpers.isBoolean(data[key].value)) {
          extractedData[key] = {
            value: data[key].value === 'true'
          }
        } else {
          extractedData[key] = {
            value: data[key].value
          }
        }
      }
    }

    parameters = extractedData
  } else {
    try {
      for (const line of inputsParameters.split(/\r|\n/)) {
        const parts = line.split(/[:=]/)
        if (parts.length < 2) {
          throw new Error('Invalid parameters object')
        }

        const name: string = parts[0].trim()
        let value: string | number | boolean = parts[1].trim()

        // TODO(ljtill): Hanle other types
        if (helpers.isNumeric(value)) {
          value = parseInt(value)
        } else if (helpers.isBoolean(value)) {
          value = value === 'true'
        }

        parameters[name] = {
          value
        }
      }
    } catch {
      throw new Error('Unable to parse parameters object')
    }
  }

  core.debug(`Parameters: ${JSON.stringify(parameters)}`)

  return parameters
}
