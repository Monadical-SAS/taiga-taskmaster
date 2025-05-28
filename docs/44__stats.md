## 44. Stats

### 44.1. Get discover stats

To get the discover stats send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [discover stats object](https://docs.taiga.io/api.html#object-discover-stats)

### 44.2. Get system stats

To get the discover stats send a GET request with the following parameters:
This API will only work if your instance has system stats enabled

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [system stats object](https://docs.taiga.io/api.html#object-system-stats)
