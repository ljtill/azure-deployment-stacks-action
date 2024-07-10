# Workflows

## Create

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

      - name: Deployment
        uses: ljtill/azure-deployment-stacks-action@releases/v1
        with:
          name: 'Microsoft.Samples'
          description: 'Sample description for my Deployment Stack'
          location: uksouth
          scope: subscription
          mode: create
          action-on-unmanage: deleteAll
          deny-settings: denyWriteAndDelete
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          template-file: ./src/main.bicep
          wait: true
```

## Delete

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

      - name: Deployment
        uses: ljtill/azure-deployment-stacks-action@releases/v1
        with:
          name: 'Microsoft.Samples'
          location: uksouth
          scope: subscription
          mode: delete
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          wait: true
```

## Validate

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

      - name: Deployment
        uses: ljtill/azure-deployment-stacks-action@releases/v1
        with:
          name: 'Microsoft.Samples'
          description: 'Sample description for my Deployment Stack'
          location: uksouth
          scope: subscription
          mode: validate
          action-on-unmanage: deleteAll
          deny-settings: denyWriteAndDelete
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          template-file: ./src/main.bicep
          wait: true
```
