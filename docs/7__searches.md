## 7. Searches

### 7.1. Search

To search send a GET request with the following get parameters:

- **project** (required): project id
- **text**: string

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [search results detail objects](https://docs.taiga.io/api.html#object-search-results-detail)
