/**
 * Checks if a given string is a valid JSON.
 * @param input - The string to be checked.
 * @returns A boolean indicating whether the input is valid JSON or not.
 */
export function isJson(input: string): boolean {
  try {
    JSON.parse(input)
  } catch {
    return false
  }
  return true
}

/**
 * Checks if a given value is numeric.
 * @param value - The value to check.
 * @returns `true` if the value is numeric, `false` otherwise.
 */
export function isNumeric(value: string): boolean {
  return /^-?\d+$/.test(value)
}

/**
 * Checks if a given value is a boolean.
 * @param value - The value to check.
 * @returns True if the value is a boolean, false otherwise.
 */
export function isBoolean(value: string): boolean {
  return /^(true|false)$/i.test(value)
}
