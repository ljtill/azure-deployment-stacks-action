/**
 * Represents the configuration object.
 */
export interface Config {
  inputs: Inputs
  context: Context
  outputs: Outputs
}

/**
 * Represents the inputs for the deployment stack action.
 */
interface Inputs {
  name: string
  description: string
  location: string
  scope: string
  mode: string
  actionOnUnmanage: string
  denySettings: string
  applyToChildScopes: boolean
  excludedActions: string[]
  excludedPrincipals: string[]
  managementGroupId: string
  subscriptionId: string
  resourceGroupName: string
  templateFile: string
  templateSpec: string
  templateUri: string
  parametersFile: string
  parameters: string
  parametersUri: string
  bypassStackOutOfSyncError: boolean
  wait: boolean
}

// TODO: Duplicate of ParametersContent in template.ts
interface Parameters {
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

/**
 * Represents the context for the deployment stacks action.
 */
interface Context {
  templateType: string // 'template' | 'templateLink'
  template: Record<string, unknown>
  parametersType: string // 'parameters' | 'parametersLink'
  parameters: Parameters
  repository: string
  commit: string
  branch: string
}

/**
 * Represents the outputs of a deployment.
 */
interface Outputs {}

/**
 * Default inputs for the deployment stack.
 */
const defaultInputs: Inputs = {
  name: '',
  description: '',
  location: '',
  scope: '',
  mode: '',
  actionOnUnmanage: '',
  denySettings: '',
  applyToChildScopes: false,
  excludedActions: [],
  excludedPrincipals: [],
  managementGroupId: '',
  subscriptionId: '',
  resourceGroupName: '',
  templateFile: '',
  templateSpec: '',
  templateUri: '',
  parametersFile: '',
  parameters: '',
  parametersUri: '',
  bypassStackOutOfSyncError: false,
  wait: false
}
const defaultContext: Context = {
  templateType: '',
  template: {},
  parametersType: '',
  parameters: {},
  repository: '',
  commit: '',
  branch: ''
}
const defaultOutputs: Outputs = {}

/**
 * Creates a default configuration object with optional overrides.
 * @param overrides - Optional overrides for the configuration.
 * @returns The default configuration object.
 */
export function createDefaultConfig(overrides?: Partial<Config>): Config {
  return {
    inputs: { ...defaultInputs, ...(overrides?.inputs || {}) },
    context: { ...defaultContext, ...(overrides?.context || {}) },
    outputs: { ...defaultOutputs, ...(overrides?.outputs || {}) }
  }
}
