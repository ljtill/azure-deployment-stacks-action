export enum Scope {
  ManagementGroup = 'managementGroup',
  Subscription = 'subscription',
  ResourceGroup = 'resourceGroup'
}

export enum Mode {
  Create = 'create',
  Delete = 'delete'
}

export enum ActionOnUnmanage {
  DeleteAll = 'deleteAll',
  DeleteResources = 'deleteResources',
  DetachAll = 'detachAll'
}

export enum DenySettings {
  DenyDelete = 'denyDelete',
  DenyWriteAndDelete = 'denyWriteAndDelete',
  None = 'none'
}

export type Options = {
  name: string
  description: string
  scope: Scope
  location: string
  mode: Mode
  actionOnUnmanage: ActionOnUnmanage
  denySettings: DenySettings
  managementGroupId: string
  subscriptionId: string
  resourceGroupName: string
  templateFile: string
  parametersFile: string
  wait: boolean
}
