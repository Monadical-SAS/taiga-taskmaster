## 45. Importers

### 45.1. Trello

#### 45.1.1. Auth url

Get the url for authorize Taiga to access to your Trello account.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

- A 200 Ok and the response body is a JSON of [importer auth url object](https://docs.taiga.io/api.html#object-importers-trello-auth-url)

#### 45.1.2. Authorize

Complete the authorization process.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"code": "00000000000000000000000000000000"
}' \
```

- A 200 Ok and the response body is a JSON of [importer auth token object](https://docs.taiga.io/api.html#object-importers-trello-auth-token)

#### 45.1.3. List users

List your Trello users.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"project": "123ABC",
"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}' \
```

- A 200 Ok and the response body is a JSON of [list of importer users object](https://docs.taiga.io/api.html#object-importers-trello-list-users)

#### 45.1.4. List projects

List your Trello boards.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}' \
```

- A 200 Ok and the response body is a JSON of [list of importer projects object](https://docs.taiga.io/api.html#object-importers-trello-list-projects)

#### 45.1.5. Import project

Ask the server to import a project from Trello.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "New project description",
"is_private": false,
"keep_external_reference": false,
"name": "New project name",
"project": "123ABC",
"template": "kanban",
"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
"users_bindings": {
"user-1": "123",
"user-2": "321"
}
}' \
```

- If taiga is working in synchronous mode the result is a 200 OK and as response body a JSON of [imported project result](https://docs.taiga.io/api.html#object-importers-trello-import-project).
- If taiga is working in asynchronous mode the result is a 202 Accepted and as response body a JSON of [import project accepted](https://docs.taiga.io/api.html#object-importers-task-accepted).

### 45.2. Github

#### 45.2.1. Auth url

Get the url for authorize Taiga to access to your Github account.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

- A 200 Ok and the response body is a JSON of [importer auth url object](https://docs.taiga.io/api.html#object-importers-github-auth-url)

#### 45.2.2. Authorize

Complete the authorization process.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"code": "00000000000000000000"
}' \
```

- A 200 Ok and the response body is a JSON of [importer auth token object](https://docs.taiga.io/api.html#object-importers-github-auth-token)

#### 45.2.3. List users

List the Github repository users.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"project": "user/project",
"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}' \
```

- A 200 Ok and the response body is a JSON of [list of importer users object](https://docs.taiga.io/api.html#object-importers-github-list-users)

#### 45.2.4. List repositories

List your Github repositories.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}' \
```

- A 200 Ok and the response body is a JSON of [list of importer projects object](https://docs.taiga.io/api.html#object-importers-github-list-projects)

#### 45.2.5. Import project

Ask the server to import a repository from Github.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "New project description",
"is_private": false,
"keep_external_reference": false,
"name": "New project name",
"project": "user/project",
"template": "kanban",
"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
"users_bindings": {
"user-1": "123",
"user-2": "321"
}
}' \
```

- If taiga is working in synchronous mode the result is a 200 OK and as response body a JSON of [imported project result](https://docs.taiga.io/api.html#object-importers-github-import-project).
- If taiga is working in asynchronous mode the result is a 202 Accepted and as response body a JSON of [import project accepted](https://docs.taiga.io/api.html#object-importers-task-accepted).

### 45.3. Jira

#### 45.3.1. Auth url

Get the url for authorize Taiga to access to your Jira account.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

- A 200 Ok and the response body is a JSON of [importer auth url object](https://docs.taiga.io/api.html#object-importers-jira-auth-url)

#### 45.3.2. Authorize

Complete the authorization process.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{}' \
```

- A 200 Ok and the response body is a JSON of [importer auth token object](https://docs.taiga.io/api.html#object-importers-jira-auth-token)

#### 45.3.3. List users

List the Jira project users.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"project": "12345",
"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
"url": "http://your.jira.server"
}' \
```

- A 200 Ok and the response body is a JSON of [list of importer users object](https://docs.taiga.io/api.html#object-importers-jira-list-users)

#### 45.3.4. List projects

List your Jira projects.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
"url": "http://your.jira.server"
}' \
```

- A 200 Ok and the response body is a JSON of [list of importer projects object](https://docs.taiga.io/api.html#object-importers-jira-list-projects)

#### 45.3.5. Import project

Ask the server to import a project from Jira.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "New project description",
"is_private": false,
"keep_external_reference": false,
"name": "New project name",
"project": "123",
"project_type": "kanban",
"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
"url": "http://your.jira.server",
"users_bindings": {
"user-1": "123",
"user-2": "321"
}
}' \
```

- If taiga is working in synchronous mode the result is a 200 OK and as response body a JSON of [imported project result](https://docs.taiga.io/api.html#object-importers-jira-import-project).
- If taiga is working in asynchronous mode the result is a 202 Accepted and as response body a JSON of [import project accepted](https://docs.taiga.io/api.html#object-importers-task-accepted).
