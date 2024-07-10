# Inputs

The following inputs can be customized to tailor the Actions to your
environment:

| Parameter                      | Mode                     | Required | Type    | Description                                                                                         | Values                                       |
| ------------------------------ | ------------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| name                           | create, delete, validate | true     | string  | The name of the deployment stack.                                                                   |                                              |
| description                    | create, validate         | false    | string  | The description of the deployment stack.                                                            |                                              |
| location                       | create, delete, validate | false    | string  | The location to store deployment stack.                                                             |                                              |
| scope                          | create, delete, validate | true     | string  | The scope of the deployment stack.                                                                  | managementGroup, subscription, resourceGroup |
| mode                           | create, delete, validate | true     | string  | The mode of the deployment stack action.                                                            | create, delete, validate                     |
| action-on-unmanage             | create, validate         | false    | string  | Defines what happens to resources that are no longer managed after the stack is updated or deleted. | deleteAll, deleteResources, detachAll        |
| deny-settings                  | create, validate         | false    | string  | Define which operations are denied on resources managed by the stack.                               | denyDelete, denyWriteAndDelete, none         |
| apply-to-child-scopes          | create, validate         | false    | boolean | DenySettings will be applied to child scopes.                                                       |                                              |
| excluded-actions               | create, validate         | false    | string  | List of role-based management operations that are excluded from the denySettings .                  |                                              |
| excluded-principals            | create, validate         | false    | string  | List of Entra principal IDs excluded from the lock (Comma seperated).                               |                                              |
| management-group-id            | create, delete, validate | false    | string  | The management group id where the deployment stack will be created.                                 |                                              |
| subscription-id                | create, delete, validate | false    | string  | The subscription id where the deployment stack will be created.                                     |                                              |
| resource-group-name            | create, delete, validate | false    | string  | The resource group name where the deployment stack will be created.                                 |                                              |
| template-file                  | create, validate         | false    | string  | A path to a ARM or Bicep file in the file system.                                                   |                                              |
| template-spec                  | create, validate         | false    | string  | The template spec resource id.                                                                      |                                              |
| template-uri                   | create, validate         | false    | string  | A uri to a remote template file.                                                                    |                                              |
| parameters-file                | create, validate         | false    | string  | A path to a ARM or Bicep paramter file in the file system.                                          |                                              |
| parameters                     | create, validate         | false    | string  | Parameters may be supplied as a JSON string, or as <KEY=VALUE> pairs.                               |                                              |
| parameters-uri                 | create, validate         | false    | string  | A uri to a remote parameters file.                                                                  |                                              |
| bypass-stack-out-of-sync-error | create, validate         | false    | boolean | Flag to bypass service errors that indicate the stack resource list is not correctly synchronized.  | true, false                                  |
| wait                           | create, delete, validate | false    | boolean | Wait for the deployment to complete.                                                                | true, false                                  |

The `excludedActions` and `excludedPrincipals` parameters are defined by comma
separated.

The `wait` parameter is set to false by default to avoid long-running GitHub
Action jobs.

## Details

Input: Parameters

Allowed Values:

```yaml
- name: Deployment
  uses: ljtill/azure-deployment-stacks-action@v1
  with:
    parameters: |
      name: sample
```

```yaml
- name: Deployment
  uses: ljtill/azure-deployment-stacks-action@v1
  with:
    parameters: |
      { "name": "sample" }
```
