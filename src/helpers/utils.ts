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

export function isNumeric(value: string): boolean {
  return /^-?\d+$/.test(value)
}

export function isBoolean(value: string): boolean {
  return /^(true|false)$/i.test(value)
}
