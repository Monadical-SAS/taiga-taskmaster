## 26. Task custom attributes values
### 26.1. Get
To get a task custom attribute send a GET request specifying the task custom attribute id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [task custom attribute detail object](https://docs.taiga.io/api.html#object-task-custom-attribute-detail)
### 26.2. Edit
To edit task custom attributes values send a PUT or a PATCH specifying the task id in the url.
"attribute_values" must be a JSON object with pairs task custom atribute id - value.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Duration 1"
}' \
```
When the update is successful, the HTTP response is a 200 OK and the response body is a JSON [task custom attribute detail object](https://docs.taiga.io/api.html#object-task-custom-attributes-values-detail)
