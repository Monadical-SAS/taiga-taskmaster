## 41. Webhooks

### 41.1. List

To list webhooks send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [webhook detail objects](https://docs.taiga.io/api.html#object-webhook-detail)
The results can be filtered using the following parameters:

- **project**: project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 41.2. Create

To create webhook send a POST request with the following data:

- **project** (required): project id
- **name** (required): string
- **url** (required): payload url
- **key** (required): secret key

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"key": "my-very-secret-key",
"name": "My service webhook",
"project": 1,
"url": "http://myservice.com/webhooks"
}' \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [webhook detail object](https://docs.taiga.io/api.html#object-webhook-detail)

### 41.3. Get

To get a webhook send a GET request specifying the webhook id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [webhook detail object](https://docs.taiga.io/api.html#object-webhook-detail)

### 41.4. Edit

To edit a webhook send a PUT or a PATCH specifying the webhook id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "My service name"
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [webhook detail object](https://docs.taiga.io/api.html#object-webhook-detail)

### 41.5. Delete

To delete a webhook send a DELETE specifying the webhook id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 41.6. Test

To test a webhook send a POST request specifying the webhook id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [webhook log detail object](https://docs.taiga.io/api.html#object-webhook-log-detail) with the resault of the test.

### 41.7. Logs list

To list webhook logs send a GET request to the url:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [webhook log detail objects](https://docs.taiga.io/api.html#object-webhook-log-detail)
The results can be filtered using the following parameters:

- **webhook**: webhook id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 41.8. Log get

To get a webhook log send a GET request specifying the webhook log id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [webhook log detail object](https://docs.taiga.io/api.html#object-webhook-log-detail)

### 41.9. Resend request

To resend a request from a webhook log send a POST request specifying the webhook log id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [webhook log detail object](https://docs.taiga.io/api.html#object-webhook-log-detail) with the resault of the resend.
