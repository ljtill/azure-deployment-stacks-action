# Parameters

Input: Parameters

Allowed Values:

```yaml
- name: Deployment
  uses: ljtill/azure-deployment-stacks-action@v1
  with:
    parameters: |
      name: sample
      version: 0.1
```

```yaml
- name: Deployment
  uses: ljtill/azure-deployment-stacks-action@v1
  with:
    parameters: |
      { "name": "sample" }
```
