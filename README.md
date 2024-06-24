# Azure Deployment Stacks Action

[![GitHub Super-Linter](https://github.com/ljtill/azure-deployment-stacks-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/ljtill/azure-deployment-stacks-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/ljtill/azure-deployment-stacks-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/ljtill/azure-deployment-stacks-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/ljtill/azure-deployment-stacks-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/ljtill/azure-deployment-stacks-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This repository contains a [GitHub Action](https://docs.github.com/actions) that
allows engineers to create, update, delete, validate and export
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
name: Stack (Create)

on:
  push:
    branches:
      - main
    paths:
      - 'src/**'

permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    name: Create
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

      - name: Stack
        uses: ljtill/azure-deployment-stacks-action@releases/v1
        with:
          name: 'Microsoft.Samples'
          description: 'Sample description for my Deployment Stack'
          location: uksouth
          scope: subscription
          mode: create
          actionOnUnmanage: deleteAll
          denySettings: denyWriteAndDelete
          subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          templateFile: ./src/main.bicep
          wait: true
```

### Delete Mode

The following example demonstrates how to set up the action in delete mode,
which is recommended to be used with `workflow_dispatch` triggers:

```yaml
name: Stack (Delete)

on:
  workflow_dispatch:

permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    name: Delete
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

      - name: Stack
        uses: ljtill/azure-deployment-stacks-action@releases/v1
        with:
          name: 'Microsoft.Samples'
          location: uksouth
          scope: subscription
          mode: delete
          subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          wait: true
```

### Validate Mode

The following example demonstrates how to set up the action in validate mode,
which is recommended to be used with `pull_request` triggers:

```yaml
name: Stack (Validate)

on:
  pull_request:
    branches:
      - 'main'
    paths:
      - 'src/**'

permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    name: Validate
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

      - name: Stack
        uses: ljtill/azure-deployment-stacks-action@releases/v1
        with:
          name: 'Microsoft.Samples'
          description: 'Sample description for my Deployment Stack'
          location: uksouth
          scope: subscription
          mode: validate
          actionOnUnmanage: deleteAll
          denySettings: denyWriteAndDelete
          subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          templateFile: ./src/main.bicep
          wait: true
```

## Parameters

| Parameter          | Required | Type    | Description                                                                                         | Default | Values                                       |
| ------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------- |
| name               | true     | string  | The name of the deployment stack.                                                                   |         |                                              |
| description        | false    | string  | The description of the deployment stack.                                                            |         |                                              |
| location           | false    | string  | The location to store deployment stack.                                                             | eastus  |                                              |
| scope              | true     | string  | The scope of the deployment stack.                                                                  |         | managementGroup, subscription, resourceGroup |
| mode               | true     | string  | The mode of the deployment stack action.                                                            |         | create, delete, validate                     |
| actionOnUnmanage   | false    | string  | Defines what happens to resources that are no longer managed after the stack is updated or deleted. |         | deleteAll, deleteResources, detachAll        |
| denySettings       | false    | string  | Define which operations are denied on resources managed by the stack.                               |         | denyDelete, denyWriteAndDelete, none         |
| applyToChildScopes | false    | boolean | DenySettings will be applied to child scopes.                                                       |         |                                              |
| excludedActions    | false    | string  | List of role-based management operations that are excluded from the denySettings (Comma seperated). |         |                                              |
| excludedPrincipals | false    | string  | List of Entra principal IDs excluded from the lock (Comma seperated).                               |         |                                              |
| managementGroupId  | false    | string  | The management group id where the deployment stack will be created.                                 |         |                                              |
| subscriptionId     | false    | string  | The subscription id where the deployment stack will be created.                                     |         |                                              |
| resourceGroupName  | false    | string  | The resource group name where the deployment stack will be created.                                 |         |                                              |
| templateFile       | false    | string  | A path to a ARM or Bicep file in the file system.                                                   |         |                                              |
| parametersFile     | false    | string  | A path to a ARM or Bicep paramter file in the file system.                                          |         |                                              |
| wait               | false    | boolean | Wait for the deployment to complete.                                                                | false   | true, false                                  |

## Documentation

- [Deployment Stacks](https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks)
