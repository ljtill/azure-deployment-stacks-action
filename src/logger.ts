import * as core from '@actions/core'

/**
 * Represents a logger that provides logging functionality for the application.
 */
class Logger {
  /**
   * Logs an informational message.
   * @param message - The message to be logged.
   */
  info(message: string): void {
    core.info(`${message}`)
  }

  /**
   * Logs a debug message.
   * @param message - The message to be logged.
   */
  debug(message: string): void {
    core.debug(`=> ${message}`)
  }

  /**
   * Logs an error message.
   * @param message - The message to be logged.
   */
  error(message: string): void {
    core.error(`${message}`)
  }

  /**
   * Logs a warning message.
   * @param message - The warning message to log.
   */
  warning(message: string): void {
    core.warning(`${message}`)
  }

  /**
   * Starts a new logging group.
   * @param name - The name of the group.
   */
  startGroup(): void {}

  /**
   * Ends the current logging group.
   * @param name - The name of the group.
   */
  endGroup(): void {}
}

export const logger = new Logger()
