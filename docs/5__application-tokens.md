## 5. Application tokens
### 5.1. List
To list the application tokens for an authenticated user send a GET request with the following parameters:
*
**application**: application id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [application token objects](https://docs.taiga.io/api.html#object-application-token-detail)
### 5.2. Get
To get an application token send a GET request specifying the application token id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [application token object](https://docs.taiga.io/api.html#object-application-token-detail)
### 5.3. Delete
To delete application tokens send a DELETE specifying the application token id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 5.4. Authorize
To request an authorization code send a POST request with the following data:
*
**application**: the application id for the requested token
*
**state**: an unguessable random string. It is used to protect against cross-site request forgery attacks. The API will include this value when the validation process is completed so the final app can verify it matches the original one.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"application": "00000000-0000-0000-0000-000000000000",
"state": "random-state"
}' \
```
When the creation is successful, the HTTP response is a 200 and the response body is a JSON [authorization code object](https://docs.taiga.io/api.html#object-application-token-authorization-code)
### 5.5. Validate
To validate an authorization code send a POST request with the following data:
*
**application**: the application id for the requested token
*
**state**: an unguessable random string. It is used to protect against cross-site request forgery attacks. The API will include this value when the validation process is completed so the final app can verify it matches the original one.
*
**auth_code**: the authorization code received on previous the steps.
```bash
-H "Content-Type: application/json" \
-d '{
"application": "00000000-0000-0000-0000-000000000000",
"auth_code": "00000000-0000-0000-0000-000000000002",
"state": "random-state"
}' \
```
When the creation is successful, the HTTP response is a 200 and the response body is a JSON [cyphered token object](https://docs.taiga.io/api.html#object-application-token-cyphered-token)
