import * as core from '@actions/core'
import * as operations from './operations'
import * as helpers from './helpers'
import { logger } from './logger'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    logger.debug(`Starting action`)

    await helpers.verifyBicep()

    const config = await helpers.initializeConfig()

    switch (config.inputs.mode) {
      case 'create':
        await operations.createDeploymentStack(config)
        break
      case 'delete':
        await operations.deleteDeploymentStack(config)
        break
      case 'validate':
        await operations.validateDeploymentStack(config)
        break
    }

    logger.debug(`Finishing action`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
