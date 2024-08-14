import { Template, Parameters, ParametersType, TemplateType } from './template'

export interface Config {
  inputs: Inputs
  context: Context
  outputs: Outputs
}

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

interface Context {
  templateType: TemplateType | undefined
  template: Template
  parametersType: ParametersType | undefined
  parameters: Parameters
  repository: string
  commit: string
  branch: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Outputs {}

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
  templateType: undefined,
  template: {},
  parametersType: undefined,
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
