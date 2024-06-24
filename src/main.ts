import * as core from '@actions/core'
import { DeploymentStacksClient } from '@azure/arm-resourcesdeploymentstacks'
import * as helper from './helper'
import * as stack from './stack'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    core.debug(`Starting action`)

    // Check that the Bicep binary is installed
    await helper.checkBicep()

    // Authenticate the session
    const credential = helper.newCredential()

    // Hydrate options variable
    const options = helper.newOptions()

    // Initialize deployment stacks client
    const client = new DeploymentStacksClient(credential)

    // Parse the template and parameters
    const template = await helper.parseTemplateFile(options)
    const parameters = options.parametersFile
      ? helper.parseParametersFile(options)
      : {}

    // Perform the action
    switch (options.mode) {
      case 'create':
        await stack.createOrUpdateDeploymentStack(
          options,
          client,
          template,
          parameters
        )

        break
      case 'delete':
        await stack.deleteDeploymentStack(options, client)

        break
    }

    core.debug(`Finishing action`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
