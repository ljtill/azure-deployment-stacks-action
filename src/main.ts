import * as core from '@actions/core'
import { DeploymentStacksClient } from '@azure/arm-resourcesdeploymentstacks'
import * as helper from './helper'
import * as stack from './stack'
import { Mode } from './types'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Starting the action...`)

    // Authenticate the session
    core.debug(`Generate new credential...`)
    const credential = helper.newCredential()

    // Hydrate options variable
    core.debug(`Parsing the inputs...`)
    const options = helper.parseInputs()

    // Installing Bicep binary
    // core.debug(`Installing Bicep tool...`)
    // await helper.installBicep()

    // Initialize deployment stacks client
    const client = new DeploymentStacksClient(credential)

    // Parse the template and parameters
    const template = await helper.parseTemplateFile(options)
    const parameters = options.parametersFile
      ? helper.parseParametersFile(options)
      : {}

    // Handle the execution mode
    switch (options.mode) {
      case Mode.Create:
        await stack.createOrUpdateDeploymentStack(
          options,
          client,
          template,
          parameters
        )

        break
      case Mode.Delete:
        await stack.deleteDeploymentStack(options, client)

        break
      default:
        throw new Error(`Invalid mode: ${options.mode}`)
    }

    core.debug(`Completing the action...`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
