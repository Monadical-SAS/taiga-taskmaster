## 21. User story custom attribute

### 21.1. List

To list user story custom attributes send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [user story custom attribute detail objects](https://docs.taiga.io/api.html#object-userstory-custom-attribute-detail)
The results can be filtered using the following parameters:

- **project**: project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 21.2. Create

To create user story custom attributes send a POST request with the following data:

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

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [user story custom attribute detail object](https://docs.taiga.io/api.html#object-userstory-custom-attribute-detail)

### 21.3. Get

To get a user story custom attribute send a GET request specifying the user story custom attribute id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [user story custom attribute detail object](https://docs.taiga.io/api.html#object-userstory-custom-attribute-detail)

### 21.4. Edit

To edit user story custom attributes send a PUT or a PATCH specifying the user story custom attribute id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Duration 1"
}' \
```

When the update is successful, the HTTP response is a 200 OK and the response body is a JSON [user story custom attribute detail object](https://docs.taiga.io/api.html#object-userstory-custom-attribute-detail)

### 21.5. Delete

To delete user story custom attributes send a DELETE specifying the user story custom attribute id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 21.6. Bulk update order

To update the order of multiple user story custom attributes at the same time send a POST request with the following data:

- **project** (required)
- **bulk_userstory_custom_attributes**: list where each element is a list, the first element is the custom attribute id and the second the new order

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_userstory_custom_attributes": [
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
