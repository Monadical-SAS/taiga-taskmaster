## 22. User story custom attributes values

### 22.1. Get

To get a user story custom attribute send a GET request specifying the user story custom attribute id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [user story custom attribute detail object](https://docs.taiga.io/api.html#object-userstory-custom-attribute-detail)

### 22.2. Edit

To edit user story custom attributes values send a PUT or a PATCH specifying the user story id in the url.
"attribute_values" must be a JSON object with pairs user story custom atribute id - value.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"attributes_values": {
"3": "240 min"
},
"version": 1
}' \
```

When the update is successful, the HTTP response is a 200 OK and the response body is a JSON [user story custom attribute detail object](https://docs.taiga.io/api.html#object-userstory-custom-attributes-values-detail)
