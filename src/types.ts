export enum Scope {
  ManagementGroup = 'managementGroup',
  Subscription = 'subscription',
  ResourceGroup = 'resourceGroup'
}

export enum Mode {
  Create = 'create',
  Delete = 'delete'
}

export enum ActionsOnUnmanage {
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
  actionsOnUnmanage: ActionsOnUnmanage
  denySettings: DenySettings
  managementGroupId: string
  subscriptionId: string
  resourceGroupName: string
  templateFile: string
  parametersFile: string
  wait: boolean
}
