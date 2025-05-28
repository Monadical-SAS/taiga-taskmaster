## 15. Epic status
### 15.1. List
To list epic status send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [epic status detail objects](https://docs.taiga.io/api.html#object-epic-status-detail)
The results can be filtered using the following parameters:
*
**project**: project id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 15.2. Create
To create epic statuses send a POST request with the following data:
*
**color**: in hexadecimal
*
**is_closed**: (true|false)
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
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [epic status detail object](https://docs.taiga.io/api.html#object-epic-status-detail)
### 15.3. Get
To get an epic status send a GET request specifying the epic status id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [epic status detail object](https://docs.taiga.io/api.html#object-epic-status-detail)
### 15.4. Edit
To edit epic statuses send a PUT or a PATCH specifying the epic status id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Patch status name"
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [epic status detail object](https://docs.taiga.io/api.html#object-epic-status-detail)
### 15.5. Delete
To delete epic satuses send a DELETE specifying the epic status id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 15.6. Bulk update order
To update the order of multiple epic statuses at the same time send a POST request with the following data:
*
**project** (required)
*
**bulk_epic_statuses**: list where each element is a list, the first element is the status id and the second the new order
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_epic_statuses": [
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
