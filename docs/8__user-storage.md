## 8. User storage
### 8.1. List
To list user storage data send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [user storage data objects](https://docs.taiga.io/api.html#object-user-storage-detail)
### 8.2. Create
To create user storage data send a POST request with the following data:
*
**key**: string
*
**value**: string
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"key": "favorite-forest",
"value": "Taiga"
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [user storage data object](https://docs.taiga.io/api.html#object-user-storage-detail)
### 8.3. Get
To get a user storage data send a GET request specifying the user storage key in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [user storage data object](https://docs.taiga.io/api.html#object-user-storage-detail)
### 8.4. Edit
To edit user storage data send a PUT or a PATCH specifying the user storage key in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"value": "Russian Taiga"
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [user storage data object](https://docs.taiga.io/api.html#object-user-storage-detail)
### 8.5. Delete
To delete user storage data send a DELETE specifying the user storage key in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
