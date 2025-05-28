## 6. Resolver

### 6.1. Projects

To resolve the id of a project send a GET request with the following parameters:

- **project** (required): the project slug trying to be resolved

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The response body is a JSON object containing the project id

```json
"project": 1
```

### 6.2. User stories

To resolve the id of a user story send a GET request with the following parameters:

- **project** (required): the project slug trying to be resolved
- **us** (required): the user story ref trying to be resolved

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The response body is a JSON object containing the project and the user story ids

```json
"project": 1,
"us": 1
```

### 6.3. Issues

To resolve the id of an issue send a GET request with the following parameters:

- **project** (required): the project slug trying to be resolved
- **issue** (required): the issue ref trying to be resolved

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The response body is a JSON object containing the project and the issue ids

```json
"issue": 22,
"project": 1
```

### 6.4. Tasks

To resolve the id of a task send a GET request with the following parameters:

- **project** (required): the project slug trying to be resolved
- **task** (required): the task ref trying to be resolved

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The response body is a JSON object containing the project and the task ids

```json
"project": 1,
"task": 1
```

### 6.5. Milestones

To resolve the id of a milestone send a GET request with the following parameters:

- **project** (required): the project slug trying to be resolved
- **milestone** (required): the milestone slug trying to be resolved

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The response body is a JSON object containing the project and the milestone ids

```json
"milestone": 1,
"project": 1
```

### 6.6. Wiki pages

To resolve the id of a wiki page send a GET request with the following parameters:

- **project** (required): the project slug trying to be resolved
- **wikipage**(required): the wiki-page slug trying to be resolved

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The response body is a JSON object containing the project and the wiki page ids

```json
"project": 1,
"wikipage": 1
```

### 6.7. Multiple resolution

To resolve the multiple ids you can send a GET mixing parameters from the previous examples:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The response body is a JSON object containing the project and the task ids

```json
"project": 1,
"task": 1,
"us": 1,
"wikipage": 1
```

### 6.8. By ref value

To resolve an object if we don’t know its type we have to use `ref` GET parameter:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The response body is a JSON object containing the project and the story, task or
issue id.

```json
"project": 1,
"task": 1
```

Incompatibility between GET params
Be careful because `ref` is inconpatible with `us`, `task` and `issue`
parameters in requests with multiple resolutions.
