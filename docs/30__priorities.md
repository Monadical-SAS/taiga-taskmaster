## 30. Priorities
### 30.1. List
To list priorities send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [priority detail objects](https://docs.taiga.io/api.html#object-priority-detail)
The results can be filtered using the following parameters:
*
**project**: project id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 30.2. Create
To create priorities send a POST request with the following data:
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
"name": "New priority",
"order": 8,
"project": 1
}' \
```
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "New priority name",
"project": 1
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [priority detail object](https://docs.taiga.io/api.html#object-priority-detail)
### 30.3. Get
To get a priority send a GET request specifying the priority id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [priority detail object](https://docs.taiga.io/api.html#object-priority-detail)
### 30.4. Edit
To edit priorities send a PUT or a PATCH specifying the priority id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Patch name"
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [priority detail object](https://docs.taiga.io/api.html#object-priority-detail)
### 30.5. Delete
To delete priorities send a DELETE specifying the priority id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 30.6. Bulk update order
To update the order of multiple priorities at the same time send a POST request with the following data:
*
**project** (required)
*
**bulk_priorities**: list where each element is a list, the first element is the status id and the second the new order
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_priorities": [
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
