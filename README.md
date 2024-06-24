# Azure Deployment Stacks Action

This repository contains a GitHub Action that allows engineers to create,
update, delete, validate and export
[Azure Deployment Stacks](https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks)
directly from their GitHub workflows. It supports a variety of inputs for scopes
and options, making it flexible and easy to use for managing Azure resources.
Whether you need to define the scope at the management group, subscription, or
resource group level, this action provides the necessary parameters to tailor
deployments to your specific needs. Additionally, it includes options for
setting the location, mode, and handling unmanaged resources, as well as
configuring deny settings and specifying ARM or Bicep templates. This GitHub
Action streamlines the process of managing Azure infrastructure, enabling
efficient and automated deployments

## Authentication

The action supports multiple authentication methods. The simplest approach is to
use [`azure/login@v2`](https://github.com/azure/login). However, if the action
runs on Self-Hosted Runners, it can also use Managed Identity for
authentication.

## Modes

The action supports three modes: `create`, `delete` and `validate`.

For `create` mode, it is recommended to use it with `push` triggers. This setup
ensures that whenever changes are pushed to the repository, the action
automatically creates or updates the Azure Deployment Stack accordingly. This is
ideal for continuous integration and deployment workflows, where infrastructure
changes should be applied seamlessly as part of the development process.

For `delete` mode, it is recommended to use it with `workflow_dispatch`
triggers. This allows for manual initiation of the delete process through the
GitHub Actions interface. Using `workflow_dispatch` triggers provides greater
control and prevents accidental deletions, ensuring that stacks are only deleted
when explicitly requested by an authorized user. This setup is particularly
useful for maintenance tasks or cleanup operations where automated deletion
could pose risks.

For `validate` mode, it is recommended to use it with pull_request triggers.
This ensures that the Azure Deployment Stack is validated whenever a pull
request is created or updated. By integrating validation into the pull request
workflow, you can catch any potential issues or misconfigurations before they
are merged into the main branch. This setup is ideal for ensuring the quality
and integrity of infrastructure changes, as it allows for early detection of
errors and provides an opportunity to review and address any issues in a
collaborative manner. This approach helps maintain a stable and reliable
infrastructure by preventing problematic changes from being integrated into the
production environment.

## Getting Started

### Create Mode

The following example demonstrates how to set up the action in create mode,
which is recommended to be used with `push` triggers:

```yaml
name: Creation

on:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deployment
        uses: ljtill/azure-deployment-stacks-action@v1
        with:
          name: development
          scope: subscription
          mode: create
          actionOnUnmanage: deleteAll
          denySettings: denyWriteAndDelete
          subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          templateFile: ./main.bicep
          parametersFile: ./main.bicepparam
          wait: true
```

### Delete Mode

The following example demonstrates how to set up the action in delete mode,
which is recommended to be used with `workflow_dispatch` triggers:

```yaml
name: Deletion

on: workflow_dispatch

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deployment
        uses: ljtill/azure-deployment-stacks-action@v1
        with:
          name: development
          scope: subscription
          mode: delete
          wait: true
```

### Validate Mode

The following example demonstrates how to set up the action in delete mode,
which is recommended to be used with `pull_request` triggers:

```yaml

```

## Parameters

| Parameter         | Required | Type   | Description                                                                                         | Default | Values                                       |
| ----------------- | -------- | ------ | --------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------- |
| name              | true     | string | The name of the deployment stack.                                                                   |         |                                              |
| description       | false    | string | The description of the deployment stack.                                                            |         |                                              |
| scope             | true     | string | The scope of the deployment stack.                                                                  |         | managementGroup, subscription, resourceGroup |
| location          | false    | string | The location to store deployment stack.                                                             | eastus  |                                              |
| mode              | true     | string | The mode of the deployment stack action.                                                            |         | create, delete                               |
| actionOnUnmanage  | true     | string | Defines what happens to resources that are no longer managed after the stack is updated or deleted. |         | deleteAll, deleteResources, detachAll        |
| denySettings      | true     | string | Define which operations are denied on resources managed by the stack.                               |         | denyDelete, denyWriteAndDelete, none         |
| managementGroupId | false    | string | The management group id where the deployment stack will be created.                                 |         |                                              |
| subscriptionId    | false    | string | The subscription id where the deployment stack will be created.                                     |         |                                              |
| resourceGroupName | false    | string | The resource group name where the deployment stack will be created.                                 |         |                                              |
| templateFile      | true     | string | A path to a ARM or Bicep file in the file system.                                                   |         |                                              |
| parametersFile    | false    | string | A path to a ARM or Bicep paramter file in the file system.                                          |         |                                              |
| wait              | false    | string | Wait for the deployment to complete.                                                                | false   | true, false                                  |

## Documentation

- [Deployment Stacks](https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks)
