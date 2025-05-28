## 38. Notify policies
### 38.1. List
To list the notify policies of the current user send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [notify policy detail objects](https://docs.taiga.io/api.html#object-notify-policy-detail)
### 38.2. Get
To get a notify policy send a GET request specifying the notify policy id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [notify policy detail object](https://docs.taiga.io/api.html#object-notify-policy-detail)
### 38.3. Edit
To edit notify policies send a PUT or a PATCH specifying the notify policy id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"notify_level": 2
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [notify policy detail object](https://docs.taiga.io/api.html#object-notify-policy-detail)
