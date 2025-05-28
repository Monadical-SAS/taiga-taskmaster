## 25. Task custom attribute

### 25.1. List

To list task custom attributes send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [task custom attribute detail objects](https://docs.taiga.io/api.html#object-task-custom-attribute-detail)
The results can be filtered using the following parameters:

- **project**: project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 25.2. Create

To create task custom attributes send a POST request with the following data:

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

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [task custom attribute detail object](https://docs.taiga.io/api.html#object-task-custom-attribute-detail)

### 25.3. Get

To get a task custom attribute send a GET request specifying the task custom attribute id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [task custom attribute detail object](https://docs.taiga.io/api.html#object-task-custom-attribute-detail)

### 25.4. Edit

To edit task custom attributes send a PUT or a PATCH specifying the task custom attribute id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Duration 1"
}' \
```

When the update is successful, the HTTP response is a 200 OK and the response body is a JSON [task custom attribute detail object](https://docs.taiga.io/api.html#object-task-custom-attribute-detail)

### 25.5. Delete

To delete task custom attributes send a DELETE specifying the task custom attribute id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 25.6. Bulk update order

To update the order of multiple task custom attributes at the same time send a POST request with the following data:

- **project** (required)
- **bulk_task_custom_attributes**: list where each element is a list, the first element is the custom attribute id and the second the new order

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_task_custom_attributes": [
[
1,
10
],
[
5,
15
]
],
"project": 1
}' \
```

When the update is successful, the HTTP response is a 204 NO CONTENT with an empty body response
