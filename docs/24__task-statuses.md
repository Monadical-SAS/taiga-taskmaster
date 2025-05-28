## 24. Task status

### 24.1. List

To list task status send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [task status detail objects](https://docs.taiga.io/api.html#object-task-status-detail)
The results can be filtered using the following parameters:

- **project**: project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 24.2. Create

To create task statuses send a POST request with the following data:

- **color**: in hexadecimal
- **is_closed**: (true|false)
- **name** (required)
- **order**: integer
- **project**: (required): project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"color": "#AAAAAA",
"is_closed": true,
"name": "New status",
"order": 8,
"project": 1
}' \
```

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "New status name",
"project": 1
}' \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [task status detail object](https://docs.taiga.io/api.html#object-task-status-detail)

### 24.3. Get

To get a task status send a GET request specifying the task status id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [task status detail object](https://docs.taiga.io/api.html#object-task-status-detail)

### 24.4. Edit

To edit task statuses send a PUT or a PATCH specifying the task status id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Patch status name"
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [task status detail object](https://docs.taiga.io/api.html#object-task-status-detail)

### 24.5. Delete

To delete task satuses send a DELETE specifying the task status id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 24.6. Bulk update order

To update the order of multiple task statuses at the same time send a POST request with the following data:

- **project** (required)
- **bulk_task_statuses**: list where each element is a list, the first element is the status id and the second the new order

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_task_statuses": [
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
