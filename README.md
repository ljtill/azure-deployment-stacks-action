# Azure Deployment Stacks Action

![Icon](./docs/static/stacks-medium.jpg)

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

For `validate` mode, it is recommended to use it with `pull_request` triggers.
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

```yaml
- name: Stack
  uses: ljtill/azure-deployment-stacks-action@v1
  with:
    name: 'Microsoft.Samples'
    description: 'Sample description for the Deployment Stack'
    location: uksouth
    scope: subscription
    mode: create
    actionOnUnmanage: deleteAll
    denySettings: denyWriteAndDelete
    subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
    templateFile: ./src/main.bicep
    wait: true
```

## Workflows

The following samples provide end-to-end implementations of the Azure Deployment
Stamps Action:

- [Create](./docs/README.md#create)
- [Delete](./docs/README.md#delete)
- [Validate](./docs/README.md#validate)

## Parameters

| Parameter          | Mode                     | Required | Type    | Description                                                                                         | Values                                       |
| ------------------ | ------------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| name               | create, delete, validate | true     | string  | The name of the deployment stack.                                                                   |                                              |
| description        | create, validate         | false    | string  | The description of the deployment stack.                                                            |                                              |
| location           | create, delete, validate | false    | string  | The location to store deployment stack.                                                             |                                              |
| scope              | create, delete, validate | true     | string  | The scope of the deployment stack.                                                                  | managementGroup, subscription, resourceGroup |
| mode               | create, delete, validate | true     | string  | The mode of the deployment stack action.                                                            | create, delete, validate                     |
| actionOnUnmanage   | create, validate         | false    | string  | Defines what happens to resources that are no longer managed after the stack is updated or deleted. | deleteAll, deleteResources, detachAll        |
| denySettings       | create, validate         | false    | string  | Define which operations are denied on resources managed by the stack.                               | denyDelete, denyWriteAndDelete, none         |
| applyToChildScopes | create, validate         | false    | boolean | DenySettings will be applied to child scopes.                                                       |                                              |
| excludedActions    | create, validate         | false    | string  | List of role-based management operations that are excluded from the denySettings .                  |                                              |
| excludedPrincipals | create, validate         | false    | string  | List of Entra principal IDs excluded from the lock (Comma seperated).                               |                                              |
| managementGroupId  | create, delete, validate | false    | string  | The management group id where the deployment stack will be created.                                 |                                              |
| subscriptionId     | create, delete, validate | false    | string  | The subscription id where the deployment stack will be created.                                     |                                              |
| resourceGroupName  | create, delete, validate | false    | string  | The resource group name where the deployment stack will be created.                                 |                                              |
| templateFile       | create, validate         | false    | string  | A path to a ARM or Bicep file in the file system.                                                   |                                              |
| parametersFile     | create, validate         | false    | string  | A path to a ARM or Bicep paramter file in the file system.                                          |                                              |
| wait               | create, delete, validate | false    | boolean | Wait for the deployment to complete.                                                                | true, false                                  |

> The `excludedActions` and `excludedPrincipals` parameters are defined by comma
> separation - 0000,0000,0000

> The `wait` parameter is set to false by default to avoid long-running GitHub
> Action jobs.

## Documentation

- [Deployment Stacks](https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-stacks)
