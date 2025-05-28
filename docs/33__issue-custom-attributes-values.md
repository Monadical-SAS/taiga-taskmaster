## 33. Issue custom attributes values
### 33.1. Get
To get a issue custom attribute send a GET request specifying the issue custom attribute id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [issue custom attribute detail object](https://docs.taiga.io/api.html#object-issue-custom-attribute-detail)
### 33.2. Edit
To edit issue custom attributes values send a PUT or a PATCH specifying the issue id in the url.
"attribute_values" must be a JSON object with pairs issue custom atribute id - value.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"attributes_values": {
"5": "240 min"
},
"version": 1
}' \
```
When the update is successful, the HTTP response is a 200 OK and the response body is a JSON [issue custom attribute detail object](https://docs.taiga.io/api.html#object-issue-custom-attributes-values-detail)
