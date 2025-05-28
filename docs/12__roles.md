## 12. Roles

### 12.1. List

To list roles send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [role detail objects](https://docs.taiga.io/api.html#object-role-detail)
The results can be filtered using the following parameters:

- **project**: project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 12.2. Create

To create roles send a POST request with the following data:

- **name** (required)
- **order**: integer
- **project**: (required): project id
- **computable**: `true` if this role has estimations
- **permissions**: list of permmissions (strings) allowed for this role

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "New role",
"order": 10,
"permissions": [
"view_us",
"view_project"
],
"project": 1
}' \
```

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "New role name",
"project": 1
}' \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [role detail object](https://docs.taiga.io/api.html#object-role-detail)

### 12.3. Get

To get a role send a GET request specifying the role id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [role detail object](https://docs.taiga.io/api.html#object-role-detail)

### 12.4. Edit

To edit roles send a PUT or a PATCH specifying the role id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Patch name"
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [role detail object](https://docs.taiga.io/api.html#object-role-detail)

### 12.5. Delete

To delete roles send a DELETE specifying the role id in the url. You can use `moveTo` as query param
with the new role id for the users that have this one.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
