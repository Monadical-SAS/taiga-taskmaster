## 31. Severities

### 31.1. List

To list severities send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [severity detail objects](https://docs.taiga.io/api.html#object-severity-detail)
The results can be filtered using the following parameters:

- **project**: project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 31.2. Create

To create severities send a POST request with the following data:

- **color**: in hexadecimal
- **name** (required)
- **order**: integer
- **project**: (required): project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"color": "#AAAAAA",
"name": "New severity",
"order": 8,
"project": 1
}' \
```

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "New severity name",
"project": 1
}' \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [severity detail object](https://docs.taiga.io/api.html#object-severity-detail)

### 31.3. Get

To get a severity send a GET request specifying the severity id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [severity detail object](https://docs.taiga.io/api.html#object-severity-detail)

### 31.4. Edit

To edit severities send a PUT or a PATCH specifying the severity id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Patch name"
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [severity detail object](https://docs.taiga.io/api.html#object-severity-detail)

### 31.5. Delete

To delete severities send a DELETE specifying the severity id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 31.6. Bulk update order

To update the order of multiple severities at the same time send a POST request with the following data:

- **project** (required)
- **bulk_severities**: list where each element is a list, the first element is the status id and the second the new order

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_severities": [
[
1,
10
],
[
2,
5
]
],
"project": 1
}' \
```

When the update is successful, the HTTP response is a 204 NO CONTENT with an empty body response
