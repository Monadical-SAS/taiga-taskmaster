## 37. Users
### 37.1. List
To list users send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [user detail objects](https://docs.taiga.io/api.html#object-user-detail)
The results can be filtered using the following parameters:
*
**project**: project id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 37.2. Get
To get a user send a GET request specifying the user id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [user detail object](https://docs.taiga.io/api.html#object-user-detail)
### 37.3. Me
To get your own user send a GET request to the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [user detail object](https://docs.taiga.io/api.html#object-user-detail)
### 37.4. Get user stats
To get the stats from a user send a GET request specifying the user id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [user stats object](https://docs.taiga.io/api.html#object-user-stats-detail)
### 37.5. Get watched content
To get the user watched content send a GET request specifying the user id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a list of JSON [watched detail object](https://docs.taiga.io/api.html#object-watched-detail)
The results can be filtered using the following parameters:
*
**type**: of the content. Possible values: project, userstory, task and issue
*
**q**: text to search in the subject of the element
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 37.6. Get liked content
To get the user liked content send a GET request specifying the user id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a list of JSON [liked detail object](https://docs.taiga.io/api.html#object-liked-detail)
The results can be filtered using the following parameters:
*
**q**: text to search in the subject of the element
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 37.7. Get voted content
To get the user voted content send a GET request specifying the user id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a list of JSON [voted detail object](https://docs.taiga.io/api.html#object-voted-detail)
The results can be filtered using the following parameters:
*
**type**: of the content. Possible values: userstory, task and issue
*
**q**: text to search in the subject of the element
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 37.8. Edit
To edit users send a PUT or a PATCH specifying the user id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"username": "patchedusername"
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [user detail object](https://docs.taiga.io/api.html#object-user-detail)
### 37.9. Delete
To delete users send a DELETE specifying the user id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 37.10. Get contacts
To get a user contacts send a GET request specifying the user id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The results can be filtered using the following parameter:
*
**q**: text to search in username, full name or email
The HTTP response is a 200 OK and the response body is a list of JSON [contact detail object](https://docs.taiga.io/api.html#object-contact-detail)
### 37.11. Cancel
To cancel a user account send a POST with the following data
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"cancel_token": "eyJ1c2VyX2NhbmNlbF9hY2NvdW50X2lkIjo2fQ:1jrHFD:5svMIhFOCpm86JDngtP1CRNPlMs"
}' \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 37.12. Change avatar
To change your user avatar send a POST with the following data
```bash
-H "Content-Type: multipart/form-data" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-F avatar=@test.png \
```
When the change is successful, the HTTP response is a 200 OK and the response body is a JSON [user detail object](https://docs.taiga.io/api.html#object-user-detail)
### 37.13. Remove avatar
To remove your user avatar send a POST with the following data
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When the change is successful, the HTTP response is a 200 OK and the response body is a JSON [user detail object](https://docs.taiga.io/api.html#object-user-detail)
### 37.14. Change email
To change your user email send a POST with the following data
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"email_token": "email-token"
}' \
```
When the change is successful, the HTTP response is a 200 OK and the response body is a JSON [user detail object](https://docs.taiga.io/api.html#object-user-detail)
### 37.15. Change password
To change your user password send a POST with the following data
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"current_password": "123123",
"password": "new-password"
}' \
```
When the change succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 37.16. Password recovery
To request a user password recovery send a POST with the following data:
*
**username** (required): this field also supports the user email
```bash
-H "Content-Type: application/json" \
-d '{
"username": "user1"
}' \
```
When the password recovery request succeeded, the HTTP response is a 200 OK and the response body is a JSON object:
```json
"detail": "Mail sended successful!"
```
### 37.17. Change password from recovery
To change a user password from a request recovery send a POST with the following data
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"password": "new-password",
"token": "password-token"
}' \
```
When the password change succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
