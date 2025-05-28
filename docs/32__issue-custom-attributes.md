## 32. Issue custom attribute
### 32.1. List
To list issue custom attributes send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [issue custom attribute detail objects](https://docs.taiga.io/api.html#object-issue-custom-attribute-detail)
The results can be filtered using the following parameters:
*
**project**: project id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 32.2. Create
To create issue custom attributes send a POST request with the following data:
*
**name**: (required) text
*
**description**: text
*
**order**: integer
*
**project**: (required) integer, project id
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
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [issue custom attribute detail object](https://docs.taiga.io/api.html#object-issue-custom-attribute-detail)
### 32.3. Get
To get a issue custom attribute send a GET request specifying the issue custom attribute id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [issue custom attribute detail object](https://docs.taiga.io/api.html#object-issue-custom-attribute-detail)
### 32.4. Edit
To edit issue custom attributes send a PUT or a PATCH specifying the issue custom attribute id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Duration 1"
}' \
```
When the update is successful, the HTTP response is a 200 OK and the response body is a JSON [issue custom attribute detail object](https://docs.taiga.io/api.html#object-issue-custom-attribute-detail)
### 32.5. Delete
To delete issue custom attributes send a DELETE specifying the issue custom attribute id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 32.6. Bulk update order
To update the order of multiple issue custom attributes at the same time send a POST request with the following data:
*
**project** (required)
*
**bulk_issue_custom_attributes**: list where each element is a list, the first element is the custom attribute id and the second the new order
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_issue_custom_attributes": [
[
5,
10
],
[
3,
5
]
],
"project": 1
}' \
```
When the update is successful, the HTTP response is a 204 NO CONTENT with an empty body response
