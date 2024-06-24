import * as core from '@actions/core'
import { setLogLevel } from '@azure/logger'
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

    // Set SDK log level
    if (process.env['RUNNER_DEBUG']) {
      setLogLevel('verbose')
    }

    // Check that the Bicep binary is installed
    await helper.checkBicep()

    // Authenticate the session
    const credential = helper.newCredential()

    // Hydrate options variable
    const options = helper.newOptions()

    // Initialize deployment stacks client
    const client = new DeploymentStacksClient(credential)

    // Perform action
    switch (options.mode) {
      case 'create':
        await stack.createDeploymentStack(options, client)
        break
      case 'delete':
        await stack.deleteDeploymentStack(options, client)
        break
      case 'validate':
        await stack.validateDeploymentStack(options, client)
        break
    }

    core.debug(`Finishing action`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
