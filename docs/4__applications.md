## 4. Applications

### 4.1. Get

To get an application send a GET request specifying the application id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [application object](https://docs.taiga.io/api.html#object-application-detail)

### 4.2. Get token

To get an application token send a GET request specifying the application id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [application token object](https://docs.taiga.io/api.html#object-application-token-detail)
