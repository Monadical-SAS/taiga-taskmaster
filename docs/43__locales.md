## 43. Locales
### 43.1. List
To list the available locales send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [locale objects](https://docs.taiga.io/api.html#object-locale-detail)
