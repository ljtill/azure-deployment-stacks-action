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
