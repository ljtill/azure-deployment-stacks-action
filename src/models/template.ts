export type Template = Record<string, unknown>

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

// eslint-disable-next-line no-shadow
export enum TemplateType {
  File,
  Spec,
  Uri
}

// eslint-disable-next-line no-shadow
export enum ParametersType {
  Object,
  File,
  Link,
  Undefined
}
