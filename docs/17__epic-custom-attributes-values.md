## 17. Epic custom attributes values
### 17.1. Get
To get an epic custom attribute value send a GET request specifying the epic custom attribute id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [epic custom attribute detail object](https://docs.taiga.io/api.html#object-epic-custom-attributes-values-detail)
### 17.2. Edit
To edit epic custom attributes values send a PUT or a PATCH specifying the epic id in the url.
"attribute_values" must be a JSON object with pairs epic custom atribute id - value.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"attributes_values": {
"14": "240 min"
},
"version": 1
}' \
```
When the update is successful, the HTTP response is a 200 OK and the response body is a JSON [epic custom attribute detail object](https://docs.taiga.io/api.html#object-epic-custom-attributes-values-detail)
