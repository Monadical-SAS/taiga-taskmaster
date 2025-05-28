## 35. Wiki links

### 35.1. List

To list wiki links send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [wiki link detail objects](https://docs.taiga.io/api.html#object-wiki-link-detail)
The results can be filtered using the following parameters:

- **project**: project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 35.2. Create

To create wiki links send a POST request with the following data:

- **project** (required): project id
- **title** (required): string
- **href** (required): wiki page slug
- **order**: integer

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"href": "home",
"order": 1,
"project": 1,
"title": "Home page"
}' \
```

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"href": "home",
"project": 1,
"title": "Home page"
}' \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [wiki link detail object](https://docs.taiga.io/api.html#object-wiki-link-detail)

### 35.3. Get

To get a wiki link send a GET request specifying the wiki link id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [wiki link detail object](https://docs.taiga.io/api.html#object-wiki-link-detail)

### 35.4. Edit

To edit wiki links send a PUT or a PATCH specifying the wiki link id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"subject": "Patching subject"
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [wiki link detail object](https://docs.taiga.io/api.html#object-wiki-link-detail)

### 35.5. Delete

To delete wiki link send a DELETE specifying the wiki link id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
