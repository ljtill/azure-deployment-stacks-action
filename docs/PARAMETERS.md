# Parameters

The following parameters can be customized to tailor the Actions to your
environment:

| Parameter                 | Mode                     | Required | Type    | Description                                                                                         | Values                                       |
| ------------------------- | ------------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| name                      | create, delete, validate | true     | string  | The name of the deployment stack.                                                                   |                                              |
| description               | create, validate         | false    | string  | The description of the deployment stack.                                                            |                                              |
| location                  | create, delete, validate | false    | string  | The location to store deployment stack.                                                             |                                              |
| scope                     | create, delete, validate | true     | string  | The scope of the deployment stack.                                                                  | managementGroup, subscription, resourceGroup |
| mode                      | create, delete, validate | true     | string  | The mode of the deployment stack action.                                                            | create, delete, validate                     |
| actionOnUnmanage          | create, validate         | false    | string  | Defines what happens to resources that are no longer managed after the stack is updated or deleted. | deleteAll, deleteResources, detachAll        |
| denySettings              | create, validate         | false    | string  | Define which operations are denied on resources managed by the stack.                               | denyDelete, denyWriteAndDelete, none         |
| applyToChildScopes        | create, validate         | false    | boolean | DenySettings will be applied to child scopes.                                                       |                                              |
| excludedActions           | create, validate         | false    | string  | List of role-based management operations that are excluded from the denySettings .                  |                                              |
| excludedPrincipals        | create, validate         | false    | string  | List of Entra principal IDs excluded from the lock (Comma seperated).                               |                                              |
| managementGroupId         | create, delete, validate | false    | string  | The management group id where the deployment stack will be created.                                 |                                              |
| subscriptionId            | create, delete, validate | false    | string  | The subscription id where the deployment stack will be created.                                     |                                              |
| resourceGroupName         | create, delete, validate | false    | string  | The resource group name where the deployment stack will be created.                                 |                                              |
| templateFile              | create, validate         | false    | string  | A path to a ARM or Bicep file in the file system.                                                   |                                              |
| templateSpec              | create, validate         | false    | string  | The template spec resource id.                                                                      |                                              |
| templateUri               | create, validate         | false    | string  | A uri to a remote template file.                                                                    |                                              |
| parametersFile            | create, validate         | false    | string  | A path to a ARM or Bicep paramter file in the file system.                                          |                                              |
| parametersUri             | create, validate         | false    | string  | A uri to a remote parameters file.                                                                  |                                              |
| bypassStackOutOfSyncError | create, validate         | false    | boolean | Flag to bypass service errors that indicate the stack resource list is not correctly synchronized.  | true, false                                  |
| wait                      | create, delete, validate | false    | boolean | Wait for the deployment to complete.                                                                | true, false                                  |

The `excludedActions` and `excludedPrincipals` parameters are defined by comma
separated.

The `wait` parameter is set to false by default to avoid long-running GitHub
Action jobs.
