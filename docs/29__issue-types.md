## 29. Issue types
### 29.1. List
To list issue types send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [issue type detail objects](https://docs.taiga.io/api.html#object-issue-type-detail)
The results can be filtered using the following parameters:
*
**project**: project id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 29.2. Create
To create issue types send a POST request with the following data:
*
**color**: in hexadecimal
*
**name** (required)
*
**order**: integer
*
**project**: (required): project id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"color": "#AAAAAA",
"name": "New type",
"order": 8,
"project": 1
}' \
```
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "New type name",
"project": 1
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [issue type detail object](https://docs.taiga.io/api.html#object-issue-type-detail)
### 29.3. Get
To get an issue type send a GET request specifying the issue type id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [issue type detail object](https://docs.taiga.io/api.html#object-issue-type-detail)
### 29.4. Edit
To edit issue types send a PUT or a PATCH specifying the issue type id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Patch type name"
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [issue type detail object](https://docs.taiga.io/api.html#object-issue-type-detail)
### 29.5. Delete
To delete issue statuses send a DELETE specifying the issue type id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 29.6. Bulk update order
To update the order of multiple issue types at the same time send a POST request with the following data:
*
**project** (required)
*
**bulk_issue_types**: list where each element is a list, the first element is the status id and the second the new order
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_issue_types": [
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
