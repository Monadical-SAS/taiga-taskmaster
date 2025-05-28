## 16. Epic custom attribute

### 16.1. List

To list epic custom attributes send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [epic custom attribute detail objects](https://docs.taiga.io/api.html#object-epic-custom-attribute-detail)
The results can be filtered using the following parameters:

- **project**: project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 16.2. Create

To create epic custom attributes send a POST request with the following data:

- **name**: (required) text
- **description**: text
- **order**: integer
- **project**: (required) integer, project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "Duration in minutes",
"name": "Duration 2",
"order": 8,
"project": 1
}' \
```

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Duration 3",
"project": 1
}' \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [epic custom attribute detail object](https://docs.taiga.io/api.html#object-epic-custom-attribute-detail)

### 16.3. Get

To get an epic custom attribute send a GET request specifying the epic custom attribute id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [epic custom attribute detail object](https://docs.taiga.io/api.html#object-epic-custom-attribute-detail)

### 16.4. Edit

To edit epic custom attributes send a PUT or a PATCH specifying the epic custom attribute id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Duration 1"
}' \
```

When the update is successful, the HTTP response is a 200 OK and the response body is a JSON [epic custom attribute detail object](https://docs.taiga.io/api.html#object-epic-custom-attribute-detail)

### 16.5. Delete

To delete epic custom attributes send a DELETE specifying the epic custom attribute id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 16.6. Bulk update order

To update the order of multiple epic custom attributes at the same time send a POST request with the following data:

- **project** (required)
- **bulk_epic_custom_attributes**: list where each element is a list, the first element is the custom attribute id and the second the new order

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_epic_custom_attributes": [
[
14,
10
],
[
13,
15
]
],
"project": 1
}' \
```

When the update is successful, the HTTP response is a 204 NO CONTENT with an empty body response
