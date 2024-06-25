/** Options */
export interface Config {
  inputs: Inputs
  context: Context
}

/** Inputs */
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
  parametersFile: string
  wait: boolean
}

/** Context */
interface Context {
  template: Record<string, unknown>
  parameters: Record<string, unknown>
  repository: string
  commit: string
  branch: string
}

/** Default Values */
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
  parametersFile: '',
  wait: false
}

const defaultContext: Context = {
  template: {},
  parameters: {},
  repository: '',
  commit: '',
  branch: ''
}

/** Create default options */
export function createDefaultConfig(overrides?: Partial<Config>): Config {
  return {
    inputs: { ...defaultInputs, ...(overrides?.inputs || {}) },
    context: { ...defaultContext, ...(overrides?.context || {}) }
  }
}
