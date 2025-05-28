## 20. Points
### 20.1. List
To list points send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [point detail objects](https://docs.taiga.io/api.html#object-point-detail)
The results can be filtered using the following parameters:
*
**project**: project id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 20.2. Create
To create points send a POST request with the following data:
*
**color**: in hexadecimal
*
**name** (required)
*
**order**: integer
*
**value** (required): integer
*
**project**: (required): project id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"color": "#AAAAAA",
"name": "Huge",
"order": 8,
"project": 1,
"value": 40
}' \
```
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Very huge",
"project": 1
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [point detail object](https://docs.taiga.io/api.html#object-point-detail)
### 20.3. Get
To get a point send a GET request specifying the point id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [point detail object](https://docs.taiga.io/api.html#object-point-detail)
### 20.4. Edit
To edit points send a PUT or a PATCH specifying the point id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Patch name"
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [point detail object](https://docs.taiga.io/api.html#object-point-detail)
### 20.5. Delete
To delete points send a DELETE specifying the point id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 20.6. Bulk update order
To update the order of multiple points at the same time send a POST request with the following data:
*
**project** (required)
*
**bulk_points**: list where each element is a list, the first element is the status id and the second the new order
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_points": [
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
