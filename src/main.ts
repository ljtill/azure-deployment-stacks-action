import * as core from '@actions/core'
import * as helper from './helper'
import * as stack from './stack'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    core.debug(`Starting action`)

    await helper.checkBicepInstallation()

    const config = helper.newConfig()

    switch (config.inputs.mode) {
      case 'create':
        await stack.createDeploymentStack(config)
        break
      case 'delete':
        await stack.deleteDeploymentStack(config)
        break
      case 'validate':
        await stack.validateDeploymentStack(config)
        break
    }

    core.debug(`Finishing action`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
