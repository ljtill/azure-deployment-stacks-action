/**
 * Represents the content of the template file.
 */
export interface TemplateContent {
  $schema: string
  contentVersion: string
  parameters?: object
  functions?: object[]
  variables?: object
  resources?: object[]
  outputs?: object
}

/**
 * Represents the content of the parameters file.
 */
export interface ParametersContent {
  $schema: string
  contentVersion: string
  parameters: Parameters
}
export interface Parameters {
  [key: string]: {
    value: string | Reference
  }
}
interface Reference {
  keyVault: {
    id: string
  }
  secretName: string
}
