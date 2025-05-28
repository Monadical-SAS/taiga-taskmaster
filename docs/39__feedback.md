## 39. Feedback

### 39.1. Create

To create feedback send a POST request with the following data:

- **comment** (required)

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"comment": "Testing feedback"
}' \
```

When created successfully, the HTTP response is a 201 Created and the response body is a JSON [feedback object](https://docs.taiga.io/api.html#object-feedback-detail)
