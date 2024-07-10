/* eslint-disable no-shadow */

/**
 * Represents the template object.
 */
export type Template = Record<string, unknown>

/**
 * Represents the type of the template.
 */

export enum TemplateType {
  File,
  Spec,
  Uri
}

/**
 * Represents the parameters object.
 */
type Reference = {
  keyVault: {
    id: string
  }
  secretName: string
}
export type Parameters = {
  [key: string]: {
    value: string | number | boolean | Reference
  }
}

/**
 * Represents the type of the parameters.
 */
export enum ParametersType {
  Object,
  File,
  Link,
  Undefined
}
