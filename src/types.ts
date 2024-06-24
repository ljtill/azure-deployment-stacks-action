export type Options = {
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
  repository: string
  commit: string
  branch: string
}

export type ActionOnUnmanage = {
  managementGroups: string
  resourceGroups: string
  resources: string
}

export type DenySettings = {
  mode: string
  applyToChildScopes: boolean
  excludedActions: string[]
  excludedPrincipals: string[]
}
